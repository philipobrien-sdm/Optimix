import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client Lazily/Safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. RECOMMENDATIONS API - Integrates server-side Gemini
app.post("/api/recommendations", async (req, res) => {
  const { team, meetings } = req.body;

  if (!team || !meetings) {
    return res.status(400).json({ error: "Missing team or meetings data." });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `
You are a resource optimization manager. Support the manager in assigns resources to scheduled calendar meetings.
Analyze the team data and scheduled meetings/discussions below. Suggest the best 1-2 resources for each meeting.

For each suggestion, evaluate along these four dimensions:
1. **Availability**: Confirm they do not have a blocked time overlapping the meeting schedule (meetings are on days: Monday-Friday, hours are standard 24h system like 9-17).
2. **Expertise & Constraints**: Do they possess the required skills for the meeting? Also carefully adhere to any individual availability constraints defined in their "constraints" field (e.g., "Not available on mornings", "No Fridays").
3. **Learning Opportunity**: Does this meeting's topic align with their goals to learn new skills?
4. **Consistency**: Have they been involved in this topic or current project before, or will assigning them maintain consistency of presence?

--- TEAM MEMBERS DATA ---
${JSON.stringify(team, null, 2)}

--- SCHEDULED MEETINGS DATA ---
${JSON.stringify(meetings, null, 2)}

Provide the recommendations in a structured JSON schema form, matching the required output format.
For each meeting, recommend 1 or 2 member IDs, and provide clear/compact justifications based on the 4 dimensions.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "List of recommendations per meeting",
            items: {
              type: Type.OBJECT,
              properties: {
                meetingId: { type: Type.STRING, description: "ID of the meeting" },
                suggestedMemberIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "IDs of recommended team members"
                },
                reasons: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Specific reasons justifying this assignment across the 4 dimensions"
                }
              },
              required: ["meetingId", "suggestedMemberIds", "reasons"]
            }
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const recommendations = JSON.parse(responseText.trim());
        return res.json({ recommendations, source: "gemini" });
      }
    } catch (e: any) {
      console.error("Gemini assignment generator failed, using high-fidelity local heuristic engine:", e);
    }
  }

  // Fallback intelligent heuristic allocation generator (Availability & Expertise & learning checks)
  const recommendations = meetings.map((meeting: any) => {
    // Score each team member
    const scoredMembers = team.map((member: any) => {
      let score = 0;
      const reasons: string[] = [];

      // Dimension 1: Availability Check (Overlap check)
      const isBlocked = member.blockedTimes?.some((blocked: any) => {
        if (blocked.day !== meeting.day) return false;
        // Overlap: (start1 < end2) && (end1 > start2)
        return (meeting.startHour < blocked.endHour) && (meeting.endHour > blocked.startHour);
      });

      if (isBlocked) {
        score -= 100; // Heavy penalty for availability block
        reasons.push(`${member.name} is blocked on ${meeting.day} during this time.`);
      } else {
        score += 25;
        reasons.push(`${member.name} is fully available on ${meeting.day}.`);
      }

      // Dimension 2: Expertise Match
      const matchingSkills = member.skills.filter((skill: string) => 
        meeting.requiredSkills?.some((req: string) => req.toLowerCase() === skill.toLowerCase())
      );
      if (matchingSkills.length > 0) {
        score += matchingSkills.length * 30;
        reasons.push(`Has matching expertise in ${matchingSkills.join(", ")}.`);
      }

      // Dimension 3: Learning Opportunity
      const learningMatches = member.learningGoals?.filter((goal: string) =>
        meeting.requiredSkills?.some((req: string) => req.toLowerCase() === goal.toLowerCase()) ||
        meeting.topic?.toLowerCase().includes(goal.toLowerCase())
      );
      if (learningMatches && learningMatches.length > 0) {
        score += learningMatches.length * 20;
        reasons.push(`Alignment with learning goals: ${learningMatches.join(", ")}.`);
      }

      // Dimension 4: Consistency matching based on project assignment
      if (member.project && meeting.title?.toLowerCase().includes(member.project.toLowerCase())) {
        score += 15;
        reasons.push(`Assigned project is consistent with topic: ${member.project}.`);
      } else if (member.role && meeting.title?.toLowerCase().includes(member.role.toLowerCase())) {
        score += 10;
        reasons.push(`Consistent role responsibilities: ${member.role}.`);
      }

      return { member, score, reasons };
    });

    // Filter out blocked members first if we have better ones, sort decending
    const sorted = scoredMembers
      .filter((s: any) => s.score > -50)
      .sort((a: any, b: any) => b.score - a.score);

    const bestFits = sorted.slice(0, 2);
    const suggestedMemberIds = bestFits.map((f: any) => f.member.id);
    const combinedReasons = bestFits.flatMap((f: any) => f.reasons.slice(0, 2));

    return {
      meetingId: meeting.id,
      suggestedMemberIds: suggestedMemberIds.length > 0 ? suggestedMemberIds : [team[0]?.id].filter(Boolean),
      reasons: combinedReasons.length > 0 ? combinedReasons : ["No high-matching availability found; assigned default resource."]
    };
  });

  return res.json({ recommendations, source: "heuristic" });
});

// 2. REPORT GENERATOR - Mock Email system
app.post("/api/send-report", (req, res) => {
  const { recipient, reportContent, summary } = req.body;
  if (!recipient) {
    return res.status(400).json({ error: "No recipient specified." });
  }

  // Simulate report creation / transmission logs
  const reportLog = {
    id: `rep-${Date.now()}`,
    sentAt: new Date().toLocaleTimeString(),
    recipient,
    summary: summary || "Weekly Team Resource Maximization report",
    dimensionsSummary: {
      availability: "Reviewing calendar attendance stats, availability is optimized with minimized schedule overlaps.",
      expertise: "Skills gaps highlighted for critical system components under ongoing development.",
      learningOpportunity: "Assigned learning milestones mapped to junior team members to promote expansion of expertise.",
      consistency: "Assigned projects correspond closely to core product ownership profiles."
    }
  };

  return res.json({ 
    success: true, 
    message: `Report successfully dispatched to ${recipient}`,
    report: reportLog
  });
});

// Start integration server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

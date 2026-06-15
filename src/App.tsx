import React, { useState, useEffect } from "react";
import { TeamMember, Meeting, SkillGap, Notification, AIRecommendation, UtilizationReport } from "./types";
import { DEFAULT_TEAM, DEFAULT_MEETINGS, AVAILABLE_SKILLS, AVAILABLE_PROJECTS } from "./data/defaultData";
import { 
  Users, Calendar, Award, Bell, Mail, Bot, AlertTriangle, 
  Check, Play, Send, Sparkles, RefreshCw, Plus, Trash2, 
  User, CheckCircle2, Clock, MapPin, X, ArrowUpRight, HelpCircle, Settings,
  Download, Upload
} from "lucide-react";
import TeamManager from "./components/TeamManager";

export default function App() {
  // --- Core State (with persistence) ---
  const [team, setTeam] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem("optimix_team");
    return saved ? JSON.parse(saved) : DEFAULT_TEAM;
  });

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem("optimix_meetings");
    return saved ? JSON.parse(saved) : DEFAULT_MEETINGS;
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reportsLog, setReportsLog] = useState<UtilizationReport[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [recsSource, setRecsSource] = useState<"gemini" | "heuristic" | "none">("none");
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);

  // Form states for scheduling meeting
  const [meetTitle, setMeetTitle] = useState("");
  const [meetTopic, setMeetTopic] = useState("");
  const [meetDay, setMeetDay] = useState<Meeting['day']>("Monday");
  const [meetStart, setMeetStart] = useState(10);
  const [meetEnd, setMeetEnd] = useState(11.5);
  const [meetSkills, setMeetSkills] = useState<string[]>([]);
  const [meetAssignees, setMeetAssignees] = useState<string[]>([]);
  const [meetRecurrence, setMeetRecurrence] = useState<'Once' | 'Weekly' | 'Bi-Weekly' | 'Monthly'>("Once");
  const [showMeetForm, setShowMeetForm] = useState(false);

  // Email report settings
  const [reportEmail, setReportEmail] = useState("philip.obrien@gmail.com");
  const [reportSchedule, setReportSchedule] = useState("Weekly - Monday 9:00 AM");
  const [sendingReport, setSendingReport] = useState(false);

  // Active Tab for managing section (unified single-screen toggle for sub-panel)
  const [activeBoard, setActiveBoard] = useState<"timeline" | "roster" | "gaps">("timeline");

  // Local LLM states
  const [localLlmEnabled, setLocalLlmEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("optimix_local_llm_enabled");
    return saved === "true";
  });

  const [localLlmUrl, setLocalLlmUrl] = useState<string>(() => {
    const saved = localStorage.getItem("optimix_local_llm_url");
    return saved || "http://localhost:11434";
  });

  const [localLlmModel, setLocalLlmModel] = useState<string>(() => {
    const saved = localStorage.getItem("optimix_local_llm_model");
    return saved || "llama3";
  });

  const [localLlmFormat, setLocalLlmFormat] = useState<'ollama' | 'openai'>(() => {
    const saved = localStorage.getItem("optimix_local_llm_format");
    return (saved as 'ollama' | 'openai') || "ollama";
  });

  const [localLlmModelsList, setLocalLlmModelsList] = useState<string[]>([]);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Save changes
  useEffect(() => {
    localStorage.setItem("optimix_team", JSON.stringify(team));
  }, [team]);

  useEffect(() => {
    localStorage.setItem("optimix_meetings", JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem("optimix_local_llm_enabled", String(localLlmEnabled));
  }, [localLlmEnabled]);

  useEffect(() => {
    localStorage.setItem("optimix_local_llm_url", localLlmUrl);
  }, [localLlmUrl]);

  useEffect(() => {
    localStorage.setItem("optimix_local_llm_model", localLlmModel);
  }, [localLlmModel]);

  useEffect(() => {
    localStorage.setItem("optimix_local_llm_format", localLlmFormat);
  }, [localLlmFormat]);

  // --- App State Backup & Restore ---
  const handleDownloadAppState = () => {
    try {
      const backupData = {
        version: "1.0.0",
        team,
        meetings,
        settings: {
          localLlmEnabled,
          localLlmUrl,
          localLlmModel,
          localLlmFormat,
          reportEmail,
          reportSchedule
        }
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `optimix_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addNotification("Backup Downloaded", "The entire application state (settings and team data) has been exported successfully.", "report");
    } catch (error: any) {
      console.error(error);
      addNotification("Export Failed", `Failed to generate app state backup: ${error.message}`, "gap");
    }
  };

  const handleLoadAppState = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const backup = JSON.parse(text);

        if (!backup || typeof backup !== 'object') {
          throw new Error("Invalid backup file format.");
        }

        if (backup.team && Array.isArray(backup.team)) {
          setTeam(backup.team);
        } else {
          throw new Error("Missing correct 'team' roster array in backup file.");
        }

        if (backup.meetings && Array.isArray(backup.meetings)) {
          setMeetings(backup.meetings);
        }

        if (backup.settings) {
          const s = backup.settings;
          if (typeof s.localLlmEnabled === 'boolean') setLocalLlmEnabled(s.localLlmEnabled);
          if (typeof s.localLlmUrl === 'string') setLocalLlmUrl(s.localLlmUrl);
          if (typeof s.localLlmModel === 'string') setLocalLlmModel(s.localLlmModel);
          if (s.localLlmFormat === 'ollama' || s.localLlmFormat === 'openai') {
            setLocalLlmFormat(s.localLlmFormat);
          }
          if (typeof s.reportEmail === 'string') setReportEmail(s.reportEmail);
          if (typeof s.reportSchedule === 'string') setReportSchedule(s.reportSchedule);
        }

        addNotification("App State Loaded", "Application state, team layout, and connection configurations have been restored successfully.", "availability");
      } catch (err: any) {
        console.error(err);
        addNotification("Restore Blocked", `Import error: ${err.message || "Failed to parse JSON file."}`, "gap");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // Helper to append app notifications
  const addNotification = (title: string, message: string, type: Notification['type']) => {
    const newAlert: Notification = {
      id: `alert-${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [newAlert, ...prev].slice(0, 20));
  };

  // --- Dynamic Calculations ---
  // Total hours from the team roster
  const totalRosterHours = team.reduce((acc, m) => acc + m.weeklyHours, 0);

  // Allocated Meeting Hours (Sum of meeting durations * number of assignees)
  const totalAllocatedHours = meetings.reduce((acc, m) => {
    const duration = m.endHour - m.startHour;
    return acc + (duration * m.assignedMemberIds.length);
  }, 0);

  const utilizationPercentage = totalRosterHours > 0 
    ? Math.round((totalAllocatedHours / totalRosterHours) * 100) 
    : 0;

  // Let's compute average consistency index based on team's scores
  const consistencyIndex = team.length > 0 
    ? Math.round(team.reduce((acc, m) => acc + (m.consistencyScore || 85), 0) / team.length) 
    : 85;

  // Compute stats on skills match, learning opportunities, and critical gaps
  // Compile meeting requirements vs team assignments
  const computedGaps: SkillGap[] = [];
  const requiredSkillsSet = new Set<string>();
  meetings.forEach(m => m.requiredSkills.forEach(s => requiredSkillsSet.add(s)));

  requiredSkillsSet.forEach(skill => {
    const meetingsUsing = meetings.filter(m => m.requiredSkills.includes(skill));
    const assignedWhoHaveSkill = meetingsUsing.flatMap(m => 
      m.assignedMemberIds.map(memId => team.find(t => t.id === memId)).filter(Boolean) as TeamMember[]
    ).filter(mem => mem.skills.includes(skill));

    const totalExpertsOnTeam = team.filter(t => t.skills.includes(skill)).map(t => t.name);
    
    // Status assessment
    let status: SkillGap['status'] = "Optimal";
    if (assignedWhoHaveSkill.length === 0 && totalExpertsOnTeam.length > 0) {
      status = "Critical Gap"; // Meeting scheduled but assigned person doesn't have it, although an expert exists!
    } else if (totalExpertsOnTeam.length === 0) {
      status = "Critical Gap"; // Nobody on the team has it!
    } else if (assignedWhoHaveSkill.length > 4) {
      status = "Over-Allocation";
    }

    computedGaps.push({
      skill,
      requiredInTopics: meetingsUsing.map(m => m.topic),
      teamExperts: totalExpertsOnTeam,
      status
    });
  });

  // Dynamic automatic alerts based on assignments and gaps
  useEffect(() => {
    // 1. Availability check: any assigned meeting overlaps with member block time?
    meetings.forEach(m => {
      m.assignedMemberIds.forEach(memId => {
        const mem = team.find(t => t.id === memId);
        if (mem) {
          const overlap = mem.blockedTimes.find(b => 
            b.day === m.day && 
            ((m.startHour < b.endHour) && (m.endHour > b.startHour))
          );
          if (overlap) {
            addNotification(
              "Schedule Overlap Detected", 
              `${mem.name} is scheduled for "${m.title}" but possesses a blocker: "${overlap.reason}".`, 
              "availability"
            );
          }
        }
      });
    });

    // 2. Skill Gap notification trigger
    const critical = computedGaps.filter(g => g.status === "Critical Gap");
    if (critical.length > 0) {
      addNotification(
        "Expertise Deficit Alert", 
        `We have identified ${critical.length} topics without aligned expert assignees (e.g. ${critical[0].skill}).`, 
        "gap"
      );
    }
  }, [meetings.length, team.length]);

  // Initial load auto-trigger
  useEffect(() => {
    addNotification("Roster System Initialised", " Roster database successfully bound to client cache.", "availability");
    addNotification("Availability Monitor Active", "Real-time block schedules sync completed.", "availability");
    generateSuggestions(false);
  }, []);

  // --- Gemini API Call / Heuristics Client & Local LLM ---
  const handleTestLocalLlmConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      if (localLlmFormat === "ollama") {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(`${localLlmUrl}/api/tags`, {
          signal: controller.signal,
          method: "GET"
        });
        clearTimeout(id);
        if (!response.ok) throw new Error(`HTTP status ${response.status}`);
        const data = await response.json();
        if (data && Array.isArray(data.models)) {
          const models = data.models.map((m: any) => m.name);
          setLocalLlmModelsList(models);
          if (models.length > 0 && !models.includes(localLlmModel)) {
            setLocalLlmModel(models[0]);
          }
          setTestResult({
            success: true,
            message: `Connected successfully! Found ${models.length} Ollama models: ${models.slice(0, 5).join(", ")}${models.length > 5 ? "..." : ""}`
          });
        } else {
          setTestResult({
            success: true,
            message: "Connected to Ollama host (CORS OK), but could not look up models list."
          });
        }
      } else {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(`${localLlmUrl}/v1/models`, {
          signal: controller.signal,
          method: "GET"
        });
        clearTimeout(id);
        if (!response.ok) throw new Error(`HTTP status ${response.status}`);
        const data = await response.json();
        if (data && Array.isArray(data.data)) {
          const models = data.data.map((m: any) => m.id || m.name);
          setLocalLlmModelsList(models);
          if (models.length > 0 && !models.includes(localLlmModel)) {
            setLocalLlmModel(models[0]);
          }
          setTestResult({
            success: true,
            message: `Connected successfully! Found ${models.length} OpenAI-compatible models: ${models.slice(0, 5).join(", ")}${models.length > 5 ? "..." : ""}`
          });
        } else {
          setTestResult({
            success: true,
            message: "Connected to OpenAI host (CORS OK), but could not look up models list."
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(localLlmUrl, { signal: controller.signal });
        clearTimeout(id);
        setTestResult({
          success: true,
          message: `Connected successfully to server root! Discovered active server, but custom tags/models endpoint is restricted or not accessible. Custom model name can still be used.`
        });
      } catch {
        setTestResult({
          success: false,
          message: `Could not reach local service at ${localLlmUrl}. Check status/logs, and make sure CORS is enabled (e.g. OLLAMA_ORIGINS=* for Ollama).`
        });
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const generateSuggestions = async (forceUserClick: boolean) => {
    setAiLoading(true);

    if (localLlmEnabled) {
      const instructions = `You are a resource optimization manager. Support the manager in assigns resources to scheduled calendar meetings.
Analyze the team data and scheduled meetings/discussions below. Suggest the best 1-2 resources for each meeting.

For each suggestion, evaluate along these four dimensions:
1. **Availability**: Confirm they do not have a blocked time overlapping the meeting schedule (meetings are on days: Monday-Friday, hours are standard 24h system like 9-17).
2. **Expertise & Constraints**: Do they possess the required skills for the meeting? Adhere to any individual constraints defined under their 'constraints' field, e.g. "Only available mornings".
3. **Learning Opportunity**: Does this meeting's topic align with their goals to learn new skills?
4. **Consistency**: Have they been involved in this topic or current project before, or will assigning them maintain consistency of presence?

--- TEAM MEMBERS DATA ---
${JSON.stringify(team.map(t => ({
  id: t.id,
  name: t.name,
  role: t.role,
  skills: t.skills,
  project: t.project,
  constraints: t.constraints || "",
  blockedTimes: t.blockedTimes
})), null, 2)}

--- SCHEDULED MEETINGS DATA ---
${JSON.stringify(meetings.map(m => ({
  id: m.id,
  title: m.title,
  topic: m.topic,
  day: m.day,
  startHour: m.startHour,
  endHour: m.endHour,
  requiredSkills: m.requiredSkills
})), null, 2)}

Provide the recommendations inside a JSON array. Return ONLY the JSON array. Output MUST match this schema structure:
[
  {
    "meetingId": "meeting-id-here",
    "suggestedMemberIds": ["id1", "id2"],
    "reasons": ["Reason 1 availability", "Reason 2 expertise"]
  }
]`;

      try {
        let recommendationsParsed: any[] = [];
        let fetchedText = "";

        if (localLlmFormat === 'ollama') {
          const body = {
            model: localLlmModel,
            prompt: instructions,
            stream: false,
            options: {
              temperature: 0.1
            }
          };
          
          const response = await fetch(`${localLlmUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
          
          if (!response.ok) {
            throw new Error(`Local Ollama failed with HTTP ${response.status}`);
          }
          const resJson = await response.json();
          fetchedText = resJson.response;
        } else {
          // OpenAI compatible format
          const body = {
            model: localLlmModel,
            messages: [
              { role: "system", content: "You are a helpful assistant that returns clean formatting and strictly raw JSON arrays of recommendations." },
              { role: "user", content: instructions }
            ],
            temperature: 0.1
          };
          
          const response = await fetch(`${localLlmUrl}/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
          
          if (!response.ok) {
            throw new Error(`Local OpenAI API failed with HTTP ${response.status}`);
          }
          const resJson = await response.json();
          fetchedText = resJson.choices?.[0]?.message?.content || "";
        }

        // Clean any code block wrappers
        let jsonStr = fetchedText.trim();
        if (jsonStr.startsWith("```")) {
          // extract content between ```json and ```
          const firstLineBreak = jsonStr.indexOf("\n");
          if (jsonStr.startsWith("```json")) {
            const lastBackticks = jsonStr.lastIndexOf("```");
            if (firstLineBreak !== -1 && lastBackticks !== -1) {
              jsonStr = jsonStr.substring(firstLineBreak, lastBackticks).trim();
            }
          } else {
            const lastBackticks = jsonStr.lastIndexOf("```");
            if (firstLineBreak !== -1 && lastBackticks !== -1) {
              jsonStr = jsonStr.substring(firstLineBreak, lastBackticks).trim();
            }
          }
        }
        
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          recommendationsParsed = parsed;
        } else if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          recommendationsParsed = parsed.recommendations;
        } else if (typeof parsed === 'object') {
          const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
          if (arrayKey) {
            recommendationsParsed = parsed[arrayKey];
          }
        }

        if (recommendationsParsed && recommendationsParsed.length > 0) {
          setRecommendations(recommendationsParsed);
          setRecsSource("local");
          if (forceUserClick) {
            addNotification(
              "Optimal Allocator Loaded", 
              `Evaluated team metrics against planned timeline using local LLM (${localLlmModel}).`, 
              "report"
            );
          }
          setAiLoading(false);
          return;
        }
        throw new Error("No array found in JSON output from local LLM.");
      } catch (err: any) {
        console.error("Local LLM failed, using cloud/heuristic fallback:", err);
        addNotification("Local LLM Query Failed", `${err.message || "Failed to parse response"}. Routing to fallback heuristics.`, "gap");
      }
    }

    // Default Cloud Gemini / Local heuristics route
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team, meetings })
      });

      if (!response.ok) {
        throw new Error("Server returned error response.");
      }

      const data = await response.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
        setRecsSource(data.source);
        if (forceUserClick) {
          addNotification(
            "Optimal Allocator Loaded", 
            `Evaluated team metrics against planned timeline using ${data.source === "gemini" ? "Gemini AI" : "Local Heuristics"}.`, 
            "report"
          );
        }
      }
    } catch (err) {
      console.error(err);
      addNotification("AI Suggestion Failed", "Re-routing engine to default heuristical scheduler.", "gap");
    } finally {
      setAiLoading(false);
    }
  };

  // Dispatch Rec report
  const handleSendReport = async () => {
    setSendingReport(true);
    try {
      const summaryContent = `Utilisation of team lies at ${utilizationPercentage}%. Main projects monitored: ${AVAILABLE_PROJECTS.join(", ")}.`;
      const response = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: reportEmail,
          summary: "Weekly Team Leverage & Utilization Audit Report",
          reportContent: summaryContent
        })
      });
      if (response.ok) {
        const data = await response.json();
        setReportsLog(prev => [data.report, ...prev]);
        addNotification(
          "Report Sent", 
          `Utilization metrics digest dispatched automatically to ${reportEmail}. Next: ${reportSchedule}`, 
          "report"
        );
      }
    } catch (e) {
      console.error(e);
      addNotification("Dispatch Failure", "External mail container failed to acknowledge route.", "gap");
    } finally {
      setSendingReport(false);
    }
  };

  const applyAISuggestion = (meetId: string, memberIds: string[]) => {
    setMeetings(prev => prev.map(m => m.id === meetId ? { ...m, assignedMemberIds: memberIds } : m));
    addNotification("Roster Remapped", "Autoassigned resource mapping suggestions to meeting coordinates.", "availability");
  };

  const handleAddNewMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim()) return;

    const newM: Meeting = {
      id: `meet-${Date.now()}`,
      title: meetTitle,
      topic: meetTopic || "General Topic",
      day: meetDay,
      startHour: parseFloat(meetStart.toString()),
      endHour: parseFloat(meetEnd.toString()),
      requiredSkills: meetSkills,
      assignedMemberIds: meetAssignees,
      recurrence: meetRecurrence
    };

    setMeetings(prev => [...prev, newM]);
    setMeetTitle("");
    setMeetTopic("");
    setMeetSkills([]);
    setMeetAssignees([]);
    setMeetRecurrence("Once");
    setShowMeetForm(false);
    addNotification("Discussion Booked", `"${newM.title}" added to the allocation timeline.`, "availability");
  };

  const handleRemoveMeeting = (id: string) => {
    const meet = meetings.find(m => m.id === id);
    if (meet) {
      setMeetings(prev => prev.filter(m => m.id !== id));
      addNotification("Meeting Cancelled", `Removed "${meet.title}" from scheduled timeline.`, "gap");
    }
  };

  const handleTriggerOutlookEmail = (meet: Meeting) => {
    // Get assigned member emails, or fall back to mock details if none assigned yet
    const assignees = meet.assignedMemberIds.map(id => team.find(t => t.id === id)).filter(Boolean) as TeamMember[];
    
    // Outlook friendly separator for multiple recipients is semicolon ';'
    const emailList = assignees.length > 0 
      ? assignees.map(m => m.email).join(";") 
      : "unassigned@optimix.com"; 
    
    const subject = encodeURIComponent(`OptiMix Resource Schedule: ${meet.title}`);
    
    const bodyText = `Hi Team,\n\nYou have been assigned to the following session under OptiMix Resource Allocations:\n\n` +
      `Topic/Session: ${meet.title} (${meet.topic})\n` +
      `Scheduled Day: ${meet.day}\n` +
      `Scheduled Hours: ${formatTime(meet.startHour)} - ${formatTime(meet.endHour)}\n` +
      `Recurrence: ${meet.recurrence || "Once"}\n` +
      `Required Competencies: ${meet.requiredSkills.join(", ") || "None"}\n` +
      `Allocated Resources: ${assignees.length > 0 ? assignees.map(a => `${a.name} (${a.email})`).join(", ") : "Pending Assignment (Bottleneck Alert)"}\n\n` +
      `Please make sure to review this scheduled allocation and check for any potential conflicts.\n\nBest regards,\nOptiMix Resource Planner`;
    
    const body = encodeURIComponent(bodyText);
    
    // open mailto
    const mailtoUri = `mailto:${emailList}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUri;
    
    addNotification(
      "Outlook Triggered",
      `Outlook email client loaded for "${meet.title}" with assigned resources.`,
      "report"
    );
  };

  const handleToggleSkillSelection = (skill: string) => {
    setMeetSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleToggleAssigneeSelection = (memId: string) => {
    setMeetAssignees(prev => prev.includes(memId) ? prev.filter(id => id !== memId) : [...prev, memId]);
  };

  return (
    <div className="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col p-4 md:p-6 selection:bg-indigo-500/30 selection:text-white" id="main_bento_dashboard">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-900 pb-5" id="optimax_header">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-2xl italic tracking-tighter shadow-lg shadow-indigo-600/20 text-white border border-indigo-400/20">
            OM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                OptiMix
              </h1>
              <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full">
                Leverage Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">Opportunistic dashboard maximizing the final 10% of team potential & availability mapping.</p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            id="tab_btn_timeline"
            onClick={() => setActiveBoard("timeline")}
            className={`inline-flex items-center gap-1.5 cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeBoard === "timeline" 
                ? "bg-indigo-600 border border-indigo-400/25 text-white shadow-lg shadow-indigo-600/30" 
                : "bg-slate-900/80 border border-slate-800 text-slate-350 hover:bg-slate-850"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Leverage Timeline
          </button>
          
          <button 
            id="tab_btn_roster"
            onClick={() => setActiveBoard("roster")}
            className={`inline-flex items-center gap-1.5 cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeBoard === "roster" 
                ? "bg-indigo-600 border border-indigo-400/25 text-white shadow-lg shadow-indigo-600/30" 
                : "bg-slate-900/80 border border-slate-800 text-slate-350 hover:bg-slate-850"
            }`}
          >
            <Users className="w-4 h-4" />
            Team Roster Setup
          </button>

          <button 
            id="tab_btn_gaps"
            onClick={() => setActiveBoard("gaps")}
            className={`inline-flex items-center gap-1.5 cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeBoard === "gaps" 
                ? "bg-indigo-600 border border-indigo-400/25 text-white shadow-lg shadow-indigo-600/30" 
                : "bg-slate-900/80 border border-slate-800 text-slate-350 hover:bg-slate-850"
            }`}
          >
            <Award className="w-4 h-4" />
            Coverage & Gaps
          </button>

          <div className="w-px h-6 bg-slate-900 hidden md:block mx-1"></div>

          <button 
            id="ai_refresh_btn"
            disabled={aiLoading}
            onClick={() => generateSuggestions(true)}
            className="bg-slate-900 border border-slate-800 text-slate-250 cursor-pointer hover:border-indigo-500/30 hover:bg-slate-850/80 px-4.5 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 active:scale-95"
          >
            <Sparkles className={`w-4 h-4 text-indigo-400 ${aiLoading ? 'animate-spin' : ''}`} />
            Scan AI Options
          </button>

          <button 
            id="ai_settings_btn"
            onClick={() => setShowSettingsModal(true)}
            className={`bg-slate-900 border hover:border-indigo-500/35 hover:bg-slate-850/85 px-4.5 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 active:scale-95 ${
              localLlmEnabled 
                ? "border-emerald-500/30 text-emerald-300 bg-emerald-950/10" 
                : "border-slate-800 text-slate-250"
            }`}
            title="Local LLM Settings"
          >
            <Settings className={`w-4 h-4 ${localLlmEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Local LLM Setup</span>
            {localLlmEnabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          <div className="w-px h-6 bg-slate-900 hidden md:block mx-1"></div>

          <button 
            id="backup_state_btn"
            onClick={handleDownloadAppState}
            className="bg-slate-900 border border-slate-800 text-slate-250 cursor-pointer hover:border-indigo-500/30 hover:bg-slate-850/80 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 active:scale-95"
            title="Download full database & layout metrics backup"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Backup State</span>
          </button>

          <button 
            id="load_state_btn"
            onClick={() => document.getElementById("load_backup_input")?.click()}
            className="bg-slate-900 border border-slate-800 text-slate-250 cursor-pointer hover:border-indigo-500/30 hover:bg-slate-850/80 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 active:scale-95"
            title="Restore full database & layout metrics from backup"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Load State</span>
          </button>
          <input 
            type="file" 
            id="load_backup_input" 
            accept=".json" 
            onChange={handleLoadAppState} 
            className="hidden" 
          />
        </div>
      </header>

      {/* Main Content Layout */}
      {activeBoard === "timeline" && (
        <div className="space-y-6" id="bento_timeline_board">
          {/* Top Bento Row: Stats Widget & AI Advisor alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Bento Box 1: Utilization Health */}
            <div className="lg:col-span-3 bg-slate-900/55 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-800 transition-all shadow-inner relative overflow-hidden" id="card_utilization">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -z-10" />
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Roster Utilization
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 font-bold px-2 py-0.5 bg-slate-950 rounded-md">Wk 24</span>
                </div>
                <div className="flex items-baseline mt-4 gap-2">
                  <span className="text-5xl font-black tracking-tight">{utilizationPercentage}%</span>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    utilizationPercentage > 85 ? 'text-rose-400 bg-rose-500/10' :
                    utilizationPercentage > 60 ? 'text-emerald-400 bg-emerald-500/10' :
                    'text-amber-400 bg-amber-500/10'
                  }`}>
                    {utilizationPercentage > 85 ? 'Overworked' : utilizationPercentage > 60 ? 'Balanced' : 'Underutilized'}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-900">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]" 
                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium font-mono">
                  <span>{Math.round(totalAllocatedHours)}hrs Assigned</span>
                  <span>{totalRosterHours}hrs Capacity</span>
                </div>
              </div>

              <div className="border-t border-slate-900 pt-3 mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono font-medium">
                <span>Consistency Tracker:</span>
                <span className="text-emerald-400 font-bold">{consistencyIndex}% index</span>
              </div>
            </div>

            {/* Bento Box 2: Automated Availability Alerts */}
            <div className="lg:col-span-3 bg-slate-900/55 border border-slate-850 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-800 transition-all relative overflow-hidden" id="card_availability_alerts">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -z-10" />
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-400" />
                  Upcoming Team Availability
                </h3>
                <div className="space-y-3 max-h-32 overflow-y-auto pr-1">
                  {team.map(member => {
                    // Compute allocated meeting hours
                    const mCount = meetings.filter(m => m.assignedMemberIds.includes(member.id));
                    const spentHours = mCount.reduce((a, b) => a + (b.endHour - b.startHour), 0);
                    const remainingHours = Math.max(0, member.weeklyHours - spentHours);
                    const isFullyFree = remainingHours > (member.weeklyHours - 4);

                    return (
                      <div key={member.id} className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isFullyFree ? 'bg-emerald-400' : 'bg-slate-750'}`} />
                          <div className="truncate max-w-[120px]">
                            <p className="text-xs font-semibold text-slate-200 truncate">{member.name}</p>
                            <p className="text-[9px] text-slate-500 truncate">{member.role}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-lg shrink-0">
                          {Math.round(remainingHours)}h free
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic mt-3 leading-tight block">
                * Based on weekly scheduled discussions against personal blocker hours.
              </p>
            </div>

            {/* Bento Box 3: AI Assignment Laboratory Advisor */}
            <div className="lg:col-span-6 bg-slate-900/55 border border-indigo-500/25 rounded-2xl p-5 hover:border-indigo-550 transition-all flex flex-col justify-between" id="card_ai_suggestions">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                    <Bot className="w-4.5 h-4.5 text-indigo-400" />
                    AI Opportunity Alerts & Advice
                  </h3>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20 uppercase tracking-wider font-bold">
                    {recsSource === "gemini" ? "Gemini Models" : recsSource === "heuristic" ? "Dynamic Local" : "Pending Scan"}
                  </span>
                </div>

                {recommendations.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500 space-y-2">
                    <Sparkles className="w-6 h-6 text-indigo-400/40 mx-auto" />
                    <p className="text-xs font-medium">No schedule evaluation scans compiled yet.</p>
                    <button 
                      onClick={() => generateSuggestions(true)}
                      className="text-[11px] font-bold bg-indigo-600 hover:bg-indigo-550 transition-colors px-3 py-1.5 rounded-lg text-white cursor-pointer mt-1"
                    >
                      Analyze Roster Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-40 overflow-y-auto pr-1">
                    {meetings.map(meet => {
                      const rec = recommendations.find(r => r.meetingId === meet.id);
                      if (!rec) return null;

                      // Check if already suggested assignees are set
                      const currentAssignees = meet.assignedMemberIds;
                      const suggestedIds = rec.suggestedMemberIds;
                      const isApplied = listIsEqual(currentAssignees, suggestedIds);

                      return (
                        <div key={meet.id} className="bg-indigo-950/20 border border-indigo-500/15 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[9px] text-indigo-400 font-mono font-bold uppercase">{meet.title}</span>
                            <p className="text-xs text-indigo-100 font-medium">
                              Suggest assigning: <span className="font-bold underline decoration-indigo-400 decoration-2">{suggestedIds.map(id => team.find(t => t.id === id)?.name).filter(Boolean).join(", ")}</span>
                            </p>
                            <div className="flex flex-wrap gap-1 items-center">
                              {rec.reasons.slice(0, 2).map((r, i) => (
                                <span key={i} className="text-[9px] text-slate-400 flex items-center gap-1">
                                  <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button 
                            disabled={isApplied}
                            onClick={() => applyAISuggestion(meet.id, suggestedIds)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all self-end sm:self-center font-semibold ${
                              isApplied 
                                ? "bg-slate-950 text-slate-500 border border-slate-900 cursor-not-allowed" 
                                : "bg-indigo-600 hover:bg-indigo-550 text-white shadow-md shadow-indigo-600/10 active:scale-95"
                            }`}
                          >
                            {isApplied ? "Applied" : "Apply AI建议"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="text-[10px] text-indigo-400 mt-2 hover:underline cursor-pointer flex items-center justify-between text-right border-t border-slate-900 pt-2 font-mono">
                <span>Recommendations match 4 dimensions: availability, expertise, learning target & stability.</span>
              </div>
            </div>

          </div>

          {/* Interactive Leverage Timeline Grid */}
          <div className="bg-slate-900/55 border border-slate-850 rounded-2xl p-5 hover:border-slate-800 transition-all" id="timeline_grid_card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-900">
              <div>
                <h2 className="text-base font-bold text-slate-200">Weekly Allocation Timeline Planner</h2>
                <p className="text-xs text-slate-500">Spot calendar holes, check exclusions, and balance assignments cleanly.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn_schedule_open"
                  onClick={() => setShowMeetForm(!showMeetForm)}
                  className="inline-flex items-center gap-2 cursor-pointer bg-indigo-600 hover:bg-indigo-550 border border-indigo-400/20 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/15"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Discussion Topic
                </button>
              </div>
            </div>

            {/* Quick Meeting Creation Form Overlay / Embed */}
            {showMeetForm && (
              <form onSubmit={handleAddNewMeeting} className="mb-6 p-4 bg-slate-950 border border-indigo-500/20 rounded-xl space-y-4 animate-fade-in" id="add_meeting_form">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-xs font-bold text-indigo-300">Schedule New Session & Topic Area</span>
                  <button type="button" onClick={() => setShowMeetForm(false)} className="text-slate-500 hover:text-slate-350">
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session/Meeting Title</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Billing Core Review"
                      value={meetTitle} 
                      onChange={(e) => setMeetTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-indigo-400 focus:outline-none rounded-xl text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topic Classification</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Database Design"
                      value={meetTopic} 
                      onChange={(e) => setMeetTopic(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-indigo-400 focus:outline-none rounded-xl text-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Day</label>
                      <select 
                        value={meetDay} 
                        onChange={(e: any) => setMeetDay(e.target.value)}
                        className="w-full px-2 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 cursor-pointer"
                      >
                        <option value="Monday">Mon</option>
                        <option value="Tuesday">Tue</option>
                        <option value="Wednesday">Wed</option>
                        <option value="Thursday">Thu</option>
                        <option value="Friday">Fri</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start</label>
                      <select 
                        value={meetStart} 
                        onChange={(e) => setMeetStart(parseFloat(e.target.value))}
                        className="w-full px-1.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono cursor-pointer"
                      >
                        {Array.from({ length: 18 }, (_, i) => 8 + i * 0.5).map(hr => (
                          <option key={hr} value={hr}>{formatTime(hr)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End</label>
                      <select 
                        value={meetEnd} 
                        onChange={(e) => setMeetEnd(parseFloat(e.target.value))}
                        className="w-full px-1.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono cursor-pointer"
                      >
                        {Array.from({ length: 18 }, (_, i) => meetStart + 0.5 + i * 0.5).map(hr => (
                          <option key={hr} value={hr}>{formatTime(hr)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recurrence</label>
                      <select 
                        value={meetRecurrence} 
                        onChange={(e: any) => setMeetRecurrence(e.target.value as any)}
                        className="w-full px-1.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 cursor-pointer"
                      >
                        <option value="Once">Once</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Bi-Weekly">Bi-Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Required Core Competencies</span>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900 border border-slate-800 rounded-xl max-h-24 overflow-y-auto">
                      {AVAILABLE_SKILLS.map((skill, idx) => {
                        const active = meetSkills.includes(skill);
                        return (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => handleToggleSkillSelection(skill)}
                            className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${
                              active ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-750"
                            }`}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Roster Assignments</span>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900 border border-slate-800 rounded-xl max-h-24 overflow-y-auto">
                      {team.map((member) => {
                        const isAssigned = meetAssignees.includes(member.id);
                        
                        // Check if member is blocked on this day/hour window
                        const isBlocked = member.blockedTimes.some(b => 
                          b.day === meetDay && 
                          ((meetStart < b.endHour) && (meetEnd > b.startHour))
                        );

                        // Check if member has required skill alignment
                        const meetsSkill = member.skills.some(s => meetSkills.includes(s));
                        const isLearningGoal = member.learningGoals?.some(s => meetSkills.includes(s));

                        return (
                          <button
                            type="button"
                            key={member.id}
                            onClick={() => handleToggleAssigneeSelection(member.id)}
                            className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                              isAssigned 
                                ? "bg-indigo-600/90 text-white" 
                                : "bg-slate-800 text-slate-400 hover:bg-slate-750"
                            }`}
                          >
                            <span>{member.name}</span>
                            {isBlocked && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Possesses Blocker Exception!" />}
                            {meetsSkill && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Expert match" />}
                            {isLearningGoal && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" title="Learning Opportunity goal alignment" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
                  <button 
                    type="button" 
                    onClick={() => setShowMeetForm(false)} 
                    className="px-4 py-1.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white font-semibold text-xs shadow-md shadow-indigo-600/15 cursor-pointer"
                  >
                    Commit to Calendar
                  </button>
                </div>
              </form>
            )}

            {/* Calendar timeline layout table */}
            <div className="w-full overflow-x-auto">
              <div className="min-w-[800px] border border-slate-850 bg-slate-950/60 rounded-xl overflow-hidden shadow-sm" id="calendar_grid">
                             {/* Scale Hours Row */}
                <div className="grid grid-cols-12 bg-slate-900 border-b border-slate-850 py-2.5 text-[9px] uppercase tracking-wider font-bold text-slate-450 font-mono text-center">
                  <div className="col-span-2 text-left pl-4">Team Resource</div>
                  <div className="col-span-2">Monday</div>
                  <div className="col-span-2">Tuesday</div>
                  <div className="col-span-2">Wednesday</div>
                  <div className="col-span-2">Thursday</div>
                  <div className="col-span-2">Friday</div>
                </div>

                {/* 🚨 Schedule Bottlenecks & Unassigned Row */}
                {meetings.some(m => m.assignedMemberIds.length === 0 || getMeetingStatus(m, team) !== null) && (
                  <div className="grid grid-cols-12 bg-rose-500/5 border-b border-rose-950/40 py-4 items-center">
                    <div className="col-span-2 pl-4">
                      <div className="font-extrabold text-xs text-rose-450 uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-450 shrink-0" />
                        Bottlenecks
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium font-mono">Attention Alert</div>
                    </div>
                    
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                      const dayBottlenecks = meetings.filter(m => 
                        m.day === day && 
                        (m.assignedMemberIds.length === 0 || getMeetingStatus(m, team) !== null)
                      );
                      
                      return (
                        <div key={day} className="col-span-2 px-2.5 h-full min-h-[58px] flex flex-col justify-start gap-1.5 justify-center border-l border-slate-900/40 border-dashed">
                          {dayBottlenecks.map(meet => {
                            const diag = getMeetingStatus(meet, team);
                            const isCritical = diag?.severity === "critical";
                            
                            return (
                              <div 
                                key={meet.id}
                                className={`text-[10px] px-2.5 py-2 rounded-xl border flex flex-col font-medium select-none group relative transition-all ${
                                  isCritical 
                                    ? "bg-rose-950/40 border-rose-500/40 text-rose-200 hover:bg-rose-900/50" 
                                    : "bg-amber-950/30 border-amber-500/30 text-amber-200 hover:bg-amber-900/45"
                                } shadow-md`}
                              >
                                <div className="flex items-center justify-between gap-1 leading-tight mb-0.5">
                                  <span className="font-bold truncate">{meet.title}</span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                    <button 
                                      onClick={() => handleRemoveMeeting(meet.id)}
                                      className="p-0.5 text-rose-550 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                                      title="Unschedule topic"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                                <span className="text-[8.5px] font-mono opacity-80">{formatTime(meet.startHour)} - {formatTime(meet.endHour)}</span>
                                
                                {meet.recurrence && meet.recurrence !== "Once" && (
                                  <span className="text-[8px] bg-slate-900 text-slate-350 px-1 py-0.5 rounded max-w-max mt-1 font-mono tracking-wide border border-slate-880">
                                    🔁 {meet.recurrence}
                                  </span>
                                )}

                                {/* Bottleneck specific diagnosis */}
                                <div className="mt-1 text-[8.5px] font-medium text-rose-350 leading-relaxed bg-slate-950/65 p-1.5 rounded border border-rose-500/10 max-h-16 overflow-y-auto">
                                  {diag ? diag.reason : "No assignees scheduled."}
                                </div>

                                {/* Outlook mail & Quick assigning selectors */}
                                <div className="flex flex-wrap gap-1.5 mt-2 pt-1.5 border-t border-slate-800/80">
                                  <button
                                    onClick={() => handleTriggerOutlookEmail(meet)}
                                    className="text-[8.5px] bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-1.5 py-0.5 rounded border border-indigo-500/25 flex items-center gap-0.5 transition-colors cursor-pointer shrink-0 font-bold"
                                    title="Email assigned (or suggested) resources via Outlook"
                                  >
                                    <Mail className="w-2.5 h-2.5 shrink-0" />
                                    Outlook
                                  </button>
                                  
                                  <select
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val) {
                                        setMeetings(prev => prev.map(m => m.id === meet.id ? { ...m, assignedMemberIds: [...m.assignedMemberIds, val] } : m));
                                        addNotification("Roster Appended", `Allocated resource to "${meet.title}"`, "availability");
                                      }
                                    }}
                                    className="text-[8.5px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded px-1 cursor-pointer max-w-[80px]"
                                    value=""
                                  >
                                    <option value="" disabled>+ Assign</option>
                                    {team.map(t => (
                                      <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                          {dayBottlenecks.length === 0 && (
                            <span className="text-[9px] text-slate-800 italic select-none text-center py-1">No alerts</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Team Rows */}
                {team.map((member) => (
                  <div key={member.id} className="grid grid-cols-12 border-b border-slate-900 last:border-b-0 hover:bg-slate-900/20 py-4 items-center">
                    
                    {/* Resource details */}
                    <div className="col-span-2 pl-4">
                      <div className="font-bold text-sm text-slate-100">{member.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{member.role}</div>
                      
                      {/* Skills micro badge */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 text-indigo-400 font-serif border border-slate-850 rounded">
                          {member.project}
                        </span>
                      </div>
                    </div>

                    {/* Mon-Fri cells */}
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                      const dayMeetings = meetings.filter(m => m.day === day && m.assignedMemberIds.includes(member.id));
                      const dayBlockages = member.blockedTimes.filter(b => b.day === day);

                      return (
                        <div key={day} className="col-span-2 px-2.5 h-full min-h-[58px] flex flex-col justify-start gap-1 justify-center border-l border-slate-900 last:border-r-0">
                          
                          {/* Blockages (Grayed/Crimson pill blocks) */}
                          {dayBlockages.map(block => (
                            <div 
                              key={block.id} 
                              className="text-[9px] px-2 py-1 rounded bg-rose-950/40 border border-rose-900/30 text-rose-300 pointer-events-none truncate"
                              title={`Schedule Blocked: ${block.reason} (${block.startHour}:00 - ${block.endHour}:00)`}
                            >
                              <div className="font-bold flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{block.startHour}h-{block.endHour}h</div>
                              <span className="italic truncate block">{block.reason}</span>
                            </div>
                          ))}

                          {/* Meetings / Allocated sessions */}
                          {dayMeetings.map(meet => {
                            // Check for expert alignment
                            const hasAlignSkill = member.skills.some(s => meet.requiredSkills.includes(s));
                            const hasAlignGoal = member.learningGoals?.some(s => meet.requiredSkills.includes(s));

                            return (
                              <div 
                                key={meet.id} 
                                className={`text-[10px] px-2 py-1.5 rounded-lg border flex flex-col font-medium select-none group relative transition-all ${
                                  hasAlignSkill 
                                    ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-200 hover:bg-indigo-900/40' 
                                    : hasAlignGoal
                                    ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-200 hover:bg-emerald-900/40'
                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 leading-tight mb-0.5">
                                  <span className="font-bold truncate">{meet.title}</span>
                                  <button 
                                    onClick={() => handleRemoveMeeting(meet.id)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-rose-500 hover:bg-rose-955/35 rounded transition-all transition-colors cursor-pointer"
                                    title="Unschedule discussion"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                                <span className="text-[8px] font-mono opacity-80">{formatTime(meet.startHour)} - {formatTime(meet.endHour)}</span>
                                
                                {/* Micro alignment signals and Outlook icon trigger */}
                                <div className="flex items-center justify-between gap-1 mt-1">
                                  <div className="flex flex-wrap gap-1 leading-none">
                                    {hasAlignSkill && (
                                      <span className="text-[8px] bg-indigo-500/20 text-indigo-300 font-bold px-1 rounded-sm shrink-0">EXPERT</span>
                                    )}
                                    {hasAlignGoal && (
                                      <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-bold px-1 rounded-sm shrink-0">GROWTH</span>
                                    )}
                                    {meet.recurrence && meet.recurrence !== 'Once' && (
                                      <span className="text-[8px] bg-slate-950 border border-slate-850 text-slate-400 px-1 rounded-sm shrink-0" title={`Recurs: ${meet.recurrence}`}>🔂 {meet.recurrence}</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleTriggerOutlookEmail(meet); }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-950 hover:text-indigo-400 rounded text-slate-450 transition-all cursor-pointer"
                                    title="Email assigned resources via Outlook"
                                  >
                                    <Mail className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {/* Inline empty indicator if clear */}
                          {dayMeetings.length === 0 && dayBlockages.length === 0 && (
                            <span className="text-[9px] text-slate-700 select-none text-center font-mono py-1.5">Available</span>
                          )}
                        </div>
                      );
                    })}

                  </div>
                ))}

              </div>
            </div>

            {/* Custom Bottom legend bar */}
            <div className="mt-4 border-t border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-mono">Next Cron Check: Recurring Tuesdays 09:00 AM</span>
                <span>•</span>
                <span className="text-indigo-400 font-mono">Expert Alignment active</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">Feedback shadow tracking on</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-500" /> Expert Matching</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Goal Shadowing</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500/40" /> Blocker Exclusions</span>
              </div>
            </div>
          </div>

          {/* Lower Bento row: Email scheduling mailroom & interactive notifications logger */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Bento Cell: Recurring mailroom reports */}
            <div className="bg-slate-900/55 border border-slate-850 rounded-2xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between" id="card_cron_mailroom">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  Recurring Utilization Dispatcher
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Automate and dispatch periodic reports summaries of roster availability, expertise gaps, and learning opportunity metrics directly to your manager inbox.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recipient Email</label>
                    <input 
                      type="email" 
                      value={reportEmail} 
                      onChange={(e) => setReportEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-850 focus:border-indigo-400 focus:outline-none rounded-xl text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recurrence Schedule</label>
                    <select 
                      value={reportSchedule} 
                      onChange={(e) => setReportSchedule(e.target.value)}
                      className="w-full px-2 py-2 text-xs bg-slate-950 border border-slate-850 focus:border-indigo-400 rounded-xl text-slate-200"
                    >
                      <option value="Weekly - Monday 9:00 AM">Weekly - Mondays (09:00)</option>
                      <option value="Weekly - Friday 5:00 PM">Weekly - Fridays (17:00)</option>
                      <option value="Daily - 6:00 PM">Daily - EOD Summary (18:00)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-900 pt-4 mt-2">
                <div className="text-[10px] text-slate-500 font-mono">
                  {reportsLog.length > 0 
                    ? `Last dispatch: ${reportsLog[0].sentAt} (ID: ${reportsLog[0].id})` 
                    : "No reports dispatched in session."
                  }
                </div>
                <button
                  type="button"
                  disabled={sendingReport || !reportEmail}
                  onClick={handleSendReport}
                  className="bg-indigo-600 hover:bg-indigo-550 border border-indigo-400/20 text-white cursor-pointer px-4.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/15"
                >
                  {sendingReport ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Dispatch Sample Digest
                </button>
              </div>

              {reportsLog.length > 0 && (
                <div className="mt-4 p-3 bg-slate-950/80 border border-slate-900 rounded-xl space-y-2">
                  <span className="text-[10px] text-indigo-400 font-bold block uppercase font-mono">Report Transmission Log:</span>
                  <p className="text-[11px] text-slate-350 italicleading-relaxed leading-normal">
                    "Successfully transmitted: Team metrics are compiled at {utilizationPercentage}% and sent to {reportsLog[0].recipient}. Visual coverage indicates {computedGaps.length} monitored skills."
                  </p>
                </div>
              )}
            </div>

            {/* Bento Cell: Interactive Alert Center notifications log */}
            <div className="bg-slate-900/55 border border-slate-850 rounded-2xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between" id="card_unified_logs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-violet-400" />
                    Roster Activity Log & Flags
                  </h3>
                  <button 
                    onClick={() => setNotifications([])}
                    className="text-[10px] text-slate-500 hover:text-slate-350 cursor-pointer"
                  >
                    Clear Feed
                  </button>
                </div>

                <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center p-6 text-slate-600 text-xs italic">
                       Roster quiet. No warnings or status reports queued.
                    </div>
                  ) : (
                    notifications.map(item => (
                      <div key={item.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-slate-850 transition-all">
                        <span className="text-xs mt-0.5">
                          {item.type === 'gap' ? '⚠️' : item.type === 'report' ? '📊' : '🕒'}
                        </span>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-200">{item.title}</span>
                            <span className="text-[9px] font-mono text-slate-500 shrink-0">{item.timestamp}</span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 leading-normal">{item.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono text-right border-t border-slate-900 pt-3 mt-2">
                Active alerts auto-refreshing on client actions.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Roster Management Board Integration */}
      {activeBoard === "roster" && (
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 animate-fade-in" id="bento_roster_board">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-900">
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Team Roster Setup Registry</h2>
              <p className="text-xs text-slate-400">Onboard developers and configure day blocks. These blocks form the exclusion rules on the timeline plan.</p>
            </div>
          </div>
          
          {/* Subordinated layout wrapper to styled TeamManager component */}
          <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl">
            <TeamManager 
              team={team} 
              setTeam={setTeam} 
              addNotification={addNotification} 
            />
          </div>
        </div>
      )}

      {/* Gaps Visualization Board */}
      {activeBoard === "gaps" && (
        <div className="bg-slate-900/55 border border-slate-850 rounded-2xl p-6 hover:border-slate-800 transition-all animate-fade-in" id="bento_gaps_board">
          <div className="pb-4 border-b border-slate-900 mb-6">
            <h2 className="text-lg font-black tracking-tight text-white">Expertise Alignment & Project Gaps</h2>
            <p className="text-xs text-slate-400">Identify discussions that are missing matching specialists or align them with development shadow targets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Card: Dynamic Skill Allocation Status */}
            <div className="p-5 bg-slate-950 border border-slate-900 rounded-2xl space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <LinkSkillIcon className="w-4 h-4 text-indigo-400" />
                Required Skills & Talent Alignment
              </h3>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {computedGaps.length === 0 ? (
                  <div className="text-slate-500 text-xs italic p-4 text-center">
                    No active sessions with registered competencies found.
                  </div>
                ) : (
                  computedGaps.map((gap, i) => (
                    <div key={i} className="p-3 bg-slate-900/60 rounded-xl border border-slate-900 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-200">{gap.skill}</span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          gap.status === "Critical Gap" ? "bg-rose-500/10 text-rose-450 border border-rose-500/20" :
                          gap.status === "Over-Allocation" ? "bg-amber-400/10 text-amber-450 border border-amber-400/20" :
                          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35"
                        }`}>
                          {gap.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                          <span>Team Experts:</span>
                          <span className="text-slate-300 truncate max-w-[200px]">{gap.teamExperts.join(", ") || "No experts found"}</span>
                        </div>
                        <div className="flex gap-1 h-2.5 bg-slate-950 rounded overflow-hidden">
                          {Array.from({ length: 4 }).map((_, step) => {
                            let barColor = "bg-slate-800";
                            if (gap.status === "Critical Gap") {
                              if (step === 0) barColor = "bg-rose-500";
                            } else if (gap.status === "Over-Allocation") {
                              barColor = "bg-indigo-500";
                            } else {
                              if (step < 3) barColor = "bg-indigo-500";
                            }
                            return <div key={step} className={`flex-1 ${barColor}`} />;
                          })}
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 font-medium font-serif italic truncate">
                        Required in: {gap.requiredInTopics.join(", ") || "General Timeline"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Card: Strategic Optimization Recommendation Generator */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Strategic Advisor Recommendations
                </h3>

                <p className="text-xs text-slate-350 leading-relaxed mb-4">
                  Based on current project assignments, availability exclusion blocks, and mapped personal learning targets, our heuristical index suggests the following actions to utilize the team's capacity:
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/15 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-indigo-300">Shadow Opportunity</span>
                    <p className="text-slate-350 font-serif leading-relaxed italic">
                      "Leverage junior resource Diana Prince (React, Node.js) to shadow Bob Smith on Billing API Integration sessions. Mentoring aligns with Diana's goals: 'SQL' & 'Typescript'."
                    </p>
                  </div>

                  <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/15 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-emerald-300">Underutilized DevOps Slot</span>
                    <p className="text-slate-350 font-serif leading-relaxed italic">
                      "Evan Wright possesses AWS & Docker expertise but operates with 0 scheduled meetings. Deploy Evan to review AWS Ingress Security session to align lead consistency."
                    </p>
                  </div>

                  <div className="p-3.5 bg-amber-950/20 border border-amber-500/15 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-amber-300">Exclusion Risk mitigation</span>
                    <p className="text-slate-350 font-serif leading-relaxed italic">
                      "Alice Chen is blocked Monday mornings. Move Architecture reviews to Tuesday afternoon (15:00) to bypass Alice's exclusionary window and achieve full lead consistency."
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono text-center pt-3 border-t border-slate-900 leading-normal">
                Optimize and modify your scheduled meetings on the main screen to action these recommendations.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 text-center text-[11px] text-slate-550 border-t border-slate-900 pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <span>OptiMix Resource Utilization Maximiser Engine • Standard CJS Node Process Container</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a>
          <a href="#" className="hover:text-indigo-400 transition-colors">API Keys Panel</a>
          <a href="#" className="hover:text-indigo-400 transition-colors">System Health: Green</a>
        </div>
      </footer>

      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="local_llm_settings_modal">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative">
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer p-1.5 hover:bg-slate-800 rounded-xl transition-colors border-0"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-white flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              Local LLM Service Setup
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Configure and test a private, local LLM connection running on your computer (e.g., Ollama or LM Studio). This replaces cloud-based Gemini requests with 100% private inference.
            </p>

            <div className="space-y-4 text-xs">
              {/* Toggle Enable */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-850">
                <div>
                  <span className="font-bold text-slate-250 block">Activate Local LLM Integration</span>
                  <span className="text-[11px] text-slate-500">Route all Scan AI operations to your private local endpoint.</span>
                </div>
                <button
                  type="button"
                  id="toggle_local_llm"
                  onClick={() => setLocalLlmEnabled(!localLlmEnabled)}
                  className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative cursor-pointer border-0 ${
                    localLlmEnabled ? "bg-emerald-500" : "bg-slate-800"
                  }`}
                >
                  <div className={`bg-white w-5.5 h-5.5 rounded-full shadow-md transform transition-transform duration-200 ${
                    localLlmEnabled ? "translate-x-5.5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Format selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Local Engine Format</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setLocalLlmFormat("ollama"); setLocalLlmUrl("http://localhost:11434"); setTestResult(null); }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      localLlmFormat === "ollama"
                        ? "border-indigo-600 bg-indigo-950/20 text-indigo-300 font-bold"
                        : "border-slate-850 bg-slate-950/40 text-slate-450 hover:border-slate-800"
                    }`}
                  >
                    Ollama Server
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLocalLlmFormat("openai"); setLocalLlmUrl("http://localhost:1234"); setTestResult(null); }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      localLlmFormat === "openai"
                        ? "border-indigo-600 bg-indigo-950/20 text-indigo-300 font-bold"
                        : "border-slate-850 bg-slate-950/40 text-slate-450 hover:border-slate-800"
                    }`}
                  >
                    OpenAI / LM Studio
                  </button>
                </div>
              </div>

              {/* Base URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Server Base URL</label>
                <input
                  type="text"
                  value={localLlmUrl}
                  onChange={(e) => { setLocalLlmUrl(e.target.value); setTestResult(null); }}
                  placeholder="e.g. http://localhost:11434"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 focus:border-indigo-400 focus:outline-none rounded-xl text-slate-100 font-mono"
                />
              </div>

              {/* Model selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active LLM Model</label>
                  <input
                    type="text"
                    value={localLlmModel}
                    onChange={(e) => setLocalLlmModel(e.target.value)}
                    placeholder="e.g. llama3.2"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 focus:border-indigo-400 focus:outline-none rounded-xl text-slate-100 font-mono"
                  />
                </div>
                
                {/* Discovered models list */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discovered Models List</label>
                  {localLlmModelsList.length === 0 ? (
                    <div className="w-full px-3 py-2 bg-slate-950 border border-slate-850 text-slate-500 rounded-xl italic select-none text-[11px] h-[34px] flex items-center">
                      No models fetched. Run test below.
                    </div>
                  ) : (
                    <select
                      value={localLlmModel}
                      onChange={(e) => setLocalLlmModel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 focus:border-indigo-400 focus:outline-none rounded-xl text-slate-200 cursor-pointer text-xs"
                    >
                      {localLlmModelsList.map((m, i) => (
                        <option key={i} value={m}>{m}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Action Buttons to Connection Test */}
              <div className="pt-2 flex gap-3.5">
                <button
                  type="button"
                  onClick={handleTestLocalLlmConnection}
                  disabled={testingConnection}
                  className="bg-indigo-600 hover:bg-indigo-550 disabled:bg-slate-800 disabled:text-slate-500 cursor-pointer border border-indigo-400/25 text-white flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center inline-flex items-center justify-center gap-1.5"
                >
                  {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Test localhost connection
                </button>
              </div>

              {/* Status display */}
              {testResult && (
                <div className={`p-3.5 rounded-xl border text-[11.5px] leading-relaxed block ${
                  testResult.success 
                    ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" 
                    : "bg-rose-950/25 border-rose-500/15 text-rose-350"
                }`}>
                  <span className="font-bold block mb-1">{testResult.success ? "✓ Connection Established" : "✗ Connection Blocked"}</span>
                  <p>{testResult.message}</p>
                </div>
              )}

              {/* Live documentation help guide block */}
              <div className="p-3.5 bg-slate-950/40 rounded-2xl border border-slate-850/60 text-[11px] text-slate-500 space-y-2 leading-relaxed">
                <span className="font-bold text-slate-400 uppercase tracking-wider block text-[9.5px]">How to ensure CORS compatibility:</span>
                {localLlmFormat === "ollama" ? (
                  <p>
                    Ollama restricts cross-origin request scripts by default. To unblock OptiMix connection, set environment flags before starting Ollama:
                    <code className="block mt-1 p-1 bg-slate-950 rounded text-slate-400 font-mono text-[10px] break-all">OLLAMA_ORIGINS="*" ollama serve</code>
                  </p>
                ) : (
                  <p>
                    Check configurations inside LM Studio or LocalAI settings panel. Ensure the server mounts on host <code className="text-slate-400 font-mono">127.0.0.1</code> or <code className="text-slate-400 font-mono">localhost</code> and supports headers for cross-origin requests.
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-6 border-t border-slate-850 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer border-0"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- Supplementary Helpers ---

function getMeetingStatus(meet: Meeting, team: TeamMember[]) {
  const assigned = meet.assignedMemberIds;
  
  if (assigned.length === 0) {
    const hasRequiredSkills = meet.requiredSkills.length > 0;
    if (!hasRequiredSkills) {
      return {
        status: "unassigned" as const,
        reason: "No resource assigned. Setup skills below.",
        severity: "warning" as const
      };
    }
    
    const qualifiedExperts = team.filter(m => 
      m.skills.some(s => meet.requiredSkills.includes(s))
    );
    
    if (qualifiedExperts.length === 0) {
      return {
        status: "bottleneck" as const,
        reason: `Expertise Deficit: Nobody has: ${meet.requiredSkills.join(", ")}.`,
        severity: "critical" as const
      };
    }
    
    const freeQualifiedExperts = qualifiedExperts.filter(m => {
      const isBlocked = m.blockedTimes.some(b => 
        b.day === meet.day && 
        ((meet.startHour < b.endHour) && (meet.endHour > b.startHour))
      );
      return !isBlocked;
    });
    
    if (freeQualifiedExperts.length === 0) {
      return {
        status: "bottleneck" as const,
        reason: `Schedule Bottleneck: All qualified experts are blocked during this time!`,
        severity: "critical" as const
      };
    }
    
    return {
      status: "unassigned" as const,
      reason: "No resources assigned to scheduled topic.",
      severity: "warning" as const
    };
  }
  
  for (const id of assigned) {
    const mem = team.find(t => t.id === id);
    if (mem) {
      const overlap = mem.blockedTimes.find(b => 
        b.day === meet.day && 
        ((meet.startHour < b.endHour) && (meet.endHour > b.startHour))
      );
      if (overlap) {
        return {
          status: "overlap-conflict" as const,
          reason: `Overlap conflict: ${mem.name} is blocked for: "${overlap.reason}".`,
          severity: "critical" as const
        };
      }
    }
  }
  
  if (meet.requiredSkills.length > 0) {
    const anyExpertAssigned = assigned.some(id => {
      const mem = team.find(t => t.id === id);
      return mem && mem.skills.some(s => meet.requiredSkills.includes(s));
    });
    
    if (!anyExpertAssigned) {
      return {
        status: "skill-mismatch" as const,
        reason: "Skills mismatch: assigned members lack required skills.",
        severity: "warning" as const
      };
    }
  }
  
  return null;
}

function formatTime(hour: number): string {
  const h = Math.floor(hour);
  const m = (hour - h) * 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m === 0 ? '00' : Math.round(m);
  return `${displayH}:${displayM} ${ampm}`;
}

function listIsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, i) => val === sortedB[i]);
}

// Icon fallbacks
function LinkSkillIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  );
}

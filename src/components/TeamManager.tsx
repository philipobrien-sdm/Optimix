import React, { useState, useRef } from "react";
import { TeamMember, BlockedTime } from "../types";
import { 
  UserPlus, Upload, Trash2, Edit2, ShieldAlert, CheckCircle2, Save, 
  X, ShieldQuestion, Award, BookOpen, Clock, Calendar, AlertCircle
} from "lucide-react";
import { AVAILABLE_SKILLS, AVAILABLE_PROJECTS } from "../data/defaultData";

interface TeamManagerProps {
  team: TeamMember[];
  setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  addNotification: (title: string, message: string, type: 'availability' | 'gap' | 'report') => void;
}

export default function TeamManager({ team, setTeam, addNotification }: TeamManagerProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [newMemberProject, setNewMemberProject] = useState("Unassigned");
  const [newMemberHours, setNewMemberHours] = useState(40);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberConstraints, setNewMemberConstraints] = useState("");
  const [csvPreviewError, setCsvPreviewError] = useState<string | null>(null);
  const [showCSVModal, setShowCSVModal] = useState(false);

  // New Blocked Time controls
  const [blockDay, setBlockDay] = useState<BlockedTime['day']>("Monday");
  const [blockStart, setBlockStart] = useState(9);
  const [blockEnd, setBlockEnd] = useState(11);
  const [blockReason, setBlockReason] = useState("");

  // CSV Drag and drop / file input
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV Core Logic
  const handleCSVParse = (text: string) => {
    try {
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error("CSV file should contain at least a header row and one team member row.");
      }

      // Check header columns
      const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
      const nameIdx = headers.findIndex(h => h.includes("name") || h.includes("employee"));
      const roleIdx = headers.findIndex(h => h.includes("role") || h.includes("title"));
      const emailIdx = headers.findIndex(h => h.includes("email") || h.includes("mail"));
      const skillsIdx = headers.findIndex(h => h.includes("skill") || h.includes("expertise"));
      const projectIdx = headers.findIndex(h => h.includes("project") || h.includes("assignment"));
      const hoursIdx = headers.findIndex(h => h.includes("hour") || h.includes("capacity"));
      const constraintsIdx = headers.findIndex(h => h.includes("constraint") || h.includes("limit") || h.includes("avail") || h.includes("note"));

      if (nameIdx === -1) {
        throw new Error("Missing 'Name' or 'Employee' column in the CSV header.");
      }

      const importedMembers: TeamMember[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Simple CSV splitter that respects quoted strings
        const row = parseCSVRow(lines[i]);
        if (row.length < 1) continue;

        const name = row[nameIdx] || "Unknown Resource";
        const role = roleIdx !== -1 ? row[roleIdx] : "Team Resource";
        const email = emailIdx !== -1 && row[emailIdx] 
          ? row[emailIdx] 
          : `${name.toLowerCase().replace(/\s+/g, ".")}@optimix.com`;
        
        // Parse skills: split by pipe, semicolon, or slash
        const rawSkills = skillsIdx !== -1 ? row[skillsIdx] : "";
        const skills = rawSkills
          ? rawSkills.split(/[;|/]/).map(s => s.trim()).filter(Boolean)
          : [];

        const project = projectIdx !== -1 && row[projectIdx] ? row[projectIdx] : "Unassigned";
        const hoursVal = hoursIdx !== -1 ? parseInt(row[hoursIdx] || "40", 10) : 40;
        const weeklyHours = isNaN(hoursVal) ? 45 : hoursVal;
        const constraints = constraintsIdx !== -1 && row[constraintsIdx] ? row[constraintsIdx].replace(/^["']|["']$/g, "").trim() : "";

        importedMembers.push({
          id: `mem-${Date.now()}-${i}`,
          name,
          role,
          email,
          skills,
          project,
          weeklyHours,
          blockedTimes: [],
          learningGoals: [],
          constraints,
          consistencyScore: 75 + Math.floor(Math.random() * 20),
        });
      }

      if (importedMembers.length === 0) {
        throw new Error("Could not parse any valid team rows from the CSV file.");
      }

      setTeam(prev => [...prev, ...importedMembers]);
      addNotification(
        "Import Completed Successfully!",
        `Dispatched ${importedMembers.length} team records successfully from CSV import.`,
        "availability"
      );
      setShowCSVModal(false);
      setCsvPreviewError(null);
    } catch (e: any) {
      setCsvPreviewError(e.message || "An unexpected parser error occurred.");
    }
  };

  const parseCSVRow = (text: string): string[] => {
    const result: string[] = [];
    let insideQuote = false;
    let entry = "";
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        result.push(entry.trim());
        entry = "";
      } else {
        entry += char;
      }
    }
    result.push(entry.trim());
    return result;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      readAndParseCSVFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      readAndParseCSVFile(e.target.files[0]);
    }
  };

  const readAndParseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === "string") {
        handleCSVParse(event.target.result);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleCSV = () => {
    const sampleCSV = `Employee Name,Role,Email,Skill Set,Current Project Assignments,Weekly Hours,Availability Constraints
"Sarah Connor","SecOps Expert","sarah.connor@optimix.com","System Architecture;AWS;Docker;CI/CD;Rust","Cloud Migration",40,"No meetings Wednesday mornings"
"James Holden","Frontend Lead","james.holden@optimix.com","React;Typescript;Figma;UI Design","Core UI Overhaul",35,"Only available before 4 PM"
"Naomi Nagata","Database Engineer","naomi.nagata@optimix.com","Express;SQL;Node.js;Go","Billing API Integration",40,"Prefers afternoon sessions"
"Alex Kamal","Junior Support","alex.kamal@optimix.com","React;CSS","Core UI Overhaul",20,"No Friday sessions"`;
    handleCSVParse(sampleCSV);
  };

  const handleDownloadCSVTemplate = () => {
    const csvContent = "Employee Name,Role,Email,Skill Set,Current Project Assignments,Weekly Hours,Availability Constraints\n" +
      '"Sarah Connor","SecOps Expert","sarah.connor@optimix.com","System Architecture;AWS;Docker;CI/CD;Rust","Cloud Migration",40,"No meetings Wednesday mornings"\n' +
      '"James Holden","Frontend Lead","james.holden@optimix.com","React;Typescript;Figma;UI Design","Core UI Overhaul",35,"Only available before 4 PM"\n' +
      '"Naomi Nagata","Database Engineer","naomi.nagata@optimix.com","Express;SQL;Node.js;Go","Billing API Integration",40,"Prefers afternoon sessions"\n' +
      '"Alex Kamal","Junior Support","alex.kamal@optimix.com","React;CSS","Core UI Overhaul",20,"No Friday sessions"\n';
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "optimix_team_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification("Template Downloaded", "Downloaded team roster CSV template.", "report");
  };

  // Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const emailStr = newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, ".")}@optimix.com`;

    const newMem: TeamMember = {
      id: `mem-${Date.now()}`,
      name: newMemberName,
      role: newMemberRole || "Specialist",
      email: emailStr,
      skills: ["React"], // Default basic skill
      project: newMemberProject,
      weeklyHours: newMemberHours,
      blockedTimes: [],
      learningGoals: ["SQL"],
      constraints: newMemberConstraints,
      consistencyScore: 80,
    };

    setTeam(prev => [...prev, newMem]);
    setNewMemberName("");
    setNewMemberRole("");
    setNewMemberEmail("");
    setNewMemberConstraints("");
    setNewMemberProject("Unassigned");
    setNewMemberHours(40);
    addNotification("New Member Onboarded", `${newMem.name} has been enrolled in the roster setup.`, "availability");
  };

  // Delete Member
  const handleDeleteMember = (id: string) => {
    const member = team.find(m => m.id === id);
    if (member && confirm(`Are you sure you want to remove ${member.name}?`)) {
      setTeam(prev => prev.filter(m => m.id !== id));
      if (selectedMember?.id === id) {
        setSelectedMember(null);
        setIsEditing(false);
      }
      addNotification("Resource Dropped", `${member.name} was removed from the roster registry.`, "gap");
    }
  };

  // Add Blocked Time slot
  const handleAddBlockedTime = () => {
    if (!selectedMember || !blockReason.trim()) return;

    const newBlock: BlockedTime = {
      id: `block-${Date.now()}`,
      day: blockDay,
      startHour: blockStart,
      endHour: blockEnd,
      reason: blockReason,
    };

    const updated = {
      ...selectedMember,
      blockedTimes: [...selectedMember.blockedTimes, newBlock]
    };

    setTeam(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
    setSelectedMember(updated);
    setBlockReason("");
    addNotification(
      "Availability Schedule Blocked",
      `${selectedMember.name} is now unavailable on ${blockDay} between ${blockStart}:00 and ${blockEnd}:00.`,
      "availability"
    );
  };

  const handleRemoveBlockedTime = (blockId: string) => {
    if (!selectedMember) return;

    const updated = {
      ...selectedMember,
      blockedTimes: selectedMember.blockedTimes.filter(b => b.id !== blockId)
    };

    setTeam(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
    setSelectedMember(updated);
  };

  // Toggle skills or learning goals
  const handleToggleSkill = (skill: string) => {
    if (!selectedMember) return;
    const hasSkill = selectedMember.skills.includes(skill);
    const updatedSkills = hasSkill
      ? selectedMember.skills.filter(s => s !== skill)
      : [...selectedMember.skills, skill];

    const updated = { ...selectedMember, skills: updatedSkills };
    setTeam(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
    setSelectedMember(updated);
  };

  const handleToggleLearningGoal = (skill: string) => {
    if (!selectedMember) return;
    const hasGoal = selectedMember.learningGoals.includes(skill);
    const updatedGoals = hasGoal
      ? selectedMember.learningGoals.filter(s => s !== skill)
      : [...selectedMember.learningGoals, skill];

    const updated = { ...selectedMember, learningGoals: updatedGoals };
    setTeam(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
    setSelectedMember(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="team_manager_container">
      {/* List Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900/40 rounded-2xl border border-slate-850 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-850">
            <div>
              <h2 className="text-base font-bold text-slate-100" id="team_roster_header">Roster Staff Accounts</h2>
              <p className="text-xs text-slate-400">Onboard or configure skills, assign projects, and write-off calendar blocks.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn_import_csv"
                onClick={() => setShowCSVModal(true)}
                className="inline-flex items-center gap-2 cursor-pointer bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all border border-indigo-500/20 shadow-md shadow-indigo-600/5"
              >
                <Upload className="w-4 h-4 text-indigo-400" />
                Import CSV File
              </button>
            </div>
          </div>

          {/* Quick Roster cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {team.map((member) => (
              <div 
                id={`roster_card_${member.id}`}
                key={member.id}
                onClick={() => { setSelectedMember(member); setIsEditing(false); }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedMember?.id === member.id 
                    ? "border-indigo-550 bg-indigo-950/20 shadow-lg shadow-indigo-550/5" 
                    : "border-slate-850 bg-slate-950/40 hover:border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm md:text-base">{member.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">{member.role}</p>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg font-mono text-slate-350 font-bold">
                      {member.weeklyHours}h/wk
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {member.skills.slice(0, 3).map((s, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-slate-900 border border-slate-850 text-slate-300 rounded font-mono">
                        {s}
                      </span>
                    ))}
                    {member.skills.length > 3 && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 border border-slate-850 text-slate-400 rounded font-mono">
                        +{member.skills.length - 3}
                      </span>
                    )}
                  </div>

                  {member.constraints && (
                    <div className="mt-2 text-[10.5px] text-amber-400 font-medium italic truncate" title={member.constraints}>
                      🛡️ {member.constraints}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${member.project === 'Unassigned' ? 'bg-amber-500' : 'bg-emerald-400'}`} />
                    <span className="truncate max-w-[120px]">{member.project}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span>{member.blockedTimes.length} blockers</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Member form */}
        <div className="bg-slate-900/40 rounded-2xl border border-slate-850 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2" id="add_member_title">
            <UserPlus className="w-4.5 h-4.5 text-indigo-400" />
            Quick-Enroll New Resource
          </h3>
          <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end" id="add_member_form">
            <div className="space-y-1.5 col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employee Name</label>
              <input
                id="input_member_name"
                type="text"
                required
                placeholder="Jane Doe"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none rounded-xl"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
              <input
                id="input_member_email"
                type="email"
                placeholder="jane.doe@example.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none rounded-xl"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Role Title</label>
              <input
                id="input_member_role"
                type="text"
                placeholder="Database Specialist"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none rounded-xl"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project Roster</label>
              <select
                id="select_member_project"
                value={newMemberProject}
                onChange={(e) => setNewMemberProject(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-400 focus:outline-none rounded-xl cursor-pointer"
              >
                {AVAILABLE_PROJECTS.map((proj, idx) => (
                  <option key={idx} value={proj}>{proj}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Constraints</label>
              <input
                id="input_member_constraints"
                type="text"
                placeholder="e.g. mornings only"
                value={newMemberConstraints}
                onChange={(e) => setNewMemberConstraints(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none rounded-xl"
              />
            </div>

            <div className="space-y-1.5 col-span-1 flex gap-2">
              <div className="w-1/2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hours/Wk</label>
                <input
                  id="input_member_hours"
                  type="number"
                  min="5"
                  max="80"
                  value={newMemberHours}
                  onChange={(e) => setNewMemberHours(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-400 focus:outline-none rounded-xl"
                />
              </div>
              <button
                type="submit"
                id="btn_submit_add_member"
                className="w-1/2 bg-indigo-600 hover:bg-indigo-550 text-white flex items-center justify-center cursor-pointer text-xs font-bold rounded-xl py-2 h-[34px] transition-colors border border-indigo-500/20"
              >
                Onboard
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Editor Detail Sidebar */}
      <div className="lg:col-span-1">
        {selectedMember ? (
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-sm space-y-6 sticky top-6 max-h-[85vh] overflow-y-auto" id="selected_member_panel">
            <div className="flex items-start justify-between pb-4 border-b border-slate-850">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-100 text-base">{selectedMember.name}</h3>
                  <button 
                    id="btn_toggle_edit_member"
                    onClick={() => setIsEditing(!isEditing)}
                    className={`p-1 rounded-lg transition-all border-0 cursor-pointer ${
                      isEditing
                        ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                        : "text-slate-450 hover:text-indigo-400 hover:bg-indigo-500/10"
                    }`}
                    title={isEditing ? "Done editing" : "Edit team member details"}
                  >
                    {isEditing ? <CheckCircle2 className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => handleDeleteMember(selectedMember.id)}
                    className="p-1 text-slate-450 hover:text-rose-450 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer border-0"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-medium">{selectedMember.role}</p>
              </div>
              <button 
                onClick={() => setSelectedMember(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer border-0"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Profile Variables */}
            {isEditing ? (
              <div className="space-y-3 text-xs" id="edit_member_form_container">
                <div className="flex flex-col bg-slate-950 p-2.5 rounded-xl border border-indigo-500/20 gap-1.5 text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Employee Name</span>
                  <input
                    type="text"
                    required
                    value={selectedMember.name}
                    onChange={(e) => {
                      if (!e.target.value.trim()) return;
                      const updated = { ...selectedMember, name: e.target.value };
                      setTeam(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
                      setSelectedMember(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-400 font-medium"
                    placeholder="e.g. Jane Doe"
                  />
                </div>

                <div className="flex flex-col bg-slate-950 p-2.5 rounded-xl border border-indigo-500/20 gap-1.5 text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Role Title</span>
                  <input
                    type="text"
                    value={selectedMember.role}
                    onChange={(e) => {
                      const updated = { ...selectedMember, role: e.target.value || "Specialist" };
                      setTeam(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
                      setSelectedMember(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-400"
                    placeholder="e.g. UI Lead"
                  />
                </div>

                <div className="flex flex-col bg-slate-950 p-2.5 rounded-xl border border-indigo-500/20 gap-1.5 text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Email Address</span>
                  <input
                    type="email"
                    value={selectedMember.email}
                    onChange={(e) => {
                      const updated = { ...selectedMember, email: e.target.value };
                      setTeam(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
                      setSelectedMember(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-400"
                    placeholder="jane.doe@example.com"
                  />
                </div>

                <div className="flex flex-col bg-slate-950 p-2.5 rounded-xl border border-indigo-500/20 gap-1.5 text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Assigned Project</span>
                  <select
                    value={selectedMember.project}
                    onChange={(e) => {
                      const updated = { ...selectedMember, project: e.target.value };
                      setTeam(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
                      setSelectedMember(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    {AVAILABLE_PROJECTS.map((proj, idx) => (
                      <option key={idx} value={proj}>{proj}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col bg-slate-950 p-2.5 rounded-xl border border-indigo-500/20 gap-1.5 text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Weekly Hours Capacity</span>
                  <input
                    type="number"
                    min="5"
                    max="80"
                    value={selectedMember.weeklyHours}
                    onChange={(e) => {
                      const hours = parseInt(e.target.value, 10);
                      if (isNaN(hours)) return;
                      const updated = { ...selectedMember, weeklyHours: hours };
                      setTeam(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
                      setSelectedMember(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="flex flex-col bg-slate-950 p-2.5 rounded-xl border border-indigo-500/20 gap-1.5 text-left">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Availability Constraints (Free Text)</span>
                  <input
                    type="text"
                    value={selectedMember.constraints || ""}
                    placeholder="e.g. mornings only, no Wednesdays"
                    onChange={(e) => {
                      const updated = { ...selectedMember, constraints: e.target.value };
                      setTeam(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
                      setSelectedMember(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full bg-indigo-650 hover:bg-indigo-600 text-slate-100 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer border border-indigo-400/20 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-450" />
                  Exit Edit Mode
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <span className="text-slate-400 font-bold">Email Address:</span>
                  <span className="font-mono text-indigo-300 font-semibold truncate max-w-[170px]">{selectedMember.email}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <span className="text-slate-400 font-bold">Roster Project:</span>
                  <span className="font-black text-indigo-400">{selectedMember.project}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <span className="text-slate-400 font-bold">Roster Hours capacity:</span>
                  <span className="font-black text-emerald-400 font-mono">{selectedMember.weeklyHours} hrs/week</span>
                </div>
                {selectedMember.constraints && (
                  <div className="flex flex-col bg-slate-950 p-2.5 rounded-xl border border-slate-850 gap-1.5 align-start">
                    <span className="text-slate-400 font-bold text-[11px] block text-left">Availability Constraints (Free Text):</span>
                    <input
                      type="text"
                      value={selectedMember.constraints || ""}
                      placeholder="e.g. mornings only, no Wednesdays"
                      onChange={(e) => {
                        const updated = { ...selectedMember, constraints: e.target.value };
                        setTeam(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
                        setSelectedMember(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-400 font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Skills selection */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                Specialist Expertise
              </h4>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 border border-slate-850 rounded-xl bg-slate-950">
                {AVAILABLE_SKILLS.map((skill, idx) => {
                  const active = selectedMember.skills.includes(skill);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleToggleSkill(skill)}
                      className={`text-[10px] px-2 py-1 rounded-lg font-mono transition-all cursor-pointer ${
                        active 
                          ? "bg-indigo-600 text-white hover:bg-indigo-550 border border-indigo-400/20 font-bold" 
                          : "bg-slate-900 text-slate-400 hover:bg-slate-850 border border-slate-800"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Learning Goals */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                Active Learning Goals
              </h4>
              <p className="text-slate-400 text-[10.5px] mb-2 leading-relaxed">
                Highlight skill targets and developmental shadow goals. The AI scheduler favors reassigning these meetings.
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 border border-slate-850 rounded-xl bg-slate-950">
                {AVAILABLE_SKILLS.map((skill, idx) => {
                  const active = selectedMember.learningGoals?.includes(skill);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleToggleLearningGoal(skill)}
                      className={`text-[10px] px-2 py-1 rounded-lg font-mono transition-all cursor-pointer ${
                        active 
                          ? "bg-emerald-600 text-white hover:bg-emerald-55 border border-emerald-400/20 font-bold" 
                          : "bg-slate-900 text-slate-400 hover:bg-slate-850 border border-slate-800"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Availability Blocks */}
            <div className="border-t border-slate-850 pt-4 space-y-4">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  Availability Exclusions (OOO)
                </h4>
                <p className="text-slate-400 text-[10.5px] mb-3 leading-relaxed">
                  Mark out scheduled windows or study leaves. The resource is immediately grayed out and blocked on the calendar timeline.
                </p>
                
                {/* List exclusions */}
                {selectedMember.blockedTimes.length === 0 ? (
                  <div className="text-center p-4 border border-dashed border-slate-800 rounded-xl bg-slate-950 text-slate-500 text-xs">
                    No timeline blocker exceptions filed.
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {selectedMember.blockedTimes.map((blocked) => (
                      <div key={blocked.id} className="flex items-start justify-between p-2.5 rounded-lg border border-rose-950 bg-rose-950/20 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-rose-350 flex items-center gap-1 font-mono">
                            <span>{blocked.day}</span>
                            <span className="text-rose-500">•</span>
                            <span>{blocked.startHour}:00h-{blocked.endHour}:00h</span>
                          </div>
                          <span className="text-slate-400 italic block">"{blocked.reason}"</span>
                        </div>
                        <button 
                          onClick={() => handleRemoveBlockedTime(blocked.id)}
                          className="text-rose-450 hover:text-rose-300 transition-colors p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add blocker container */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-300 block">Add Calendar Exclusion Window</span>
                <div className="grid grid-cols-3 gap-2">
                  <select 
                    value={blockDay} 
                    onChange={(e: any) => setBlockDay(e.target.value)}
                    className="col-span-1 text-[10px] px-1 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 rounded cursor-pointer"
                  >
                    <option value="Monday">Mon</option>
                    <option value="Tuesday">Tue</option>
                    <option value="Wednesday">Wed</option>
                    <option value="Thursday">Thu</option>
                    <option value="Friday">Fri</option>
                  </select>
                  <select 
                    value={blockStart} 
                    onChange={(e) => setBlockStart(parseInt(e.target.value, 10))}
                    className="col-span-1 text-[10px] px-1 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 rounded font-mono cursor-pointer"
                  >
                    {Array.from({ length: 9 }, (_, k) => k + 9).map((hr) => (
                      <option key={hr} value={hr}>{hr}:00</option>
                    ))}
                  </select>
                  <select 
                    value={blockEnd} 
                    onChange={(e) => setBlockEnd(parseInt(e.target.value, 10))}
                    className="col-span-1 text-[10px] px-1 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 rounded font-mono cursor-pointer"
                  >
                    {Array.from({ length: 11 }, (_, k) => k + 10).map((hr) => (
                      <option key={hr} value={hr}>{hr}:00</option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Weekly checkup or university slot"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded placeholder:text-slate-500 text-slate-200 focus:outline-none focus:border-rose-500/50"
                  />
                </div>
                <button
                  type="button"
                  disabled={!blockReason.trim()}
                  onClick={handleAddBlockedTime}
                  className={`w-full py-1.5 text-xs font-semibold rounded cursor-pointer transition-colors ${
                    blockReason.trim() 
                      ? "bg-rose-900 hover:bg-rose-850 text-white border border-rose-500/25" 
                      : "bg-slate-900 border border-slate-850 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  Block Off Hour Slates
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/40 border-2 border-dashed border-slate-850 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-inner h-[280px]">
            <ShieldQuestion className="w-10 h-10 text-slate-700" />
            <div>
              <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">No Resource Focused</h4>
              <p className="text-[11px] text-slate-500 mt-2 max-w-[200px] leading-relaxed mx-auto">
                Click on any team member's file card to edit secondary fields, highlight learning goals, or write study leave exemptions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CSV Import Modal Overlay */}
      {showCSVModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl max-w-xl w-full p-6 space-y-5 text-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-100">Import Team Roster from CSV</h3>
                <p className="text-xs text-slate-400">Append roster resources instantly via structured file uploads.</p>
              </div>
              <button 
                onClick={() => { setShowCSVModal(false); setCsvPreviewError(null); }}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CSV Template Guide */}
            <div className="p-3.5 bg-indigo-500/10 rounded-xl border border-indigo-500/25 text-xs text-indigo-300 space-y-2">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span className="font-bold">Required CSV Columns headers (comma separated):</span>
                <button
                  type="button"
                  onClick={handleDownloadCSVTemplate}
                  className="bg-indigo-600 hover:bg-indigo-550 text-white font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  <Upload className="w-3 h-3 rotate-180" />
                  Download Template .CSV
                </button>
              </div>
              <p className="leading-relaxed font-mono text-[10px] bg-slate-950 p-2 rounded border border-slate-850 text-slate-300 select-all overflow-x-auto whitespace-nowrap">
                Employee Name, Role, Email, Skill Set, Current Project Assignments, Weekly Hours
              </p>
              <p className="opacity-80 text-[10.5px] leading-normal pt-1">
                * Note: Separate individual skills inside row cell with pipes (<code className="font-bold text-white font-mono">|</code>) or semicolons (<code className="font-bold text-white font-mono">;</code>).
              </p>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center space-y-3 transition-colors ${
                isDragging 
                  ? "border-indigo-500 bg-indigo-500/15" 
                  : "border-slate-800 hover:border-indigo-500/50 hover:bg-slate-950/40"
              }`}
            >
              <Upload className="w-8 h-8 text-indigo-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Drag & Drop your team CSV file here</span>
                <p className="text-[10px] text-slate-500 mt-1">or click to browse your workspace files</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {csvPreviewError && (
              <div className="p-3 bg-rose-500/10 text-rose-450 rounded-xl border border-rose-500/20 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{csvPreviewError}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-850 pt-4">
              <button
                type="button"
                onClick={handleLoadSampleCSV}
                className="text-xs bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 cursor-pointer px-4 py-2 rounded-xl font-medium transition-colors"
              >
                Instant Template Inject
              </button>
              <button
                onClick={() => { setShowCSVModal(false); setCsvPreviewError(null); }}
                className="text-xs bg-slate-800 hover:bg-slate-750 cursor-pointer text-slate-400 px-4 py-2 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

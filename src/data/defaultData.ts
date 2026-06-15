import { TeamMember, Meeting } from "../types";

export const DEFAULT_TEAM: TeamMember[] = [
  {
    id: "mem-1",
    name: "Alice Chen",
    role: "Lead Architect",
    email: "alice.chen@optimix.com",
    skills: ["React", "Typescript", "System Architecture", "AWS", "SQL"],
    project: "Cloud Migration",
    weeklyHours: 40,
    learningGoals: ["Kubernetes", "Rust"],
    consistencyScore: 92,
    constraints: "Not available on Thursday mornings",
    blockedTimes: [
      { id: "b1", day: "Monday", startHour: 9, endHour: 11, reason: "Weekly Sync & Architecture Alignment" }
    ]
  },
  {
    id: "mem-2",
    name: "Bob Smith",
    role: "Senior Backend Engineer",
    email: "bob.smith@optimix.com",
    skills: ["Node.js", "Express", "SQL", "Docker", "Typescript"],
    project: "Billing API Integration",
    weeklyHours: 40,
    learningGoals: ["System Architecture", "AWS"],
    consistencyScore: 85,
    constraints: "Prefers morning meetings before 2 PM",
    blockedTimes: [
      { id: "b2", day: "Wednesday", startHour: 14, endHour: 16, reason: "Sprint Board Planning" }
    ]
  },
  {
    id: "mem-3",
    name: "Charlie Blue",
    role: "Frontend UI Developer",
    email: "charlie.blue@optimix.com",
    skills: ["React", "TailwindCSS", "CSS", "UI Design", "Figma"],
    project: "Core UI Overhaul",
    weeklyHours: 40,
    learningGoals: ["Typescript", "System Architecture"],
    consistencyScore: 90,
    constraints: "Only available remote on Fridays",
    blockedTimes: [
      { id: "b3", day: "Friday", startHour: 15, endHour: 17, reason: "Weekly Design Retrospective" }
    ]
  },
  {
    id: "mem-4",
    name: "Diana Prince",
    role: "Junior Fullstack Engineer",
    email: "diana.prince@optimix.com",
    skills: ["React", "Node.js", "CSS"],
    project: "Billing API Integration",
    weeklyHours: 25,
    learningGoals: ["SQL", "Typescript", "AWS"],
    consistencyScore: 78,
    constraints: "No Thursday sessions (study blocks)",
    blockedTimes: [
      { id: "b4", day: "Thursday", startHour: 10, endHour: 12, reason: "University Lecture Block" }
    ]
  },
  {
    id: "mem-5",
    name: "Evan Wright",
    role: "Cloud DevOps Engineer",
    email: "evan.wright@optimix.com",
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD"],
    project: "Cloud Migration",
    weeklyHours: 40,
    learningGoals: ["Node.js", "Typescript"],
    consistencyScore: 88,
    constraints: "Available after 11 AM daily",
    blockedTimes: [
      { id: "b5", day: "Tuesday", startHour: 13, endHour: 15, reason: "Infrastructure Sandbox Deployment" }
    ]
  }
];

export const DEFAULT_MEETINGS: Meeting[] = [
  {
    id: "meet-1",
    title: "Billing Schema Alignment Session",
    topic: "Database Design & Optimization",
    day: "Thursday",
    startHour: 11,
    endHour: 12.5,
    requiredSkills: ["SQL", "System Architecture"],
    assignedMemberIds: ["mem-2"],
    recurrence: "Weekly"
  },
  {
    id: "meet-2",
    title: "Vite & CSS Compilation Workshop",
    topic: "Aesthetic Frontend Speed Tuning",
    day: "Friday",
    startHour: 10,
    endHour: 11.5,
    requiredSkills: ["React", "CSS"],
    assignedMemberIds: ["mem-3"],
    recurrence: "Once"
  },
  {
    id: "meet-3",
    title: "AWS Ingress Security Walkthrough",
    topic: "Enterprise Ingress Architecture",
    day: "Monday",
    startHour: 14,
    endHour: 15.5,
    requiredSkills: ["AWS", "System Architecture"],
    assignedMemberIds: ["mem-1"],
    recurrence: "Weekly"
  },
  {
    id: "meet-4",
    title: "Legacy Rust Decoupling Sprint",
    topic: "Core Refactoring & Memory Safety",
    day: "Wednesday",
    startHour: 10,
    endHour: 12,
    requiredSkills: ["Rust", "System Architecture"],
    assignedMemberIds: [],
    recurrence: "Bi-Weekly"
  }
];

export const AVAILABLE_SKILLS = [
  "React", "Typescript", "System Architecture", "AWS", "SQL",
  "Node.js", "Express", "Docker", "Kubernetes", "TailwindCSS",
  "CSS", "UI Design", "Figma", "CI/CD", "Rust", "Go"
];

export const AVAILABLE_PROJECTS = [
  "Cloud Migration", "Billing API Integration", "Core UI Overhaul", "Security Audit", "Unassigned"
];

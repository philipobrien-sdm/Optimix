export interface BlockedTime {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startHour: number; // e.g. 9 for 9 AM
  endHour: number;   // e.g. 11 for 11 AM
  reason: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  skills: string[]; // e.g., ["React", "Typescript", "SQL", "UI Design"]
  project: string;  // Current project name
  weeklyHours: number; // e.g., 40
  blockedTimes: BlockedTime[];
  learningGoals: string[]; // what skills they want to learn
  constraints?: string; // free text constraints on availability (e.g., "mornings only")
  consistencyScore?: number; // visual rating 0-100 indicating how stable they are in this topic/project
}

export interface Meeting {
  id: string;
  title: string;
  topic: string; // The topic coverage (e.g. "API Design", "CSS Overhaul")
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startHour: number;
  endHour: number;
  requiredSkills: string[];
  assignedMemberIds: string[];
  recurrence?: 'Once' | 'Weekly' | 'Bi-Weekly' | 'Monthly';
}

export interface SkillGap {
  skill: string;
  requiredInTopics: string[];
  teamExperts: string[];
  status: 'Critical Gap' | 'Optimal' | 'Over-Allocation';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'availability' | 'gap' | 'report';
  timestamp: string;
  read: boolean;
}

export interface AIRecommendation {
  meetingId: string;
  suggestedMemberIds: string[];
  reasons: string[]; // reasons per member, matching the 4 dimensions: availability, expertise, learning opportunity, consistency
}

export interface UtilizationReport {
  id: string;
  sentAt: string;
  recipient: string;
  summary: string;
  dimensionsSummary: {
    availability: string;
    expertise: string;
    learningOpportunity: string;
    consistency: string;
  };
}

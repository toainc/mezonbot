export interface DailyNote {
  projectName: string;
  channelId: string;
  block: string;
  today: string;
  yesterday: string;
  date: Date;
  workingTime: number;
  memberName: string;
}

export interface WeeklyReportResponse {
  project_name: string;
  member: number;
  progress: string;
  customer_communication: string | null;
  human_resource: string;
  technical_solution: string | null;
  testing: string | null;
  milestone: string | null;
  week_goal: string;
  issue: string;
}

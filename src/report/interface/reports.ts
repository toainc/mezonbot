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
  customer_communication: string;
  human_resource: string;
  profession: string;
  technical_solution: string;
  testing: string;
  milestone: string;
  week_goal: string;
  issue: string;
  risks: string;
}

export const PROJECT_REPORT_SYSTEM_PROMPT = (
  inputdata: string,
) => ({
  system: `You are an expert Project Manager AI specialized in analyzing daily team progress data and generating consistent weekly reports for IT projects.

CORE RESPONSIBILITIES:
- Analyze daily notes data to extract meaningful project insights
- Generate standardized weekly reports with consistent field structure
- Maintain objectivity and base analysis strictly on provided data
- Ensure ALL required fields are populated with appropriate string values

ANALYSIS METHODOLOGY:
- Track task progression by connecting "yesterday" to "today" entries across dates
- Identify team member roles and contributions from daily activities
- Count unique team members from memberName field
- Assess blockers, challenges, and issues from daily notes
- Evaluate testing activities and quality assurance processes
- Extract weekly goals from completed and planned activities
- workload rating (Idle / Light / Moderate / High / Heavy / Overloaded).

OUTPUT REQUIREMENTS:
- Respond with valid JSON only, no additional text or explanations
- ALL fields must be strings (convert numbers to string format)
- Use professional, concise language (50-150 words per field)
- Maintain consistency in terminology and format across reports
- Base all insights on factual data from daily notes only`,

  user: `Generate a comprehensive weekly project report based on the following daily notes data. 

MANDATORY FIELDS (ALL must be included as strings):

1. "project_name": Extract the project name from projectName field in data, or use "IT Project Analysis" if multiple/unclear
2. "member": Count unique team members and return as string number (e.g., "15")  
3. "progress": Analyze task completion patterns, workflow efficiency, yesterday→today task connections, overall advancement
4. "customer_communication": Assess client interactions, demos, stakeholder meetings, feedback sessions (use "No customer communication activities reported" if none)
5. "human_resource":List each team member in the format: Name: number of tasks (list task IDs) | assessment of whether they are overloaded.
7. "technical_solution": Describe technical approaches, architectures, tools, frameworks, and implementation strategies used
8. "testing": Evaluate QA activities, testing processes, bug identification, quality control measures, test coverage
9. "milestone": Identify completed milestones, upcoming deadlines, deliverables, and project phases
10. "week_goal": Extract and summarize weekly objectives achieved and key accomplishments from daily activities
11. "issue": List current blockers, challenges, impediments, and problems reported in daily notes

OUTPUT DATA FORMAT:
"human_resource" field example: Name: number of tasks (list task IDs) | workload rating

STRICT JSON OUTPUT FORMAT (ALL fields required as strings):
{
  "progress": "string",
  "customer_communication": "string",
  "human_resource": "string",
  "technical_solution": "string",
  "testing": "string",
  "milestone": "string",
  "week_goal": "string",
  "issue": "string",
}

DAILY NOTES DATA:
${inputdata}

Generate the complete weekly report JSON with all 12 fields:`
})
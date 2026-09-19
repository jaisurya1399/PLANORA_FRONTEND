export const UI_TERMINOLOGY = Object.freeze({
  systemAdministrator: "System Administrator",
  projectAdministrator: "Project Administrator",
  projectAdministrators: "Project Administrators",
  projectMember: "Project Member",
  projectMembers: "Project Members",
  ticket: "Ticket",
  tickets: "Tickets",
  ticketType: "Ticket Type",
  ticketTypes: "Ticket Types",
  myTickets: "My Tickets",
  pendingTickets: "Pending Tickets",
  dailyScrum: "Daily Scrum",
  createDailyScrum: "Create Daily Scrum",
  editDailyScrum: "Edit Daily Scrum",
});

export const roleLabel = (role) => {
  const normalized = String(role || "").toUpperCase();
  if (normalized === "ADMIN" || normalized === "SYSTEM_ADMIN")
    return UI_TERMINOLOGY.systemAdministrator;
  if (normalized === "PROJECT_ADMIN")
    return UI_TERMINOLOGY.projectAdministrator;
  if (normalized === "TEAM_LEAD") return "Team Lead";
  if (normalized === "DEVELOPER") return "Developer";
  if (normalized === "VIEWER") return "Viewer";
  if (normalized === "MEMBER") return UI_TERMINOLOGY.projectMember;
  return normalized.replace(/_/g, " ") || UI_TERMINOLOGY.projectMember;
};

export function getWorkspaceBase(pathname = "") {
  const path = String(pathname || "");
  if (path.startsWith("/systemadmin")) return "/systemadmin";
  if (path.startsWith("/member/projectadmin")) return "/member/projectadmin";
  if (path.startsWith("/member/teamlead")) return "/member/teamlead";
  if (path.startsWith("/member/developer")) return "/member/developer";
  if (path.startsWith("/member/viewer")) return "/member/viewer";
  if (path.startsWith("/admin")) return "/admin";
  if (path.startsWith("/projectadmin")) return "/projectadmin";
  if (path.startsWith("/teamlead")) return "/teamlead";
  if (path.startsWith("/developer")) return "/developer";
  if (path.startsWith("/viewer")) return "/viewer";
  return "/member/developer";
}

export function getWorkspaceBase(pathname = window.location.pathname) {
  if (pathname.startsWith("/systemadmin")) return "/systemadmin";
  if (pathname.startsWith("/admin")) return "/admin";
  if (pathname.startsWith("/member/projectadmin"))
    return "/member/projectadmin";
  if (pathname.startsWith("/member/teamlead")) return "/member/teamlead";
  if (pathname.startsWith("/member/viewer")) return "/member/viewer";
  return "/member/developer";
}

export function workspacePath(pathname, suffix = "") {
  const base = getWorkspaceBase(pathname);
  return `${base}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}

import Sidebar, { DRAWER_WIDTH } from "../components/admin/Sidebar";
import Topbar from "../components/admin/Topbar";
import AppShell from "./AppShell";

export default function ProjectAdminLayout() {
  return (
    <AppShell Sidebar={Sidebar} Topbar={Topbar} drawerWidth={DRAWER_WIDTH} />
  );
}

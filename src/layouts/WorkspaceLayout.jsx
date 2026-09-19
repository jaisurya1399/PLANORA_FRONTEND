import Sidebar, { DRAWER_WIDTH } from "../components/workspace/Sidebar";
import Topbar from "../components/workspace/Topbar";
import AppShell from "./AppShell";

export default function WorkspaceLayout() {
  return (
    <AppShell Sidebar={Sidebar} Topbar={Topbar} drawerWidth={DRAWER_WIDTH} />
  );
}

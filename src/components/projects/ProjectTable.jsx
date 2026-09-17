import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RestoreIcon from "@mui/icons-material/Restore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";

import { TEXT_SECONDARY } from "../../theme/colors";

export default function ProjectTable({
  projects,
  onView,
  onEdit,
  onDelete,
  onRestore,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        overflow: "auto",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>

            <TableCell>Project</TableCell>

            <TableCell>Owner</TableCell>

            <TableCell>Status</TableCell>

            <TableCell>Prefix</TableCell>

            <TableCell>Status Type</TableCell>

            <TableCell>Created</TableCell>

            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {projects.map((project) => (
            <TableRow hover key={project.id}>
              <TableCell>{project.id}</TableCell>

              <TableCell>
                <strong>{project.name}</strong>

                {project.description && (
                  <div
                    style={{
                      fontSize: 12,
                      color: TEXT_SECONDARY,
                    }}
                  >
                    {project.description}
                  </div>
                )}
              </TableCell>

              <TableCell>
                {project.ownerName || "—"}

                {project.ownerEmail && (
                  <div
                    style={{
                      fontSize: 12,
                      color: TEXT_SECONDARY,
                    }}
                  >
                    {project.ownerEmail}
                  </div>
                )}
              </TableCell>

              <TableCell>
                <Chip
                  label={project.statusName || "Unknown"}
                  size="small"
                  sx={{
                    backgroundColor: project.statusColor || undefined,
                  }}
                />
              </TableCell>

              <TableCell>
                <Chip
                  label={project.ticketPrefix || "—"}
                  size="small"
                  variant="outlined"
                />
              </TableCell>

              <TableCell>{project.statusType || "—"}</TableCell>

              <TableCell>
                {project.createdAt
                  ? new Date(project.createdAt).toLocaleDateString()
                  : "—"}
              </TableCell>

              <TableCell align="right">
                <Tooltip title="View">
                  <IconButton onClick={() => onView(project)}>
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Edit">
                  <IconButton onClick={() => onEdit(project)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>

                {project.deletedAt ? (
                  <Tooltip title="Restore">
                    <IconButton
                      color="success"
                      onClick={() => onRestore(project)}
                    >
                      <RestoreIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => onDelete(project)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

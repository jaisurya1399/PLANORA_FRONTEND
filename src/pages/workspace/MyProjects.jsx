import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getDeveloperDashboard } from "../../api/dashboardApi";
import {
  BORDER,
  CANVAS_BACKGROUND,
  ELEVATION_SHADOW,
  RADIUS,
  TEXT_FAINT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../../theme/colors";

export default function MyProjects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDeveloperDashboard();

      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch (err) {
      console.error("Error loading developer projects:", err);

      setError(err.message || "Unable to load your projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusColor = (status) => {
    if (!status) {
      return "default";
    }

    const value = status.toLowerCase().trim();

    if (
      value.includes("completed") ||
      value.includes("done") ||
      value.includes("closed")
    ) {
      return "success";
    }

    if (value.includes("progress") || value.includes("active")) {
      return "primary";
    }

    if (value.includes("pending") || value.includes("hold")) {
      return "warning";
    }

    return "default";
  };

  return (
    <Box className="app-page pm-fade-up">
      {/* ============================================================
          HEADER
      ============================================================ */}

      <Box
        className="page-header"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 2,
        }}
      >
        <Box>
          {/* <span className="pm-eyebrow">Workspace</span> */}
          <Typography
            variant="h1"
            className="pm-gradient-title"
            sx={{ display: "inline-block", mt: 0.5 }}
          >
            My projects
          </Typography>

          <Typography className="page-subtitle">
            View projects assigned to you.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchProjects}
          disabled={loading}
          sx={{
            textTransform: "none",
            borderRadius: 1.5,
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* ============================================================
          ERROR
      ============================================================ */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: `${RADIUS.card}px`,
          }}
        >
          {error}
        </Alert>
      )}

      {/* ============================================================
          LOADING
      ============================================================ */}

      {loading ? (
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${BORDER}`,
            borderRadius: `${RADIUS.card}px`,
          }}
        >
          <CardContent
            sx={{
              py: 8,
              textAlign: "center",
            }}
          >
            <CircularProgress size={32} />

            <Typography
              sx={{
                mt: 2,
                color: TEXT_SECONDARY,
                fontSize: 14,
              }}
            >
              Loading your projects...
            </Typography>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        /* ============================================================
           EMPTY STATE
        ============================================================ */

        <Card
          elevation={0}
          sx={{
            border: `1px solid ${BORDER}`,
            borderRadius: `${RADIUS.card}px`,
          }}
        >
          <CardContent
            sx={{
              py: 8,
              textAlign: "center",
            }}
          >
            <FolderOutlinedIcon
              sx={{
                fontSize: 56,
                color: TEXT_FAINT,
                mb: 1,
              }}
            />

            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 700,
                color: TEXT_PRIMARY,
              }}
            >
              No Projects Found
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                color: TEXT_SECONDARY,
                fontSize: 14,
              }}
            >
              Projects assigned to you will appear here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        /* ============================================================
           ROW-WISE PROJECT LIST
        ============================================================ */

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {projects.map((project) => (
            <Card
              key={project.id}
              elevation={0}
              sx={{
                width: "100%",
                border: `1px solid ${BORDER}`,
                borderRadius: `${RADIUS.card}px`,
                transition: "all 0.2s ease",

                "&:hover": {
                  borderColor: BORDER,
                  boxShadow: ELEVATION_SHADOW,
                  transform: "translateY(-1px)",
                },
              }}
            >
              <CardContent
                sx={{
                  p: 2.5,
                  "&:last-child": {
                    pb: 2.5,
                  },
                }}
              >
                {/* ==================================================
                    DESKTOP ROW
                ================================================== */}

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "55px minmax(220px, 1.8fr) minmax(150px, 1fr) minmax(150px, 1fr) 150px",
                    },
                    alignItems: "center",
                    gap: {
                      xs: 2,
                      md: 2.5,
                    },
                  }}
                >
                  {/* ==================================================
                      PROJECT ICON
                  ================================================== */}

                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1.5,
                      backgroundColor: CANVAS_BACKGROUND,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FolderOutlinedIcon
                      sx={{
                        fontSize: 27,
                        color: TEXT_PRIMARY,
                      }}
                    />
                  </Box>

                  {/* ==================================================
                      PROJECT NAME + DESCRIPTION
                  ================================================== */}

                  <Box
                    sx={{
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: TEXT_PRIMARY,
                        }}
                      >
                        {project.name || "Unnamed Project"}
                      </Typography>

                      {project.projectStatus && (
                        <Chip
                          label={project.projectStatus}
                          color={getStatusColor(project.projectStatus)}
                          size="small"
                        />
                      )}
                    </Box>

                    <Typography
                      sx={{
                        fontSize: 12,
                        color: TEXT_FAINT,
                        mt: 0.3,
                      }}
                    >
                      Project #{project.id}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 13,
                        color: TEXT_SECONDARY,
                        mt: 0.8,
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {project.description || "No description available."}
                    </Typography>
                  </Box>

                  {/* ==================================================
                      OWNER
                  ================================================== */}

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.2,
                    }}
                  >
                    <PersonOutlineIcon
                      sx={{
                        fontSize: 20,
                        color: TEXT_FAINT,
                      }}
                    />

                    <Box>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: TEXT_FAINT,
                        }}
                      >
                        Owner
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: TEXT_PRIMARY,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 150,
                        }}
                      >
                        {project.ownerName || "N/A"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* ==================================================
                      ASSIGNED ROLE + CREATED
                  ================================================== */}

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <BadgeOutlinedIcon
                        sx={{
                          fontSize: 18,
                          color: TEXT_FAINT,
                        }}
                      />

                      <Box>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: TEXT_FAINT,
                          }}
                        >
                          Assigned Role
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: TEXT_PRIMARY,
                          }}
                        >
                          {project.assignedRole || "N/A"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <CalendarTodayOutlinedIcon
                        sx={{
                          fontSize: 16,
                          color: TEXT_FAINT,
                        }}
                      />

                      <Box>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: TEXT_FAINT,
                          }}
                        >
                          Created
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: TEXT_PRIMARY,
                          }}
                        >
                          {formatDate(project.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* ==================================================
                      ACTION
                  ================================================== */}

                  {/* <Box
                    sx={{
                      display: "flex",
                      justifyContent: {
                        xs: "flex-start",
                        md: "flex-end",
                      },
                    }}
                  >
                    <Button
                      variant="outlined"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() =>
                        navigate(`/member/developer/projects/${project.id}`)
                      }
                      sx={{
                        textTransform: "none",
                        borderRadius: 1.5,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      View Project
                    </Button>
                  </Box> */}
                </Box>

                {/* ==================================================
                    TICKET PREFIX
                ================================================== */}

                {project.ticketPrefix && (
                  <Box
                    sx={{
                      mt: 2,
                      pt: 1.5,
                      borderTop: `1px solid ${BORDER}`,
                    }}
                  >
                    <Chip
                      label={`Ticket Prefix: ${project.ticketPrefix}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: 11,
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

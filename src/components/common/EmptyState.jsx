import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { Box, Button, Typography } from "@mui/material";

export default function EmptyState({
  title = "Nothing here yet",
  description = "There is no data to display.",
  actionLabel,
  onAction,
  icon: Icon = InboxOutlinedIcon,
}) {
  return (
    <Box
      role="status"
      sx={{
        minHeight: 220,
        px: 3,
        py: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      <Icon
        aria-hidden="true"
        sx={{ fontSize: 40, color: "text.disabled", mb: 1 }}
      />
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 520, mt: 0.5 }}
      >
        {description}
      </Typography>
      {actionLabel && onAction ? (
        <Button variant="outlined" sx={{ mt: 2 }} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Box>
  );
}

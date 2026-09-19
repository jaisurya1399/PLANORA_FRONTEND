import { Box, Card, Skeleton, Stack } from "@mui/material";

export function PageLoadingSkeleton({ rows = 4 }) {
  return (
    <Stack
      spacing={2}
      sx={{ width: "100%", py: 2 }}
      aria-busy="true"
      aria-label="Loading content"
    >
      <Box>
        <Skeleton variant="text" width="32%" height={42} />
        <Skeleton variant="text" width="52%" height={24} />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {Array.from({ length: Math.min(rows, 4) }).map((_, index) => (
          <Card key={index} variant="outlined" sx={{ p: 2 }}>
            <Skeleton variant="text" width="45%" />
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="75%" />
          </Card>
        ))}
      </Box>
      <Card variant="outlined" sx={{ p: 2 }}>
        <Skeleton variant="text" width="28%" height={32} />
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={42} sx={{ my: 1 }} />
        ))}
      </Card>
    </Stack>
  );
}

export default PageLoadingSkeleton;

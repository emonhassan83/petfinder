"use client";

import { Box, Card, Chip, Typography } from "@mui/material";
import { mockNotifications } from "@/mock/portal";

const NotificationsPage = () => (
  <Box>
    <Typography variant="h4" sx={{ mb: 3 }}>
      Notifications
    </Typography>
    <Box sx={{ display: "grid", gap: 2, maxWidth: 720 }}>
      {mockNotifications.map((n) => (
        <Card
          key={n.id}
          sx={{ p: 2, borderLeft: n.unread ? "4px solid" : undefined, borderLeftColor: "primary.main" }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography fontWeight={600}>{n.title}</Typography>
            {n.unread && <Chip size="small" label="New" color="secondary" />}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ my: 0.5 }}>
            {n.body}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {n.time}
          </Typography>
        </Card>
      ))}
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: "block" }}>
      Preview data. Live notifications arrive with the backend.
    </Typography>
  </Box>
);

export default NotificationsPage;

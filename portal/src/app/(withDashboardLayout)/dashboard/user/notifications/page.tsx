"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Card, CardActionArea, Chip, Pagination, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { toast } from "sonner";
import {
  AppNotification,
  useNotifGetNotificationsQuery,
  useNotifMarkAllReadMutation,
  useNotifMarkReadMutation,
} from "@/redux/api/notificationApi";

const PAGE_SIZE = 10;

const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

//* Only same-site links are followed
const safeLink = (link?: string | null) => (link && link.startsWith("/") && !link.startsWith("//") ? link : null);

const NotificationsPage = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data, isLoading, isFetching } = useNotifGetNotificationsQuery({
    page,
    limit: PAGE_SIZE,
    ...(filter === "unread" ? { unread: true } : {}),
  });
  const [markRead] = useNotifMarkReadMutation();
  const [markAll, { isLoading: markingAll }] = useNotifMarkAllReadMutation();

  const items = data?.items ?? [];
  const unread = data?.meta?.unread ?? 0;
  const pages = Math.ceil((data?.meta?.total ?? 0) / PAGE_SIZE);

  const open = async (n: AppNotification) => {
    if (!n.readAt) markRead(n.id).catch(() => undefined);
    const link = safeLink(n.link);
    if (link) router.push(link);
  };

  const readAll = async () => {
    try {
      await markAll().unwrap();
      toast.success("All notifications marked as read");
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not update notifications");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Typography variant="h4">
          Notifications {unread > 0 && <Chip size="small" color="secondary" label={`${unread} new`} sx={{ ml: 1 }} />}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filter}
            onChange={(_, v) => {
              if (v) {
                setFilter(v);
                setPage(1);
              }
            }}
            aria-label="Filter notifications"
          >
            <ToggleButton value="all" sx={{ textTransform: "none" }}>
              All
            </ToggleButton>
            <ToggleButton value="unread" sx={{ textTransform: "none" }}>
              Unread
            </ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" size="small" startIcon={<DoneAllIcon />} onClick={readAll} disabled={!unread || markingAll}>
            Mark all read
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gap: 2, maxWidth: 720, opacity: isFetching && !isLoading ? 0.6 : 1 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={84} />)
        ) : items.length === 0 ? (
          <Card sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              {filter === "unread" ? "You're all caught up." : "No notifications yet."}
            </Typography>
          </Card>
        ) : (
          items.map((n) => (
            <Card
              key={n.id}
              sx={{ borderLeft: !n.readAt ? "4px solid" : undefined, borderLeftColor: "primary.main" }}
            >
              <CardActionArea onClick={() => open(n)} sx={{ p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                  <Typography fontWeight={!n.readAt ? 700 : 600}>{n.title}</Typography>
                  {!n.readAt && <Chip size="small" label="New" color="secondary" />}
                </Box>
                {n.body && (
                  <Typography variant="body2" color="text.secondary" sx={{ my: 0.5 }}>
                    {n.body}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {timeAgo(n.createdAt)}
                </Typography>
              </CardActionArea>
            </Card>
          ))
        )}
      </Box>

      {pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3, maxWidth: 720 }}>
          <Pagination count={pages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
        </Box>
      )}
    </Box>
  );
};

export default NotificationsPage;

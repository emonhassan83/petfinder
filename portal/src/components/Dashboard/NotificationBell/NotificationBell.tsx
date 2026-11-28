"use client";

import { useEffect } from "react";
import { Badge, IconButton, Tooltip } from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import Link from "next/link";
import { useNotifGetNotificationsQuery, notificationApi } from "@/redux/api/notificationApi";
import { useAppDispatch } from "@/redux/hooks";
import { getSocket } from "@/lib/socket";
import { tagTypes } from "@/redux/tagTypes";

//* App-bar bell with the unread count (meta.unread). A `notification:new` socket event refetches it.
const NotificationBell = ({ href }: { href: string }) => {
  const { data } = useNotifGetNotificationsQuery({ limit: 1 }, { pollingInterval: 120000 });
  const dispatch = useAppDispatch();
  const unread = data?.meta?.unread ?? 0;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = () => dispatch(notificationApi.util.invalidateTags([tagTypes.notification]));
    socket.on("notification:new", onNew);
    return () => {
      socket.off("notification:new", onNew);
    };
  }, [dispatch]);

  return (
    <Tooltip title="Notifications">
      <IconButton component={Link} href={href} aria-label={`Notifications, ${unread} unread`} sx={{ color: "text.primary" }}>
        <Badge color="secondary" badgeContent={unread} max={99}>
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default NotificationBell;

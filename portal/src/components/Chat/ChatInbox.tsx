"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChatMessage,
  Conversation,
  conversationApi,
  useChatGetConversationsQuery,
  useChatGetMessagesQuery,
  useChatMarkReadMutation,
  useChatSendMessageMutation,
} from "@/redux/api/conversationApi";
import { useSubmitUserReportMutation } from "@/redux/api/userReportApi";
import { useAppDispatch } from "@/redux/hooks";
import { tagTypes } from "@/redux/tagTypes";
import { getSocket } from "@/lib/socket";
import { useAuthUser } from "@/hooks/useAuthUser";

export type ChatInboxProps = {
  //* Conversation to open first (e.g. from `?c=<id>` after "Message" on a pet page)
  initialConversationId?: string;
  //* Shown when the user has no conversations yet
  emptyHint?: string;
};

type SocketAck = { ok: boolean; message?: ChatMessage; error?: string };

const MAX_LENGTH = 2000;

const timeLabel = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "numeric", month: "short" });
};

const titleFor = (c: Conversation) => c.counterparts?.map((p) => p.name).join(", ") || "Conversation";

//* Inbox + thread over REST (/conversations) with live updates over Socket.IO
//* (message:new, typing, read). Used by the user and shelter dashboards.
const ChatInbox = ({ initialConversationId, emptyHint }: ChatInboxProps) => {
  const { user } = useAuthUser();
  const myId = user?.userId;
  const dispatch = useAppDispatch();

  const { data: convData, isLoading: listLoading } = useChatGetConversationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const conversations = useMemo(() => convData?.items ?? [], [convData]);

  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const [mobileThread, setMobileThread] = useState(!!initialConversationId);
  const active = conversations.find((c) => c.id === activeId) ?? null;

  //* Pick the first conversation once the list arrives (desktop)
  useEffect(() => {
    if (!activeId && conversations.length) setActiveId(conversations[0].id);
  }, [activeId, conversations]);

  useEffect(() => {
    if (initialConversationId) {
      setActiveId(initialConversationId);
      setMobileThread(true);
    }
  }, [initialConversationId]);

  //* ---- messages of the active conversation (kept oldest -> newest) ----
  const { data: msgData, isFetching: msgLoading } = useChatGetMessagesQuery(
    { conversationId: activeId as string },
    { skip: !activeId, refetchOnMountOrArgChange: true }
  );
  const [loadOlder, { isFetching: olderLoading }] = conversationApi.endpoints.chatGetMessages.useLazyQuery();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;

  useEffect(() => {
    setMessages([]);
    setCursor(null);
    setTyping(false);
    setOtherReadAt(null);
  }, [activeId]);

  useEffect(() => {
    if (!msgData) return;
    setMessages([...msgData.items].reverse());
    setCursor(msgData.nextCursor ?? null);
  }, [msgData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typing]);

  const appendMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  const refreshList = useCallback(
    () => dispatch(conversationApi.util.invalidateTags([tagTypes.conversation])),
    [dispatch]
  );

  //* ---- mark read ----
  const [markReadRest] = useChatMarkReadMutation();
  const markRead = useCallback(
    (conversationId: string) => {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("read", { conversationId }, (res: SocketAck) => res?.ok && refreshList());
      } else {
        markReadRest(conversationId)
          .unwrap()
          .then(refreshList)
          .catch(() => undefined);
      }
    },
    [markReadRest, refreshList]
  );

  useEffect(() => {
    if (activeId && active?.unreadCount) markRead(activeId);
  }, [activeId, active?.unreadCount, markRead]);

  //* ---- socket events ----
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    setConnected(socket.connected);
    let typingTimer: ReturnType<typeof setTimeout> | undefined;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onMessage = (m: ChatMessage) => {
      if (m.conversationId === activeRef.current) {
        appendMessage(m);
        setTyping(false);
        if (m.senderId !== myId) markRead(m.conversationId);
      }
      refreshList();
    };
    const onTyping = (e: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (e.conversationId !== activeRef.current || e.userId === myId) return;
      setTyping(e.isTyping);
      clearTimeout(typingTimer);
      if (e.isTyping) typingTimer = setTimeout(() => setTyping(false), 4000);
    };
    const onRead = (e: { conversationId: string; userId: string; readAt: string }) => {
      if (e.conversationId === activeRef.current && e.userId !== myId) setOtherReadAt(e.readAt);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message:new", onMessage);
    socket.on("typing", onTyping);
    socket.on("read", onRead);
    return () => {
      clearTimeout(typingTimer);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message:new", onMessage);
      socket.off("typing", onTyping);
      socket.off("read", onRead);
    };
  }, [myId, appendMessage, markRead, refreshList]);

  //* ---- typing signal (throttled) ----
  const lastTypingSent = useRef(0);
  const onDraftChange = (value: string) => {
    setDraft(value);
    const socket = getSocket();
    const now = Date.now();
    if (activeId && socket?.connected && value && now - lastTypingSent.current > 2500) {
      lastTypingSent.current = now;
      socket.emit("typing", { conversationId: activeId, isTyping: true });
    }
  };

  //* ---- send: socket with ack, REST fallback ----
  const [sendRest] = useChatSendMessageMutation();
  const send = async () => {
    const body = draft.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    try {
      const socket = getSocket();
      let message: ChatMessage | undefined;
      if (socket?.connected) {
        const res: SocketAck = await socket.timeout(10000).emitWithAck("message:send", { conversationId: activeId, body });
        if (!res?.ok) throw new Error(res?.error || "Message not sent");
        message = res.message;
      } else {
        message = await sendRest({ conversationId: activeId, body }).unwrap();
      }
      if (message) appendMessage(message);
      setDraft("");
      refreshList();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Message not sent");
    } finally {
      setSending(false);
    }
  };

  const showOlder = async () => {
    if (!activeId || !cursor) return;
    try {
      const res = await loadOlder({ conversationId: activeId, cursor }).unwrap();
      const older = [...res.items].reverse();
      setMessages((prev) => [...older.filter((m) => !prev.some((p) => p.id === m.id)), ...prev]);
      setCursor(res.nextCursor ?? null);
    } catch {
      toast.error("Could not load older messages");
    }
  };

  //* ---- report a message ----
  const [submitReport] = useSubmitUserReportMutation();
  const reportMessage = async (m: ChatMessage) => {
    if (!window.confirm("Report this message to the Petfinder team?")) return;
    try {
      await submitReport({ targetType: "MESSAGE", targetId: m.id, reason: "Inappropriate message" }).unwrap();
      toast.success("Thanks, our team will review it");
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not send the report");
    }
  };

  const lastOwn = [...messages].reverse().find((m) => m.senderId === myId);
  const seen = !!(lastOwn && otherReadAt && new Date(otherReadAt) >= new Date(lastOwn.createdAt));

  if (listLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!conversations.length && !initialConversationId) {
    return (
      <Card sx={{ p: 6, textAlign: "center" }}>
        <Typography variant="h6">No conversations yet</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          {emptyHint || "Start a chat from any pet's page with the Message button."}
        </Typography>
        <Button component={Link} href="/pets">
          Browse pets
        </Button>
      </Card>
    );
  }

  return (
    <Card sx={{ display: "flex", height: { xs: "calc(100vh - 180px)", md: 560 }, minHeight: 420 }}>
      {/* Conversation list */}
      <List
        aria-label="Conversations"
        sx={{
          width: { xs: "100%", md: 300 },
          flexShrink: 0,
          overflowY: "auto",
          borderRight: { md: "1px solid" },
          borderColor: "divider",
          display: { xs: mobileThread ? "none" : "block", md: "block" },
          py: 0,
        }}
      >
        {conversations.map((c) => (
          <ListItemButton
            key={c.id}
            selected={c.id === activeId}
            onClick={() => {
              setActiveId(c.id);
              setMobileThread(true);
            }}
            sx={{ borderBottom: "1px solid", borderColor: "divider", alignItems: "flex-start" }}
          >
            <Avatar
              src={c.pet?.image || c.counterparts?.[0]?.profilePhoto || undefined}
              alt={c.pet?.name}
              sx={{ mr: 1.5, mt: 0.5, bgcolor: "primary.light", color: "primary.main" }}
            >
              {titleFor(c)[0]}
            </Avatar>
            <ListItemText
              primary={
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                  <Typography fontWeight={c.unreadCount ? 700 : 600} noWrap>
                    {titleFor(c)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {timeLabel(c.lastMessage?.createdAt || c.lastMessageAt)}
                  </Typography>
                </Box>
              }
              secondary={
                <Box component="span" sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                  <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.pet ? `${c.pet.name}: ` : ""}
                    {c.lastMessage?.body || "No messages yet"}
                  </Box>
                  {c.unreadCount > 0 && <Chip size="small" color="secondary" label={c.unreadCount} sx={{ height: 20 }} />}
                </Box>
              }
              secondaryTypographyProps={{ component: "span" }}
            />
          </ListItemButton>
        ))}
      </List>

      {/* Thread */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: { xs: mobileThread ? "flex" : "none", md: "flex" },
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            aria-label="Back to conversations"
            onClick={() => setMobileThread(false)}
            sx={{ display: { md: "none" } }}
            size="small"
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography fontWeight={700} noWrap>
              {active ? titleFor(active) : "Conversation"}
            </Typography>
            {active?.pet && (
              <Typography
                variant="caption"
                component={Link}
                href={`/pets/${active.pet.id}`}
                sx={{ color: "primary.main", fontWeight: 600 }}
              >
                About {active.pet.name}
              </Typography>
            )}
          </Box>
          {active?.isFlagged && <Chip size="small" color="warning" label="Under review" />}
          <Tooltip title={connected ? "Live" : "Offline: messages send over HTTP"}>
            <Box
              aria-label={connected ? "Live" : "Offline"}
              sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: connected ? "success.main" : "text.disabled" }}
            />
          </Tooltip>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1 }} aria-live="polite">
          {cursor && (
            <Button variant="text" size="small" onClick={showOlder} disabled={olderLoading} sx={{ alignSelf: "center" }}>
              {olderLoading ? "Loading…" : "Load older messages"}
            </Button>
          )}
          {msgLoading && !messages.length ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : !messages.length ? (
            <Typography color="text.secondary" sx={{ textAlign: "center", my: "auto" }}>
              Say hello and ask about the pet.
            </Typography>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === myId;
              return (
                <Box
                  key={m.id}
                  sx={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "75%",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    flexDirection: mine ? "row-reverse" : "row",
                    "&:hover .pf-report": { opacity: 1 },
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: mine ? "primary.main" : "primary.light",
                      color: mine ? "primary.contrastText" : "text.primary",
                      px: 2,
                      py: 1,
                      borderRadius: 3,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {m.body}
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ display: "block", opacity: 0.75, textAlign: mine ? "right" : "left", mt: 0.25 }}
                    >
                      {timeLabel(m.createdAt)}
                    </Typography>
                  </Box>
                  {!mine && (
                    <IconButton
                      className="pf-report"
                      size="small"
                      aria-label="Report message"
                      onClick={() => reportMessage(m)}
                      sx={{ opacity: { xs: 1, md: 0 }, color: "text.secondary" }}
                    >
                      <FlagOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  )}
                </Box>
              );
            })
          )}
          {seen && (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "flex-end" }}>
              Seen
            </Typography>
          )}
          {typing && (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
              typing…
            </Typography>
          )}
          <div ref={bottomRef} />
        </Box>

        <Box sx={{ p: 2, display: "flex", gap: 1, borderTop: "1px solid", borderColor: "divider" }}>
          <TextField
            fullWidth
            size="small"
            multiline
            maxRows={4}
            placeholder={active?.isFlagged ? "This conversation is under review" : "Write a message"}
            value={draft}
            disabled={!activeId}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            inputProps={{ maxLength: MAX_LENGTH, "aria-label": "Message" }}
          />
          <Button onClick={send} disabled={!draft.trim() || sending || !activeId} endIcon={<SendIcon />}>
            Send
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

export default ChatInbox;

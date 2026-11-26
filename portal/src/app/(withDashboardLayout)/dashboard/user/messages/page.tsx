"use client";

import { useState } from "react";
import { Avatar, Box, Button, Card, List, ListItemButton, ListItemText, TextField, Typography } from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import { mockConversations } from "@/mock/portal";

const MessagesPage = () => {
  const [conversations, setConversations] = useState(mockConversations);
  const [activeId, setActiveId] = useState(conversations[0].id);
  const [draft, setDraft] = useState("");
  const active = conversations.find((c) => c.id === activeId)!;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, messages: [...c.messages, { from: "me", text }] } : c))
    );
    setDraft("");
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Messages
      </Typography>
      <Card sx={{ display: "flex", minHeight: 460, flexDirection: { xs: "column", md: "row" } }}>
        <List sx={{ width: { md: 280 }, borderRight: { md: "1px solid" }, borderColor: "divider" }}>
          {conversations.map((c) => (
            <ListItemButton key={c.id} selected={c.id === activeId} onClick={() => setActiveId(c.id)}>
              <Avatar sx={{ mr: 1.5, bgcolor: "primary.light", color: "primary.main" }}>{c.with[0]}</Avatar>
              <ListItemText primary={c.with} secondary={`About ${c.pet}`} />
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box
            sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <Typography fontWeight={600}>{active.with}</Typography>
            {active.verified && <VerifiedIcon color="primary" fontSize="small" titleAccess="Verified shelter" />}
          </Box>
          <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {active.messages.map((m, i) => (
              <Box
                key={i}
                sx={{
                  alignSelf: m.from === "me" ? "flex-end" : "flex-start",
                  bgcolor: m.from === "me" ? "primary.main" : "primary.light",
                  color: m.from === "me" ? "primary.contrastText" : "text.primary",
                  px: 2,
                  py: 1,
                  borderRadius: 3,
                  maxWidth: "75%",
                }}
              >
                {m.text}
              </Box>
            ))}
          </Box>
          <Box sx={{ p: 2, display: "flex", gap: 1, borderTop: "1px solid", borderColor: "divider" }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Write a message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              inputProps={{ maxLength: 1000 }}
            />
            <Button onClick={send}>Send</Button>
          </Box>
        </Box>
      </Card>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview only. Real-time chat (Socket.IO) arrives with the backend.
      </Typography>
    </Box>
  );
};

export default MessagesPage;

"use client";

import { useState } from "react";
import { Box, Button, Card, IconButton, List, ListItem, ListItemText, TextField, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "sonner";
import { mockMembers } from "@/mock/shelter";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MembersPage = () => {
  const [members, setMembers] = useState(mockMembers);
  const [email, setEmail] = useState("");

  const invite = () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value)) return toast.error("Enter a valid email address.");
    if (members.some((m) => m.email === value)) return toast.error("That person is already on your team.");
    setMembers((prev) => [...prev, { id: `m${Date.now()}`, name: value.split("@")[0], email: value, role: "Editor" }]);
    setEmail("");
    toast.success("Invitation added (preview).");
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Team
      </Typography>
      <Card sx={{ maxWidth: 640, p: 2 }}>
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField fullWidth size="small" type="email" label="Invite by email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button onClick={invite}>Invite</Button>
        </Box>
        <List>
          {members.map((m) => (
            <ListItem
              key={m.id}
              divider
              secondaryAction={
                m.role !== "Owner" && (
                  <IconButton aria-label={`Remove ${m.name}`} onClick={() => setMembers((p) => p.filter((x) => x.id !== m.id))}>
                    <DeleteOutlineIcon />
                  </IconButton>
                )
              }
            >
              <ListItemText primary={m.name} secondary={`${m.email} · ${m.role}`} />
            </ListItem>
          ))}
        </List>
      </Card>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview only. Team members need a Shelter account; individual owners have no team.
      </Typography>
    </Box>
  );
};

export default MembersPage;

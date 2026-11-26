"use client";

import { useState } from "react";
import { Box, Button, Card, IconButton, List, ListItem, ListItemText, TextField, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "sonner";
import { mockFaqs, mockPages } from "@/mock/admin";

const CmsPage = () => {
  const [faqs, setFaqs] = useState(mockFaqs);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");

  const add = () => {
    if (!q.trim() || !a.trim()) return toast.error("Question and answer are required.");
    setFaqs((p) => [...p, { id: `f${Date.now()}`, q: q.trim(), a: a.trim() }]);
    setQ("");
    setA("");
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Content management
      </Typography>
      <Typography variant="h6" sx={{ mb: 1 }}>
        FAQs
      </Typography>
      <Card sx={{ p: 2, mb: 4, maxWidth: 760 }}>
        <List>
          {faqs.map((f) => (
            <ListItem
              key={f.id}
              divider
              secondaryAction={
                <IconButton aria-label={`Delete FAQ ${f.q}`} onClick={() => setFaqs((p) => p.filter((x) => x.id !== f.id))}>
                  <DeleteOutlineIcon />
                </IconButton>
              }
            >
              <ListItemText primary={f.q} secondary={f.a} />
            </ListItem>
          ))}
        </List>
        <Box sx={{ display: "grid", gap: 1, mt: 2 }}>
          <TextField size="small" label="Question" value={q} onChange={(e) => setQ(e.target.value)} />
          <TextField size="small" label="Answer" multiline minRows={2} value={a} onChange={(e) => setA(e.target.value)} />
          <Button sx={{ justifySelf: "start" }} onClick={add}>
            Add FAQ
          </Button>
        </Box>
      </Card>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Static pages
      </Typography>
      <Card sx={{ maxWidth: 760 }}>
        <List>
          {mockPages.map((p) => (
            <ListItem key={p} divider secondaryAction={<Button size="small" variant="outlined" onClick={() => toast.info("Page editor arrives with the CMS backend.")}>Edit</Button>}>
              <ListItemText primary={p} />
            </ListItem>
          ))}
        </List>
      </Card>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview data. Rich-text content will be sanitized before display.
      </Typography>
    </Box>
  );
};

export default CmsPage;

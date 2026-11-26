"use client";

import { useState } from "react";
import { Box, Button, Card, Chip, Tab, Tabs, TextField, Typography } from "@mui/material";
import { toast } from "sonner";
import { mockLookups } from "@/mock/admin";

const LookupsPage = () => {
  const [data, setData] = useState<Record<string, string[]>>(mockLookups);
  const keys = Object.keys(data);
  const [tab, setTab] = useState(0);
  const [value, setValue] = useState("");
  const key = keys[tab];

  const add = () => {
    const v = value.trim();
    if (!v) return;
    if (data[key].some((x) => x.toLowerCase() === v.toLowerCase())) return toast.error("Already exists.");
    setData({ ...data, [key]: [...data[key], v] });
    setValue("");
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Species, breeds &amp; locations
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {keys.map((k) => (
          <Tab key={k} label={k} />
        ))}
      </Tabs>
      <Card sx={{ p: 3, maxWidth: 640 }}>
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField fullWidth size="small" label={`Add to ${key}`} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <Button onClick={add}>Add</Button>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {data[key].map((item) => (
            <Chip key={item} label={item} onDelete={() => setData({ ...data, [key]: data[key].filter((x) => x !== item) })} />
          ))}
        </Box>
      </Card>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview data. Removing a value in production will be blocked while pets still use it.
      </Typography>
    </Box>
  );
};

export default LookupsPage;

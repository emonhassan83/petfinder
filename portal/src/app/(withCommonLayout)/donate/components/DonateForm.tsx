"use client";

import { useState } from "react";
import { Box, Button, InputAdornment, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { toast } from "sonner";

const amounts = [500, 1000, 2500, 5000];

//* Gift picker. Payment processing is wired with the backend (Phase 3d); this is preview only.
const DonateForm = () => {
  const [freq, setFreq] = useState<"once" | "monthly">("once");
  const [amount, setAmount] = useState<number | null>(1000);
  const [custom, setCustom] = useState("");
  const value = custom ? Number(custom) : amount ?? 0;

  const submit = () => {
    if (!value || value < 100) return toast.error("Please choose an amount of at least ৳100.");
    toast.success(`Thank you! Online payment for your ৳${value.toLocaleString()} ${freq === "monthly" ? "monthly " : ""}gift opens soon.`);
  };

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: 5, p: { xs: 3, md: 4 }, border: "1px solid", borderColor: "divider", boxShadow: "var(--pf-shadow)" }}>
      <Typography variant="h5">Choose your gift</Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={freq}
        onChange={(_, v) => v && setFreq(v)}
        sx={{ mt: 2, bgcolor: "var(--pf-soft)", borderRadius: 999, p: 0.5, "& .MuiToggleButton-root": { border: 0, borderRadius: "999px !important", fontWeight: 700, textTransform: "none" }, "& .Mui-selected": { bgcolor: "primary.main !important", color: "#fff !important" } }}
      >
        <ToggleButton value="once">One-time</ToggleButton>
        <ToggleButton value="monthly">Monthly</ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 2.5 }}>
        {amounts.map((a) => {
          const on = !custom && amount === a;
          return (
            <Box
              key={a}
              component="button"
              type="button"
              aria-pressed={on}
              onClick={() => {
                setAmount(a);
                setCustom("");
              }}
              sx={{
                py: 2,
                borderRadius: 3,
                cursor: "pointer",
                fontFamily: "var(--font-heading), sans-serif",
                fontWeight: 800,
                fontSize: 20,
                border: "2px solid",
                borderColor: on ? "primary.main" : "divider",
                bgcolor: on ? "primary.light" : "background.paper",
                color: on ? "primary.main" : "text.primary",
                transition: "all .2s ease",
                "&:hover": { borderColor: "primary.main", transform: "translateY(-2px)" },
              }}
            >
              ৳{a.toLocaleString()}
            </Box>
          );
        })}
      </Box>
      <TextField
        fullWidth
        type="number"
        label="Other amount"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
        inputProps={{ min: 100 }}
        sx={{ mt: 2 }}
      />
      <Button fullWidth color="secondary" size="large" startIcon={<FavoriteIcon />} onClick={submit} sx={{ mt: 3, py: 1.5, fontSize: 17 }}>
        Donate ৳{(value || 0).toLocaleString()}
        {freq === "monthly" ? " / month" : ""}
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mt: 1.5 }}>
        <LockOutlinedIcon sx={{ fontSize: 16 }} /> Secure payment. Cancel monthly gifts anytime.
      </Typography>
    </Box>
  );
};

export default DonateForm;

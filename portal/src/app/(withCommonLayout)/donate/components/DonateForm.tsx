"use client";

import { useEffect, useState } from "react";
import { Box, Button, InputAdornment, TextField, Typography } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import axios from "axios";
import { toast } from "sonner";
import { API_URL } from "@/lib/apiData";
import { useAuthUser } from "@/hooks/useAuthUser";

const amounts = [500, 1000, 2500, 5000];
const CURRENCY = "BDT";

//* One-time gift via Stripe Checkout: POST /donate/checkout-session (guests allowed, amount in major
//* units) returns a hosted checkout `url`. The donation stays PENDING until the Stripe webhook confirms it.
const DonateForm = () => {
  const { user } = useAuthUser();
  const [amount, setAmount] = useState<number | null>(1000);
  const [custom, setCustom] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const value = custom ? Number(custom) : amount ?? 0;

  useEffect(() => {
    if (user?.email) setDonorEmail((e) => e || user.email);
  }, [user]);

  const submit = async () => {
    if (!value || value < 100) return toast.error("Please choose an amount of at least ৳100.");
    if (!donorName.trim()) return toast.error("Please tell us your name.");
    if (!/^\S+@\S+\.\S+$/.test(donorEmail.trim())) return toast.error("Please enter a valid email for your receipt.");
    setBusy(true);
    try {
      const { data } = await axios.post(`${API_URL}/donate/checkout-session`, {
        amount: value,
        currency: CURRENCY,
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        ...(message.trim() ? { message: message.trim() } : {}),
      });
      const url = data?.data?.url;
      if (!url) throw new Error("No checkout link returned");
      window.location.assign(url);
    } catch (err: any) {
      //* 503 when online payments are not configured yet
      toast.error(err?.response?.data?.message || "Online donations are not available right now. Please try again later.");
      setBusy(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: 5, p: { xs: 3, md: 4 }, border: "1px solid", borderColor: "divider", boxShadow: "var(--pf-shadow)" }}>
      <Typography variant="h5">Choose your gift</Typography>

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
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mt: 2 }}>
        <TextField label="Your name" value={donorName} onChange={(e) => setDonorName(e.target.value.slice(0, 100))} required />
        <TextField label="Email for receipt" type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value.slice(0, 254))} required />
      </Box>
      <TextField fullWidth multiline minRows={2} label="Message (optional)" value={message} onChange={(e) => setMessage(e.target.value.slice(0, 1000))} sx={{ mt: 1.5 }} />
      <Button fullWidth color="secondary" size="large" startIcon={<FavoriteIcon />} onClick={submit} disabled={busy} sx={{ mt: 3, py: 1.5, fontSize: 17 }}>
        {busy ? "Opening secure checkout…" : `Donate ৳${(value || 0).toLocaleString()}`}
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mt: 1.5 }}>
        <LockOutlinedIcon sx={{ fontSize: 16 }} /> Secure payment by Stripe. We never see your card details.
      </Typography>
    </Box>
  );
};

export default DonateForm;

"use client";

import { useState } from "react";
import { Box, Button, Card, Chip, MenuItem, Switch, TextField, Typography } from "@mui/material";
import { toast } from "sonner";
import { mockShelterVisits, mockWeeklySlots, ShelterVisitStatus, slotTimes, weekDays } from "@/mock/shelter";

const statusColor: Record<ShelterVisitStatus, "warning" | "success" | "default" | "info" | "error"> = {
  REQUESTED: "warning",
  CONFIRMED: "success",
  CANCELLED: "default",
  COMPLETED: "info",
  NO_SHOW: "error",
};

const label = (s: ShelterVisitStatus) => s.replace("_", "-").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const fmt = (date: string, time: string) => new Date(`${date}T${time}`).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const TODAY = "2026-11-27"; // fixed "today" for preview data

//* Meet-and-greet visits for shelters/owners: weekly availability + visit requests (preview; API in Phase 3f, v1.1)
const VisitsPage = () => {
  const [week, setWeek] = useState(mockWeeklySlots);
  const [capacity, setCapacity] = useState(2);
  const [visits, setVisits] = useState(mockShelterVisits);
  const [view, setView] = useState<"upcoming" | "past">("upcoming");

  const toggleSlot = (day: (typeof weekDays)[number], t: string) =>
    setWeek((w) => ({ ...w, [day]: w[day].includes(t) ? w[day].filter((x) => x !== t) : [...w[day], t].sort() }));
  const toggleDay = (day: (typeof weekDays)[number], open: boolean) => setWeek((w) => ({ ...w, [day]: open ? ["10:00", "11:00", "15:00"] : [] }));
  const setStatus = (id: string, status: ShelterVisitStatus) => {
    setVisits((v) => v.map((x) => (x.id === id ? { ...x, status } : x)));
    toast.success(`Visit marked ${label(status).toLowerCase()} (preview). The visitor is notified.`);
  };

  const list = visits
    .filter((v) => (view === "upcoming" ? v.date >= TODAY : v.date < TODAY))
    .sort((a, b) => (view === "upcoming" ? 1 : -1) * `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const requested = visits.filter((v) => v.status === "REQUESTED").length;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Visits
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Adopters book free meet-and-greets in the slots you open. {requested > 0 && <strong>{requested} waiting for your confirmation.</strong>}
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.1fr 1fr" }, gap: 3, alignItems: "start" }}>
        {/* Visit requests */}
        <Card sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 1, flexWrap: "wrap" }}>
            <Typography variant="h6">Visit requests</Typography>
            <Box role="radiogroup" aria-label="Show" sx={{ display: "flex", gap: 1 }}>
              {(["upcoming", "past"] as const).map((v) => (
                <Chip key={v} role="radio" aria-checked={view === v} label={v === "upcoming" ? "Upcoming" : "Past"} clickable onClick={() => setView(v)} color={view === v ? "primary" : "default"} variant={view === v ? "filled" : "outlined"} />
              ))}
            </Box>
          </Box>
          {list.length === 0 && <Typography color="text.secondary">No {view} visits.</Typography>}
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {list.map((v) => (
              <Box key={v.id} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ minWidth: 200 }}>
                  <Typography fontWeight={700}>
                    {v.visitor} <Typography component="span" color="text.secondary">to meet {v.pet}</Typography>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.25 }}>{fmt(v.date, v.time)}</Typography>
                  {v.note && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: "italic" }}>
                      “{v.note}”
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <Chip size="small" label={label(v.status)} color={statusColor[v.status]} />
                  {v.status === "REQUESTED" && (
                    <>
                      <Button size="small" onClick={() => setStatus(v.id, "CONFIRMED")}>Confirm</Button>
                      <Button size="small" color="inherit" variant="outlined" onClick={() => setStatus(v.id, "CANCELLED")}>Decline</Button>
                    </>
                  )}
                  {v.status === "CONFIRMED" && view === "upcoming" && (
                    <>
                      <Button size="small" variant="outlined" onClick={() => setStatus(v.id, "COMPLETED")}>Completed</Button>
                      <Button size="small" color="inherit" variant="text" onClick={() => setStatus(v.id, "NO_SHOW")}>No-show</Button>
                    </>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Card>

        {/* Weekly availability */}
        <Card sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2, flexWrap: "wrap" }}>
            <Typography variant="h6">Weekly availability</Typography>
            <TextField select size="small" label="Visitors per slot" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} sx={{ minWidth: 150 }}>
              {[1, 2, 3, 4].map((n) => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {weekDays.map((d) => {
              const open = week[d].length > 0;
              return (
                <Box key={d} sx={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: 1.5, alignItems: "center", py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Switch size="small" checked={open} onChange={(e) => toggleDay(d, e.target.checked)} inputProps={{ "aria-label": `${d} open` }} />
                    <Typography fontWeight={700} sx={{ fontSize: 14 }}>{d}</Typography>
                  </Box>
                  {open ? (
                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                      {slotTimes.map((t) => {
                        const on = week[d].includes(t);
                        return <Chip key={t} size="small" label={t} clickable aria-pressed={on} onClick={() => toggleSlot(d, t)} color={on ? "primary" : "default"} variant={on ? "filled" : "outlined"} />;
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Closed</Typography>
                  )}
                </Box>
              );
            })}
          </Box>
          <Button sx={{ mt: 2.5 }} onClick={() => toast.success("Availability saved (preview).")}>
            Save availability
          </Button>
        </Card>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview data. Reminders go to visitors 24 hours before a confirmed visit once notifications are live.
      </Typography>
    </Box>
  );
};

export default VisitsPage;

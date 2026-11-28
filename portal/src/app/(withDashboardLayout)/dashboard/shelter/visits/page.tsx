"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, Chip, MenuItem, Switch, TextField, Typography } from "@mui/material";
import QueryState from "@/components/Dashboard/Common/QueryState";
import ReasonDialog from "@/components/Shared/ReasonDialog";
import { useGetShelterAvailabilityQuery, useGetShelterVisitsQuery, useSaveShelterAvailabilityMutation, useUpdateShelterVisitMutation } from "@/redux/api/shelterDashboardApi";
import { runMutation } from "@/utils/dashboardHelpers";

type VisitStatus = "REQUESTED" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

const statusColor: Record<VisitStatus, "warning" | "success" | "default" | "info" | "error"> = {
  REQUESTED: "warning",
  CONFIRMED: "success",
  CANCELLED: "default",
  COMPLETED: "info",
  NO_SHOW: "error",
};

//* weekday 0 = Monday (API)
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const slotTimes = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const DEFAULT_TIMES = ["10:00", "11:00", "15:00"];

const label = (s: string) => s.replace("_", "-").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const fmt = (iso: string, tz?: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: tz });

type Day = { weekday: number; isOpen: boolean; times: string[]; capacity: number };

//* Meet-and-greet visits: visit requests and the weekly availability template.
const VisitsPage = () => {
  const [view, setView] = useState<"upcoming" | "past">("upcoming");
  const visits = useGetShelterVisitsQuery({ when: view });
  const upcomingAll = useGetShelterVisitsQuery({ when: "upcoming" });
  const avail = useGetShelterAvailabilityQuery({});
  const [updateVisit, { isLoading: saving }] = useUpdateShelterVisitMutation();
  const [saveAvail, { isLoading: savingAvail }] = useSaveShelterAvailabilityMutation();

  const [days, setDays] = useState<Day[]>([]);
  const [declining, setDeclining] = useState<any>(null);

  useEffect(() => {
    if (avail.data?.days) {
      const byDay = new Map<number, Day>(avail.data.days.map((d: Day) => [d.weekday, d]));
      setDays(weekDays.map((_, i) => byDay.get(i) ?? { weekday: i, isOpen: false, times: [], capacity: 1 }));
    }
  }, [avail.data]);

  const capacity = days.find((d) => d.isOpen)?.capacity ?? days[0]?.capacity ?? 1;
  const setDay = (i: number, patch: Partial<Day>) => setDays((ds) => ds.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const toggleSlot = (i: number, t: string) =>
    setDays((ds) =>
      ds.map((d, idx) => (idx === i ? { ...d, times: d.times.includes(t) ? d.times.filter((x) => x !== t) : [...d.times, t].sort() } : d))
    );

  //* Soonest first for upcoming, most recent first for past
  const items: any[] = [...(visits.data?.items ?? [])].sort((a, b) => (view === "upcoming" ? 1 : -1) * (new Date(a.slot?.startsAt).getTime() - new Date(b.slot?.startsAt).getTime()));
  const requested = (upcomingAll.data?.items ?? []).filter((v: any) => v.status === "REQUESTED").length;
  const act = (id: string, action: string, ok: string, reason?: string) => runMutation(updateVisit({ id, action, reason }), ok);

  const saveAvailability = () =>
    runMutation(
      saveAvail(days.map((d) => ({ weekday: d.weekday, isOpen: d.isOpen && d.times.length > 0, times: d.times, capacity }))),
      "Availability saved."
    );

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
          <QueryState isLoading={visits.isLoading} error={visits.error}>
            {items.length === 0 && <Typography color="text.secondary">No {view} visits.</Typography>}
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {items.map((v) => (
                <Box key={v.id} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                  <Box sx={{ minWidth: 200 }}>
                    <Typography fontWeight={700}>
                      {v.user?.name ?? "Visitor"} <Typography component="span" color="text.secondary">to meet {v.pet?.name}</Typography>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25 }}>
                      {fmt(v.slot?.startsAt, v.slot?.timezone)}
                    </Typography>
                    {v.note && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: "italic" }}>
                        &ldquo;{v.note}&rdquo;
                      </Typography>
                    )}
                    {v.cancelReason && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Reason: {v.cancelReason}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <Chip size="small" label={label(v.status)} color={statusColor[v.status as VisitStatus]} />
                    {v.status === "REQUESTED" && (
                      <>
                        <Button size="small" disabled={saving} onClick={() => act(v.id, "confirm", "Visit confirmed. The visitor is notified.")}>
                          Confirm
                        </Button>
                        <Button size="small" color="inherit" variant="outlined" onClick={() => setDeclining(v)}>
                          Decline
                        </Button>
                      </>
                    )}
                    {v.status === "CONFIRMED" && new Date(v.slot?.startsAt) <= new Date() && (
                      <>
                        <Button size="small" variant="outlined" disabled={saving} onClick={() => act(v.id, "complete", "Visit marked completed.")}>
                          Completed
                        </Button>
                        <Button size="small" color="inherit" variant="text" disabled={saving} onClick={() => act(v.id, "no_show", "Marked as no-show.")}>
                          No-show
                        </Button>
                      </>
                    )}
                    {v.status === "CONFIRMED" && new Date(v.slot?.startsAt) > new Date() && (
                      <Button size="small" color="inherit" variant="text" onClick={() => setDeclining(v)}>
                        Cancel
                      </Button>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </QueryState>
        </Card>

        {/* Weekly availability */}
        <Card sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2, flexWrap: "wrap" }}>
            <Typography variant="h6">Weekly availability</Typography>
            <TextField
              select
              size="small"
              label="Visitors per slot"
              value={capacity}
              onChange={(e) => setDays((ds) => ds.map((d) => ({ ...d, capacity: Number(e.target.value) })))}
              sx={{ minWidth: 150 }}
            >
              {[1, 2, 3, 4, 5, 10].map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <QueryState isLoading={avail.isLoading} error={avail.error}>
            {avail.data?.timezone && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Times are in {avail.data.timezone}, {avail.data.slotMinutes}-minute slots.
              </Typography>
            )}
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {days.map((d, i) => (
                <Box key={d.weekday} sx={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: 1.5, alignItems: "center", py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Switch
                      size="small"
                      checked={d.isOpen}
                      onChange={(e) => setDay(i, { isOpen: e.target.checked, times: e.target.checked && d.times.length === 0 ? DEFAULT_TIMES : d.times })}
                      inputProps={{ "aria-label": `${weekDays[i]} open` }}
                    />
                    <Typography fontWeight={700} sx={{ fontSize: 14 }}>
                      {weekDays[i]}
                    </Typography>
                  </Box>
                  {d.isOpen ? (
                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                      {slotTimes.map((t) => {
                        const on = d.times.includes(t);
                        return <Chip key={t} size="small" label={t} clickable aria-pressed={on} onClick={() => toggleSlot(i, t)} color={on ? "primary" : "default"} variant={on ? "filled" : "outlined"} />;
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Closed
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
            {days.some((d) => d.isOpen && d.times.length === 0) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Open days with no times are saved as closed.
              </Alert>
            )}
            <Button sx={{ mt: 2.5 }} disabled={savingAvail} onClick={saveAvailability}>
              Save availability
            </Button>
          </QueryState>
        </Card>
      </Box>

      <ReasonDialog
        open={!!declining}
        title={declining?.status === "REQUESTED" ? "Decline visit" : "Cancel visit"}
        onClose={() => setDeclining(null)}
        onConfirm={async (reason) => {
          const r = await act(declining.id, declining.status === "REQUESTED" ? "decline" : "cancel", "The visitor was notified.", reason);
          if (r.ok) setDeclining(null);
        }}
      />
    </Box>
  );
};

export default VisitsPage;

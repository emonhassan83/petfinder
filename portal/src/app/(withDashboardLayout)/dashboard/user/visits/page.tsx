"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  ChipProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import { toast } from "sonner";
import Meta from "@/components/Meta/MetaData";
import { useVisitCancelMutation, useVisitGetMineQuery } from "@/redux/api/visitApi";
import { normalizePet } from "@/lib/apiData";

const statusColor: Record<string, ChipProps["color"]> = {
  REQUESTED: "warning",
  CONFIRMED: "success",
  DECLINED: "error",
  CANCELLED: "default",
  COMPLETED: "primary",
  NO_SHOW: "error",
};
const statusLabel: Record<string, string> = {
  REQUESTED: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "Missed",
};
const ACTIVE = ["REQUESTED", "CONFIRMED"];

//* Shown in the shelter's timezone (slot.timezone), which is where the visit happens
const formatSlot = (startsAt: string, endsAt: string, timeZone?: string) => {
  const opts: Intl.DateTimeFormatOptions = { timeZone: timeZone || undefined };
  try {
    const day = new Date(startsAt).toLocaleDateString([], { ...opts, weekday: "short", day: "numeric", month: "short", year: "numeric" });
    const from = new Date(startsAt).toLocaleTimeString([], { ...opts, hour: "2-digit", minute: "2-digit" });
    const to = new Date(endsAt).toLocaleTimeString([], { ...opts, hour: "2-digit", minute: "2-digit" });
    return `${day}, ${from} – ${to}`;
  } catch {
    return new Date(startsAt).toLocaleString();
  }
};

const MyVisitsPage = () => {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [cancelling, setCancelling] = useState<any>(null);
  const [reason, setReason] = useState("");
  const { data, isLoading, isError } = useVisitGetMineQuery({ limit: 100 });
  const [cancelVisit, { isLoading: cancelBusy }] = useVisitCancelMutation();

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const all = data?.items ?? [];
    const isUpcoming = (v: any) => ACTIVE.includes(v.status) && new Date(v.slot?.endsAt ?? 0).getTime() > now;
    return {
      upcoming: all.filter(isUpcoming).sort((a, b) => +new Date(a.slot?.startsAt) - +new Date(b.slot?.startsAt)),
      past: all.filter((v) => !isUpcoming(v)).sort((a, b) => +new Date(b.slot?.startsAt) - +new Date(a.slot?.startsAt)),
    };
  }, [data]);
  const list = tab === "upcoming" ? upcoming : past;

  const confirmCancel = async () => {
    if (!cancelling) return;
    try {
      await cancelVisit({ id: cancelling.id, reason: reason.trim() || undefined }).unwrap();
      toast.success("Visit cancelled");
      setCancelling(null);
      setReason("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not cancel the visit");
    }
  };

  return (
    <Box>
      <Meta title="My visits | Petfinder" description="Your meet-and-greet visits with shelters and owners." />
      <Typography variant="h4" sx={{ mb: 2 }}>
        My visits
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="upcoming" label={`Upcoming (${upcoming.length})`} />
        <Tab value="past" label={`Past & cancelled (${past.length})`} />
      </Tabs>

      {isLoading ? (
        <Box sx={{ display: "grid", gap: 2, maxWidth: 760 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={96} />
          ))}
        </Box>
      ) : isError ? (
        <Typography color="error">Could not load your visits. Please try again.</Typography>
      ) : list.length === 0 ? (
        <Card sx={{ p: 5, textAlign: "center", maxWidth: 760 }}>
          <EventAvailableOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography sx={{ mt: 1 }} color="text.secondary">
            {tab === "upcoming" ? "No upcoming visits. Book one from a pet's page." : "No past visits yet."}
          </Typography>
          {tab === "upcoming" && (
            <Button component={Link} href="/pets" sx={{ mt: 2 }}>
              Find a pet
            </Button>
          )}
        </Card>
      ) : (
        <Box sx={{ display: "grid", gap: 2, maxWidth: 760 }}>
          {list.map((v) => {
            const pet = v.pet ? normalizePet(v.pet) : null;
            return (
              <Card key={v.id} sx={{ p: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Avatar src={pet?.image} alt={pet?.name} variant="rounded" sx={{ width: 64, height: 64 }} />
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography
                      fontWeight={700}
                      component={pet ? Link : "span"}
                      href={pet ? `/pets/${pet.id}` : undefined}
                    >
                      Meet {pet?.name ?? "pet"}
                    </Typography>
                    <Chip size="small" label={statusLabel[v.status] ?? v.status} color={statusColor[v.status] ?? "default"} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {v.slot ? formatSlot(v.slot.startsAt, v.slot.endsAt, v.slot.timezone) : "Time to be confirmed"}
                  </Typography>
                  {v.pet?.shelter?.name && (
                    <Typography variant="caption" color="text.secondary">
                      at{" "}
                      <Box component={Link} href={`/shelters/${v.pet.shelter.slug || v.pet.shelter.id}`} sx={{ color: "primary.main" }}>
                        {v.pet.shelter.name}
                      </Box>
                    </Typography>
                  )}
                  {v.cancelReason && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      Reason: {v.cancelReason}
                    </Typography>
                  )}
                </Box>
                {ACTIVE.includes(v.status) && new Date(v.slot?.startsAt ?? 0).getTime() > Date.now() && (
                  <Button variant="outlined" color="secondary" size="small" onClick={() => setCancelling(v)}>
                    Cancel visit
                  </Button>
                )}
              </Card>
            );
          })}
        </Box>
      )}

      <Dialog open={!!cancelling} onClose={() => setCancelling(null)} fullWidth maxWidth="xs">
        <DialogTitle>Cancel this visit?</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 1 }}
            label="Reason (optional, shared with the shelter)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            inputProps={{ maxLength: 500 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setCancelling(null)}>
            Keep visit
          </Button>
          <Button color="secondary" onClick={confirmCancel} disabled={cancelBusy}>
            Cancel visit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyVisitsPage;

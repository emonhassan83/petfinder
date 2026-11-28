"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography } from "@mui/material";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { isAdopterRole, useAuthUser } from "@/hooks/useAuthUser";
import {
  VisitSlot,
  useVisitBookMutation,
  useVisitCancelMutation,
  useVisitGetMineQuery,
  useVisitGetPetSlotsQuery,
} from "@/redux/api/visitApi";

type Props = { pet: { id: string; name: string; image: string; ownerId?: string }; shelterName: string };

const ACTIVE = ["REQUESTED", "CONFIRMED"];

//* Calendar day of a slot in the shelter's timezone (YYYY-MM-DD)
const dayKey = (iso: string, timeZone: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone });
const fmt = (iso: string, timeZone: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("en-GB", { timeZone, ...opts });

//* Meet-and-greet booking. Free, no deposit. Slots: GET /pets/:id/visit-slots (next 14 days, shelter
//* timezone); booking: POST /visits (by slotId, or by startsAt for a slot not stored yet).
const BookVisit = ({ pet, shelterName }: Props) => {
  const { user } = useAuthUser();
  const router = useRouter();
  const pathname = usePathname();
  const isPreview = pet.id.startsWith("preview-");
  const canBook = !!user && isAdopterRole(user.role) && user.userId !== pet.ownerId && !isPreview;
  const [open, setOpen] = useState(false);

  const { data: mine } = useVisitGetMineQuery(undefined, { skip: !canBook });
  const active = mine?.items.find((v) => v.petId === pet.id && ACTIVE.includes(v.status));
  const { data: slotData, isFetching, isError } = useVisitGetPetSlotsQuery({ petId: pet.id }, { skip: !open || !canBook });
  const [book, { isLoading: booking }] = useVisitBookMutation();
  const [cancel, { isLoading: cancelling }] = useVisitCancelMutation();

  const timeZone = slotData?.timezone || "UTC";
  const days = useMemo(() => {
    const map = new Map<string, VisitSlot[]>();
    for (const s of slotData?.slots ?? []) {
      if (s.remaining <= 0) continue;
      const k = dayKey(s.startsAt, timeZone);
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return Array.from(map.entries());
  }, [slotData, timeZone]);

  const [day, setDay] = useState("");
  const [slot, setSlot] = useState<VisitSlot | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    if (days.length && !days.some(([k]) => k === day)) setDay(days[0][0]);
  }, [days, day]);
  const slots = days.find(([k]) => k === day)?.[1] ?? [];

  const start = () => {
    if (!user) {
      toast.info("Log in to book a visit");
      router.push(`/login?redirect=${encodeURIComponent(pathname || "/pets")}`);
      return;
    }
    if (isPreview) return toast.info("Preview pets cannot be booked");
    if (!canBook) return toast.info(user.userId === pet.ownerId ? "This is your own listing." : "Visits are booked from an adopter account.");
    setOpen(true);
  };

  const confirm = async () => {
    if (!slot) return;
    try {
      await book({
        petId: pet.id,
        ...(slot.id ? { slotId: slot.id } : { startsAt: slot.startsAt }),
        ...(note.trim() ? { note: note.trim() } : {}),
      }).unwrap();
      toast.success(`Visit requested for ${fmt(slot.startsAt, timeZone, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}. ${shelterName} will confirm.`);
      setOpen(false);
      setSlot(null);
      setNote("");
    } catch (err: any) {
      //* 409: slot just filled up or you already have an active visit for this pet
      toast.error(err?.data?.message || "Could not book this time");
    }
  };

  const cancelActive = async () => {
    if (!active) return;
    try {
      await cancel({ id: active.id }).unwrap();
      toast.success("Visit cancelled");
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not cancel the visit");
    }
  };

  if (active) {
    const tz = active.slot?.timezone || "UTC";
    return (
      <Box sx={{ mt: 1.5, p: 1.75, borderRadius: 3, bgcolor: "primary.light", display: "flex", alignItems: "center", gap: 1.5 }}>
        <EventAvailableOutlinedIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{active.status === "CONFIRMED" ? "Visit confirmed" : "Visit requested"}</Typography>
          {active.slot?.startsAt && (
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              {fmt(active.slot.startsAt, tz, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </Typography>
          )}
        </Box>
        <Button size="small" variant="text" onClick={cancelActive} disabled={cancelling}>
          Cancel
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Button fullWidth variant="outlined" startIcon={<EventAvailableOutlinedIcon />} onClick={start} sx={{ mt: 1.5 }}>
        Book a visit
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "var(--pf-radius-card)" } }}>
        <DialogTitle sx={{ pr: 7 }}>
          <Typography component="span" sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600, fontSize: 26, display: "block" }}>
            Meet <em>{pet.name}</em>
          </Typography>
          <Typography component="span" sx={{ fontSize: 14, color: "text.secondary" }}>
            Free meet-and-greet at {shelterName}. No deposit needed. Times shown in {timeZone.replace("_", " ")}.
          </Typography>
          <IconButton aria-label="Close" onClick={() => setOpen(false)} sx={{ position: "absolute", right: 12, top: 12 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {isFetching ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : isError || days.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
              {isError ? "Visit times could not be loaded. Please try again later." : `No open visit times in the next two weeks. Try messaging ${shelterName}.`}
            </Typography>
          ) : (
            <>
              <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>Choose a day</Typography>
              <Box role="radiogroup" aria-label="Day" sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1, scrollbarWidth: "thin" }}>
                {days.map(([k, list]) => {
                  const on = k === day;
                  const ref = list[0].startsAt;
                  return (
                    <Box
                      key={k}
                      component="button"
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={fmt(ref, timeZone, { weekday: "long", day: "numeric", month: "long" })}
                      onClick={() => {
                        setDay(k);
                        setSlot(null);
                      }}
                      sx={{
                        flex: "0 0 64px",
                        py: 1.25,
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: on ? "text.primary" : "divider",
                        bgcolor: on ? "text.primary" : "background.paper",
                        color: on ? "background.default" : "text.primary",
                        cursor: "pointer",
                        font: "inherit",
                        textAlign: "center",
                        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
                      }}
                    >
                      <Box sx={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", opacity: 0.8 }}>{fmt(ref, timeZone, { weekday: "short" })}</Box>
                      <Box sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>{fmt(ref, timeZone, { day: "numeric" })}</Box>
                      <Box sx={{ fontSize: 11, opacity: 0.8 }}>{fmt(ref, timeZone, { month: "short" })}</Box>
                    </Box>
                  );
                })}
              </Box>

              <Typography sx={{ fontWeight: 700, fontSize: 14, mt: 2.5, mb: 1 }}>Choose a time</Typography>
              <Box role="radiogroup" aria-label="Time" sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {slots.map((s) => {
                  const on = slot?.startsAt === s.startsAt;
                  return (
                    <Chip
                      key={s.startsAt}
                      role="radio"
                      aria-checked={on}
                      label={fmt(s.startsAt, timeZone, { hour: "2-digit", minute: "2-digit" })}
                      clickable
                      onClick={() => setSlot(s)}
                      color={on ? "primary" : "default"}
                      variant={on ? "filled" : "outlined"}
                      sx={{ minWidth: 72 }}
                    />
                  );
                })}
              </Box>

              <TextField fullWidth multiline minRows={2} label="Anything the shelter should know? (optional)" value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} sx={{ mt: 3 }} helperText={`${note.length}/300`} />
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="text" onClick={() => setOpen(false)}>
            Not now
          </Button>
          <Button onClick={confirm} disabled={!slot || booking}>
            Request visit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookVisit;

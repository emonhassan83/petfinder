"use client";

import { useMemo, useState } from "react";
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography } from "@mui/material";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "sonner";
import { useVisits } from "@/hooks/useVisits";

type Props = { pet: { id: string; name: string; image: string }; shelterName: string };

const DAYS = 14;
const CLOSED_DAY = 5; // Friday: preview shelters are closed

//* Mock availability: deterministic per date so it doesn't jump around between renders
const slotsFor = (d: Date) => {
  if (d.getDay() === CLOSED_DAY) return [];
  const all = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
  const seed = d.getDate() + d.getMonth();
  return all.filter((_, i) => (i + seed) % 3 !== 0);
};

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

//* Meet-and-greet booking (Pawvelle's booking calendar). Free, no deposit. Real slots come from /pets/:id/visit-slots (Phase 3f).
const BookVisit = ({ pet, shelterName }: Props) => {
  const { book, cancel, activeFor } = useVisits();
  const active = activeFor(pet.id);
  const [open, setOpen] = useState(false);
  const days = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS }, (_, i) => new Date(start.getTime() + (i + 1) * 86400000));
  }, []);
  const [day, setDay] = useState<Date>(() => days.find((d) => slotsFor(d).length) ?? days[0]);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const slots = slotsFor(day);

  const confirm = () => {
    const [h, m] = time.split(":").map(Number);
    const startsAt = new Date(day);
    startsAt.setHours(h, m);
    const ok = book({ petId: pet.id, petName: pet.name, petImage: pet.image, shelterName, startsAt: startsAt.toISOString(), note: note.trim() || undefined });
    if (!ok) return toast.error(`You already have a visit booked with ${pet.name}.`);
    toast.success(`Visit requested for ${startsAt.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}. ${shelterName} will confirm.`);
    setOpen(false);
    setTime("");
    setNote("");
  };

  if (active) {
    const when = new Date(active.startsAt);
    return (
      <Box sx={{ mt: 1.5, p: 1.75, borderRadius: 3, bgcolor: "primary.light", display: "flex", alignItems: "center", gap: 1.5 }}>
        <EventAvailableOutlinedIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Visit requested</Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            {when.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </Typography>
        </Box>
        <Button size="small" variant="text" onClick={() => cancel(active.id)}>
          Cancel
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Button fullWidth variant="outlined" startIcon={<EventAvailableOutlinedIcon />} onClick={() => setOpen(true)} sx={{ mt: 1.5 }}>
        Book a visit
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "var(--pf-radius-card)" } }}>
        <DialogTitle sx={{ pr: 7 }}>
          <Typography component="span" sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600, fontSize: 26, display: "block" }}>
            Meet <em>{pet.name}</em>
          </Typography>
          <Typography component="span" sx={{ fontSize: 14, color: "text.secondary" }}>
            Free meet-and-greet at {shelterName}. No deposit needed.
          </Typography>
          <IconButton aria-label="Close" onClick={() => setOpen(false)} sx={{ position: "absolute", right: 12, top: 12 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>Choose a day</Typography>
          <Box role="radiogroup" aria-label="Day" sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1, scrollbarWidth: "thin" }}>
            {days.map((d) => {
              const closed = slotsFor(d).length === 0;
              const on = sameDay(d, day);
              return (
                <Box
                  key={d.toISOString()}
                  component="button"
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) + (closed ? ", closed" : "")}
                  disabled={closed}
                  onClick={() => {
                    setDay(d);
                    setTime("");
                  }}
                  sx={{
                    flex: "0 0 64px",
                    py: 1.25,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: on ? "text.primary" : "divider",
                    bgcolor: on ? "text.primary" : "background.paper",
                    color: on ? "background.default" : closed ? "text.disabled" : "text.primary",
                    cursor: closed ? "not-allowed" : "pointer",
                    font: "inherit",
                    textAlign: "center",
                    textDecoration: closed ? "line-through" : "none",
                    "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
                  }}
                >
                  <Box sx={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", opacity: 0.8 }}>{d.toLocaleDateString("en-GB", { weekday: "short" })}</Box>
                  <Box sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>{d.getDate()}</Box>
                  <Box sx={{ fontSize: 11, opacity: 0.8 }}>{d.toLocaleDateString("en-GB", { month: "short" })}</Box>
                </Box>
              );
            })}
          </Box>

          <Typography sx={{ fontWeight: 700, fontSize: 14, mt: 2.5, mb: 1 }}>Choose a time</Typography>
          <Box role="radiogroup" aria-label="Time" sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {slots.map((s) => (
              <Chip key={s} role="radio" aria-checked={time === s} label={s} clickable onClick={() => setTime(s)} color={time === s ? "primary" : "default"} variant={time === s ? "filled" : "outlined"} sx={{ minWidth: 72 }} />
            ))}
          </Box>

          <TextField fullWidth multiline minRows={2} label="Anything the shelter should know? (optional)" value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} sx={{ mt: 3 }} helperText={`${note.length}/300`} />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="text" onClick={() => setOpen(false)}>
            Not now
          </Button>
          <Button onClick={confirm} disabled={!time}>
            Request visit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookVisit;

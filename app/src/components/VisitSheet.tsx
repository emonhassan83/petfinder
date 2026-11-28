import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { BottomSheet, Pill, PrimaryButton } from "./BottomSheet";
import { ErrorView, LoadingView } from "./Async";
import { colors, fonts, radius } from "../theme";
import { Pet, VisitSlot } from "../api/types";
import { bookVisit, fetchVisitSlots } from "../api/api";
import { dateLabel, dayKey, timeLabel } from "../utils/date";
import { useAsync } from "../hooks/useAsync";
import { useAppState } from "../state/AppState";

//* "Book a visit": open slots from GET /pets/:id/visit-slots grouped by day (shelter timezone); confirm POSTs /visits.
export const VisitSheet = ({ pet, visible, onClose, onViewVisits }: { pet: Pet; visible: boolean; onClose: () => void; onViewVisits: () => void }) => {
  const { requireAuth } = useAppState();
  const { data, loading, error, reload } = useAsync(() => (visible ? fetchVisitSlots(pet.id) : Promise.resolve(null)), [visible, pet.id]);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<VisitSlot | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<{ date: string; time: string } | null>(null);

  const tz = data?.timezone ?? "UTC";
  const days = useMemo(() => {
    const map = new Map<string, VisitSlot[]>();
    (data?.slots ?? []).filter((s) => s.remaining > 0).forEach((s) => {
      const k = dayKey(s.startsAt, tz);
      map.set(k, [...(map.get(k) ?? []), s]);
    });
    return [...map.entries()];
  }, [data, tz]);

  useEffect(() => {
    if (days.length && !days.some(([k]) => k === day)) setDay(days[0][0]);
  }, [days, day]);

  const close = () => { setSlot(null); setDone(null); setProblem(null); onClose(); };

  const confirm = async () => {
    if (!slot || !requireAuth("book a visit")) return;
    setBusy(true);
    setProblem(null);
    try {
      await bookVisit(pet.id, slot);
      setDone({ date: dateLabel(slot.startsAt, tz), time: timeLabel(slot.startsAt, tz) });
    } catch (e: any) {
      setProblem(e?.message ?? "Could not book this visit.");
      reload();
      setSlot(null);
    } finally {
      setBusy(false);
    }
  };

  const slots = days.find(([k]) => k === day)?.[1] ?? [];

  return (
    <BottomSheet visible={visible} title={done ? "Visit requested" : `Visit ${pet.name}`} onClose={close}>
      {done ? (
        <View style={styles.done}>
          <View style={styles.check}><Ionicons name="checkmark" size={32} color={colors.white} /></View>
          <Text style={styles.doneText}>{pet.shelter} will confirm your visit on {done.date} at {done.time}.</Text>
          <PrimaryButton label="View my visits" onPress={() => { close(); onViewVisits(); }} />
        </View>
      ) : loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={reload} />
      ) : days.length === 0 ? (
        <View style={styles.done}>
          <Text style={styles.doneText}>No open visit times in the next two weeks. Message {pet.shelter} to arrange one.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.label}>Pick a day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {days.map(([k, list]) => {
              const on = day === k;
              const [dow, rest] = dateLabel(list[0].startsAt, tz).split(", ");
              return (
                <Pressable key={k} onPress={() => { setDay(k); setSlot(null); }} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={dateLabel(list[0].startsAt, tz)} style={[styles.day, on && styles.dayOn]}>
                  <Text style={[styles.dow, on && { color: colors.white }]}>{dow}</Text>
                  <Text style={[styles.dom, on && { color: colors.white }]}>{(rest ?? "").split(" ").pop()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={styles.label}>Pick a time</Text>
          <View style={styles.slots}>
            {slots.map((s) => <Pill key={s.startsAt} label={timeLabel(s.startsAt, tz)} on={slot?.startsAt === s.startsAt} onPress={() => setSlot(s)} />)}
          </View>
          {problem ? <Text style={styles.problem} accessibilityRole="alert">{problem}</Text> : null}
          <Text style={styles.note}>Free meet-and-greet, no deposit needed. Times are in the shelter's timezone ({tz}).</Text>
          <PrimaryButton label={busy ? "Booking..." : "Confirm visit"} onPress={confirm} disabled={!slot || busy} />
        </>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  label: { color: colors.slate, fontSize: 13, marginTop: 12, marginBottom: 10 },
  day: { width: 56, height: 72, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1.2, borderColor: colors.sand, alignItems: "center", justifyContent: "center", gap: 2 },
  dayOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dow: { color: colors.slate, fontSize: 12, fontWeight: "600" },
  dom: { color: colors.ink, fontSize: 20, fontFamily: fonts.heading },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  note: { color: colors.slate, fontSize: 12, marginTop: 14 },
  problem: { color: colors.danger, marginTop: 12, fontSize: 13 },
  done: { alignItems: "center", gap: 12, paddingVertical: 12 },
  check: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  doneText: { color: colors.ink, textAlign: "center", fontSize: 15, lineHeight: 22 },
});

import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { BottomSheet, Pill, PrimaryButton } from "./BottomSheet";
import { colors, fonts, radius } from "../theme";
import { Pet, visitSlots } from "../data/mock";
import { useAppState } from "../state/AppState";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

//* "Book a visit": next 14 days + time slots; confirm stores the visit in app state.
export const VisitSheet = ({ pet, visible, onClose, onViewVisits }: { pet: Pet; visible: boolean; onClose: () => void; onViewVisits: () => void }) => {
  const { bookVisit } = useAppState();
  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d; }),
    [visible]
  );
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const close = () => { setDate(null); setTime(null); setDone(false); onClose(); };
  const confirm = () => { if (date && time) { bookVisit(pet.id, date, time); setDone(true); } };

  return (
    <BottomSheet visible={visible} title={done ? "Visit requested" : `Visit ${pet.name}`} onClose={close}>
      {done ? (
        <View style={styles.done}>
          <View style={styles.check}><Ionicons name="checkmark" size={32} color={colors.white} /></View>
          <Text style={styles.doneText}>{pet.shelter} will confirm your visit on {date} at {time}.</Text>
          <PrimaryButton label="View my visits" onPress={() => { close(); onViewVisits(); }} />
        </View>
      ) : (
        <>
          <Text style={styles.label}>Pick a day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {days.map((d) => {
              const k = iso(d), on = date === k;
              return (
                <Pressable key={k} onPress={() => setDate(k)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={d.toDateString()} style={[styles.day, on && styles.dayOn]}>
                  <Text style={[styles.dow, on && { color: colors.white }]}>{DAYS[d.getDay()]}</Text>
                  <Text style={[styles.dom, on && { color: colors.white }]}>{d.getDate()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={styles.label}>Pick a time</Text>
          <View style={styles.slots}>
            {visitSlots.map((s) => <Pill key={s} label={s} on={time === s} onPress={() => setTime(s)} />)}
          </View>
          <Text style={styles.note}>Free meet-and-greet, no deposit needed.</Text>
          <PrimaryButton label="Confirm visit" onPress={confirm} disabled={!date || !time} />
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
  done: { alignItems: "center", gap: 12, paddingVertical: 12 },
  check: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  doneText: { color: colors.ink, textAlign: "center", fontSize: 15, lineHeight: 22 },
});

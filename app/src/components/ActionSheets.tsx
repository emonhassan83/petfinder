import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput } from "./Text";
import { BottomSheet, Pill, PrimaryButton } from "./BottomSheet";
import { colors, radius } from "../theme";
import { Pet } from "../api/types";
import { AdoptionAnswers, applyToAdopt, reportPet } from "../api/api";

const YesNo = ({ label, value, onChange }: { label: string; value: "YES" | "NO" | null; onChange: (v: "YES" | "NO") => void }) => (
  <View>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.row}>
      <Pill label="Yes" on={value === "YES"} onPress={() => onChange("YES")} />
      <Pill label="No" on={value === "NO"} onPress={() => onChange("NO")} />
    </View>
  </View>
);

const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) => (
  <View>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.slate} multiline maxLength={1000} accessibilityLabel={label} />
  </View>
);

const SLEEP: AdoptionAnswers["animalSleep"][] = ["Indoor", "Room", "Crate", "Garage", "Outdoor"];

const Done = ({ text, onClose }: { text: string; onClose: () => void }) => (
  <View style={styles.done}>
    <View style={styles.check}><Ionicons name="checkmark" size={32} color={colors.white} /></View>
    <Text style={styles.doneText}>{text}</Text>
    <PrimaryButton label="Done" onPress={onClose} />
  </View>
);

//* Adoption application: the seven answers required by POST /adoption-requests.
export const AdoptSheet = ({ pet, visible, onClose, onSubmitted }: { pet: Pet; visible: boolean; onClose: () => void; onSubmitted: () => void }) => {
  const [petsHousehold, setHousehold] = useState("");
  const [petsNeutered, setNeutered] = useState<"YES" | "NO" | null>(null);
  const [secureOutdoorArea, setOutdoor] = useState<"YES" | "NO" | null>(null);
  const [animalSleep, setSleep] = useState<AdoptionAnswers["animalSleep"] | null>(null);
  const [animalAlonePeriodsTime, setAlone] = useState<"YES" | "NO" | null>(null);
  const [detailsSupport, setSupport] = useState("");
  const [petOwnershipExperience, setExperience] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const ready = petsHousehold.trim() && petsNeutered && secureOutdoorArea && animalSleep && animalAlonePeriodsTime && detailsSupport.trim() && petOwnershipExperience.trim();

  const close = () => { setDone(false); setProblem(null); onClose(); if (done) onSubmitted(); };

  const submit = async () => {
    if (!ready || !petsNeutered || !secureOutdoorArea || !animalSleep || !animalAlonePeriodsTime) return;
    setBusy(true);
    setProblem(null);
    try {
      await applyToAdopt(pet.id, {
        petsHousehold: petsHousehold.trim(), petsNeutered, secureOutdoorArea, animalSleep, animalAlonePeriodsTime,
        detailsSupport: detailsSupport.trim(), petOwnershipExperience: petOwnershipExperience.trim(),
      });
      setDone(true);
    } catch (e: any) {
      setProblem(e?.message ?? "Could not send your application.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} title={done ? "Application sent" : `Adopt ${pet.name}`} onClose={close}>
      {done ? (
        <Done text={`${pet.shelter} will review your application and message you.`} onClose={close} />
      ) : (
        <View style={{ gap: 4 }}>
          <Field label="Other pets in your household?" value={petsHousehold} onChange={setHousehold} placeholder="e.g. one cat, or none" />
          <YesNo label="Are your pets neutered?" value={petsNeutered} onChange={setNeutered} />
          <YesNo label="Do you have a secure outdoor area?" value={secureOutdoorArea} onChange={setOutdoor} />
          <Text style={styles.label}>Where will the pet sleep?</Text>
          <View style={styles.row}>{SLEEP.map((s) => <Pill key={s} label={s} on={animalSleep === s} onPress={() => setSleep(s)} />)}</View>
          <YesNo label="Will the pet be left alone for long periods?" value={animalAlonePeriodsTime} onChange={setAlone} />
          <Field label="How will you support the pet's needs?" value={detailsSupport} onChange={setSupport} placeholder="Time, budget, routine" />
          <Field label="Your pet ownership experience" value={petOwnershipExperience} onChange={setExperience} placeholder="Past pets, training, care" />
          {problem ? <Text style={styles.problem} accessibilityRole="alert">{problem}</Text> : null}
          <PrimaryButton label={busy ? "Sending..." : "Send application"} onPress={submit} disabled={!ready || busy} />
        </View>
      )}
    </BottomSheet>
  );
};

const REASONS = ["Scam or fraud", "Wrong or misleading info", "Animal welfare concern", "Inappropriate content", "Other"];

//* Report a listing: POST /reports {targetType: "PET"}.
export const ReportSheet = ({ pet, visible, onClose }: { pet: Pet; visible: boolean; onClose: () => void }) => {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const close = () => { setDone(false); setProblem(null); setReason(null); setDetails(""); onClose(); };
  const submit = async () => {
    if (!reason) return;
    setBusy(true);
    setProblem(null);
    try {
      await reportPet(pet.id, reason, details.trim() || undefined);
      setDone(true);
    } catch (e: any) {
      setProblem(e?.message ?? "Could not send your report.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} title={done ? "Report sent" : "Report this listing"} onClose={close}>
      {done ? (
        <Done text="Thanks. Our moderators will review this listing." onClose={close} />
      ) : (
        <View style={{ gap: 4 }}>
          <Text style={styles.label}>What is wrong?</Text>
          <View style={styles.row}>{REASONS.map((r) => <Pill key={r} label={r} on={reason === r} onPress={() => setReason(r)} />)}</View>
          <Field label="Details (optional)" value={details} onChange={setDetails} placeholder="Tell us more" />
          {problem ? <Text style={styles.problem} accessibilityRole="alert">{problem}</Text> : null}
          <PrimaryButton label={busy ? "Sending..." : "Send report"} onPress={submit} disabled={!reason || busy} />
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  label: { color: colors.slate, fontSize: 13, marginTop: 12, marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 10, color: colors.ink, minHeight: 46, textAlignVertical: "top" },
  problem: { color: colors.danger, marginTop: 12, fontSize: 13 },
  done: { alignItems: "center", gap: 12, paddingVertical: 12 },
  check: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  doneText: { color: colors.ink, textAlign: "center", fontSize: 15, lineHeight: 22 },
});

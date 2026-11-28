import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { Text } from "./Text";
import { BottomSheet, Pill } from "./BottomSheet";
import { colors, fonts, radius } from "../theme";
import { Pet, Size } from "../api/types";
import { fetchCostEstimates } from "../api/api";
import { CostEstimates, FoodTier, VetCare, VetPlan, estimateFirstYear, firstYearCost, formatBDT, hasEstimates } from "../utils/cost";

const sizes: Size[] = ["Small", "Medium", "Large"];
const foods: FoodTier[] = ["Basic", "Standard", "Premium"];
const vets: VetCare[] = ["Essential", "Routine", "Comprehensive"];
const livePlans: VetPlan[] = ["Routine", "Plus"];
const asSize = (s: string): Size => (s === "Small" || s === "Large" ? s : "Medium");

//* First-year cost calculator (modal). Pure client-side math from utils/cost.
export const CostSheet = ({ pet, visible, onClose }: { pet: Pet; visible: boolean; onClose: () => void }) => {
  const [size, setSize] = useState<Size>(asSize(pet.size));
  const [food, setFood] = useState<FoodTier>("Standard");
  const [vet, setVet] = useState<VetCare>("Routine");
  const [insured, setInsured] = useState(false);
  const [estimates, setEstimates] = useState<CostEstimates | null>(null);

  //* Admin-managed estimates from /settings/public; falls back to the built-in constants when unavailable
  useEffect(() => {
    if (visible && !estimates) fetchCostEstimates().then(setEstimates);
  }, [visible, estimates]);

  const live = hasEstimates(estimates, pet.species, size);
  const { lines, total } = useMemo(
    () => (live ? estimateFirstYear(estimates, pet.species, size, food, vet === "Routine" ? "Routine" : "Plus", insured) : firstYearCost(size, food, vet, insured)),
    [live, estimates, pet.species, size, food, vet, insured]
  );
  const plans: VetCare[] = live ? (livePlans as unknown as VetCare[]) : vets;

  return (
    <BottomSheet visible={visible} title="First-year cost" onClose={onClose}>
      <Text style={styles.label}>Size</Text>
      <View style={styles.row}>{sizes.map((s) => <Pill key={s} label={s} on={size === s} onPress={() => setSize(s)} />)}</View>
      <Text style={styles.label}>Food</Text>
      <View style={styles.row}>{foods.map((s) => <Pill key={s} label={s} on={food === s} onPress={() => setFood(s)} />)}</View>
      <Text style={styles.label}>Vet care</Text>
      <View style={styles.row}>{plans.map((s) => <Pill key={s} label={s} on={vet === s} onPress={() => setVet(s)} />)}</View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Pet insurance</Text>
        <Switch value={insured} onValueChange={setInsured} trackColor={{ true: colors.primary, false: colors.sand }} thumbColor={colors.white} accessibilityLabel="Include pet insurance" />
      </View>
      <View style={styles.total}>
        <Text style={styles.totalLabel}>Estimated first year</Text>
        <Text style={styles.totalAmount}>{formatBDT(total)}</Text>
        {lines.map((l) => (
          <View key={l.label} style={styles.line}>
            <Text style={styles.lineText}>{l.label}</Text>
            <Text style={styles.lineText}>{formatBDT(l.amount)}</Text>
          </View>
        ))}
        <Text style={styles.note}>Estimate only. Adoption fees for {pet.name} are listed separately.</Text>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  label: { color: colors.slate, fontSize: 13, marginTop: 12, marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48, marginTop: 8 },
  switchLabel: { color: colors.ink, fontWeight: "600", fontSize: 15 },
  total: { backgroundColor: colors.white, borderRadius: radius.md, padding: 16, marginTop: 12, gap: 6 },
  totalLabel: { color: colors.slate, fontSize: 13 },
  totalAmount: { color: colors.primaryDark, fontFamily: fonts.heading, fontSize: 32, marginBottom: 6 },
  line: { flexDirection: "row", justifyContent: "space-between" },
  lineText: { color: colors.ink, fontSize: 14 },
  note: { color: colors.slate, fontSize: 12, marginTop: 8 },
});

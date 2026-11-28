import React, { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Text } from "../components/Text";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors, fonts, radius } from "../theme";
import { ApplicationStatus, Visit, VisitStatus, pets } from "../data/mock";
import { useAppState } from "../state/AppState";

const badge: Record<ApplicationStatus, string> = { PENDING: colors.warning, APPROVED: colors.success, REJECTED: colors.danger };
const visitBadge: Record<VisitStatus, string> = { REQUESTED: colors.warning, CONFIRMED: colors.success, CANCELLED: colors.danger };

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const prettyDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const Segments = ({ value, onChange }: { value: "applications" | "visits"; onChange: (v: "applications" | "visits") => void }) => (
  <View style={styles.seg}>
    {(["applications", "visits"] as const).map((k) => (
      <Pressable
        key={k}
        onPress={() => onChange(k)}
        accessibilityRole="tab"
        accessibilityState={{ selected: value === k }}
        accessibilityLabel={k === "applications" ? "Applications" : "Visits"}
        style={[styles.segItem, value === k && styles.segOn]}
      >
        <Text style={[styles.segText, value === k && { color: colors.white }]}>{k === "applications" ? "Applications" : "Visits"}</Text>
      </Pressable>
    ))}
  </View>
);

export const ApplicationsScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { applications, visits, cancelVisit } = useAppState();
  const [tab, setTab] = useState<"applications" | "visits">("applications");

  // Deep link from the booking confirmation: navigate("Applications", { tab: "visits" })
  useEffect(() => {
    if (route.params?.tab === "visits") setTab("visits");
  }, [route.params?.tab]);

  const confirmCancel = (v: Visit) =>
    Alert.alert("Cancel visit?", "The shelter will be told you can no longer make it.", [
      { text: "Keep visit", style: "cancel" },
      { text: "Cancel visit", style: "destructive", onPress: () => cancelVisit(v.id) },
    ]);

  const now = today();
  const upcoming = visits.filter((v) => v.date >= now).sort((a, b) => a.date.localeCompare(b.date));
  const past = visits.filter((v) => v.date < now).sort((a, b) => b.date.localeCompare(a.date));
  const visitRows: ({ header: string } | Visit)[] = [
    ...(upcoming.length ? [{ header: "Upcoming" }, ...upcoming] : []),
    ...(past.length ? [{ header: "Past" }, ...past] : []),
  ];

  const header = <Segments value={tab} onChange={setTab} />;

  if (tab === "visits") {
    return (
      <FlatList
        style={{ backgroundColor: colors.cream }}
        data={visitRows}
        keyExtractor={(r) => ("header" in r ? r.header : r.id)}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.title}>No visits yet</Text>
            <Text style={{ color: colors.slate }}>Book a visit from any pet page.</Text>
          </View>
        }
        renderItem={({ item }) => {
          if ("header" in item) return <Text style={styles.group}>{item.header}</Text>;
          const pet = pets.find((p) => p.id === item.petId);
          const canCancel = item.date >= now && item.status !== "CANCELLED";
          return (
            <View style={styles.card}>
              <Pressable onPress={() => nav.navigate("PetDetail", { id: item.petId })} accessibilityRole="button" accessibilityLabel={`View ${pet?.name ?? "pet"}`} style={styles.visitMain}>
                <Image source={{ uri: pet?.image }} style={styles.thumb} contentFit="cover" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.title}>{pet?.name ?? "Pet"}</Text>
                  <Text style={styles.meta} numberOfLines={1}>{pet?.shelter}</Text>
                  <Text style={styles.meta}>{prettyDate(item.date)} · {item.time}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: visitBadge[item.status] }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </Pressable>
              {canCancel && (
                <Pressable onPress={() => confirmCancel(item)} accessibilityRole="button" accessibilityLabel={`Cancel visit with ${pet?.name ?? "pet"}`} style={styles.cancel}>
                  <Text style={styles.cancelText}>Cancel visit</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.cream }}
      data={applications}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.title}>No applications yet</Text>
          <Text style={{ color: colors.slate }}>Apply to a pet and track the status here.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const pet = pets.find((p) => p.id === item.petId);
        return (
          <Pressable
            onPress={() => nav.navigate("PetDetail", { id: item.petId })}
            accessibilityRole="button"
            style={styles.card}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{pet?.name ?? "Pet"}</Text>
              <Text style={{ color: colors.slate }}>{pet?.shelter} · {item.date}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: badge[item.status] }]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  seg: { flexDirection: "row", backgroundColor: colors.sand, borderRadius: radius.pill, padding: 4, marginBottom: 4 },
  segItem: { flex: 1, minHeight: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: colors.primary },
  segText: { color: colors.ink, fontWeight: "700", fontSize: 14 },
  group: { color: colors.slate, fontSize: 13, fontWeight: "700", marginTop: 6 },
  card: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, padding: 16, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  visitMain: { flexDirection: "row", alignItems: "center", gap: 12, flexBasis: "100%" },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.sand },
  meta: { color: colors.slate, fontSize: 13 },
  cancel: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  cancelText: { color: colors.danger, fontWeight: "700" },
  title: { fontSize: 16, fontFamily: fonts.heading, color: colors.ink },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 60 },
});

import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, radius } from "../theme";
import { ApplicationStatus, pets } from "../data/mock";
import { useAppState } from "../state/AppState";

const badge: Record<ApplicationStatus, string> = { PENDING: colors.warning, APPROVED: colors.success, REJECTED: colors.danger };

export const ApplicationsScreen = () => {
  const nav = useNavigation<any>();
  const { applications } = useAppState();

  return (
    <FlatList
      style={{ backgroundColor: colors.cream }}
      data={applications}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
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
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  title: { fontSize: 16, fontWeight: "700", color: colors.ink },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
});

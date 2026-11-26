import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme";
import { pets } from "../data/mock";
import { useAppState } from "../state/AppState";

export const PetDetailScreen = ({ route, navigation }: any) => {
  const pet = pets.find((p) => p.id === route.params.id);
  const { favorites, toggleFavorite, apply, startConversation } = useAppState();

  if (!pet) return <Text style={{ padding: 24 }}>This pet is no longer available.</Text>;
  const fav = favorites.includes(pet.id);

  const onApply = () =>
    Alert.alert(`Apply to adopt ${pet.name}?`, "The shelter will review your application and message you.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Apply",
        onPress: () => {
          if (apply(pet.id)) navigation.navigate("Tabs", { screen: "Applications" });
          else Alert.alert("Already applied", "You have already applied for this pet.");
        },
      },
    ]);

  const onChat = () => {
    const id = startConversation(pet.id, pet.shelter);
    navigation.navigate("Chat", { id });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView>
        <Image source={{ uri: pet.image }} style={styles.image} contentFit="cover" accessibilityLabel={pet.name} />
        <View style={styles.body}>
          <View style={styles.row}>
            <Text style={styles.name}>{pet.name}</Text>
            <Pressable
              onPress={() => toggleFavorite(pet.id)}
              accessibilityRole="button"
              accessibilityLabel={fav ? "Remove from favorites" : "Save to favorites"}
              hitSlop={8}
            >
              <Ionicons name={fav ? "heart" : "heart-outline"} size={28} color={colors.accent} />
            </Pressable>
          </View>
          <Text style={styles.meta}>
            {pet.breed} · {pet.age} {pet.age === 1 ? "year" : "years"} · {pet.gender} · {pet.location}
          </Text>
          <View style={styles.shelter}>
            <Ionicons name={pet.verified ? "shield-checkmark" : "person-circle-outline"} size={20} color={pet.verified ? colors.primary : colors.slate} />
            <Text style={{ color: colors.ink, fontWeight: "600" }}>
              {pet.shelter}
              {pet.verified ? " · Verified" : ""}
            </Text>
          </View>
          <Text style={styles.h}>About</Text>
          <Text style={styles.p}>{pet.about}</Text>
          <Text style={styles.h}>Adoption requirements</Text>
          <Text style={styles.p}>{pet.requirements}</Text>
          <Pressable
            onPress={() => Alert.alert("Report listing", "Reporting connects to moderation once the backend is live.")}
            accessibilityRole="button"
          >
            <Text style={styles.report}>Report this listing</Text>
          </Pressable>
        </View>
      </ScrollView>
      <View style={styles.bar}>
        <Pressable onPress={onChat} accessibilityRole="button" style={[styles.btn, styles.btnOutline]}>
          <Text style={[styles.btnText, { color: colors.primary }]}>Chat</Text>
        </Pressable>
        <Pressable onPress={onApply} accessibilityRole="button" style={[styles.btn, { flex: 2 }]}>
          <Text style={styles.btnText}>Apply to adopt</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  image: { width: "100%", height: 300, backgroundColor: colors.primaryLight },
  body: { padding: 20, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 28, fontWeight: "800", color: colors.ink },
  meta: { color: colors.slate, fontSize: 15 },
  shelter: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8 },
  h: { fontSize: 17, fontWeight: "700", color: colors.ink, marginTop: 12 },
  p: { color: colors.slate, fontSize: 15, lineHeight: 22 },
  report: { color: colors.danger, marginTop: 24, textAlign: "center" },
  bar: { flexDirection: "row", gap: 12, padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
  btn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.pill, alignItems: "center" },
  btnOutline: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary },
  btnText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});

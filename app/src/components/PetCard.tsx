import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme";
import { Pet } from "../data/mock";
import { useAppState } from "../state/AppState";

export const PetCard = ({ pet, onPress }: { pet: Pet; onPress: () => void }) => {
  const { favorites, toggleFavorite } = useAppState();
  const fav = favorites.includes(pet.id);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`View ${pet.name}`} style={styles.card}>
      <View>
        <Image source={{ uri: pet.image }} style={styles.image} contentFit="cover" accessibilityLabel={pet.name} />
        <Pressable
          onPress={() => toggleFavorite(pet.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={fav ? "Remove from favorites" : "Save to favorites"}
          style={styles.heart}
        >
          <Ionicons name={fav ? "heart" : "heart-outline"} size={22} color={colors.accent} />
        </Pressable>
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name}>{pet.name}</Text>
          {pet.verified && <Ionicons name="shield-checkmark" size={18} color={colors.primary} accessibilityLabel="Verified shelter" />}
        </View>
        <Text style={styles.meta}>
          {pet.breed} · {pet.age} {pet.age === 1 ? "year" : "years"} · {pet.gender}
        </Text>
        <Text style={styles.meta}>
          <Ionicons name="location-outline" size={13} /> {pet.location}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: "hidden", marginBottom: 16 },
  image: { width: "100%", height: 200, backgroundColor: colors.primaryLight },
  heart: { position: "absolute", top: 12, right: 12, backgroundColor: colors.white, borderRadius: radius.pill, padding: 8 },
  body: { padding: 14, gap: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 18, fontWeight: "700", color: colors.ink },
  meta: { color: colors.slate, fontSize: 14 },
});

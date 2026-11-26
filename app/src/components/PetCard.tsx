import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow } from "../theme";
import { Pet } from "../data/mock";
import { useAppState } from "../state/AppState";

export const GenderIcon = ({ gender, size = 18 }: { gender: Pet["gender"]; size?: number }) => (
  <Ionicons
    name={gender === "Male" ? "male" : "female"}
    size={size}
    color={gender === "Male" ? colors.male : colors.female}
    accessibilityLabel={gender}
  />
);

export const ageLabel = (age: number) => `${age} ${age === 1 ? "year" : "years"}`;

//* Photo card with an overlapping white info panel (design: "Needing your affection").
export const PetCard = ({ pet, onPress, width }: { pet: Pet; onPress: () => void; width?: number }) => {
  const { favorites, toggleFavorite } = useAppState();
  const fav = favorites.includes(pet.id);
  const scale = useRef(new Animated.Value(1)).current;
  const heart = useRef(new Animated.Value(1)).current;

  const press = (to: number) => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  const onHeart = () => {
    toggleFavorite(pet.id);
    Animated.sequence([
      Animated.spring(heart, { toValue: 1.35, useNativeDriver: true, speed: 50 }),
      Animated.spring(heart, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  return (
    <Animated.View style={[{ width, transform: [{ scale }] }, styles.wrap]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => press(0.97)}
        onPressOut={() => press(1)}
        accessibilityRole="button"
        accessibilityLabel={`View ${pet.name}`}
      >
        <View style={[styles.photo, { backgroundColor: pet.tint }]}>
          <Image source={{ uri: pet.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityLabel={pet.name} />
        </View>
        <View style={[styles.info, shadow]}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {pet.name}
              </Text>
              <GenderIcon gender={pet.gender} />
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {pet.breed} • {ageLabel(pet.age)}
            </Text>
          </View>
          <Pressable
            onPress={onHeart}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={fav ? "Remove from favorites" : "Save to favorites"}
            style={styles.heart}
          >
            <Animated.View style={{ transform: [{ scale: heart }] }}>
              <Ionicons name={fav ? "heart" : "heart-outline"} size={18} color={colors.primary} />
            </Animated.View>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  photo: { height: 210, borderRadius: radius.lg, overflow: "hidden" },
  info: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: -56,
    marginHorizontal: 12,
    gap: 10,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 20, fontWeight: "800", color: colors.ink, flexShrink: 1 },
  meta: { color: colors.slate, fontSize: 13, marginTop: 2 },
  heart: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
});

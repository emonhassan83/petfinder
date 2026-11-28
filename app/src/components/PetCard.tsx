import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";
import { Text } from "./Text";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, shadow } from "../theme";
import { Pet } from "../api/types";
import { useAppState } from "../state/AppState";

export const GenderIcon = ({ gender, size = 18 }: { gender: Pet["gender"]; size?: number }) =>
  gender === "Unknown" ? null : (
    <Ionicons
      name={gender === "Male" ? "male" : "female"}
      size={size}
      color={gender === "Male" ? colors.male : colors.female}
      accessibilityLabel={gender}
    />
  );

export const ageLabel = (age: number) => (age < 1 ? "Under 1 year" : `${age} ${age === 1 ? "year" : "years"}`);

//* Photo card with an overlapping white info panel (design: "Needing your affection").
//* `index` staggers the entry animation when cards appear in a list.
export const PetCard = ({ pet, onPress, width, index = 0 }: { pet: Pet; onPress: () => void; width?: number; index?: number }) => {
  const { favorites, toggleFavorite } = useAppState();
  const fav = favorites.includes(pet.id);
  const scale = useSharedValue(1);
  const heart = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heart.value }] }));

  const onHeart = () => {
    toggleFavorite(pet.id);
    heart.value = withSequence(withSpring(1.35, { duration: 160 }), withSpring(1, { duration: 320 }));
  };

  return (
    //* Entry/exit live on the outer view; the press scale lives on the inner one so they never fight
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 110).springify().damping(16).mass(1.2)}
      exiting={FadeOut.duration(200)}
      style={[{ width }, styles.wrap]}
    >
    <Animated.View style={cardStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (scale.value = withSpring(0.97, { duration: 180 }))}
        onPressOut={() => (scale.value = withSpring(1, { duration: 260 }))}
        accessibilityRole="button"
        accessibilityLabel={`View ${pet.name}`}
      >
        <View style={[styles.photo, { backgroundColor: pet.tint }]}>
          <Image source={pet.image ? { uri: pet.image } : undefined} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityLabel={pet.name} />
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
              {[pet.breed, ageLabel(pet.age)].filter(Boolean).join(" • ")}
            </Text>
          </View>
          <Pressable
            onPress={onHeart}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={fav ? "Remove from favorites" : "Save to favorites"}
            style={styles.heart}
          >
            <Animated.View style={heartStyle}>
              <Ionicons name={fav ? "heart" : "heart-outline"} size={18} color={colors.primary} />
            </Animated.View>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
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
  name: { fontSize: 20, fontFamily: fonts.heading, color: colors.ink, flexShrink: 1 },
  meta: { color: colors.slate, fontSize: 13, marginTop: 2 },
  heart: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
});

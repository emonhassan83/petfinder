import React, { useRef, useState } from "react";
import { Alert, Animated, Pressable, Share, StyleSheet, View } from "react-native";
import { Text } from "../components/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts, needs, radius, shadow } from "../theme";
import { pets, shelters } from "../data/mock";
import { useAppState } from "../state/AppState";
import { ageLabel, GenderIcon } from "../components/PetCard";
import { VisitSheet } from "../components/VisitSheet";
import { CostSheet } from "../components/CostSheet";
import { formatBDT } from "../utils/cost";

const HERO = 340;

export const PetDetailScreen = ({ route, navigation }: any) => {
  const pet = pets.find((p) => p.id === route.params.id);
  const { favorites, toggleFavorite, apply, startConversation } = useAppState();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [visitOpen, setVisitOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  if (!pet) return <Text style={{ padding: 24 }}>This pet is no longer available.</Text>;
  const fav = favorites.includes(pet.id);
  const shelter = shelters.find((s) => s.id === pet.shelterId);
  const pronoun = pet.gender === "Female" ? "she" : "he";

  const onApply = () =>
    Alert.alert(`Adopt ${pet.name}?`, "The shelter will review your application and message you.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Apply",
        onPress: () => {
          if (apply(pet.id)) navigation.navigate("Tabs", { screen: "Applications" });
          else Alert.alert("Already applied", "You have already applied for this pet.");
        },
      },
    ]);

  const onChat = () => navigation.navigate("Chat", { id: startConversation(pet.id, pet.shelter) });

  //* Parallax: the photo moves slower than the sheet and stretches on pull-down
  const heroStyle = {
    transform: [
      { translateY: scrollY.interpolate({ inputRange: [-HERO, 0, HERO], outputRange: [-HERO / 2, 0, HERO * 0.4] }) },
      { scale: scrollY.interpolate({ inputRange: [-HERO, 0], outputRange: [2, 1], extrapolateRight: "clamp" }) },
    ],
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.hero, { backgroundColor: pet.tint }, heroStyle]}>
          <Image source={{ uri: pet.photos[photo] ?? pet.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} accessibilityLabel={pet.name} />
          <View style={styles.dots}>
            {pet.photos.map((_, i) => (
              <View key={i} style={[styles.dot, i === photo && styles.dotOn]} />
            ))}
          </View>
        </Animated.View>

        <View style={styles.sheet}>
          <View style={styles.swatches}>
            {pet.photos.map((uri, i) => (
              <Pressable
                key={uri}
                onPress={() => setPhoto(i)}
                accessibilityRole="button"
                accessibilityLabel={`Show photo ${i + 1} of ${pet.photos.length}`}
                accessibilityState={{ selected: i === photo }}
                hitSlop={{ top: 0, bottom: 0, left: 2, right: 2 }}
                style={[styles.swatch, i === photo && styles.swatchOn]}
              >
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              </Pressable>
            ))}
          </View>

          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{pet.name}</Text>
                <GenderIcon gender={pet.gender} size={24} />
              </View>
              <Text style={styles.meta}>
                {pet.breed} • {ageLabel(pet.age)} • {pet.size}
              </Text>
            </View>
            <Pressable
              onPress={() => Share.share({ message: `Meet ${pet.name}, a ${pet.breed} looking for a home on Petfinder.` })}
              accessibilityRole="button"
              accessibilityLabel="Share"
              style={styles.iconBtn}
            >
              <Ionicons name="share-social-outline" size={20} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => toggleFavorite(pet.id)}
              accessibilityRole="button"
              accessibilityLabel={fav ? "Remove from favorites" : "Save to favorites"}
              style={[styles.iconBtn, fav && { backgroundColor: colors.primaryLight }]}
            >
              <Ionicons name={fav ? "heart" : "heart-outline"} size={20} color={colors.primary} />
            </Pressable>
          </View>

          <View style={styles.colors}>
            {pet.color.map((c) => (
              <View key={c} style={styles.colorChip} accessibilityLabel={`Coat colour ${c}`}>
                <Text style={styles.colorText}>{c}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.about} numberOfLines={expanded ? undefined : 3}>
            {pet.about}
          </Text>
          <Pressable onPress={() => setExpanded((v) => !v)} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.more}>{expanded ? "SEE LESS" : "SEE MORE"}</Text>
          </Pressable>

          <Text style={styles.label}>Published by</Text>
          <View style={styles.publisher}>
            <View style={[styles.logo, { backgroundColor: shelter?.tint ?? colors.primaryLight }]}>
              <Ionicons name={shelter?.icon ?? "home"} size={20} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shelterName}>
                {pet.shelter} {pet.verified && <MaterialCommunityIcons name="check-decagram" size={14} color={colors.male} />}
              </Text>
              <Text style={styles.shelterMeta}>
                <Ionicons name="location-outline" size={12} /> {pet.distanceKm} km from you
              </Text>
            </View>
            <Pressable onPress={onChat} accessibilityRole="button" style={styles.outlineBtn}>
              <Text style={styles.outlineText}>Message</Text>
            </Pressable>
          </View>

          <Text style={[styles.section]}>All {pronoun} needs from you is</Text>
          <View style={styles.needs}>
            {needs.map((n) => (
              <View key={n.key} style={[styles.need, { backgroundColor: n.bg }]}>
                <MaterialCommunityIcons name={n.icon} size={24} color={n.fg} />
                <Text style={[styles.needText, { color: n.fg }]}>{n.key}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.label}>Adoption requirements</Text>
          <Text style={styles.about}>{pet.requirements}</Text>

          <Text style={styles.label}>Adoption fees</Text>
          <View style={styles.fees}>
            {pet.fees.map((f) => (
              <View key={f.label} style={styles.feeRow}>
                <Text style={styles.feeText}>{f.label}</Text>
                <Text style={styles.feeText}>{f.amount ? formatBDT(f.amount) : "Included"}</Text>
              </View>
            ))}
            <View style={[styles.feeRow, styles.feeTotal]}>
              <Text style={styles.feeTotalText}>Total</Text>
              <Text style={styles.feeTotalText}>{formatBDT(pet.fees.reduce((sum, f) => sum + f.amount, 0))}</Text>
            </View>
          </View>
          <Pressable onPress={() => setCostOpen(true)} accessibilityRole="button" accessibilityLabel="Estimate first-year cost" style={styles.costLink}>
            <Ionicons name="calculator-outline" size={18} color={colors.primary} />
            <Text style={styles.costLinkText}>First-year cost</Text>
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Report listing", "Reporting connects to moderation once the backend is live.")}
            accessibilityRole="button"
          >
            <Text style={styles.report}>Report this listing</Text>
          </Pressable>
        </View>
      </Animated.ScrollView>

      {/* Floating back button */}
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={[styles.back, { top: insets.top + 8 }]}
      >
        <Ionicons name="chevron-back" size={24} color={colors.white} />
      </Pressable>

      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={() => setVisitOpen(true)} accessibilityRole="button" accessibilityLabel="Book a visit" style={styles.visitBtn}>
          <Text style={styles.visitText}>Book a visit</Text>
        </Pressable>
        <Pressable onPress={onApply} accessibilityRole="button" accessibilityLabel={`Adopt ${pet.name}`} style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.98 }] }]}>
          <Text style={styles.ctaText}>Adopt {pet.name}</Text>
        </Pressable>
      </View>

      <VisitSheet pet={pet} visible={visitOpen} onClose={() => setVisitOpen(false)} onViewVisits={() => navigation.navigate("Tabs", { screen: "Applications", params: { tab: "visits" } })} />
      <CostSheet pet={pet} visible={costOpen} onClose={() => setCostOpen(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  hero: { height: HERO, overflow: "hidden" },
  dots: { position: "absolute", bottom: 40, alignSelf: "center", flexDirection: "row", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, borderWidth: 1, borderColor: colors.white },
  dotOn: { backgroundColor: colors.white },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28, padding: 24, gap: 6 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 30, fontFamily: fonts.heading, color: colors.ink },
  meta: { color: colors.slate, fontSize: 14, marginTop: 2 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.2, borderColor: "#F3D5CE", alignItems: "center", justifyContent: "center" },
  about: { color: "#5F6170", fontSize: 14, lineHeight: 22, marginTop: 14 },
  more: { color: colors.primary, fontSize: 12, fontWeight: "700", marginTop: 2 },
  label: { color: colors.slate, fontSize: 13, marginTop: 22 },
  publisher: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  logo: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  shelterName: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  shelterMeta: { color: colors.slate, fontSize: 12, marginTop: 3 },
  outlineBtn: { borderWidth: 1.2, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 10 },
  outlineText: { color: colors.primary, fontWeight: "700" },
  section: { color: colors.ink, fontSize: 18, fontFamily: fonts.heading, marginTop: 26, marginBottom: 8 },
  needs: { flexDirection: "row", gap: 10 },
  need: { flex: 1, aspectRatio: 1, borderRadius: radius.md, alignItems: "center", justifyContent: "center", gap: 6 },
  needText: { fontSize: 13, fontWeight: "600" },
  report: { color: colors.slate, marginTop: 28, textAlign: "center", textDecorationLine: "underline" },
  back: { position: "absolute", left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,.25)", alignItems: "center", justifyContent: "center" },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 12, paddingHorizontal: 24, paddingTop: 12, backgroundColor: colors.white, ...shadow },
  cta: { flex: 1, backgroundColor: colors.primary, borderRadius: radius.sm, minHeight: 56, alignItems: "center", justifyContent: "center" },
  visitBtn: { borderWidth: 1.4, borderColor: colors.primary, borderRadius: radius.sm, minHeight: 56, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  visitText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  swatches: { flexDirection: "row", gap: 10, marginBottom: 14 },
  swatch: { width: 56, height: 56, borderRadius: radius.sm, overflow: "hidden", borderWidth: 2, borderColor: "transparent", backgroundColor: colors.sand },
  swatchOn: { borderColor: colors.primary },
  colors: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  colorChip: { backgroundColor: colors.sand, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  colorText: { color: colors.ink, fontSize: 12, fontWeight: "600" },
  fees: { backgroundColor: colors.cream, borderRadius: radius.md, padding: 14, marginTop: 10, gap: 8 },
  feeRow: { flexDirection: "row", justifyContent: "space-between" },
  feeText: { color: colors.ink, fontSize: 14 },
  feeTotal: { borderTopWidth: 1, borderTopColor: colors.sand, paddingTop: 10, marginTop: 2 },
  feeTotalText: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  costLink: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, marginTop: 4 },
  costLinkText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  ctaText: { color: colors.white, fontSize: 17, fontWeight: "700" },
});

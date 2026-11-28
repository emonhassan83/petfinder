import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text, TextInput } from "../components/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts, radius, shadow } from "../theme";
import { pets, shelters, stories } from "../data/mock";
import { StoryCard } from "./StoriesScreen";
import { PetCard } from "../components/PetCard";
import { useAppState } from "../state/AppState";

const Chip = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: on }}
    style={[styles.chip, on && styles.chipOn]}
  >
    <Text style={[styles.chipText, on && { color: colors.white }]}>{label}</Text>
  </Pressable>
);

export const DiscoverScreen = () => {
  const nav = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { prefs, setPrefs } = useAppState();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [fade]);

  const activeFilters = prefs.species.length + prefs.genders.length;

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pets.filter(
      (p) =>
        (p.species === "Rabbit" || prefs.species.includes(p.species)) &&
        prefs.genders.includes(p.gender) &&
        (!q || `${p.name} ${p.breed} ${p.location}`.toLowerCase().includes(q))
    );
  }, [query, prefs]);

  const toggle = (key: "species" | "genders", v: string) => {
    const list = prefs[key];
    const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    if (next.length) setPrefs({ ...prefs, [key]: next });
  };

  const open = (id: string) => nav.navigate("PetDetail", { id });

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.hello}>Hello there,</Text>
                <Text style={styles.title}>Pets waiting for you</Text>
              </View>
              <Pressable onPress={() => nav.navigate("Profile")} accessibilityRole="button" accessibilityLabel="Profile" style={styles.avatar}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.searchRow}>
              <View style={styles.search}>
                <Ionicons name="location-outline" size={18} color={colors.ink} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={prefs.location || "Search name, breed or area"}
                  placeholderTextColor={colors.ink}
                  style={styles.searchInput}
                  returnKeyType="search"
                  accessibilityLabel="Search pets"
                />
              </View>
              <Pressable
                onPress={() => setShowFilters((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Filters"
                accessibilityState={{ expanded: showFilters }}
                style={styles.filterBtn}
              >
                <Ionicons name="options-outline" size={20} color={colors.primary} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeFilters}</Text>
                </View>
              </Pressable>
            </View>

            {showFilters && (
              <View style={styles.filters}>
                {["Dog", "Cat"].map((s) => (
                  <Chip key={s} label={s} on={prefs.species.includes(s)} onPress={() => toggle("species", s)} />
                ))}
                {["Male", "Female"].map((g) => (
                  <Chip key={g} label={g} on={prefs.genders.includes(g)} onPress={() => toggle("genders", g)} />
                ))}
                <Pressable onPress={() => nav.navigate("Onboarding")} accessibilityRole="button">
                  <Text style={styles.link}>More preferences</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Soft grey sheet */}
          <View style={styles.sheet}>
            <Text style={styles.section}>Needing your affection</Text>
            <FlatList
              horizontal
              data={data}
              keyExtractor={(p) => p.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={width * 0.66 + 16}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              ListEmptyComponent={<Text style={styles.empty}>No pets match. Try another filter.</Text>}
              renderItem={({ item }) => <PetCard pet={item} width={width * 0.66} onPress={() => open(item.id)} />}
            />

            <View style={styles.sectionRow}>
              <Text style={[styles.section, { marginBottom: 0 }]}>Happy tails</Text>
              <Pressable onPress={() => nav.navigate("Stories")} accessibilityRole="button" accessibilityLabel="See all success stories" style={styles.seeAll}>
                <Text style={styles.link}>See all</Text>
              </Pressable>
            </View>
            <FlatList
              horizontal
              data={stories}
              keyExtractor={(s) => s.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 8 }}
              renderItem={({ item }) => (
                <View style={{ width: 170 }}>
                  <StoryCard story={item} height={150} onPress={() => nav.navigate("Stories", { id: item.id })} />
                </View>
              )}
            />

            <Text style={styles.section}>Featured shelters</Text>
            <FlatList
              horizontal
              data={shelters}
              keyExtractor={(s) => s.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 8 }}
              renderItem={({ item }) => (
                <View style={[styles.shelter, shadow]}>
                  <View style={[styles.shelterLogo, { backgroundColor: item.tint }]}>
                    <Ionicons name={item.icon} size={22} color={colors.primaryDark} />
                  </View>
                  <View>
                    <Text style={styles.shelterName}>
                      {item.name} {item.verified && <MaterialCommunityIcons name="check-decagram" size={14} color={colors.male} />}
                    </Text>
                    <Text style={styles.shelterMeta}>
                      <Ionicons name="location-outline" size={12} /> {item.distanceKm} km from you
                    </Text>
                  </View>
                </View>
              )}
            />

            <Text style={styles.section}>Near you</Text>
            <View style={{ paddingHorizontal: 20, gap: 12 }}>
              {data.map((p) => (
                <PetCard key={p.id} pet={p} onPress={() => open(p.id)} />
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, backgroundColor: colors.white },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hello: { color: colors.slate, fontSize: 15 },
  title: { color: colors.ink, fontSize: 24, fontFamily: fonts.heading, marginTop: 4 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.white, ...shadow },
  searchRow: { flexDirection: "row", gap: 12, marginTop: 22 },
  search: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.2, borderColor: "#DADCE3", borderRadius: radius.sm, paddingHorizontal: 14 },
  searchInput: { flex: 1, color: colors.ink, paddingVertical: 13, fontSize: 15 },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primaryLight, borderRadius: radius.sm, paddingHorizontal: 14 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  filters: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1.2, borderColor: colors.primary },
  chipOn: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontWeight: "600" },
  link: { color: colors.primary, fontWeight: "700", marginLeft: 4 },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 8, paddingBottom: 32, minHeight: 600 },
  section: { color: colors.ink, fontSize: 19, fontFamily: fonts.heading, marginTop: 22, marginBottom: 14, paddingHorizontal: 20 },
  empty: { color: colors.slate, paddingVertical: 40 },
  sectionRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 22, marginBottom: 14, paddingRight: 20 },
  seeAll: { minHeight: 44, justifyContent: "center" },
  shelter: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.white, borderRadius: radius.md, padding: 14, paddingRight: 22 },
  shelterLogo: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  shelterName: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  shelterMeta: { color: colors.slate, fontSize: 12, marginTop: 4 },
});

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeOutUp, LinearTransition } from "react-native-reanimated";
import { Text, TextInput } from "../components/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts, radius, shadow } from "../theme";
import { fetchPets, fetchShelters, fetchStories } from "../api/api";
import { Pet } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import { ErrorView, LoadingView } from "../components/Async";
import { StoryCard } from "./StoriesScreen";
import { PetCard } from "../components/PetCard";
import { Typewriter } from "../components/Typewriter";
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

const COAT_COLORS = ["Black", "White", "Brown", "Grey", "Golden", "Cream", "Orange"];
const PAGE = 12;

//* Inline state for a horizontal row (loading / error / empty)
const RowState = ({ loading, error, empty, onRetry }: { loading: boolean; error: string | null; empty: string; onRetry: () => void }) =>
  loading ? <LoadingView /> : error ? <ErrorView message={error} onRetry={onRetry} /> : <Text style={styles.empty}>{empty}</Text>;

export const DiscoverScreen = () => {
  const nav = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { prefs, setPrefs, user } = useAppState();
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [colour, setColour] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  //* Debounce the search box so we do not hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setTerm(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const activeFilters = prefs.species.length + prefs.genders.length + (colour ? 1 : 0);

  //* Onboarding prefs -> API filters: a single species / gender is sent; both selected means "any"
  const species = prefs.species.length === 1 ? prefs.species[0] : undefined;
  const gender = prefs.genders.length === 1 ? prefs.genders[0] : undefined;
  const filterKey = [species, gender, colour, term].join("|");

  const [pets, setPets] = useState<Pet[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsError, setPetsError] = useState<string | null>(null);
  const reqId = useRef(0);

  const loadPets = useCallback(async (nextPage: number) => {
    const id = ++reqId.current;
    setPetsLoading(true);
    setPetsError(null);
    try {
      const res = await fetchPets({ species, gender, colors: colour ? [colour] : undefined, searchTerm: term || undefined, page: nextPage, limit: PAGE });
      if (id !== reqId.current) return;
      setPets((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
      setTotal(res.total);
      setPage(nextPage);
    } catch (e: any) {
      if (id === reqId.current) setPetsError(e?.message ?? "Could not load pets");
    } finally {
      if (id === reqId.current) setPetsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => { loadPets(1); }, [loadPets]);

  const sheltersState = useAsync(fetchShelters, []);
  const storiesState = useAsync(fetchStories, []);
  const shelters = sheltersState.data ?? [];
  const stories = storiesState.data ?? [];
  const featured = pets.slice(0, 6);
  const more = pets.slice(6);

  const toggle = (key: "species" | "genders", v: string) => {
    const list = prefs[key];
    const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    if (next.length) setPrefs({ ...prefs, [key]: next });
  };

  const open = (id: string) => nav.navigate("PetDetail", { id });

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <Animated.View entering={FadeIn.duration(700)} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(800)} layout={LinearTransition.springify().damping(20)} style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.hello}>{user ? `Hello, ${user.name.split(" ")[0]}` : "Hello there,"}</Text>
                <Typewriter style={styles.title} text="Pets waiting for you" delay={500} />
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
                  placeholder={prefs.location ? `Search ${prefs.location}, name or breed` : "Search name, breed or area"}
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
              <Animated.View entering={FadeInDown.duration(250)} exiting={FadeOutUp.duration(180)} style={styles.filters}>
                {["Dog", "Cat"].map((s) => (
                  <Chip key={s} label={s} on={prefs.species.includes(s)} onPress={() => toggle("species", s)} />
                ))}
                {["Male", "Female"].map((g) => (
                  <Chip key={g} label={g} on={prefs.genders.includes(g)} onPress={() => toggle("genders", g)} />
                ))}
                {COAT_COLORS.map((c) => (
                  <Chip key={c} label={c} on={colour === c} onPress={() => setColour(colour === c ? null : c)} />
                ))}
                <Pressable onPress={() => nav.navigate("Onboarding")} accessibilityRole="button">
                  <Text style={styles.link}>More preferences</Text>
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>

          {/* Soft grey sheet: slides with the header when the filter panel opens/closes */}
          <Animated.View entering={FadeInDown.delay(250).duration(850)} layout={LinearTransition.springify().damping(20)} style={styles.sheet}>
            <Text style={styles.section}>Needing your affection</Text>
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(p) => p.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={width * 0.66 + 16}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              ListEmptyComponent={<View style={{ width: width - 40 }}><RowState loading={petsLoading} error={petsError} empty="No pets match. Try another filter." onRetry={() => loadPets(1)} /></View>}
              renderItem={({ item, index }) => <PetCard pet={item} index={index} width={width * 0.66} onPress={() => open(item.id)} />}
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
              ListEmptyComponent={<View style={{ width: width - 40 }}><RowState loading={storiesState.loading} error={storiesState.error} empty="Adoption stories will appear here." onRetry={storiesState.reload} /></View>}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInRight.delay(Math.min(index, 6) * 110).springify().damping(16).mass(1.2)} style={{ width: 170 }}>
                  <StoryCard story={item} height={150} onPress={() => nav.navigate("Stories", { id: item.id })} />
                </Animated.View>
              )}
            />

            <Text style={styles.section}>Featured shelters</Text>
            <FlatList
              horizontal
              data={shelters}
              keyExtractor={(s) => s.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 8 }}
              ListEmptyComponent={<View style={{ width: width - 40 }}><RowState loading={sheltersState.loading} error={sheltersState.error} empty="No verified shelters yet." onRetry={sheltersState.reload} /></View>}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInRight.delay(Math.min(index, 6) * 110).springify().damping(16).mass(1.2)} style={[styles.shelter, shadow]}>
                  <View style={[styles.shelterLogo, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="home" size={22} color={colors.primaryDark} />
                  </View>
                  <View>
                    <Text style={styles.shelterName}>
                      {item.name} {item.verified && <MaterialCommunityIcons name="check-decagram" size={14} color={colors.male} />}
                    </Text>
                    <Text style={styles.shelterMeta}>
                      <Ionicons name="location-outline" size={12} /> {[item.location, `${item.petsCount} pets`].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                </Animated.View>
              )}
            />

            {more.length > 0 && <Text style={styles.section}>More pets</Text>}
            <View style={{ paddingHorizontal: 20, gap: 12 }}>
              {more.map((p, i) => (
                //* Stagger restarts per "Load more" page so new cards cascade in
                <PetCard key={p.id} pet={p} index={(i + featured.length) % PAGE} onPress={() => open(p.id)} />
              ))}
              {petsError && pets.length > 0 ? <ErrorView message={petsError} onRetry={() => loadPets(page)} /> : null}
              {pets.length < total && !petsLoading ? (
                <Pressable onPress={() => loadPets(page + 1)} accessibilityRole="button" style={styles.more}>
                  <Text style={styles.link}>Load more</Text>
                </Pressable>
              ) : null}
              {petsLoading && pets.length > 0 ? <LoadingView /> : null}
            </View>
          </Animated.View>
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
  more: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  sectionRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 22, marginBottom: 14, paddingRight: 20 },
  seeAll: { minHeight: 44, justifyContent: "center" },
  shelter: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.white, borderRadius: radius.md, padding: 14, paddingRight: 22 },
  shelterLogo: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  shelterName: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  shelterMeta: { color: colors.slate, fontSize: 12, marginTop: 4 },
});

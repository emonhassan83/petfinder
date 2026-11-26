import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme";
import { pets } from "../data/mock";
import { PetCard } from "../components/PetCard";

const species = ["All", "Dog", "Cat", "Rabbit"];

export const DiscoverScreen = () => {
  const nav = useNavigation<any>();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pets.filter(
      (p) =>
        (filter === "All" || p.species === filter) &&
        (!q || `${p.name} ${p.breed} ${p.location}`.toLowerCase().includes(q))
    );
  }, [query, filter]);

  return (
    <View style={styles.screen}>
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 16 }}>
            <Text style={styles.title}>Find your new best friend</Text>
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={colors.slate} />
              <TextInput
                style={styles.input}
                placeholder="Search breed, name or city"
                placeholderTextColor={colors.slate}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                accessibilityLabel="Search pets"
              />
            </View>
            <View style={styles.chips}>
              {species.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setFilter(s)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === s }}
                  style={[styles.chip, filter === s && styles.chipActive]}
                >
                  <Text style={[styles.chipText, filter === s && { color: colors.white }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No pets match your search.</Text>}
        renderItem={({ item }) => <PetCard pet={item} onPress={() => nav.navigate("PetDetail", { id: item.id })} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  list: { padding: 16 },
  title: { fontSize: 26, fontWeight: "800", color: colors.ink },
  search: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line },
  input: { flex: 1, paddingVertical: 12, color: colors.ink },
  chips: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.ink, fontWeight: "600" },
  empty: { textAlign: "center", color: colors.slate, marginTop: 40 },
});

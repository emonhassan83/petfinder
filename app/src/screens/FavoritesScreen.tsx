import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Text } from "../components/Text";
import { useNavigation } from "@react-navigation/native";
import { colors, fonts } from "../theme";
import { pets } from "../data/mock";
import { useAppState } from "../state/AppState";
import { PetCard } from "../components/PetCard";

export const FavoritesScreen = () => {
  const nav = useNavigation<any>();
  const { favorites } = useAppState();
  const data = pets.filter((p) => favorites.includes(p.id));

  return (
    <View style={styles.screen}>
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No saved pets yet</Text>
            <Text style={styles.emptyText}>Tap the heart on a pet to save it here.</Text>
          </View>
        }
        renderItem={({ item }) => <PetCard pet={item} onPress={() => nav.navigate("PetDetail", { id: item.id })} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.heading, color: colors.ink },
  emptyText: { color: colors.slate },
});

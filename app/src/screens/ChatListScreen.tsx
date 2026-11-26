import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme";
import { pets } from "../data/mock";
import { useAppState } from "../state/AppState";

export const ChatListScreen = () => {
  const nav = useNavigation<any>();
  const { conversations } = useAppState();

  return (
    <FlatList
      style={{ backgroundColor: colors.cream }}
      data={conversations}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ flexGrow: 1 }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.title}>No conversations yet</Text>
          <Text style={{ color: colors.slate }}>Open a pet and tap Chat to message the shelter.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const pet = pets.find((p) => p.id === item.petId);
        const last = item.messages[item.messages.length - 1];
        return (
          <Pressable onPress={() => nav.navigate("Chat", { id: item.id })} accessibilityRole="button" style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.with[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.with}</Text>
              <Text style={{ color: colors.slate }} numberOfLines={1}>
                {pet ? `About ${pet.name}` : ""}
                {last ? ` · ${last.text}` : ""}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.white },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.primary, fontWeight: "800", fontSize: 18 },
  title: { fontSize: 16, fontWeight: "700", color: colors.ink },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, padding: 24 },
});

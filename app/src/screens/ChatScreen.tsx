import React, { useLayoutEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "../components/Text";
import { colors, fonts, radius } from "../theme";
import { useAppState } from "../state/AppState";

export const ChatScreen = ({ route, navigation }: any) => {
  const { conversations, sendMessage } = useAppState();
  const conv = conversations.find((c) => c.id === route.params.id);
  const [draft, setDraft] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({ title: conv?.with ?? "Chat" });
  }, [navigation, conv?.with]);

  if (!conv) return <Text style={{ padding: 24 }}>Conversation not found.</Text>;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    sendMessage(conv.id, text);
    setDraft("");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <FlatList
        data={conv.messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={<Text style={{ color: colors.slate, textAlign: "center" }}>Say hello to start the conversation.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.from === "me" ? styles.mine : styles.theirs]}>
            <Text style={{ color: item.from === "me" ? colors.white : colors.ink }}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a message"
          placeholderTextColor={colors.slate}
          maxLength={1000}
          onSubmitEditing={send}
          accessibilityLabel="Message"
        />
        <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send" style={styles.send}>
          <Text style={{ color: colors.white, fontWeight: "700" }}>Send</Text>
        </Pressable>
      </View>
      <Text style={styles.note}>Preview: real-time chat connects with the backend.</Text>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  bubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.primary },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.primaryLight },
  composer: { flexDirection: "row", gap: 8, padding: 12, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
  input: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10, color: colors.ink },
  send: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 18, justifyContent: "center" },
  note: { textAlign: "center", fontSize: 11, color: colors.slate, paddingBottom: 6, backgroundColor: colors.white },
});

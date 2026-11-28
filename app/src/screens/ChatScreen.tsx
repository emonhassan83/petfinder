import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "../components/Text";
import { colors, radius } from "../theme";
import { Message } from "../api/types";
import { fetchConversation, fetchMessages, markConversationRead, sendMessage } from "../api/api";
import { getSocket } from "../api/socket";
import { useAsync } from "../hooks/useAsync";
import { useAppState } from "../state/AppState";
import { ErrorView, LoadingView } from "../components/Async";

//* Newest-first list (inverted FlatList). History comes from REST with a cursor; new messages arrive over Socket.IO.
export const ChatScreen = ({ route, navigation }: any) => {
  const id: string = route.params.id;
  const { user } = useAppState();
  const conv = useAsync(() => fetchConversation(id), [id]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: conv.data?.with ?? "Chat" });
  }, [navigation, conv.data?.with]);

  const merge = useCallback((incoming: Message[]) => {
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      return [...prev, ...fresh].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  }, []);

  const loadFirst = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMessages(id);
      setMessages(res.messages);
      setCursor(res.nextCursor);
      markConversationRead(id).catch(() => {});
    } catch (e: any) {
      setError(e?.message ?? "Could not load messages");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadFirst(); }, [loadFirst]);

  const loadOlder = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchMessages(id, cursor);
      merge(res.messages);
      setCursor(res.nextCursor);
    } catch {
      //* Keep the cursor so the next scroll retries
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = (m: any) => {
      if (m?.conversationId !== id) return;
      merge([{ id: m.id, conversationId: m.conversationId, senderId: m.senderId, body: m.body, createdAt: m.createdAt }]);
      if (m.senderId !== user?.id) markConversationRead(id).catch(() => {});
    };
    socket.on("message:new", onNew);
    return () => {
      socket.off("message:new", onNew);
    };
  }, [id, merge, user?.id]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      merge([await sendMessage(id, body)]);
      setDraft("");
    } catch (e: any) {
      Alert.alert("Message not sent", e?.message ?? "Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={loadFirst} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <FlatList
        inverted
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        onEndReached={loadOlder}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ padding: 8 }} /> : undefined}
        ListEmptyComponent={<Text style={{ color: colors.slate, textAlign: "center", transform: [{ scaleY: -1 }] }}>Say hello to start the conversation.</Text>}
        renderItem={({ item }) => {
          const mine = item.senderId === user?.id;
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={{ color: mine ? colors.white : colors.ink }}>{item.body}</Text>
            </View>
          );
        }}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a message"
          placeholderTextColor={colors.slate}
          maxLength={2000}
          onSubmitEditing={send}
          accessibilityLabel="Message"
        />
        <Pressable onPress={send} disabled={sending || !draft.trim()} accessibilityRole="button" accessibilityLabel="Send" style={[styles.send, (sending || !draft.trim()) && { opacity: 0.5 }]}>
          <Text style={{ color: colors.white, fontWeight: "700" }}>Send</Text>
        </Pressable>
      </View>
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
});

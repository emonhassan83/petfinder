import React, { useEffect } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Text } from "../components/Text";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { colors, fonts } from "../theme";
import { fetchConversations } from "../api/api";
import { getSocket } from "../api/socket";
import { useAsync } from "../hooks/useAsync";
import { useAppState } from "../state/AppState";
import { timeAgo } from "../utils/date";
import { EmptyView, ErrorView, LoadingView, SignInPrompt } from "../components/Async";

export const ChatListScreen = () => {
  const nav = useNavigation<any>();
  const focused = useIsFocused();
  const { user } = useAppState();
  const { data, loading, error, reload } = useAsync(() => (user ? fetchConversations() : Promise.resolve([])), [user?.id]);

  useEffect(() => {
    if (focused && user) reload();
  }, [focused]); // eslint-disable-line react-hooks/exhaustive-deps

  //* Live updates: any new message refreshes the list while the tab is open
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;
    socket.on("message:new", reload);
    return () => {
      socket.off("message:new", reload);
    };
  }, [user, reload]);

  if (!user) {
    return (
      <View style={styles.screen}>
        <SignInPrompt text="Sign in to message shelters and owners about their pets." onPress={() => nav.navigate("SignIn")} />
      </View>
    );
  }
  if (loading && !data) return <View style={styles.screen}><LoadingView /></View>;
  if (error && !data) return <View style={styles.screen}><ErrorView message={error} onRetry={reload} /></View>;

  return (
    <FlatList
      style={styles.screen}
      data={data ?? []}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshing={loading}
      onRefresh={reload}
      ListEmptyComponent={<EmptyView title="No conversations yet" text="Open a pet and tap Message to chat with the shelter." />}
      renderItem={({ item }) => (
        <Pressable onPress={() => nav.navigate("Chat", { id: item.id })} accessibilityRole="button" accessibilityLabel={`Open chat with ${item.with}`} style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.with[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.with}</Text>
            <Text style={{ color: colors.slate }} numberOfLines={1}>
              {item.petName ? `About ${item.petName}` : ""}
              {item.lastText ? ` · ${item.lastText}` : ""}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text style={styles.time}>{timeAgo(item.lastAt)}</Text>
            {item.unread > 0 && (
              <View style={styles.unread} accessibilityLabel={`${item.unread} unread`}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </Pressable>
      )}
    />
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.white },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.primary, fontWeight: "800", fontSize: 18 },
  title: { fontSize: 16, fontFamily: fonts.heading, color: colors.ink },
  time: { color: colors.slate, fontSize: 12 },
  unread: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  unreadText: { color: colors.white, fontSize: 11, fontWeight: "700" },
});

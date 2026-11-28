import React, { useEffect } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { Text } from "../components/Text";
import { colors, fonts, radius } from "../theme";
import { fetchNotifications } from "../api/api";
import { useAsync } from "../hooks/useAsync";
import { useAppState } from "../state/AppState";
import { timeAgo } from "../utils/date";
import { ErrorView, LoadingView } from "../components/Async";

//* TODO(push): expo-notifications is not installed. When it is, request permission, read the Expo push token and call
//* registerPushToken(token, Platform.OS === "ios" ? "IOS" : "ANDROID") (POST /notifications/push-token) after sign-in.
export const ProfileScreen = () => {
  const nav = useNavigation<any>();
  const focused = useIsFocused();
  const { user, signOut } = useAppState();
  const notes = useAsync(() => (user ? fetchNotifications() : Promise.resolve([])), [user?.id]);

  useEffect(() => {
    if (focused && user) notes.reload();
  }, [focused]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmSignOut = () =>
    Alert.alert("Sign out?", "You can sign back in at any time.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);

  if (!user) {
    return (
      <ScrollView style={{ backgroundColor: colors.cream }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to PetFinder</Text>
          <Text style={{ color: colors.slate, marginVertical: 8 }}>Sign in to save pets across devices, apply to adopt and chat with shelters.</Text>
          <Pressable accessibilityRole="button" style={styles.btn} onPress={() => nav.navigate("SignIn")}>
            <Text style={styles.btnText}>Sign in / Create account</Text>
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" onPress={() => nav.navigate("Onboarding")} style={styles.link}>
          <Text style={styles.linkText}>Pet preferences</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.cream }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.card}>
        <Text style={styles.title}>{user.name}</Text>
        <Text style={{ color: colors.slate, marginTop: 4 }}>{user.email}</Text>
        <Text style={{ color: colors.slate, fontSize: 12, marginTop: 2 }}>{user.role === "OWNER" ? "Pet owner account" : "Adopter account"}</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={() => nav.navigate("Onboarding")} style={styles.link}>
        <Text style={styles.linkText}>Pet preferences</Text>
      </Pressable>

      <Text style={styles.title}>Notifications</Text>
      {notes.loading && !notes.data ? <LoadingView /> : null}
      {notes.error && !notes.data ? <ErrorView message={notes.error} onRetry={notes.reload} /> : null}
      {notes.data && notes.data.length === 0 ? <Text style={{ color: colors.slate }}>Nothing new yet.</Text> : null}
      {(notes.data ?? []).map((n) => (
        <View key={n.id} style={[styles.card, !n.read && { borderColor: colors.primary }]}>
          <Text style={{ fontWeight: "700", color: colors.ink }}>{n.title}</Text>
          <Text style={{ color: colors.slate, marginVertical: 4 }}>{n.body}</Text>
          <Text style={{ color: colors.slate, fontSize: 12 }}>{timeAgo(n.createdAt)}</Text>
        </View>
      ))}

      <Pressable accessibilityRole="button" onPress={confirmSignOut} style={[styles.btn, styles.out]}>
        <Text style={[styles.btnText, { color: colors.danger }]}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: colors.line },
  title: { fontSize: 18, fontFamily: fonts.heading, color: colors.ink },
  btn: { backgroundColor: colors.primary, minHeight: 48, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  out: { backgroundColor: colors.white, borderWidth: 1.2, borderColor: colors.danger },
  btnText: { color: colors.white, fontWeight: "700" },
  link: { minHeight: 44, justifyContent: "center" },
  linkText: { color: colors.primary, fontWeight: "700" },
});

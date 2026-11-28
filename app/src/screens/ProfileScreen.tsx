import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../components/Text";
import { colors, fonts, radius } from "../theme";
import { notifications } from "../data/mock";

export const ProfileScreen = () => (
  <ScrollView style={{ backgroundColor: colors.cream }} contentContainerStyle={{ padding: 16, gap: 16 }}>
    <View style={styles.card}>
      <Text style={styles.title}>Welcome to PetFinder</Text>
      <Text style={{ color: colors.slate, marginVertical: 8 }}>
        Sign in to save pets across devices, apply to adopt and chat with shelters.
      </Text>
      <Pressable
        accessibilityRole="button"
        style={styles.btn}
        onPress={() => Alert.alert("Sign in", "Email and Google sign-in connect with the backend in a later phase.")}
      >
        <Text style={styles.btnText}>Sign in / Create account</Text>
      </Pressable>
    </View>

    <Text style={styles.title}>Notifications</Text>
    {notifications.map((n) => (
      <View key={n.id} style={styles.card}>
        <Text style={{ fontWeight: "700", color: colors.ink }}>{n.title}</Text>
        <Text style={{ color: colors.slate, marginVertical: 4 }}>{n.body}</Text>
        <Text style={{ color: colors.slate, fontSize: 12 }}>{n.time}</Text>
      </View>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: colors.line },
  title: { fontSize: 18, fontFamily: fonts.heading, color: colors.ink },
  btn: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: radius.pill, alignItems: "center" },
  btnText: { color: colors.white, fontWeight: "700" },
});

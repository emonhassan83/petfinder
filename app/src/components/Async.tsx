import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { colors, fonts, radius } from "../theme";

export const LoadingView = () => (
  <View style={styles.center} accessibilityLabel="Loading" accessibilityRole="progressbar">
    <ActivityIndicator color={colors.primary} />
  </View>
);

export const ErrorView = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <View style={styles.center}>
    <Text style={styles.title}>Something went wrong</Text>
    <Text style={styles.text}>{message}</Text>
    {onRetry && (
      <Pressable onPress={onRetry} accessibilityRole="button" style={styles.btn}>
        <Text style={styles.btnText}>Try again</Text>
      </Pressable>
    )}
  </View>
);

export const EmptyView = ({ title, text, action }: { title: string; text?: string; action?: { label: string; onPress: () => void } }) => (
  <View style={styles.center}>
    <Text style={styles.title}>{title}</Text>
    {text ? <Text style={styles.text}>{text}</Text> : null}
    {action && (
      <Pressable onPress={action.onPress} accessibilityRole="button" style={styles.btn}>
        <Text style={styles.btnText}>{action.label}</Text>
      </Pressable>
    )}
  </View>
);

//* Shown by Saved / Applied / Chat when signed out
export const SignInPrompt = ({ text, onPress }: { text: string; onPress: () => void }) => (
  <EmptyView title="Sign in to continue" text={text} action={{ label: "Sign in or create account", onPress }} />
);

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24, minHeight: 200 },
  title: { fontSize: 18, fontFamily: fonts.heading, color: colors.ink, textAlign: "center" },
  text: { color: colors.slate, textAlign: "center" },
  btn: { marginTop: 8, backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 20, minHeight: 44, alignItems: "center", justifyContent: "center" },
  btnText: { color: colors.white, fontWeight: "700" },
});

import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Text, TextInput } from "../components/Text";
import { Pill } from "../components/BottomSheet";
import { colors, fonts, radius } from "../theme";
import { useAppState } from "../state/AppState";

//* Sign in / create account (email + password). Registration is for adopters (USER) or pet owners (OWNER); social login is out of scope.
export const AuthScreen = () => {
  const nav = useNavigation<any>();
  const { signIn, signUp } = useAppState();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [role, setRole] = useState<"USER" | "OWNER">("USER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const register = mode === "register";
  const valid = email.trim() && password.length >= (register ? 6 : 1) && (!register || name.trim());

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setProblem(null);
    try {
      if (register) await signUp({ name: name.trim(), email, password, contactNumber: phone.trim(), address: address.trim(), role });
      else await signIn(email, password);
      nav.goBack();
    } catch (e: any) {
      setProblem(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{register ? "Create your account" : "Welcome back"}</Text>
          <Text style={styles.sub}>{register ? "Save pets, apply to adopt and message shelters." : "Sign in to save pets, apply and chat."}</Text>

          {register && (
            <>
              <View style={styles.row}>
                <Pill label="I want to adopt" on={role === "USER"} onPress={() => setRole("USER")} />
                <Pill label="I rehome pets" on={role === "OWNER"} onPress={() => setRole("OWNER")} />
              </View>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.slate} autoComplete="name" accessibilityLabel="Full name" />
            </>
          )}
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.slate} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" accessibilityLabel="Email" />
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder={register ? "Password (6+ characters)" : "Password"} placeholderTextColor={colors.slate} secureTextEntry autoCapitalize="none" autoComplete={register ? "new-password" : "current-password"} accessibilityLabel="Password" onSubmitEditing={submit} />
          {register && (
            <>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone (optional)" placeholderTextColor={colors.slate} keyboardType="phone-pad" accessibilityLabel="Phone" />
              <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address (optional)" placeholderTextColor={colors.slate} accessibilityLabel="Address" />
            </>
          )}

          {problem ? <Text style={styles.problem} accessibilityRole="alert">{problem}</Text> : null}

          <Pressable onPress={submit} disabled={!valid || busy} accessibilityRole="button" accessibilityState={{ disabled: !valid || busy }} style={[styles.cta, (!valid || busy) && { opacity: 0.5 }]}>
            <Text style={styles.ctaText}>{busy ? "Please wait..." : register ? "Create account" : "Sign in"}</Text>
          </Pressable>

          <Pressable onPress={() => { setMode(register ? "signin" : "register"); setProblem(null); }} accessibilityRole="button" style={styles.switch}>
            <Text style={styles.switchText}>{register ? "Already have an account? Sign in" : "New here? Create an account"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { padding: 24, gap: 14 },
  title: { fontSize: 28, fontFamily: fonts.heading, color: colors.ink },
  sub: { color: colors.slate, marginBottom: 6 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 14, color: colors.ink, fontSize: 15 },
  problem: { color: colors.danger, fontSize: 13 },
  cta: { backgroundColor: colors.primary, borderRadius: radius.sm, minHeight: 54, alignItems: "center", justifyContent: "center", marginTop: 6 },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  switch: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  switchText: { color: colors.primary, fontWeight: "700" },
});

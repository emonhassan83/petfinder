import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { Text, TextInput } from "../components/Text";
import { Typewriter } from "../components/Typewriter";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts, radius } from "../theme";
import { Size } from "../api/types";
import { useNavigation } from "@react-navigation/native";
import { useAppState } from "../state/AppState";

const sizes: { key: Size; range: string }[] = [
  { key: "Small", range: "15 - 33 cm" },
  { key: "Medium", range: "34 - 60 cm" },
  { key: "Large", range: "60+ cm" },
];

//* Each onboarding block rises in a beat after the previous one
const Step = ({ i, children }: { i: number; children: React.ReactNode }) => (
  <Animated.View entering={FadeInDown.delay(i * 160).springify().damping(16).mass(1.3)}>{children}</Animated.View>
);

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

const Option = ({ label, icon, selected, onPress }: { label: string; icon: React.ReactNode; selected: boolean; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: selected }}
    accessibilityLabel={label}
    style={({ pressed }) => [styles.option, selected && styles.optionOn, pressed && { transform: [{ scale: 0.97 }] }]}
  >
    {icon}
    <Text style={[styles.optionText, selected && { color: colors.primary }]}>{label}</Text>
    <View style={[styles.check, selected && styles.checkOn]}>{selected && <Ionicons name="checkmark" size={14} color={colors.white} />}</View>
  </Pressable>
);

export const OnboardingScreen = () => {
  const { prefs, savePrefs } = useAppState();
  const nav = useNavigation<any>();
  const [species, setSpecies] = useState(prefs.species);
  const [genders, setGenders] = useState(prefs.genders);
  const [size, setSize] = useState<Size>(prefs.size);
  const [location, setLocation] = useState(prefs.location);
  const sizeIndex = sizes.findIndex((s) => s.key === size);
  const canSubmit = species.length > 0 && genders.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Step i={0}>
          <Text style={styles.hello}>Welcome,</Text>
          <Typewriter style={styles.title} text="We'll help you find the perfect pet for you :)" speed={38} delay={450} />
        </Step>

        <Step i={1}>
        <View style={styles.qRow}>
          <Text style={styles.q}>Which pet do you want to adopt?</Text>
          <Text style={styles.step}>1/2</Text>
        </View>
        <View style={styles.row}>
          {(["Cat", "Dog"] as const).map((s) => (
            <Option
              key={s}
              label={s}
              selected={species.includes(s)}
              onPress={() => setSpecies((l) => toggle(l, s))}
              icon={<MaterialCommunityIcons name={s === "Cat" ? "cat" : "dog"} size={22} color={species.includes(s) ? colors.primary : colors.slate} />}
            />
          ))}
        </View>
        </Step>

        <Step i={2}>
        <View style={styles.qRow}>
          <Text style={styles.q}>Select pet's gender</Text>
          <Text style={styles.step}>2/2</Text>
        </View>
        <View style={styles.row}>
          {(["Male", "Female"] as const).map((g) => (
            <Option
              key={g}
              label={g}
              selected={genders.includes(g)}
              onPress={() => setGenders((l) => toggle(l, g))}
              icon={<Ionicons name={g === "Male" ? "male" : "female"} size={22} color={genders.includes(g) ? colors.primary : colors.slate} />}
            />
          ))}
        </View>
        </Step>

        <Step i={3}>
        <Text style={[styles.q, { marginTop: 28 }]}>Which pet size do you prefer?</Text>
        <View style={styles.track} accessibilityRole="adjustable" accessibilityValue={{ text: size }}>
          <View style={styles.rail} />
          {/* Filled rail grows/shrinks smoothly when the size changes */}
          <Animated.View layout={LinearTransition.springify().damping(18)} style={[styles.railOn, { width: `${sizeIndex * 50}%` }]} />
          {sizes.map((s, i) => (
            <Pressable
              key={s.key}
              onPress={() => setSize(s.key)}
              hitSlop={16}
              accessibilityRole="button"
              accessibilityLabel={`${s.key} size`}
              style={[styles.stop, { left: `${i * 50}%` }, i === sizeIndex && styles.knob]}
            >
              {i === sizeIndex && <Ionicons name="code" size={12} color={colors.white} />}
            </Pressable>
          ))}
        </View>
        <View style={styles.sizeLabels}>
          {sizes.map((s, i) => (
            <View key={s.key} style={{ alignItems: i === 0 ? "flex-start" : i === 2 ? "flex-end" : "center", flex: 1 }}>
              <Text style={[styles.sizeName, i === sizeIndex && { color: colors.primary }]}>{s.key}</Text>
              <Text style={styles.sizeRange}>{s.range}</Text>
            </View>
          ))}
        </View>

        </Step>

        <Step i={4}>
        <Text style={[styles.q, { marginTop: 28 }]}>Share your location to see pets near you</Text>
        <View style={styles.input}>
          <Ionicons name="location-outline" size={18} color={colors.ink} />
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Your area or city"
            placeholderTextColor={colors.slate}
            style={{ flex: 1, color: colors.ink, paddingVertical: 14 }}
            accessibilityLabel="Location"
          />
        </View>
        </Step>

        <Step i={5}>
        <Pressable
          disabled={!canSubmit}
          onPress={() => {
            savePrefs({ species, genders, size, location: location.trim() });
            if (nav.canGoBack()) nav.goBack();
          }}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, !canSubmit && { opacity: 0.5 }, pressed && { transform: [{ scale: 0.98 }] }]}
        >
          <Text style={styles.ctaText}>Find my pet</Text>
        </Pressable>
        </Step>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { padding: 24, paddingTop: 32 },
  hello: { color: colors.slate, fontSize: 15 },
  title: { color: colors.ink, fontSize: 24, fontFamily: fonts.heading, lineHeight: 34, marginTop: 6, marginBottom: 12 },
  qRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, marginBottom: 12 },
  q: { color: colors.ink, fontSize: 15, fontWeight: "500" },
  step: { color: colors.slate, fontSize: 13 },
  row: { flexDirection: "row", gap: 12 },
  option: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.2, borderColor: "#DADCE3", borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 16 },
  optionOn: { borderColor: colors.primary, backgroundColor: "#FFF8F6" },
  optionText: { flex: 1, color: colors.slate, fontSize: 15, fontWeight: "600" },
  check: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.2, borderColor: "#DADCE3", alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  track: { height: 28, marginTop: 18, marginHorizontal: 10, justifyContent: "center" },
  rail: { position: "absolute", left: 0, right: 0, height: 3, borderRadius: 2, backgroundColor: colors.primaryLight },
  railOn: { position: "absolute", left: 0, height: 3, borderRadius: 2, backgroundColor: colors.primary },
  stop: { position: "absolute", width: 12, height: 12, marginLeft: -6, borderRadius: 6, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.white },
  knob: { width: 28, height: 28, marginLeft: -14, borderRadius: 14, borderWidth: 0, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  sizeLabels: { flexDirection: "row", marginTop: 8 },
  sizeName: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  sizeRange: { color: colors.slate, fontSize: 11, marginTop: 2 },
  input: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.2, borderColor: "#DADCE3", borderRadius: radius.sm, paddingHorizontal: 14, marginTop: 12 },
  cta: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 17, alignItems: "center", marginTop: 32 },
  ctaText: { color: colors.white, fontSize: 17, fontWeight: "700" },
});

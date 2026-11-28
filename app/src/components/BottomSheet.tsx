import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { colors, fonts, radius, shadow } from "../theme";

//* Bottom sheet built on RN Modal (slide animation, tap outside to close).
export const BottomSheet = ({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grab} />
        <View style={styles.head}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
            <Ionicons name="close" size={20} color={colors.ink} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
};

//* Selectable pill used in sheets
export const Pill = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={label} style={[styles.pill, on && styles.pillOn]}>
    <Text style={[styles.pillText, on && { color: colors.white }]}>{label}</Text>
  </Pressable>
);

export const PrimaryButton = ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
  <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} style={[styles.cta, disabled && { opacity: 0.45 }]}>
    <Text style={styles.ctaText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(30,27,24,.45)" },
  sheet: { maxHeight: "85%", backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, ...shadow },
  grab: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.sand, marginBottom: 10 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 22, color: colors.ink, flex: 1 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.sand, alignItems: "center", justifyContent: "center" },
  pill: { minHeight: 44, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1.2, borderColor: colors.sand, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.ink, fontWeight: "600", fontSize: 14 },
  cta: { backgroundColor: colors.primary, borderRadius: radius.sm, minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 16 },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});

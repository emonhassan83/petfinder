import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Text } from "../components/Text";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { colors, fonts, radius } from "../theme";
import { Application, ApplicationStatus, Visit, VisitStatus } from "../api/types";
import { cancelVisit, fetchApplications, fetchVisits, withdrawApplication } from "../api/api";
import { useAsync } from "../hooks/useAsync";
import { useAppState } from "../state/AppState";
import { dateLabel, timeAgo, timeLabel } from "../utils/date";
import { EmptyView, ErrorView, LoadingView, SignInPrompt } from "../components/Async";

const badge: Record<ApplicationStatus, string> = {
  PENDING: colors.warning,
  APPROVED: colors.success,
  REJECTED: colors.danger,
  WITHDRAWN: colors.slate,
  COMPLETED: colors.success,
};
const visitBadge: Record<VisitStatus, string> = {
  REQUESTED: colors.warning,
  CONFIRMED: colors.success,
  CANCELLED: colors.danger,
  COMPLETED: colors.success,
  NO_SHOW: colors.slate,
};

const Segments = ({ value, onChange }: { value: "applications" | "visits"; onChange: (v: "applications" | "visits") => void }) => (
  <View style={styles.seg}>
    {(["applications", "visits"] as const).map((k) => (
      <Pressable
        key={k}
        onPress={() => onChange(k)}
        accessibilityRole="tab"
        accessibilityState={{ selected: value === k }}
        accessibilityLabel={k === "applications" ? "Applications" : "Visits"}
        style={[styles.segItem, value === k && styles.segOn]}
      >
        <Text style={[styles.segText, value === k && { color: colors.white }]}>{k === "applications" ? "Applications" : "Visits"}</Text>
      </Pressable>
    ))}
  </View>
);

export const ApplicationsScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const focused = useIsFocused();
  const { user } = useAppState();
  const [tab, setTab] = useState<"applications" | "visits">("applications");
  const apps = useAsync(() => (user ? fetchApplications() : Promise.resolve([] as Application[])), [user?.id]);
  const visits = useAsync(() => (user ? fetchVisits() : Promise.resolve([] as Visit[])), [user?.id]);

  // Deep link from the booking confirmation: navigate("Applications", { tab: "visits" })
  useEffect(() => {
    if (route.params?.tab === "visits") setTab("visits");
  }, [route.params?.tab]);

  //* Pull fresh statuses whenever the tab is shown
  useEffect(() => {
    if (focused && user) {
      apps.reload();
      visits.reload();
    }
  }, [focused]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = useCallback(async (fn: () => Promise<unknown>, reload: () => void, failTitle: string) => {
    try {
      await fn();
      reload();
    } catch (e: any) {
      Alert.alert(failTitle, e?.message ?? "Please try again.");
    }
  }, []);

  const confirmCancel = (v: Visit) =>
    Alert.alert("Cancel visit?", "The shelter will be told you can no longer make it.", [
      { text: "Keep visit", style: "cancel" },
      { text: "Cancel visit", style: "destructive", onPress: () => act(() => cancelVisit(v.id), visits.reload, "Could not cancel the visit") },
    ]);

  const confirmWithdraw = (a: Application) =>
    Alert.alert("Withdraw application?", `Your application for ${a.petName} will be withdrawn.`, [
      { text: "Keep it", style: "cancel" },
      { text: "Withdraw", style: "destructive", onPress: () => act(() => withdrawApplication(a.id), apps.reload, "Could not withdraw") },
    ]);

  const header = <Segments value={tab} onChange={setTab} />;
  const listStyle = { backgroundColor: colors.cream };
  const content = { padding: 16, gap: 12, flexGrow: 1 } as const;

  if (!user) {
    return (
      <View style={[{ flex: 1 }, listStyle]}>
        <SignInPrompt text="Sign in to apply to adopt, book visits and track their status." onPress={() => nav.navigate("SignIn")} />
      </View>
    );
  }

  if (tab === "visits") {
    const now = Date.now();
    const list = visits.data ?? [];
    const upcoming = list.filter((v) => new Date(v.startsAt).getTime() >= now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const past = list.filter((v) => new Date(v.startsAt).getTime() < now).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    const rows: ({ header: string } | Visit)[] = [
      ...(upcoming.length ? [{ header: "Upcoming" }, ...upcoming] : []),
      ...(past.length ? [{ header: "Past" }, ...past] : []),
    ];
    return (
      <FlatList
        style={listStyle}
        data={rows}
        keyExtractor={(r) => ("header" in r ? r.header : r.id)}
        contentContainerStyle={content}
        refreshing={visits.loading && !!visits.data}
        onRefresh={visits.reload}
        ListHeaderComponent={header}
        ListEmptyComponent={
          visits.loading ? (
            <LoadingView />
          ) : visits.error ? (
            <ErrorView message={visits.error} onRetry={visits.reload} />
          ) : (
            <EmptyView title="No visits yet" text="Book a visit from any pet page." />
          )
        }
        renderItem={({ item }) => {
          if ("header" in item) return <Text style={styles.group}>{item.header}</Text>;
          const canCancel = new Date(item.startsAt).getTime() >= now && (item.status === "REQUESTED" || item.status === "CONFIRMED");
          return (
            <View style={styles.card}>
              <Pressable onPress={() => nav.navigate("PetDetail", { id: item.petId })} accessibilityRole="button" accessibilityLabel={`View ${item.petName}`} style={styles.visitMain}>
                <Image source={item.petImage ? { uri: item.petImage } : undefined} style={styles.thumb} contentFit="cover" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.title}>{item.petName}</Text>
                  <Text style={styles.meta} numberOfLines={1}>{item.shelter}</Text>
                  <Text style={styles.meta}>{dateLabel(item.startsAt, item.timezone)} · {timeLabel(item.startsAt, item.timezone)}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: visitBadge[item.status] }]}>
                  <Text style={styles.badgeText}>{item.status.replace("_", " ")}</Text>
                </View>
              </Pressable>
              {canCancel && (
                <Pressable onPress={() => confirmCancel(item)} accessibilityRole="button" accessibilityLabel={`Cancel visit with ${item.petName}`} style={styles.cancel}>
                  <Text style={styles.cancelText}>Cancel visit</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
    );
  }

  return (
    <FlatList
      style={listStyle}
      data={apps.data ?? []}
      keyExtractor={(a) => a.id}
      contentContainerStyle={content}
      refreshing={apps.loading && !!apps.data}
      onRefresh={apps.reload}
      ListHeaderComponent={header}
      ListEmptyComponent={
        apps.loading ? (
          <LoadingView />
        ) : apps.error ? (
          <ErrorView message={apps.error} onRetry={apps.reload} />
        ) : (
          <EmptyView title="No applications yet" text="Apply to a pet and track the status here." />
        )
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Pressable onPress={() => nav.navigate("PetDetail", { id: item.petId })} accessibilityRole="button" accessibilityLabel={`View ${item.petName}`} style={styles.visitMain}>
            <Image source={item.petImage ? { uri: item.petImage } : undefined} style={styles.thumb} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.petName}</Text>
              <Text style={styles.meta}>Applied {timeAgo(item.createdAt)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: badge[item.status] }]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
          </Pressable>
          {(item.status === "PENDING" || item.status === "APPROVED") && (
            <Pressable onPress={() => confirmWithdraw(item)} accessibilityRole="button" accessibilityLabel={`Withdraw application for ${item.petName}`} style={styles.cancel}>
              <Text style={styles.cancelText}>Withdraw</Text>
            </Pressable>
          )}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  seg: { flexDirection: "row", backgroundColor: colors.sand, borderRadius: radius.pill, padding: 4, marginBottom: 4 },
  segItem: { flex: 1, minHeight: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: colors.primary },
  segText: { color: colors.ink, fontWeight: "700", fontSize: 14 },
  group: { color: colors.slate, fontSize: 13, fontWeight: "700", marginTop: 6 },
  card: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, padding: 16, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line },
  visitMain: { flexDirection: "row", alignItems: "center", gap: 12, flexBasis: "100%" },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.sand },
  meta: { color: colors.slate, fontSize: 13 },
  cancel: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  cancelText: { color: colors.danger, fontWeight: "700" },
  title: { fontSize: 16, fontFamily: fonts.heading, color: colors.ink },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: colors.white, fontWeight: "700", fontSize: 12 },
});

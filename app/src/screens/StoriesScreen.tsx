import React, { useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../components/Text";
import { colors, fonts, radius, shadow } from "../theme";
import { Story } from "../api/types";
import { fetchStories } from "../api/api";
import { useAsync } from "../hooks/useAsync";
import { EmptyView, ErrorView, LoadingView } from "../components/Async";

//* Alternating photo heights give the masonry feel
const heights = [200, 260, 230, 180];

export const StoryCard = ({ story, height, onPress }: { story: Story; height: number; onPress: () => void }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Read story: ${story.title}`} style={[styles.card, shadow]}>
    <Image source={story.image ? { uri: story.image } : undefined} style={{ height, backgroundColor: colors.sand }} contentFit="cover" />
    <View style={styles.cardBody}>
      <Text style={styles.cardTitle}>{story.title}</Text>
      <Text style={styles.cardMeta}>{[story.petName, story.city].filter(Boolean).join(" · ")}</Text>
    </View>
  </Pressable>
);

//* Two-column staggered list; tapping a card opens a story modal
export const StoriesScreen = ({ route }: any) => {
  const insets = useSafeAreaInsets();
  const dismissed = useRef(false);
  const { data, loading, error, reload } = useAsync(fetchStories, []);
  const stories = data ?? [];
  const [picked, setOpen] = useState<Story | null>(null);
  //* A story id from the Discover row opens its modal once the list has loaded
  const open = picked ?? (route?.params?.id && !dismissed.current ? stories.find((s) => s.id === route.params.id) ?? null : null);
  const cols = useMemo(() => {
    const out: { story: Story; h: number }[][] = [[], []];
    stories.forEach((story, i) => out[i % 2].push({ story, h: heights[i % heights.length] }));
    return out;
  }, [stories]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={reload} />;
  if (!stories.length) return <EmptyView title="No stories yet" text="Happy adoption stories from shelters will appear here." />;

  const closeStory = () => { dismissed.current = true; setOpen(null); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {cols.map((col, ci) => (
          <View key={ci} style={styles.col}>
            {col.map(({ story, h }) => <StoryCard key={story.id} story={story} height={h} onPress={() => setOpen(story)} />)}
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!open} animationType="slide" onRequestClose={closeStory}>
        {open && (
          <View style={{ flex: 1, backgroundColor: colors.cream }}>
            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
              <Image source={open.image ? { uri: open.image } : undefined} style={styles.hero} contentFit="cover" />
              <View style={styles.detail}>
                <Text style={styles.family}>{[open.family, open.city].filter(Boolean).join(" · ")}</Text>
                <Text style={styles.detailTitle}>{open.title}</Text>
                <Text style={styles.body}>{open.body || open.excerpt}</Text>
              </View>
            </ScrollView>
            <Pressable onPress={closeStory} accessibilityRole="button" accessibilityLabel="Close story" style={[styles.close, { top: insets.top + 8 }]}>
              <Ionicons name="close" size={22} color={colors.white} />
            </Pressable>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 12, padding: 16, alignItems: "flex-start" },
  col: { flex: 1, gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: radius.md, overflow: "hidden" },
  cardBody: { padding: 12, gap: 2 },
  cardTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink },
  cardMeta: { color: colors.slate, fontSize: 12 },
  hero: { height: 360, backgroundColor: colors.sand },
  detail: { padding: 24, gap: 12 },
  family: { color: colors.primaryDark, fontWeight: "700", fontSize: 13 },
  detailTitle: { fontFamily: fonts.heading, fontSize: 28, color: colors.ink },
  body: { color: colors.ink, fontSize: 15, lineHeight: 24 },
  close: { position: "absolute", right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(30,27,24,.45)", alignItems: "center", justifyContent: "center" },
});

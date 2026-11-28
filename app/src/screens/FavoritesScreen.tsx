import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { colors } from "../theme";
import { fetchFavorites } from "../api/api";
import { useAsync } from "../hooks/useAsync";
import { useAppState } from "../state/AppState";
import { PetCard } from "../components/PetCard";
import { EmptyView, ErrorView, LoadingView, SignInPrompt } from "../components/Async";

export const FavoritesScreen = () => {
  const nav = useNavigation<any>();
  const focused = useIsFocused();
  const { user, favorites } = useAppState();
  const { data, loading, error, reload } = useAsync(() => (user ? fetchFavorites() : Promise.resolve([])), [user?.id]);

  //* Refresh when the tab regains focus
  useEffect(() => {
    if (focused && user) reload();
  }, [focused]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <View style={styles.screen}>
        <SignInPrompt text="Sign in to save pets and see them on every device." onPress={() => nav.navigate("SignIn")} />
      </View>
    );
  }
  if (loading && !data) return <View style={styles.screen}><LoadingView /></View>;
  if (error && !data) return <View style={styles.screen}><ErrorView message={error} onRetry={reload} /></View>;

  //* Hearts toggled on this screen drop out immediately without waiting for a refetch
  const items = (data ?? []).filter((p) => favorites.includes(p.id));
  return (
    <View style={styles.screen}>
      <Animated.FlatList
        data={items}
        keyExtractor={(p) => p.id}
        //* Un-hearted cards fade out (PetCard exiting) and the rest slide up into place
        itemLayoutAnimation={LinearTransition.springify().damping(20)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshing={loading}
        onRefresh={reload}
        ListEmptyComponent={<EmptyView title="No saved pets yet" text="Tap the heart on a pet to save it here." />}
        renderItem={({ item, index }) => <PetCard pet={item} index={index} onPress={() => nav.navigate("PetDetail", { id: item.id })} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
});

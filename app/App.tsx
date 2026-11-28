import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./src/components/Text";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Fraunces_600SemiBold, Fraunces_600SemiBold_Italic } from "@expo-google-fonts/fraunces";
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { colors, fonts, shadow } from "./src/theme";
import { AppStateProvider, useAppState } from "./src/state/AppState";
import { DiscoverScreen } from "./src/screens/DiscoverScreen";
import { FavoritesScreen } from "./src/screens/FavoritesScreen";
import { ChatListScreen } from "./src/screens/ChatListScreen";
import { ApplicationsScreen } from "./src/screens/ApplicationsScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { PetDetailScreen } from "./src/screens/PetDetailScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { StoriesScreen } from "./src/screens/StoriesScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type IconName = keyof typeof Ionicons.glyphMap;
const tabs: Record<string, { label: string; on: IconName; off: IconName }> = {
  Discover: { label: "Adopt", on: "paw", off: "paw-outline" },
  Favorites: { label: "Saved", on: "heart", off: "heart-outline" },
  Applications: { label: "Applied", on: "document-text", off: "document-text-outline" },
  Chat: { label: "Chat", on: "chatbubble-ellipses", off: "chatbubble-ellipses-outline" },
  Profile: { label: "Profile", on: "person", off: "person-outline" },
};

//* Pill tab bar: the active tab shows icon + label on a soft coral pill
const PillTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const t = tabs[route.name];
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={t.label}
            onPress={() => {
              const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            style={[styles.tab, focused && styles.tabOn]}
          >
            <Ionicons name={focused ? t.on : t.off} size={20} color={focused ? colors.primary : colors.slate} />
            {focused && <Text style={styles.tabText}>{t.label}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
};

const Tabs = () => (
  <Tab.Navigator
    tabBar={(p) => <PillTabBar {...p} />}
    screenOptions={{
      headerStyle: { backgroundColor: colors.cream },
      headerShadowVisible: false,
      headerTitleStyle: { color: colors.ink, fontFamily: fonts.heading },
    }}
  >
    <Tab.Screen name="Discover" component={DiscoverScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: "Saved pets" }} />
    <Tab.Screen name="Applications" component={ApplicationsScreen} />
    <Tab.Screen name="Chat" component={ChatListScreen} options={{ title: "Messages" }} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.cream } };

const Root = () => {
  const { ready, onboarded } = useAppState();
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.cream }} />;

  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.primary, headerTitleStyle: { fontFamily: fonts.heading, color: colors.ink }, contentStyle: { backgroundColor: colors.cream }, headerShadowVisible: false, animation: "slide_from_right" }}>
      {!onboarded ? (
        <Stack.Screen name="Welcome" component={OnboardingScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="PetDetail" component={PetDetailScreen} options={{ headerShown: false, animation: "fade_from_bottom" }} />
          <Stack.Screen name="Stories" component={StoriesScreen} options={{ title: "Happy tails" }} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: "Preferences", presentation: "modal" }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Fraunces_600SemiBold, Fraunces_600SemiBold_Italic, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  //* Keep a blank cream screen until fonts are ready (also if loading fails, to avoid a stuck splash)
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="dark" />
          <Root />
        </NavigationContainer>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: colors.white, paddingTop: 10, paddingHorizontal: 12, ...shadow },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 },
  tabOn: { backgroundColor: colors.primaryLight },
  tabText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
});

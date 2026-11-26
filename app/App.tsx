import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "./src/theme";
import { AppStateProvider } from "./src/state/AppState";
import { DiscoverScreen } from "./src/screens/DiscoverScreen";
import { FavoritesScreen } from "./src/screens/FavoritesScreen";
import { ChatListScreen } from "./src/screens/ChatListScreen";
import { ApplicationsScreen } from "./src/screens/ApplicationsScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { PetDetailScreen } from "./src/screens/PetDetailScreen";
import { ChatScreen } from "./src/screens/ChatScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const icons: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Discover: ["search", "search-outline"],
  Favorites: ["heart", "heart-outline"],
  Chat: ["chatbubble", "chatbubble-outline"],
  Applications: ["document-text", "document-text-outline"],
  Profile: ["person", "person-outline"],
};

const Tabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.slate,
      headerStyle: { backgroundColor: colors.white },
      headerTitleStyle: { color: colors.ink },
      tabBarIcon: ({ focused, color, size }) => <Ionicons name={icons[route.name][focused ? 0 : 1]} size={size} color={color} />,
    })}
  >
    <Tab.Screen name="Discover" component={DiscoverScreen} />
    <Tab.Screen name="Favorites" component={FavoritesScreen} />
    <Tab.Screen name="Chat" component={ChatListScreen} options={{ title: "Messages" }} />
    <Tab.Screen name="Applications" component={ApplicationsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.cream } };

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="dark" />
          <Stack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="PetDetail" component={PetDetailScreen} options={{ title: "" }} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

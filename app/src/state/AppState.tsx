import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Size, AppUser } from "../api/types";
import * as api from "../api/api";
import { loadTokens, setSessionHandlers } from "../api/client";
import { connectSocket, disconnectSocket } from "../api/socket";
import { navigationRef } from "../navigation";

export type Prefs = { species: string[]; genders: string[]; size: Size; location: string };
const defaultPrefs: Prefs = { species: ["Dog", "Cat"], genders: ["Male", "Female"], size: "Medium", location: "" };

type State = {
  ready: boolean;
  onboarded: boolean;
  prefs: Prefs;
  savePrefs: (p: Prefs) => void;
  setPrefs: (p: Prefs) => void;
  user: AppUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: Parameters<typeof api.register>[0]) => Promise<void>;
  signOut: () => Promise<void>;
  //* Returns true when signed in; otherwise offers the sign-in screen and returns false.
  requireAuth: (reason: string) => boolean;
  favorites: string[];
  toggleFavorite: (id: string) => Promise<void>;
};

const Ctx = createContext<State | null>(null);
const PREFS_KEY = "petfinder:prefs";

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [user, setUser] = useState<AppUser | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const userRef = useRef<AppUser | null>(null);
  userRef.current = user;

  //* Loads profile + favorites after tokens exist and opens the chat socket.
  const hydrate = useCallback(async () => {
    const [profile, ids] = await Promise.all([api.fetchProfile(), api.fetchFavoriteIds().catch(() => [] as string[])]);
    setUser(profile);
    setFavorites(ids);
    connectSocket();
  }, []);

  const reset = useCallback(() => {
    disconnectSocket();
    setUser(null);
    setFavorites([]);
  }, []);

  useEffect(() => {
    setSessionHandlers({ onSessionLost: reset });
    (async () => {
      try {
        const p = await AsyncStorage.getItem(PREFS_KEY);
        if (p) {
          setPrefs({ ...defaultPrefs, ...JSON.parse(p) });
          setOnboarded(true);
        }
      } catch {}
      try {
        if (await loadTokens()) await hydrate();
      } catch {
        //* Offline or expired session: continue as a guest; the session handler clears dead tokens
      }
      setReady(true);
    })();
  }, [hydrate, reset]);

  //* Called from onboarding: remembers the answers so onboarding shows once.
  const savePrefs = useCallback((p: Prefs) => {
    setPrefs(p);
    setOnboarded(true);
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(p)).catch(() => {});
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await api.login(email.trim(), password);
    await hydrate();
  }, [hydrate]);

  const signUp = useCallback(async (input: Parameters<typeof api.register>[0]) => {
    await api.register({ ...input, email: input.email.trim() });
    await hydrate();
  }, [hydrate]);

  const signOut = useCallback(async () => {
    await api.logout();
    reset();
  }, [reset]);

  const requireAuth = useCallback((reason: string) => {
    if (userRef.current) return true;
    Alert.alert("Sign in required", `Please sign in to ${reason}.`, [
      { text: "Not now", style: "cancel" },
      { text: "Sign in", onPress: () => navigationRef.isReady() && navigationRef.navigate("SignIn") },
    ]);
    return false;
  }, []);

  //* Optimistic: flips the heart immediately and rolls back if the API call fails.
  const toggleFavorite = useCallback(async (id: string) => {
    if (!requireAuth("save pets")) return;
    const had = favorites.includes(id);
    setFavorites((prev) => (had ? prev.filter((x) => x !== id) : [...prev, id]));
    try {
      await (had ? api.removeFavorite(id) : api.addFavorite(id));
    } catch (e: any) {
      setFavorites((prev) => (had ? [...prev, id] : prev.filter((x) => x !== id)));
      Alert.alert("Could not update favorites", e?.message ?? "Please try again.");
    }
  }, [favorites, requireAuth]);

  return (
    <Ctx.Provider value={{ ready, onboarded, prefs, savePrefs, setPrefs, user, signIn, signUp, signOut, requireAuth, favorites, toggleFavorite }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAppState = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used inside AppStateProvider");
  return v;
};

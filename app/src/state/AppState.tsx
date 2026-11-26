import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Application, Size, conversations as seedConversations, initialApplications } from "../data/mock";

export type Prefs = { species: string[]; genders: string[]; size: Size; location: string };
const defaultPrefs: Prefs = { species: ["Dog", "Cat"], genders: ["Male", "Female"], size: "Medium", location: "Dhanmondi, Dhaka" };

type Conversation = (typeof seedConversations)[number];

type State = {
  ready: boolean;
  onboarded: boolean;
  prefs: Prefs;
  savePrefs: (p: Prefs) => void;
  setPrefs: (p: Prefs) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  applications: Application[];
  apply: (petId: string) => boolean;
  conversations: Conversation[];
  sendMessage: (convId: string, text: string) => void;
  startConversation: (petId: string, shelter: string) => string;
};

const Ctx = createContext<State | null>(null);
const FAV_KEY = "petfinder:favorites";
const PREFS_KEY = "petfinder:prefs";

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);

  useEffect(() => {
    AsyncStorage.multiGet([FAV_KEY, PREFS_KEY])
      .then(([[, fav], [, p]]) => {
        if (fav) setFavorites(JSON.parse(fav));
        if (p) {
          setPrefs(JSON.parse(p));
          setOnboarded(true);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  //* Called from onboarding: remembers the answers so onboarding shows once.
  const savePrefs = useCallback((p: Prefs) => {
    setPrefs(p);
    setOnboarded(true);
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(p)).catch(() => {});
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      AsyncStorage.setItem(FAV_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  //* Returns false when the user already applied (backend will enforce unique user+pet).
  const apply = (petId: string) => {
    if (applications.some((a) => a.petId === petId)) return false;
    setApplications((prev) => [{ id: `a${Date.now()}`, petId, status: "PENDING", date: "Just now" }, ...prev]);
    return true;
  };

  const sendMessage = (convId: string, text: string) =>
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, { from: "me", text }] } : c))
    );

  const startConversation = (petId: string, shelter: string) => {
    const existing = conversations.find((c) => c.petId === petId);
    if (existing) return existing.id;
    const id = `c${Date.now()}`;
    setConversations((prev) => [...prev, { id, petId, with: shelter, messages: [] }]);
    return id;
  };

  return (
    <Ctx.Provider value={{ ready, onboarded, prefs, savePrefs, setPrefs, favorites, toggleFavorite, applications, apply, conversations, sendMessage, startConversation }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAppState = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used inside AppStateProvider");
  return v;
};

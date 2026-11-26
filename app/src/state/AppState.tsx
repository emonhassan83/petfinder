import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Application, conversations as seedConversations, initialApplications } from "../data/mock";

type Conversation = (typeof seedConversations)[number];

type State = {
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

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);

  useEffect(() => {
    AsyncStorage.getItem(FAV_KEY)
      .then((v) => v && setFavorites(JSON.parse(v)))
      .catch(() => {});
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
    <Ctx.Provider value={{ favorites, toggleFavorite, applications, apply, conversations, sendMessage, startConversation }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAppState = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used inside AppStateProvider");
  return v;
};

"use client";

import { useCallback, useEffect, useState } from "react";

//* Mock-backed until the favorites API exists (Phase 3). Stored per browser.
export type FavoritePet = {
  id: string;
  name: string;
  image: string;
  breed: string;
  age: number;
  location: string;
};

const KEY = "petfinder:favorites";
const EVENT = "petfinder:favorites";

const read = (): FavoritePet[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoritePet[]>([]);

  useEffect(() => {
    setFavorites(read());
    const sync = () => setFavorites(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const toggle = useCallback((pet: FavoritePet) => {
    const current = read();
    const next = current.some((p) => p.id === pet.id)
      ? current.filter((p) => p.id !== pet.id)
      : [...current, pet];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const isFavorite = (id: string) => favorites.some((p) => p.id === id);

  return { favorites, toggle, isFavorite };
};

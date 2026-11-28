"use client";

import { useCallback, useEffect, useState } from "react";

//* Mock-backed until the visits API exists (Phase 3f, v1.1). Stored per browser, like useFavorites.
export type VisitStatus = "REQUESTED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type Visit = {
  id: string;
  petId: string;
  petName: string;
  petImage: string;
  shelterName: string;
  startsAt: string; // ISO
  note?: string;
  status: VisitStatus;
};

const KEY = "petfinder:visits";
const EVENT = "petfinder:visits";

const read = (): Visit[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const write = (list: Visit[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage blocked: keep in memory only */
  }
  window.dispatchEvent(new Event(EVENT));
};

export const useVisits = () => {
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    setVisits(read());
    const sync = () => setVisits(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  //* Mirrors the planned server guard: one active visit per user per pet
  const book = useCallback((v: Omit<Visit, "id" | "status">) => {
    const list = read();
    if (list.some((x) => x.petId === v.petId && (x.status === "REQUESTED" || x.status === "CONFIRMED"))) return false;
    write([...list, { ...v, id: `v-${Date.now()}`, status: "REQUESTED" }]);
    return true;
  }, []);

  const cancel = useCallback((id: string) => write(read().map((x) => (x.id === id ? { ...x, status: "CANCELLED" } : x))), []);

  const activeFor = useCallback((petId: string) => visits.find((x) => x.petId === petId && (x.status === "REQUESTED" || x.status === "CONFIRMED")), [visits]);

  return { visits, book, cancel, activeFor };
};

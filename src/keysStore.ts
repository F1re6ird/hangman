import { create } from "zustand";

interface Key {
  id: string;
  letter: string;
  isPressed: boolean;
}

interface KeysStore {
  keys: Key[];
  pressKey: (id: string) => void;
  resetKeys: () => void;
}

// Utility to generate fresh default keys
const generateDefaultKeys = (): Key[] =>
  'abcdefghijklmnopqrstuvwxyz'.split('').map(letter => ({
    id: letter,
    letter,
    isPressed: false,
  }));

export const useKeysStore = create<KeysStore>((set) => ({
  keys: generateDefaultKeys(),
  pressKey: (id: string) =>
    set((state) => ({
      keys: state.keys.map((key) =>
        key.id === id ? { ...key, isPressed: true } : key
      ),
    })),
  resetKeys: () =>
    set(() => ({
      keys: generateDefaultKeys(),
    })),
}));

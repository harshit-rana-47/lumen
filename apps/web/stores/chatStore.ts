import { create } from "zustand";

export type ChatMode = "friend" | "coach" | "therapist" | "mentor" | "devils_advocate" | "future_self";

type ChatState = {
  activeMode: ChatMode;
  setActiveMode: (mode: ChatMode) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  activeMode: "friend",
  setActiveMode: (mode) => set({ activeMode: mode })
}));

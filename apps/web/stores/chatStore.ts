import { create } from "zustand";

export type ChatMode =
  | "general"
  | "reflection"
  | "friend"
  | "coach"
  | "therapist"
  | "mentor"
  | "devils_advocate"
  | "hypothetical"
  | "future_self";

type ChatState = {
  activeMode: ChatMode;
  setActiveMode: (mode: ChatMode) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  activeMode: "general",
  setActiveMode: (mode) => set({ activeMode: mode })
}));

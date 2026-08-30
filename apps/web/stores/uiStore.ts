import { create } from "zustand";

type UiState = {
  sidebarOpen: boolean;
};

export const useUiStore = create<UiState>(() => ({
  sidebarOpen: false
}));

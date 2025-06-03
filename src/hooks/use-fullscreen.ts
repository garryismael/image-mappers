import { type FullscreenContextType } from "@/context/fullscreen_context";
import { createContext, useContext } from "react";

export const FullscreenContext = createContext<
  FullscreenContextType | undefined
>(undefined);

export const useFullscreen = (): FullscreenContextType => {
  const context = useContext(FullscreenContext);
  if (!context)
    throw new Error("useFullscreen must be used within a FullscreenProvider");
  return context;
};

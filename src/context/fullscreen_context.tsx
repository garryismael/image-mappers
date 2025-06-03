import { FullscreenContext } from "@/hooks/use-fullscreen";
import React, { useCallback, useEffect, useState } from "react";

export type FullscreenContextType = {
  active: boolean;
  isSupported: boolean;
  handle: () => void;
  exit: () => void;
  toggle: () => void;
};

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void>;
  msExitFullscreen?: () => void;
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => void;
};

export const FullscreenProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [active, setActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const handle = useCallback(() => {
    const elem = document.documentElement as FullscreenElement;

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }, []);

  const exit = useCallback(() => {
    const doc = document as FullscreenDocument;

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
    }
  }, []);

  const toggle = useCallback(() => {
    if (active) {
      exit();
    } else {
      handle();
    }
  }, [active, handle, exit]);

  useEffect(() => {
    const doc = document as FullscreenDocument;
    const elem = document.documentElement as FullscreenElement;

    const onChange = () => {
      setActive(
        !!(
          document.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.msFullscreenElement
        )
      );
    };

    const supported =
      !!elem.requestFullscreen ||
      !!elem.webkitRequestFullscreen ||
      !!elem.msRequestFullscreen;

    setIsSupported(supported);

    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    document.addEventListener("MSFullscreenChange", onChange);

    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
      document.removeEventListener("MSFullscreenChange", onChange);
    };
  }, []);

  return (
    <FullscreenContext.Provider
      value={{ active, isSupported, handle, exit, toggle }}>
      {children}
    </FullscreenContext.Provider>
  );
};

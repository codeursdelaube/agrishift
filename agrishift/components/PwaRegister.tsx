"use client";

import { useEffect } from "react";

/** Active le mode hors ligne, seulement en production pour ne pas gêner le développement. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

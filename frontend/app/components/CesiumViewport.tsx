"use client";

import { MutableRefObject } from "react";

interface CesiumViewportProps {
  cesiumContainerRef: MutableRefObject<HTMLDivElement | null>;
}

export function CesiumViewport({ cesiumContainerRef }: CesiumViewportProps) {
  return (
    <main className="fixed inset-0 z-10" style={{ background: "#050505" }}>
      <div ref={cesiumContainerRef} className="w-full h-full relative" />
    </main>
  );
}

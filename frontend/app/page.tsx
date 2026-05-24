"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CENTER_LAT, CENTER_LON } from "./data/nodes";
import { RECON_SCENARIOS, ReconScenario, ScenarioId } from "./data/reconScenarios";
import { useCesiumViewer } from "./hooks/useCesiumViewer";
import { Header } from "./components/Header";
import { CesiumViewport } from "./components/CesiumViewport";
import { ReconLauncher } from "./components/ReconLauncher";
import { DroneReconView } from "./components/DroneReconView";

export default function SkyMarshalDashboard() {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const [activeReconId, setActiveReconId] = useState<ScenarioId | null>(null);
  const [clockTime, setClockTime] = useState<string>("");

  const { focusOnScenario, clearFocus } = useCesiumViewer({
    containerRef: cesiumContainerRef,
    centerLat: CENTER_LAT,
    centerLon: CENTER_LON
  });

  useEffect(() => {
    setClockTime(new Date().toTimeString().split(" ")[0]);
    const timer = setInterval(() => {
      setClockTime(new Date().toTimeString().split(" ")[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeScenario = activeReconId
    ? RECON_SCENARIOS.find((s) => s.id === activeReconId) ?? null
    : null;

  const handleMapFocus = useCallback(
    (scenario: ReconScenario) => {
      focusOnScenario(scenario);
    },
    [focusOnScenario]
  );

  const handleClose = useCallback(() => {
    setActiveReconId(null);
    clearFocus();
  }, [clearFocus]);

  return (
    <div className="flex flex-col flex-1 h-screen relative select-none">
      <Header clockTime={clockTime} />

      <CesiumViewport cesiumContainerRef={cesiumContainerRef} />

      {!activeScenario && (
        <ReconLauncher
          scenarios={RECON_SCENARIOS}
          onLaunch={(id) => setActiveReconId(id)}
        />
      )}

      {activeScenario && (
        <DroneReconView
          scenario={activeScenario}
          onMapFocus={handleMapFocus}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

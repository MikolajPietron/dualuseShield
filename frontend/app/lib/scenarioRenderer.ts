import { MapUnit, ReconScenario } from "../data/reconScenarios";

// Stalowa Wola sits at ~50.57° latitude. Meters → degrees at this latitude:
const LAT_DEG_PER_M = 1 / 111130;
const LON_DEG_PER_M = 1 / (111320 * Math.cos((50.57 * Math.PI) / 180));

function pathPositionAt(path: [number, number][], progress: number): [number, number] {
  const segs = path.length - 1;
  if (segs < 1) return path[0];
  const clamped = Math.max(0, Math.min(0.99999, progress));
  const total = clamped * segs;
  const idx = Math.min(Math.floor(total), segs - 1);
  const local = total - idx;
  const a = path[idx];
  const b = path[idx + 1];
  return [a[0] + (b[0] - a[0]) * local, a[1] + (b[1] - a[1]) * local];
}

function pathHeadingAt(path: [number, number][], progress: number): number {
  const segs = path.length - 1;
  if (segs < 1) return 0;
  const clamped = Math.max(0, Math.min(0.99999, progress));
  const total = clamped * segs;
  const idx = Math.min(Math.floor(total), segs - 1);
  const a = path[idx];
  const b = path[idx + 1];
  const dE = (b[0] - a[0]) / LON_DEG_PER_M;
  const dN = (b[1] - a[1]) / LAT_DEG_PER_M;
  return Math.atan2(dE, dN); // 0 = north
}

function getProgress(start: number, loopMs: number): number {
  return ((Date.now() - start) % loopMs) / loopMs;
}

/**
 * Render all mapUnits of a scenario as Cesium entities.
 * Returns a cleanup function that removes them.
 */
export function renderScenarioMap(
  viewer: any,
  Cesium: any,
  scenario: ReconScenario
): () => void {
  const entities: any[] = [];
  const startTime = Date.now();

  const baseLabel = (text?: string) =>
    text
      ? {
          text,
          font: "bold 26px Share Tech Mono, monospace",
          fillColor: Cesium.Color.BLACK,
          style: Cesium.LabelStyle.FILL,
          showBackground: false,
          scale: 0.34,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      : undefined;

  function pointAt(lon: number, lat: number, hex: string, size = 14) {
    return viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      point: {
        pixelSize: size,
        color: Cesium.Color.fromCssColorString(hex),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2.5,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  }

  function addMovingVehicle(unit: MapUnit, hex: string, options: { isWanted?: boolean; fov?: boolean } = {}) {
    if (!unit.path || !unit.loopSeconds) return;
    const path = unit.path;
    const loopMs = unit.loopSeconds * 1000;

    // Vehicle position (animated)
    const posCB = new Cesium.CallbackProperty(() => {
      const [lon, lat] = pathPositionAt(path, getProgress(startTime, loopMs));
      return Cesium.Cartesian3.fromDegrees(lon, lat);
    }, false);

    const vehicleEntity = viewer.entities.add({
      position: posCB,
      point: {
        pixelSize: options.isWanted ? 18 : 14,
        color: Cesium.Color.fromCssColorString(hex),
        outlineColor: options.isWanted ? Cesium.Color.fromCssColorString("#fde047") : Cesium.Color.WHITE,
        outlineWidth: options.isWanted ? 3 : 2.5,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: baseLabel(unit.label)
    });
    entities.push(vehicleEntity);

    // Wanted-target reticle (pulsing ring around fleeing vehicle)
    if (options.isWanted) {
      const reticleRadius = new Cesium.CallbackProperty(() => {
        const t = ((Date.now() - startTime) % 1400) / 1400;
        return 40 + 25 * Math.sin(t * Math.PI * 2);
      }, false);

      const reticlePosCB = new Cesium.CallbackProperty(() => {
        const [lon, lat] = pathPositionAt(path, getProgress(startTime, loopMs));
        return Cesium.Cartesian3.fromDegrees(lon, lat);
      }, false);

      const reticle = viewer.entities.add({
        position: reticlePosCB,
        ellipse: {
          semiMajorAxis: reticleRadius,
          semiMinorAxis: reticleRadius,
          material: Cesium.Color.fromCssColorString("#ef4444").withAlpha(0.18),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString("#ef4444"),
          outlineWidth: 3,
          height: 0
        }
      });
      entities.push(reticle);
    }

    // FOV cone in front of vehicle (rotates with heading)
    if (options.fov) {
      const FOV_LEN_M = 140;
      const FOV_WIDTH_M = 90;
      const fovHierarchy = new Cesium.CallbackProperty(() => {
        const progress = getProgress(startTime, loopMs);
        const [lon, lat] = pathPositionAt(path, progress);
        const heading = pathHeadingAt(path, progress);
        const cosH = Math.cos(heading);
        const sinH = Math.sin(heading);

        // Apex (vehicle), then two forward corners
        const apexLon = lon;
        const apexLat = lat;

        const forwardELon = lon + sinH * FOV_LEN_M * LON_DEG_PER_M;
        const forwardELat = lat + cosH * FOV_LEN_M * LAT_DEG_PER_M;

        const leftELon = forwardELon - cosH * (FOV_WIDTH_M / 2) * LON_DEG_PER_M;
        const leftELat = forwardELat + sinH * (FOV_WIDTH_M / 2) * LAT_DEG_PER_M;

        const rightELon = forwardELon + cosH * (FOV_WIDTH_M / 2) * LON_DEG_PER_M;
        const rightELat = forwardELat - sinH * (FOV_WIDTH_M / 2) * LAT_DEG_PER_M;

        return new Cesium.PolygonHierarchy(
          Cesium.Cartesian3.fromDegreesArray([
            apexLon, apexLat,
            leftELon, leftELat,
            rightELon, rightELat
          ])
        );
      }, false);

      const fov = viewer.entities.add({
        polygon: {
          hierarchy: fovHierarchy,
          material: Cesium.Color.fromCssColorString(hex).withAlpha(0.25),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(hex).withAlpha(0.85),
          outlineWidth: 2,
          height: 0
        }
      });
      entities.push(fov);
    }
  }

  function addStaticVehicle(unit: MapUnit, hex: string, options: { fov?: boolean; fovHeading?: number } = {}) {
    if (!unit.staticPos) return;
    const [lon, lat] = unit.staticPos;

    const e = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      point: {
        pixelSize: 14,
        color: Cesium.Color.fromCssColorString(hex),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2.5,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: baseLabel(unit.label)
    });
    entities.push(e);

    if (options.fov) {
      const heading = options.fovHeading ?? 0;
      const FOV_LEN_M = 160;
      const FOV_WIDTH_M = 110;
      const cosH = Math.cos(heading);
      const sinH = Math.sin(heading);

      const forwardELon = lon + sinH * FOV_LEN_M * LON_DEG_PER_M;
      const forwardELat = lat + cosH * FOV_LEN_M * LAT_DEG_PER_M;
      const leftELon = forwardELon - cosH * (FOV_WIDTH_M / 2) * LON_DEG_PER_M;
      const leftELat = forwardELat + sinH * (FOV_WIDTH_M / 2) * LAT_DEG_PER_M;
      const rightELon = forwardELon + cosH * (FOV_WIDTH_M / 2) * LON_DEG_PER_M;
      const rightELat = forwardELat - sinH * (FOV_WIDTH_M / 2) * LAT_DEG_PER_M;

      const fov = viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(
            Cesium.Cartesian3.fromDegreesArray([
              lon, lat,
              leftELon, leftELat,
              rightELon, rightELat
            ])
          ),
          material: Cesium.Color.fromCssColorString(hex).withAlpha(0.25),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(hex).withAlpha(0.85),
          outlineWidth: 2,
          height: 0
        }
      });
      entities.push(fov);
    }
  }

  function addZone(unit: MapUnit, hex: string, pulse: boolean, alpha = 0.22) {
    if (!unit.staticPos) return;
    const [lon, lat] = unit.staticPos;
    const baseR = unit.radiusM || 100;

    const semiAxis = pulse
      ? new Cesium.CallbackProperty(() => {
          const t = ((Date.now() - startTime) % 1600) / 1600;
          return baseR + 35 * Math.sin(t * Math.PI * 2);
        }, false)
      : baseR;

    const zone = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      ellipse: {
        semiMajorAxis: semiAxis,
        semiMinorAxis: semiAxis,
        material: Cesium.Color.fromCssColorString(hex).withAlpha(alpha),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString(hex).withAlpha(0.9),
        outlineWidth: 2,
        height: 0
      },
      label: unit.label ? baseLabel(unit.label) : undefined
    });
    entities.push(zone);
  }

  function addDroneTracker(unit: MapUnit) {
    // Vertical glowing beacon from ground to 400m altitude, optionally tracking a moving path.
    let posCB: any;
    let groundPosCB: any;

    if (unit.path && unit.loopSeconds) {
      const path = unit.path;
      const loopMs = unit.loopSeconds * 1000;
      groundPosCB = new Cesium.CallbackProperty(() => {
        const [lon, lat] = pathPositionAt(path, getProgress(startTime, loopMs));
        return Cesium.Cartesian3.fromDegrees(lon, lat, 0);
      }, false);
      posCB = new Cesium.CallbackProperty(() => {
        const [lon, lat] = pathPositionAt(path, getProgress(startTime, loopMs));
        return Cesium.Cartesian3.fromDegrees(lon, lat, 400);
      }, false);
    } else if (unit.staticPos) {
      const [lon, lat] = unit.staticPos;
      groundPosCB = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
      posCB = Cesium.Cartesian3.fromDegrees(lon, lat, 400);
    } else {
      return;
    }

    // Beacon line
    const beaconPositionsCB = new Cesium.CallbackProperty(() => {
      let groundPos: any, skyPos: any;
      if (unit.path && unit.loopSeconds) {
        const [lon, lat] = pathPositionAt(unit.path, getProgress(startTime, unit.loopSeconds * 1000));
        groundPos = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
        skyPos = Cesium.Cartesian3.fromDegrees(lon, lat, 400);
      } else if (unit.staticPos) {
        const [lon, lat] = unit.staticPos;
        groundPos = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
        skyPos = Cesium.Cartesian3.fromDegrees(lon, lat, 400);
      }
      return [groundPos, skyPos];
    }, false);

    const beacon = viewer.entities.add({
      polyline: {
        positions: beaconPositionsCB,
        width: 3,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.4,
          color: Cesium.Color.fromCssColorString("#06b6d4").withAlpha(0.9)
        })
      }
    });
    entities.push(beacon);

    // Drone marker at top
    const drone = viewer.entities.add({
      position: posCB,
      point: {
        pixelSize: 16,
        color: Cesium.Color.fromCssColorString("#06b6d4"),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: unit.label
        ? {
            text: `✈ ${unit.label}`,
            font: "bold 24px Share Tech Mono, monospace",
            fillColor: Cesium.Color.BLACK,
            style: Cesium.LabelStyle.FILL,
            showBackground: false,
            scale: 0.32,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -10),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        : undefined
    });
    entities.push(drone);

    // Ground marker (small)
    const ground = viewer.entities.add({
      position: groundPosCB,
      point: {
        pixelSize: 6,
        color: Cesium.Color.fromCssColorString("#06b6d4").withAlpha(0.7),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    entities.push(ground);
  }

  function addBlockade(unit: MapUnit) {
    if (!unit.staticPos) return;
    const [lon, lat] = unit.staticPos;

    // X marker via two crossing polylines
    const SIZE = 50;
    const halfW = (SIZE * LON_DEG_PER_M) / 2;
    const halfH = (SIZE * LAT_DEG_PER_M) / 2;

    const line1 = viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          lon - halfW, lat - halfH,
          lon + halfW, lat + halfH
        ]),
        width: 5,
        material: Cesium.Color.fromCssColorString("#f59e0b"),
        clampToGround: true
      }
    });
    const line2 = viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          lon - halfW, lat + halfH,
          lon + halfW, lat - halfH
        ]),
        width: 5,
        material: Cesium.Color.fromCssColorString("#f59e0b"),
        clampToGround: true
      }
    });
    const dot = pointAt(lon, lat, "#f59e0b", 10);
    const labelEntity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      label: {
        text: `⚠ ${unit.label || "BLOKADA"}`,
        font: "bold 24px Share Tech Mono, monospace",
        fillColor: Cesium.Color.BLACK,
        style: Cesium.LabelStyle.FILL,
        showBackground: false,
        scale: 0.34,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        pixelOffset: new Cesium.Cartesian2(0, 14),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    entities.push(line1, line2, dot, labelEntity);
  }

  function addEvacPoint(unit: MapUnit) {
    if (!unit.staticPos) return;
    const [lon, lat] = unit.staticPos;
    const ring = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      ellipse: {
        semiMajorAxis: 60,
        semiMinorAxis: 60,
        material: Cesium.Color.fromCssColorString("#10b981").withAlpha(0.22),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#10b981"),
        outlineWidth: 2.5,
        height: 0
      },
      label: {
        text: `⛨ ${unit.label || "PUNKT ZBORNY"}`,
        font: "bold 26px Share Tech Mono, monospace",
        fillColor: Cesium.Color.BLACK,
        style: Cesium.LabelStyle.FILL,
        showBackground: false,
        scale: 0.34,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        pixelOffset: new Cesium.Cartesian2(0, 16),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    const dot = pointAt(lon, lat, "#10b981", 12);
    entities.push(ring, dot);
  }

  function addEvacRoute(unit: MapUnit) {
    if (!unit.path || unit.path.length < 2) return;
    const positions = unit.path.flatMap((p) => [p[0], p[1]]);
    const line = viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(positions),
        width: 5,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString("#10b981"),
          dashLength: 12
        }),
        clampToGround: true
      }
    });
    entities.push(line);
  }

  function addScanPath(unit: MapUnit) {
    if (!unit.path || unit.path.length < 2) return;
    const positions = unit.path.flatMap((p) => [p[0], p[1]]);
    const line = viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(positions),
        width: 2,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString("#06b6d4").withAlpha(0.6),
          dashLength: 10
        }),
        clampToGround: true
      }
    });
    entities.push(line);
  }

  function addWaypoint(unit: MapUnit) {
    if (!unit.staticPos) return;
    const [lon, lat] = unit.staticPos;
    const dot = pointAt(lon, lat, "#06b6d4", 10);
    const labelEntity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      label: {
        text: unit.label || "",
        font: "bold 22px JetBrains Mono, monospace",
        fillColor: Cesium.Color.BLACK,
        style: Cesium.LabelStyle.FILL,
        showBackground: false,
        scale: 0.3,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        pixelOffset: new Cesium.Cartesian2(0, 10),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    entities.push(dot, labelEntity);
  }

  // Iterate units
  for (const unit of scenario.mapUnits) {
    switch (unit.kind) {
      case "police-car":
        if (unit.path) addMovingVehicle(unit, "#1d4ed8", { fov: unit.fov });
        else addStaticVehicle(unit, "#1d4ed8", { fov: unit.fov, fovHeading: 0 });
        break;
      case "fire-truck":
        addMovingVehicle(unit, "#dc2626");
        break;
      case "fleeing-vehicle":
        addMovingVehicle(unit, "#ef4444", { isWanted: true });
        break;
      case "fire-zone":
        addZone(unit, "#ef4444", true, 0.3);
        break;
      case "smoke-zone":
        addZone(unit, "#f59e0b", true, 0.15);
        break;
      case "blockade":
        addBlockade(unit);
        break;
      case "evac-point":
        addEvacPoint(unit);
        break;
      case "evac-route":
        addEvacRoute(unit);
        break;
      case "thermal-hot":
        addZone(unit, "#ef4444", true, 0.32);
        break;
      case "thermal-cool":
        addZone(unit, "#06b6d4", false, 0.25);
        break;
      case "drone-tracker":
        addDroneTracker(unit);
        break;
      case "scan-path":
        addScanPath(unit);
        break;
      case "waypoint":
        addWaypoint(unit);
        break;
    }
  }

  return () => {
    entities.forEach((e) => {
      try {
        viewer.entities.remove(e);
      } catch {
        /* viewer destroyed */
      }
    });
  };
}

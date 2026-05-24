import { useEffect, useRef, useState, useCallback, MutableRefObject } from "react";
import { INITIAL_NODES, NODE_COLORS } from "../data/nodes";
import { SAN_RIVER_COORDS } from "../data/river";
import { renderScenarioMap } from "../lib/scenarioRenderer";
import { ReconScenario } from "../data/reconScenarios";

interface UseCesiumViewerOptions {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  centerLat: number;
  centerLon: number;
}

const HIGHLIGHT_HEX: Record<string, string> = {
  red: "#ef4444",
  amber: "#f59e0b",
  cyan: "#06b6d4"
};

/**
 * Slim Cesium hook for Sky Marshal.
 * Renders the 3D map of Stalowa Wola with:
 *   - CartoDB Voyager basemap (light theme)
 *   - 7 critical infrastructure POIs (hex tower + beacon + label)
 *   - River San polyline
 *   - Tactical operational zone outline
 *
 * No simulation, no weapons, no incidents — the map is a passive
 * geographic backdrop for the 4-button ReconLauncher overlay.
 */
export function useCesiumViewer({
  containerRef,
  centerLat,
  centerLon
}: UseCesiumViewerOptions) {
  const viewerRef = useRef<any>(null);
  const highlightEntitiesRef = useRef<any[]>([]);
  const scenarioCleanupRef = useRef<(() => void) | null>(null);
  const [isCesiumLoaded, setIsCesiumLoaded] = useState(false);

  const flyToNode = useCallback((lat: number, lon: number) => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (viewer && Cesium) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat - 0.012, 1000),
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-35.0),
          roll: 0.0
        }
      });
    }
  }, []);

  const focusOnScenario = useCallback((scenario: ReconScenario) => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium) return;

    const node = INITIAL_NODES.find((n) => n.id === scenario.targetNodeId);
    if (!node) return;

    // Cleanup any previous scenario + highlight
    if (scenarioCleanupRef.current) {
      scenarioCleanupRef.current();
      scenarioCleanupRef.current = null;
    }
    highlightEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    highlightEntitiesRef.current = [];

    const hex = HIGHLIGHT_HEX[scenario.mapHighlightColor] || HIGHLIGHT_HEX.cyan;
    const cesiumColor = Cesium.Color.fromCssColorString(hex);

    // Pulsing main-target ring
    const startTime = Date.now();
    const pulseRadius = new Cesium.CallbackProperty(() => {
      const t = ((Date.now() - startTime) % 2200) / 2200;
      return 180 + 50 * Math.sin(t * Math.PI * 2);
    }, false);

    const ring = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat),
      ellipse: {
        semiMajorAxis: pulseRadius,
        semiMinorAxis: pulseRadius,
        material: cesiumColor.withAlpha(0.14),
        outline: true,
        outlineColor: cesiumColor.withAlpha(0.85),
        outlineWidth: 3,
        height: 0
      }
    });
    highlightEntitiesRef.current.push(ring);

    // Render scenario-specific map units (vehicles, fires, blockades, FOV cones, etc.)
    scenarioCleanupRef.current = renderScenarioMap(viewer, Cesium, scenario);

    // Fly camera in to show the action
    const altitude = scenario.cameraAltM ?? 900;
    const latOffset = Math.min(0.012, altitude / 80000);

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(node.lon, node.lat - latOffset, altitude),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      },
      duration: 1.8
    });
  }, []);

  const clearFocus = useCallback(() => {
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!viewer || !Cesium) return;

    if (scenarioCleanupRef.current) {
      scenarioCleanupRef.current();
      scenarioCleanupRef.current = null;
    }
    highlightEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    highlightEntitiesRef.current = [];

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.018, 4500),
      orientation: {
        heading: Cesium.Math.toRadians(15),
        pitch: Cesium.Math.toRadians(-38),
        roll: 0
      },
      duration: 1.2
    });
  }, [centerLat, centerLon]);

  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !containerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      animation: false,
      fullscreenButton: false,
      creditContainer: document.createElement("div"),
      terrain: undefined,
      imageryProvider: false as any
    });

    viewer.resolutionScale = Math.min(1.0, window.devicePixelRatio || 1.0);
    viewer.useBrowserRecommendedResolution = false;
    viewerRef.current = viewer;

    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: "https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png",
        credit: "CartoDB",
        maximumLevel: 19
      })
    );

    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#f8fafc");
    viewer.scene.skyAtmosphere.show = false;
    viewer.scene.fog.enabled = false;
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.depthTestAgainstTerrain = false;

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.018, 4500),
      orientation: {
        heading: Cesium.Math.toRadians(15.0),
        pitch: Cesium.Math.toRadians(-38.0),
        roll: 0.0
      }
    });

    INITIAL_NODES.forEach((node) => {
      const color = NODE_COLORS[node.type] || "#16a34a";
      const glassColor = Cesium.Color.fromCssColorString(color).withAlpha(0.25);

      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 25),
        cylinder: {
          length: 50,
          topRadius: 16,
          bottomRadius: 16,
          slices: 6,
          material: glassColor,
          outline: false
        }
      });

      viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            node.lon, node.lat, 0,
            node.lon, node.lat, 180
          ]),
          width: 1.5,
          material: Cesium.Color.fromCssColorString(color).withAlpha(0.75)
        }
      });

      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat),
        ellipse: {
          semiMajorAxis: 90,
          semiMinorAxis: 90,
          material: Cesium.Color.fromCssColorString(color).withAlpha(0.1),
          outline: false,
          height: 0
        }
      });

      viewer.entities.add({
        id: node.id,
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 180),
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString(color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2.5,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: node.name.toUpperCase(),
          font: "bold 42px Share Tech Mono, monospace",
          fillColor: Cesium.Color.fromCssColorString("#0f172a"),
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 6,
          showBackground: false,
          scale: 0.3,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });

      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 180),
        label: {
          text: `[${node.id}] ${node.lat.toFixed(4)}°N ${node.lon.toFixed(4)}°E`,
          font: "bold 28px JetBrains Mono, monospace",
          fillColor: Cesium.Color.fromCssColorString("#475569"),
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.95),
          outlineWidth: 5,
          showBackground: false,
          scale: 0.3,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 10),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
    });

    const riverCoordsArray = SAN_RIVER_COORDS.flatMap((c) => [c.lon, c.lat]);

    viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(riverCoordsArray),
        width: 8,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.35,
          color: Cesium.Color.fromCssColorString("#0891b2").withAlpha(0.6)
        }),
        clampToGround: true
      }
    });

    viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(riverCoordsArray),
        width: 2.5,
        material: Cesium.Color.CYAN,
        clampToGround: true
      }
    });

    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(22.062, 50.57, 50),
      label: {
        text: "RZEKA SAN",
        font: "bold 32px Share Tech Mono, monospace",
        fillColor: Cesium.Color.fromCssColorString("#0284c7"),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 5,
        scale: 0.35,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    viewer.entities.add({
      rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(22.01, 50.52, 22.09, 50.6),
        material: Cesium.Color.CYAN.withAlpha(0.02),
        outline: true,
        outlineColor: Cesium.Color.CYAN.withAlpha(0.25),
        outlineWidth: 1.5,
        height: 0
      }
    });

    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(22.01, 50.6, 30),
      label: {
        text: "STREFA OPERACYJNA STW // NW",
        font: "bold 28px JetBrains Mono, monospace",
        fillColor: Cesium.Color.fromCssColorString("#0891b2"),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 4,
        scale: 0.3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(22.09, 50.52, 30),
      label: {
        text: "STREFA OPERACYJNA STW // SE",
        font: "bold 28px JetBrains Mono, monospace",
        fillColor: Cesium.Color.fromCssColorString("#0891b2"),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 4,
        scale: 0.3,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    setIsCesiumLoaded(true);

    return () => {
      viewer.destroy();
    };
  }, [containerRef, centerLat, centerLon]);

  return { viewerRef, isCesiumLoaded, flyToNode, focusOnScenario, clearFocus };
}

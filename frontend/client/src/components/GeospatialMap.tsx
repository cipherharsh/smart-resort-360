// frontend/client/src/components/GeospatialMap.tsx
import { useState, useEffect } from "react";
import {
  MapPin, Wind, Droplets, Sun, CloudRain, Sparkles,
  Zap, Navigation, Layers, Radio, ShieldAlert, Eye, RefreshCw,
  Maximize2, X, ChevronRight, Activity, ArrowRight, Bot, Target
} from "lucide-react";
import { api, GeospatialResponse, GeospatialZone, BuggyGPS, SensorNode } from "../lib/api";

export function ResortGeospatialMap({
  selectedZone,
  onSelectZone,
  showSimulatedImpact = false,
  simulatedIntensity = 0,
  onOpenModal
}: {
  selectedZone?: string;
  onSelectZone?: (zoneId: string) => void;
  showSimulatedImpact?: boolean;
  simulatedIntensity?: number;
  onOpenModal?: () => void;
}) {
  const [data, setData] = useState<GeospatialResponse | null>(null);
  const [activeLayer, setActiveLayer] = useState<"all" | "assets" | "buggies" | "sensors" | "weather">("all");
  const [inspectedNode, setInspectedNode] = useState<any | null>(null);

  useEffect(() => {
    api.getGeospatialData().then(setData).catch((e) => console.warn("Geospatial fetch fallback:", e));
  }, []);

  const defaultZones: GeospatialZone[] = data?.zones || [
    {
      id: "zone-coastal",
      name: "Coastal Front & Beach Deck",
      bounds: { x: 5, y: 8, w: 42, h: 38 },
      weather_exposure: "High Wind & Sea Surge Zone",
      current_condition: "Sunny · 28°C · Light Breeze",
      amenities: ["Cliffside Infinity Pool", "Beachfront Cabanas #1-#4", "Water Sports Deck"],
      color: "#609bd8"
    },
    {
      id: "zone-clubhouse",
      name: "Clubhouse & Indoor Sports Wing",
      bounds: { x: 51, y: 8, w: 44, h: 38 },
      weather_exposure: "Sheltered Indoor Sanctuary",
      current_condition: "Climate Controlled · 22.5°C",
      amenities: ["Royal Snooker Lounge", "8-Ball Pool Arena", "Championship Carrom Club", "Lotus Spa"],
      color: "#d5b582"
    },
    {
      id: "zone-sports-arena",
      name: "Outdoor Sports Arena",
      bounds: { x: 5, y: 52, w: 42, h: 42 },
      weather_exposure: "Open Field / Floodlit Courts",
      current_condition: "Optimal Playability",
      amenities: ["Floodlit Cricket Nets & Pitch", "Badminton Court A & B", "Executive Golf Putting Green"],
      color: "#8fd6c2"
    },
    {
      id: "zone-villas",
      name: "Residential Villa Enclave",
      bounds: { x: 51, y: 52, w: 44, h: 42 },
      weather_exposure: "Hillside Microclimate",
      current_condition: "Pleasant Tropical Shade",
      amenities: ["Villas 101–124", "Presidential Suite", "Executive Garden Suites"],
      color: "#5e8ca0"
    }
  ];

  const buggies: BuggyGPS[] = data?.buggy_fleet_gps || [
    { id: "B-01", name: "Buggy 01 (VIP)", x: 20, y: 26, dest: "Cliffside Pool Deck", speed_kmh: 14, battery: "92%", status: "In Transit" },
    { id: "B-04", name: "Buggy 04 (Shuttle)", x: 68, y: 24, dest: "Royal Snooker Lounge", speed_kmh: 12, battery: "78%", status: "In Transit" },
    { id: "B-07", name: "Buggy 07 (Sports)", x: 26, y: 68, dest: "Cricket Nets", speed_kmh: 16, battery: "85%", status: "In Transit" },
    { id: "B-08", name: "Buggy 08 (Charging)", x: 86, y: 84, dest: "Depot Substation", speed_kmh: 0, battery: "99%", status: "Charging" }
  ];

  const sensors: SensorNode[] = data?.environmental_sensor_nodes || [
    { id: "WS-01", name: "Coastal Wind & Baro Node", x: 14, y: 14, reading: "Wind: 14 km/h WSW · 1012 hPa", status: "Nominal" },
    { id: "WS-02", name: "Sports Arena UV/Lux Node", x: 24, y: 76, reading: "UV: 6.2 High · 48k Lux", status: "Nominal" },
    { id: "WS-03", name: "Clubhouse HVAC Sensor", x: 72, y: 18, reading: "Temp: 22.4°C · AQI: 28", status: "Nominal" },
    { id: "WS-04", name: "Hillside Rain Gauge", x: 80, y: 62, reading: "Rain: 0.0 mm/h · 42% Soil", status: "Nominal" }
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c1817] shadow-2xl">
      {/* Top Map Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-[#112322]/80 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#8fd6c2]/15 text-[#8fd6c2]">
            <Navigation size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e6f1ed]">
                Resort Geospatial Digital Map
              </h3>
              <span className="flex items-center gap-1 rounded bg-[#8fd6c2]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#8fd6c2]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8fd6c2]" />
                GIS Synced · Goa Coast
              </span>
            </div>
            <p className="sr-muted text-[10px]">
              15.2993° N, 74.1240° E · 4 Main Zones · 8 Buggies · 4 Telemetry Nodes
            </p>
          </div>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
          {(["all", "assets", "buggies", "sensors", "weather"] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all capitalize ${
                activeLayer === layer
                  ? "bg-[#8fd6c2] text-[#122020] shadow-sm"
                  : "border border-white/8 bg-white/[.04] text-[#a7c2bc] hover:bg-white/[.08]"
              }`}
            >
              {layer}
            </button>
          ))}
          {onOpenModal && (
            <button
              onClick={onOpenModal}
              className="ml-2 rounded-lg border border-white/10 bg-white/[.05] p-1.5 text-[#8ca6a1] hover:text-white"
              title="Full screen GIS Map"
            >
              <Maximize2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="relative h-[420px] w-full select-none overflow-hidden bg-[radial-gradient(#1f3634_1px,transparent_1px)] [background-size:16px_16px]">
        {/* Ocean / Coastal Gradient Band */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#20526e]/35 to-transparent" />
        <div className="pointer-events-none absolute left-3 top-4 font-serif text-[10px] tracking-widest text-[#609bd8]/60 uppercase rotate-90 origin-left">
          ← Arabian Sea Coastline
        </div>

        {/* 1. ZONES RENDER */}
        {defaultZones.map((zone) => {
          const isSelected = selectedZone === zone.id;
          return (
            <div
              key={zone.id}
              onClick={() => {
                onSelectZone?.(zone.id);
                setInspectedNode({ type: "zone", data: zone });
              }}
              style={{
                left: `${zone.bounds.x}%`,
                top: `${zone.bounds.y}%`,
                width: `${zone.bounds.w}%`,
                height: `${zone.bounds.h}%`,
              }}
              className={`absolute cursor-pointer rounded-xl border p-3.5 transition-all duration-300 hover:scale-[1.01] ${
                isSelected
                  ? "border-[#8fd6c2] bg-[#8fd6c2]/15 ring-2 ring-[#8fd6c2]/30 shadow-lg"
                  : "border-white/10 bg-[#122625]/60 hover:border-white/25 hover:bg-[#122625]/90"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: zone.color }} />
                  <span className="text-xs font-bold text-[#e6f1ed]">{zone.name}</span>
                </div>
                <span className="rounded bg-white/[.06] px-1.5 py-0.5 text-[9px] font-mono text-[#a7c2bc]">
                  {zone.current_condition.split("·")[0]}
                </span>
              </div>

              {/* Zone Facilities list */}
              <div className="mt-2.5 space-y-1">
                {zone.amenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 text-[10px] text-[#a7c2bc] hover:text-[#8fd6c2]"
                  >
                    <span className="text-[8px] text-[#8fd6c2]">◆</span>
                    <span className="truncate">{amenity}</span>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-2.5 right-3 text-[9px] text-[#718b86]">
                {zone.weather_exposure}
              </div>
            </div>
          );
        })}

        {/* 2. SIMULATED IMPACT PROPAGATION OVERLAY (When What-If is Active) */}
        {showSimulatedImpact && (
          <div className="pointer-events-none absolute inset-0 z-20 animate-pulse">
            {/* Red Impact Zone over Coastal & Sports Arena */}
            <div
              className="absolute rounded-2xl border-2 border-dashed border-[#ef9a8e] bg-[#ef9a8e]/15 backdrop-blur-[1px]"
              style={{ left: "4%", top: "6%", width: "45%", height: "89%" }}
            >
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-[#d95f58]/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                <ShieldAlert size={12} />
                <span>Primary Weather Impact Zone ({simulatedIntensity || 25} mm/h Rain)</span>
              </div>
            </div>

            {/* Green Sheltered Sanctuary Zone over Clubhouse */}
            <div
              className="absolute rounded-2xl border-2 border-dashed border-[#8fd6c2] bg-[#8fd6c2]/10"
              style={{ left: "50%", top: "6%", width: "46%", height: "42%" }}
            >
              <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-[#579f8b]/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                <Sparkles size={12} />
                <span>Sheltered Indoor Games & Spa Haven</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. WEATHER RADAR SWEEP OVERLAY */}
        {(activeLayer === "all" || activeLayer === "weather") && (
          <div className="pointer-events-none absolute inset-0 z-10 opacity-35 mix-blend-screen">
            <svg className="h-full w-full">
              <defs>
                <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#609bd8" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#8fd6c2" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 10 20 Q 200 150 400 80 T 800 250"
                fill="none"
                stroke="url(#radarGrad)"
                strokeWidth="60"
                strokeLinecap="round"
                className="animate-pulse"
              />
              <circle cx="20%" cy="30%" r="40" fill="#609bd8" opacity="0.15" />
              <circle cx="25%" cy="70%" r="50" fill="#8fd6c2" opacity="0.12" />
            </svg>
          </div>
        )}

        {/* 4. BUGGY GPS FLEET NODES */}
        {(activeLayer === "all" || activeLayer === "buggies") &&
          buggies.map((buggy) => (
            <div
              key={buggy.id}
              onClick={(e) => {
                e.stopPropagation();
                setInspectedNode({ type: "buggy", data: buggy });
              }}
              style={{ left: `${buggy.x}%`, top: `${buggy.y}%` }}
              className="group absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-300 hover:scale-125"
            >
              <div className="relative grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-[#609bd8] text-[#0f202b] shadow-lg">
                <Navigation size={13} className="rotate-45" />
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#8fd6c2] ring-2 ring-[#0c1817]" />
              </div>
              <div className="absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0d1c1b] px-2 py-0.5 text-[9px] font-bold text-white shadow-xl group-hover:block">
                {buggy.name} · {buggy.dest}
              </div>
            </div>
          ))}

        {/* 5. SENSOR TELEMETRY NODES */}
        {(activeLayer === "all" || activeLayer === "sensors") &&
          sensors.map((sensor) => (
            <div
              key={sensor.id}
              onClick={(e) => {
                e.stopPropagation();
                setInspectedNode({ type: "sensor", data: sensor });
              }}
              style={{ left: `${sensor.x}%`, top: `${sensor.y}%` }}
              className="group absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125"
            >
              <div className="relative grid h-6 w-6 place-items-center rounded-full border border-[#e9bc73]/40 bg-[#e9bc73]/20 text-[#e9bc73]">
                <Radio size={12} className="animate-pulse" />
              </div>
              <div className="absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0d1c1b] px-2 py-0.5 text-[9px] font-bold text-[#e9bc73] shadow-xl group-hover:block">
                {sensor.name}
              </div>
            </div>
          ))}
      </div>

      {/* Bottom Inspector Drawer / Telemetry Bar */}
      <div className="border-t border-white/8 bg-[#112322] px-5 py-3">
        {inspectedNode ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#8fd6c2]/15 text-[#8fd6c2]">
                <Eye size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#f2eee8]">
                  {inspectedNode.type === "zone"
                    ? inspectedNode.data.name
                    : inspectedNode.type === "buggy"
                    ? inspectedNode.data.name
                    : inspectedNode.data.name}
                </div>
                <div className="sr-muted text-[10px]">
                  {inspectedNode.type === "zone"
                    ? `Condition: ${inspectedNode.data.current_condition} | Exposure: ${inspectedNode.data.weather_exposure}`
                    : inspectedNode.type === "buggy"
                    ? `Heading: ${inspectedNode.data.dest} | Speed: ${inspectedNode.data.speed_kmh} km/h | Battery: ${inspectedNode.data.battery}`
                    : inspectedNode.data.reading}
                </div>
              </div>
            </div>
            <button
              className="rounded-lg bg-white/[.06] px-2.5 py-1 text-[11px] text-[#8ca6a1] hover:text-white"
              onClick={() => setInspectedNode(null)}
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8ca6a1]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#609bd8]" /> Coastal Zone
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#d5b582]" /> Clubhouse / Indoor Sports
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#8fd6c2]" /> Outdoor Sports Arena
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#5e8ca0]" /> Villa Enclave
              </span>
            </div>
            <div className="font-mono text-[10px] text-[#708c86]">
              Click any zone, buggy or sensor to inspect live telemetry
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function GeospatialMapModal({ onClose, setPage }: { onClose: () => void; setPage?: (page: any) => void }) {
  const [selectedZone, setSelectedZone] = useState<string>("zone-sports-arena");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 md:p-8 backdrop-blur-md animate-in fade-in">
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/15 bg-[#0f2120] p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <div className="sr-kicker text-[#8fd6c2]">Sunridge Cove GIS Intelligence</div>
            <h2 className="mt-1 font-serif text-2xl text-[#f5efe4]">Resort Geospatial Layout & Telemetry</h2>
            <p className="sr-muted mt-1 text-xs">
              Live spatial coordinates, entities, micro-climate weather radar, and buggy trajectories.
            </p>
          </div>
          <button className="sr-button-quiet text-lg" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mt-6">
          <ResortGeospatialMap selectedZone={selectedZone} onSelectZone={setSelectedZone} />
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs text-[#8ca6a1]">
            FastAPI + GeoSpatial Services active on 15.2993° N, 74.1240° E
          </span>
          <div className="flex gap-2">
            {setPage && (
              <button
                className="sr-button"
                onClick={() => {
                  onClose();
                  setPage("whatif");
                }}
              >
                Run Digital Twin Simulation <ArrowRight size={14} />
              </button>
            )}
            <button className="sr-button sr-button-secondary" onClick={onClose}>
              Close Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

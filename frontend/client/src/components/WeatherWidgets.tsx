// frontend/client/src/components/WeatherWidgets.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Sun, CloudSun, CloudRain, Cloud, Wind, Droplets,
  Sunrise, Sunset, Sparkles, ChevronRight, X, RefreshCw, Eye, ShieldCheck,
  Compass, MapPin, Navigation, LocateFixed, Check
} from "lucide-react";
import { toast } from "sonner";
import { api, WeatherResponse } from "../lib/api";

export interface GeoLocationState {
  lat: number;
  lon: number;
  name: string;
  isGPS: boolean;
}

export const PRESET_LOCATIONS: GeoLocationState[] = [
  { name: "Sunridge Cove (Goa)", lat: 15.2993, lon: 74.1240, isGPS: false },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777, isGPS: false },
  { name: "Delhi NCR", lat: 28.6139, lon: 77.2090, isGPS: false },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946, isGPS: false },
  { name: "Pune", lat: 18.5204, lon: 73.8567, isGPS: false },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639, isGPS: false },
  { name: "Chennai", lat: 13.0827, lon: 80.2707, isGPS: false },
  { name: "Hyderabad", lat: 17.3850, lon: 78.4867, isGPS: false }
];

let globalLocation: GeoLocationState = PRESET_LOCATIONS[0];
let globalListeners: Array<(loc: GeoLocationState) => void> = [];

export function useLiveWeather() {
  const [location, setLocation] = useState<GeoLocationState>(globalLocation);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [locating, setLocating] = useState<boolean>(false);

  const fetchWeatherFor = useCallback((loc: GeoLocationState) => {
    setLoading(true);
    api.getWeather(loc.lat, loc.lon)
      .then((data) => {
        if (loc.isGPS) {
          data.location = `${loc.name} (${loc.lat.toFixed(2)}°, ${loc.lon.toFixed(2)}°)`;
        }
        setWeather(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Weather API fetch error:", err);
        setLoading(false);
      });
  }, []);

  const changeLocation = useCallback((newLoc: GeoLocationState) => {
    globalLocation = newLoc;
    setLocation(newLoc);
    globalListeners.forEach((l) => l(newLoc));
    fetchWeatherFor(newLoc);
  }, [fetchWeatherFor]);

  const detectUserGPS = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    toast.info("Requesting your browser GPS coordinates...", { duration: 2500 });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const gpsLocation: GeoLocationState = {
          name: "My Live Location (GPS)",
          lat: Number(latitude.toFixed(4)),
          lon: Number(longitude.toFixed(4)),
          isGPS: true
        };
        setLocating(false);
        changeLocation(gpsLocation);
        toast.success(`Live GPS located! Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
      },
      (error) => {
        setLocating(false);
        console.warn("GPS error:", error);
        toast.error(`Could not get GPS location: ${error.message}. Using default resort coordinates.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [changeLocation]);

  useEffect(() => {
    const listener = (loc: GeoLocationState) => {
      setLocation(loc);
      fetchWeatherFor(loc);
    };
    globalListeners.push(listener);
    fetchWeatherFor(globalLocation);

    const interval = setInterval(() => fetchWeatherFor(globalLocation), 5 * 60 * 1000);

    return () => {
      globalListeners = globalListeners.filter((l) => l !== listener);
      clearInterval(interval);
    };
  }, [fetchWeatherFor]);

  return {
    weather,
    loading,
    locating,
    location,
    detectUserGPS,
    changeLocation,
    refetch: () => fetchWeatherFor(location)
  };
}

function WeatherIcon({ icon, size = 16, className = "" }: { icon: string; size?: number; className?: string }) {
  switch (icon) {
    case "sun":
      return <Sun size={size} className={`text-[#e9bc73] ${className}`} />;
    case "cloud-sun":
      return <CloudSun size={size} className={`text-[#d5b582] ${className}`} />;
    case "cloud-rain":
      return <CloudRain size={size} className={`text-[#609bd8] ${className}`} />;
    case "cloud":
      return <Cloud size={size} className={`text-[#8ca6a1] ${className}`} />;
    default:
      return <Sun size={size} className={`text-[#e9bc73] ${className}`} />;
  }
}

// 1. TOPBAR COMPACT WEATHER PILL
export function TopbarWeatherPill({ onOpenDetails }: { onOpenDetails?: () => void }) {
  const { weather, loading, location } = useLiveWeather();

  if (loading && !weather) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[.04] px-2.5 py-1 text-[11px] text-[#8ca6a1]">
        <Sun size={13} className="animate-spin text-[#d5b582]" />
        <span>Loading live weather...</span>
      </div>
    );
  }

  const temp = weather?.current?.temp_c ?? 28.5;
  const condition = weather?.current?.condition ?? "Sunny";
  const icon = weather?.current?.icon ?? "sun";

  return (
    <button
      onClick={onOpenDetails}
      title={`Live Weather for ${location.name} (Click to switch location)`}
      className="group flex items-center gap-2 rounded-full border border-[#d5b582]/20 bg-[#d5b582]/[.08] px-3 py-1 text-xs text-[#fcf5e8] transition-all hover:border-[#d5b582]/40 hover:bg-[#d5b582]/[.14]"
    >
      <WeatherIcon icon={icon} size={14} className="group-hover:scale-110 transition-transform" />
      <span className="font-semibold text-[#d5b582]">{temp}°C</span>
      <span className="hidden lg:inline text-[#ebe7dc]/80 font-normal">· {condition}</span>
      <span className="hidden xl:inline text-[10px] text-[#8ca6a1] font-mono">
        ({location.isGPS ? "📍 Live GPS" : location.name.split(" ")[0]})
      </span>
    </button>
  );
}

// 2. MANAGER COMMAND CENTER ENVIRONMENTAL INTELLIGENCE CARD
export function ManagerWeatherCard({ onOpenDetails }: { onOpenDetails?: () => void }) {
  const { weather, loading, refetch, detectUserGPS, location } = useLiveWeather();

  const current = weather?.current;
  const advisory = weather?.advisory;

  return (
    <div className="sr-surface p-5 transition-all">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="sr-kicker text-[#d5b582]">Live Meteorological Feed</span>
            {location.isGPS && (
              <span className="rounded-full bg-[#8fd6c2]/15 px-2 py-0.2 text-[9px] font-bold text-[#8fd6c2] flex items-center gap-1">
                <LocateFixed size={10} /> Exact Device GPS Coordinates
              </span>
            )}
          </div>
          <h2 className="mt-1 font-serif text-[23px] text-[#f3eee6]">Weather & Environmental Intelligence</h2>
          <p className="sr-muted mt-1 text-xs">
            📍 {weather?.location || location.name} · {weather?.current?.air_quality || "AQI 32 · Excellent"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={detectUserGPS}
            className="flex items-center gap-1.5 rounded-lg border border-[#8fd6c2]/30 bg-[#8fd6c2]/10 px-2.5 py-1.5 text-xs font-semibold text-[#8fd6c2] hover:bg-[#8fd6c2]/20 transition-all shadow-sm"
            title="Fetch exact live weather for your current physical device coordinates"
          >
            <LocateFixed size={13} />
            <span className="hidden sm:inline">Use My Exact Location</span>
          </button>
          <button
            onClick={refetch}
            className="sr-button-quiet p-1.5 hover:text-[#d5b582]"
            title="Refresh live weather"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={onOpenDetails}
            className="sr-button-quiet text-xs text-[#d5b582] underline font-semibold"
          >
            Change City / Radar
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1.3fr]">
        {/* Current Core Conditions */}
        <div className="rounded-xl border border-white/8 bg-white/[.025] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#d5b582]/12">
                <WeatherIcon icon={current?.icon || "sun"} size={26} />
              </div>
              <div>
                <div className="font-serif text-3xl font-bold text-[#fcf5e8]">
                  {current?.temp_c ?? 28.5}°C
                </div>
                <div className="text-xs font-semibold text-[#d5b582]">
                  {current?.condition ?? "Sunny & Coastal Breeze"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[#8ca6a1]">Feels Like</div>
              <div className="text-sm font-semibold text-[#ebe7dc]">
                {current?.feels_like_c ?? 30.2}°C
              </div>
              <div className="text-[10px] text-[#6f8983]">
                H: {current?.temp_max_c ?? 32}° · L: {current?.temp_min_c ?? 24}°
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/6 pt-3 text-center">
            <div>
              <div className="sr-label text-[9px]">Humidity</div>
              <div className="mt-0.5 text-xs font-semibold text-[#ebe7dc]">
                {current?.humidity_percent ?? 68}%
              </div>
            </div>
            <div>
              <div className="sr-label text-[9px]">Wind Speed</div>
              <div className="mt-0.5 text-xs font-semibold text-[#8fd6c2]">
                {current?.wind_speed_kmh ?? 12} km/h
              </div>
            </div>
            <div>
              <div className="sr-label text-[9px]">UV Index</div>
              <div className="mt-0.5 text-xs font-semibold text-[#e9bc73]">
                {current?.uv_index ?? 6.5} ({current?.uv_category ?? "Moderate"})
              </div>
            </div>
          </div>
        </div>

        {/* Manager Operational Weather Advisory */}
        <div className="flex flex-col justify-between rounded-xl border border-[#d5b582]/15 bg-[#d5b582]/[.05] p-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#d5b582]">
                <Sparkles size={14} /> AI Resort Operations Advisory
              </span>
              <span className="rounded bg-[#d5b582]/20 px-2 py-0.5 text-[9px] font-semibold text-[#d5b582]">
                Hourly Sync
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#dce7df]">
              {advisory?.manager_note || "Current weather is optimal for resort operations. Recommend activating pool deck cabana service and outdoor badminton/cricket court bookings."}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2.5 text-[11px] text-[#8ca6a1]">
            <span className="flex items-center gap-1">
              <Sunrise size={13} className="text-[#e9bc73]" /> Sunrise: {current?.sunrise ?? "06:22 AM"}
            </span>
            <span className="flex items-center gap-1">
              <Sunset size={13} className="text-[#d5b582]" /> Sunset: {current?.sunset ?? "06:38 PM"}
            </span>
            <button
              onClick={onOpenDetails}
              className="text-[#d5b582] hover:underline font-semibold"
            >
              Detailed Radar & Hourly Forecast →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. STAFF OPERATIONS WEATHER BANNER (Maintenance & Buggy Fleet)
export function StaffWeatherCard() {
  const { weather } = useLiveWeather();
  const current = weather?.current;
  const advisory = weather?.advisory;

  return (
    <div className="mt-5 rounded-xl border border-white/8 bg-white/[.025] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#8fd6c2]/10 text-[#8fd6c2]">
            <WeatherIcon icon={current?.icon || "sun"} size={18} />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#fcf5e8]">
              Field Weather: {current?.temp_c ?? 28}°C · {current?.condition || "Clear"}
            </div>
            <div className="sr-muted mt-0.5 text-[10px]">
              Wind: {current?.wind_speed_kmh ?? 12} km/h · Humidity: {current?.humidity_percent ?? 65}% · UV: {current?.uv_index ?? 6}
            </div>
          </div>
        </div>
        <span className="rounded-md bg-[#8fd6c2]/15 px-2 py-1 text-[10px] font-semibold text-[#8fd6c2]">
          Routes Clear
        </span>
      </div>
      <p className="sr-muted mt-2.5 border-t border-white/5 pt-2 text-[11px] leading-5">
        {advisory?.staff_note || "All outdoor service routes clear. Hydration stations active at Cricket nets and Golf course."}
      </p>
    </div>
  );
}

// 4. GUEST MOBILE WEATHER HERO CARD
export function GuestWeatherCard({ setPage }: { setPage: (p: any) => void }) {
  const { weather } = useLiveWeather();
  const current = weather?.current;
  const advisory = weather?.advisory;

  return (
    <div className="mt-6 rounded-2xl border border-[#d5b582]/30 bg-gradient-to-br from-[#d5b582]/[.10] via-[#1a2d2a]/80 to-[#122020] p-4 text-left shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#d5b582]/15 text-[#d5b582] border border-[#d5b582]/30 shadow-inner">
            <WeatherIcon icon={current?.icon || "sun"} size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-[#fcf5e8]">{current?.temp_c ?? 28.4}°C</span>
              <span className="rounded-md bg-[#d5b582]/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#d5b582] border border-[#d5b582]/30">
                {current?.tag || "CLEAR"}
              </span>
            </div>
            <div className="mt-0.5 text-sm font-medium text-[#d9e7e1]">{current?.condition || "Sunny & Coastal Breeze"}</div>
          </div>
        </div>
        <div className="text-right text-xs font-medium text-[#a7c4bc] space-y-0.5">
          <div>High <span className="font-semibold text-[#fcf5e8]">{current?.max_temp_c ?? 31.5}°C</span></div>
          <div>Low <span className="font-semibold text-[#fcf5e8]">{current?.min_temp_c ?? 24}°C</span></div>
        </div>
      </div>

      <div className="mt-3.5 rounded-xl bg-black/35 p-3.5 border border-white/6">
        <div className="flex items-center gap-2 text-xs font-bold text-[#d5b582]">
          <Sparkles size={14} className="text-[#d5b582]" />
          <span>Weather-Curated Recommendation</span>
        </div>
        <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#e5ede8]">
          {advisory?.guest_recommendation || "Delightful 28.2°C coastal weather! Excellent conditions for Cricket nets, Badminton court, and Golf putting."}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2.5">
          <span className="text-xs text-[#9eb6b0]">Want to play or relax?</span>
          <button
            onClick={() => setPage("amenities")}
            className="flex items-center gap-1 text-xs font-bold text-[#d5b582] transition-colors hover:text-[#eed2a4]"
          >
            <span>Explore Amenities</span>
            <span className="text-sm">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// 5. DETAILED WEATHER DIALOG / MODAL (WITH LIVE GPS LOCATION DETECTOR & PRESETS)
export function WeatherModal({ onClose, setPage }: { onClose: () => void; setPage?: (p: any) => void }) {
  const { weather, loading, locating, location, detectUserGPS, changeLocation, refetch } = useLiveWeather();
  const current = weather?.current;
  const advisory = weather?.advisory;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/12 bg-[#122020] p-6 shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d5b582]/12">
              <WeatherIcon icon={current?.icon || "sun"} size={22} />
            </div>
            <div>
              <div className="sr-kicker text-[#d5b582]">Live Meteorological Intelligence</div>
              <h2 className="text-lg font-serif font-bold text-[#fcf5e8]">
                {weather?.location || location.name}
              </h2>
            </div>
          </div>
          <button className="sr-button-quiet" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        {/* Location Switcher & GPS Detector */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[.03] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#ebe7dc] flex items-center gap-1.5">
              <MapPin size={13} className="text-[#8fd6c2]" /> Switch Location / Detect Live GPS
            </span>
            <button
              onClick={detectUserGPS}
              disabled={locating}
              className="flex items-center gap-1 rounded-md bg-[#8fd6c2] px-2.5 py-1 text-[11px] font-bold text-[#122020] hover:bg-[#a6e6d4] transition-all disabled:opacity-50 shadow-sm"
            >
              <LocateFixed size={12} className={locating ? "animate-spin" : ""} />
              <span>{locating ? "Locating GPS..." : "📍 Use My Exact GPS Location"}</span>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESET_LOCATIONS.map((loc) => {
              const isSelected = !location.isGPS && location.name === loc.name;
              return (
                <button
                  key={loc.name}
                  onClick={() => changeLocation(loc)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all ${
                    isSelected
                      ? "bg-[#d5b582] text-[#122020] shadow-sm"
                      : "border border-white/10 bg-white/[.04] text-[#a7c2bc] hover:bg-white/[.08]"
                  }`}
                >
                  {isSelected && <Check size={10} />}
                  {loc.name}
                </button>
              );
            })}
          </div>

          {location.isGPS && (
            <div className="mt-2.5 rounded-lg bg-[#8fd6c2]/10 p-2 text-[10px] text-[#8fd6c2] flex items-center justify-between font-mono">
              <span className="flex items-center gap-1">
                <Check size={12} /> Active: Live Device GPS (Lat: {location.lat}°, Lon: {location.lon}°)
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#a7c2bc]">High Accuracy GPS</span>
            </div>
          )}
        </div>

        {/* Current Core Metrics */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="sr-surface-soft p-3 text-center">
            <div className="sr-label text-[9px]">Temperature</div>
            <div className="mt-1 text-xl font-bold text-[#fcf5e8]">{current?.temp_c ?? 28}°C</div>
            <div className="sr-muted text-[10px]">Feels like {current?.feels_like_c ?? 30}°C</div>
          </div>
          <div className="sr-surface-soft p-3 text-center">
            <div className="sr-label text-[9px]">Humidity</div>
            <div className="mt-1 text-xl font-bold text-[#8fd6c2]">{current?.humidity_percent ?? 68}%</div>
            <div className="sr-muted text-[10px]">Optimal Comfort</div>
          </div>
          <div className="sr-surface-soft p-3 text-center">
            <div className="sr-label text-[9px]">UV Radiation</div>
            <div className="mt-1 text-xl font-bold text-[#e9bc73]">{current?.uv_index ?? 6.5}</div>
            <div className="sr-muted text-[10px]">{current?.uv_category ?? "High"} index</div>
          </div>
        </div>

        {/* Additional Sensor telemetry */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="sr-surface-soft p-3 text-center">
            <div className="sr-label text-[9px]">Wind Speed</div>
            <div className="mt-1 text-sm font-semibold text-[#ebe7dc]">{current?.wind_speed_kmh ?? 12} km/h</div>
            <div className="sr-muted text-[9px]">{current?.wind_direction ?? "WSW"}</div>
          </div>
          <div className="sr-surface-soft p-3 text-center">
            <div className="sr-label text-[9px]">Sunrise</div>
            <div className="mt-1 text-sm font-semibold text-[#d5b582]">{current?.sunrise ?? "06:22 AM"}</div>
            <div className="sr-muted text-[9px]">Dawn Window</div>
          </div>
          <div className="sr-surface-soft p-3 text-center">
            <div className="sr-label text-[9px]">Sunset</div>
            <div className="mt-1 text-sm font-semibold text-[#d5b582]">{current?.sunset ?? "06:38 PM"}</div>
            <div className="sr-muted text-[9px]">Golden Hour</div>
          </div>
        </div>

        {/* 6-Hour Hourly Forecast Strip */}
        <div className="mt-5">
          <div className="sr-label text-[#8ca6a1] mb-2">6-Hour Forecast Trend</div>
          <div className="grid grid-cols-6 gap-1.5 overflow-x-auto">
            {(weather?.forecast_hourly || []).map((h, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-white/[.02] p-2 text-center">
                <div className="font-mono text-[9px] text-[#8ca6a1]">{h.time}</div>
                <div className="my-1 grid place-items-center">
                  <WeatherIcon icon={h.icon} size={14} />
                </div>
                <div className="text-[11px] font-semibold text-[#ebe7dc]">{h.temp_c}°</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Advisory */}
        <div className="mt-5 rounded-xl border border-[#d5b582]/20 bg-[#d5b582]/[.06] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#d5b582]">
            <Sparkles size={14} /> AI Resort Operations & Guest Advisory
          </div>
          <p className="sr-muted mt-2 text-xs leading-5">
            {advisory?.guest_recommendation || advisory?.manager_note || "Pleasant coastal breeze. Ideal for outdoor recreation, cricket, and pool daybeds."}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
          <button onClick={refetch} className="sr-button sr-button-secondary text-xs">
            <RefreshCw size={13} className={loading ? "animate-spin mr-1 inline" : "mr-1 inline"} />
            Refresh Telemetry
          </button>
          {setPage && (
            <button
              onClick={() => {
                setPage("amenities");
                onClose();
              }}
              className="sr-button text-xs"
            >
              Explore Curated Amenities
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

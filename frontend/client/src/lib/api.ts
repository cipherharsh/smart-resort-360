// frontend/client/src/lib/api.ts
export const API_BASE =
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.VITE_BACKEND_URL as string) ||
  ""; // Uses relative paths proxied by Vite, direct host or deployed backend

export interface UserToken {
  access_token: string;
  token_type: string;
  role: "MANAGER" | "STAFF" | "GUEST" | "ADMIN";
  user_id: number;
  email: string;
}

export interface ResortStats {
  active_guests: number;
  occupancy_rate: string;
  open_tickets: number;
  active_emergencies: number;
  occupied_amenities: string;
  active_staff_count: number;
  total_folio_revenue: number;
}

export interface BackendHealth {
  status: string;
  database_connected: boolean;
  engine: string;
}

export interface WeatherResponse {
  status: string;
  location: string;
  coordinates: { latitude: number; longitude: number };
  updated_at: string;
  is_live_upstream: boolean;
  current: {
    temp_c: number;
    feels_like_c: number;
    max_temp_c: number;
    min_temp_c: number;
    condition: string;
    icon: string;
    tag: string;
    humidity_percent: number;
    wind_speed_kmh: number;
    wind_direction: string;
    uv_index: number;
    uv_category: string;
    air_quality: string;
    sunrise: string;
    sunset: string;
  };
  forecast_hourly: Array<{
    time: string;
    temp_c: number;
    condition: string;
    icon: string;
    pop: number;
  }>;
  advisory: {
    manager_note: string;
    staff_note: string;
    guest_recommendation: string;
    recommended_amenities: string[];
    weather_suitability: string;
  };
}

export interface SocialSignalItem {
  id: string;
  platform: string;
  author: string;
  handle: string;
  avatar: string;
  timestamp: string;
  content: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  sentiment_tone: "teal" | "amber" | "red";
  weather_aspect: string;
  location_tagged: string;
  engagement: string;
  ai_insight: string;
}

export interface SocialSignalsResponse {
  status: string;
  timestamp: string;
  aggregate_sentiment: {
    score: number;
    status: string;
    breakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
    total_analyzed_posts: number;
    weather_satisfaction_index: string;
  };
  trending_hashtags: Array<{ tag: string; count: number; sentiment: string }>;
  social_signals: SocialSignalItem[];
}

export interface GeospatialZone {
  id: string;
  name: string;
  bounds: { x: number; y: number; w: number; h: number };
  weather_exposure: string;
  current_condition: string;
  amenities: string[];
  color: string;
}

export interface BuggyGPS {
  id: string;
  name: string;
  x: number;
  y: number;
  dest: string;
  speed_kmh: number;
  battery: string;
  status: string;
}

export interface SensorNode {
  id: string;
  name: string;
  x: number;
  y: number;
  reading: string;
  status: string;
}

export interface GeospatialResponse {
  resort_name: string;
  center_coordinates: { lat: number; lon: number };
  zones: GeospatialZone[];
  buggy_fleet_gps: BuggyGPS[];
  environmental_sensor_nodes: SensorNode[];
}

export interface DigitalTwinSimulationResponse {
  simulation_id: string;
  parameters: {
    rainfall_mm_hr: number;
    wind_kmh: number;
    temp_c: number;
    duration_hrs: number;
    locus: string;
  };
  impact_summary: {
    displaced_guests_count: number;
    indoor_surge_percent: string;
    outdoor_amenities_status: string;
    buggy_fleet_mode: string;
    buggy_speed_limit_kmh: number;
    avg_transit_delay_min: string;
    hvac_load_kw: string;
    hvac_stress_index: string;
    financial_impact_inr: {
      outdoor_refund_loss: string;
      indoor_upsell_revenue: string;
      net_variance: string;
    };
  };
  workforce_reallocations: Array<{ dept: string; delta: string; action: string }>;
  propagation_timeline: Array<{ t: string; event: string }>;
  mitigation_actions: Array<{ id: string; title: string; state: string; tone: "teal" | "blue" | "amber" }>;
}

// Token storage helpers
export const setAuthToken = (token: string, role: string, email: string) => {
  localStorage.setItem("sr360_token", token);
  localStorage.setItem("sr360_role", role);
  localStorage.setItem("sr360_email", email);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("sr360_token");
};

export const clearAuth = () => {
  localStorage.removeItem("sr360_token");
  localStorage.removeItem("sr360_role");
  localStorage.removeItem("sr360_email");
};

export const getStoredAuth = () => ({
  token: localStorage.getItem("sr360_token"),
  role: localStorage.getItem("sr360_role"),
  email: localStorage.getItem("sr360_email"),
});

// Generic Fetch Wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data?.detail || `API Request Failed (${response.status})`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// API methods
export const api = {
  // Health
  checkHealth: () => request<BackendHealth>("/api/health"),

  // Authentication & Dynamic OTP
  requestManagerOTP: (email: string, full_name?: string) =>
    request<{ status: string; message: string; role: string; dev_otp?: string; email_dispatched: boolean }>(
      "/api/auth/manager-otp",
      { method: "POST", body: JSON.stringify({ email, full_name }) }
    ),

  verifyManagerOTP: (email: string, otp: string) =>
    request<UserToken>("/api/auth/manager-verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  requestGuestOTP: (email: string) =>
    request<{ status: string; message: string; room_number?: string; dev_otp?: string; email_dispatched: boolean }>(
      "/api/auth/guest-login",
      { method: "POST", body: JSON.stringify({ email }) }
    ),

  verifyGuestOTP: (email: string, otp: string) =>
    request<UserToken>("/api/auth/guest-verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  requestStaffOTP: (email: string, full_name?: string, department?: string) =>
    request<{ status: string; message: string; role: string; department?: string; dev_otp?: string; email_dispatched: boolean }>(
      "/api/auth/staff-otp",
      { method: "POST", body: JSON.stringify({ email, full_name, department }) }
    ),

  verifyStaffOTP: (email: string, otp: string) =>
    request<UserToken>("/api/auth/staff-verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  loginStaff: (email: string, password?: string, pin?: string) =>
    request<UserToken>("/api/auth/staff-login", {
      method: "POST",
      body: JSON.stringify({ email, password: password || pin || "staff123" }),
    }),

  getCurrentUser: () => request<{ user_id: number; email: string; role: string }>("/api/auth/me"),

  // Manager Intelligence & Stats
  getStats: () => request<ResortStats>("/api/manager/stats"),

  getForecast: (days = 14) =>
    request<{ status: string; model_used: string; forecast: Array<{ date: string; predicted_occupied_rooms: number; occupancy_percentage: number }> }>(
      `/api/manager/forecast?days=${days}`
    ),

  getEmployees: (department?: string) =>
    request<Array<{ employee_id: number; full_name: string; role: string; department: string; email: string }>>(
      `/api/manager/employees${department ? `?department=${department}` : ""}`
    ),

  getBookings: () =>
    request<Array<{ booking_id: number; guest_name: string; email: string; room_number: string; booking_status: string }>>(
      "/api/manager/bookings"
    ),

  getTickets: (status?: string) =>
    request<Array<{ ticket_id: number; title: string; category: string; priority: string; status: string; room_number?: string }>>(
      `/api/manager/tickets${status ? `?status=${status}` : ""}`
    ),

  updateTicket: (ticketId: number, update: { status?: string; assigned_department?: string }) =>
    request(`/api/manager/tickets/${ticketId}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    }),

  // Amenities
  getAmenities: () =>
    request<Array<{ amenity_id: number; name: string; category: string; status: string; max_duration_minutes: number }>>(
      "/api/amenity/list"
    ),

  // Guest Services
  askConcierge: (query: string, guestId: number = 1) =>
    request<{ response: string; intent?: string; recommended_action?: string }>(
      "/api/guest/concierge-chat",
      { method: "POST", body: JSON.stringify({ query, guest_id: guestId }) }
    ),

  // Emergency Alert
  triggerEmergency: (alertType: string, location: string, description?: string) =>
    request("/api/emergency/trigger", {
      method: "POST",
      body: JSON.stringify({ alert_type: alertType, location, description }),
    }),

  // Live Weather
  getWeather: (lat?: number, lon?: number) =>
    request<WeatherResponse>(
      `/api/weather${lat && lon ? `?lat=${lat}&lon=${lon}` : ""}`
    ),

  // Real-World Social Signals
  getSocialSignals: () =>
    request<SocialSignalsResponse>("/api/weather/social-signals"),

  // Geospatial Map & Sensor Overlays
  getGeospatialData: () =>
    request<GeospatialResponse>("/api/weather/geospatial"),

  // Digital Twin What-If Simulation
  runDigitalTwinSimulation: (params: {
    rainfall_mm_hr?: number;
    wind_kmh?: number;
    temp_c?: number;
    duration_hrs?: number;
    locus?: string;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.rainfall_mm_hr !== undefined) query.set("rainfall_mm_hr", String(params.rainfall_mm_hr));
    if (params.wind_kmh !== undefined) query.set("wind_kmh", String(params.wind_kmh));
    if (params.temp_c !== undefined) query.set("temp_c", String(params.temp_c));
    if (params.duration_hrs !== undefined) query.set("duration_hrs", String(params.duration_hrs));
    if (params.locus !== undefined) query.set("locus", params.locus);
    return request<DigitalTwinSimulationResponse>(`/api/weather/digital-twin/simulate?${query.toString()}`);
  },
};

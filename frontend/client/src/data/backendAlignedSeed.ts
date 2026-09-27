// frontend/client/src/data/backendAlignedSeed.ts
export const seedAmenities = [
  { id: 1, name: "Royal Snooker Lounge", category: "Indoor Games", subcategory: "Snooker", status: "FREE", max_duration_minutes: 60, price: "₹800/hr", location: "Clubhouse Level 2", description: "Full-size 12ft tournament table with Strachan 6811 cloth & luxury cue lounge." },
  { id: 2, name: "8-Ball Pool Arena", category: "Indoor Games", subcategory: "Pool", status: "OCCUPIED", max_duration_minutes: 45, price: "₹500/hr", location: "Clubhouse Game Zone", description: "Pro 9ft slate pool tables with Aramith tournament balls & beverage service." },
  { id: 3, name: "Championship Carrom Club", category: "Indoor Games", subcategory: "Carrom", status: "FREE", max_duration_minutes: 45, price: "Complimentary", location: "Indoor Recreation Wing", description: "English Birch ply championship boards, precision coins & boric smooth surface." },
  { id: 4, name: "Floodlit Cricket Nets & Pitch", category: "Outdoor Games", subcategory: "Cricket", status: "FREE", max_duration_minutes: 60, price: "₹1,200/hr", location: "Sports Arena East", description: "Professional astro-turf practice nets with automatic programmable bowling machine." },
  { id: 5, name: "Badminton Court A", category: "Outdoor Games", subcategory: "Badminton Court", status: "FREE", max_duration_minutes: 45, price: "₹600/hr", location: "Sports Pavilion", description: "BWF-standard synthetic shock-absorbent mat court with tournament grade lighting." },
  { id: 6, name: "Executive Golf Putting Green", category: "Outdoor Games", subcategory: "Golf", status: "FREE", max_duration_minutes: 60, price: "₹1,500/hr", location: "Garden Greens Course", description: "9-hole undulating championship putting green with Titleist Scotty Cameron putters." },
  { id: 7, name: "Sunset Oceanfront Cabana #4", category: "Cabana", subcategory: "Cabana", status: "OCCUPIED", max_duration_minutes: 90, price: "₹2,500/hr", location: "Private Shoreline", description: "Private cabana with oceanfront view, chilled towel service and daybed." },
  { id: 8, name: "Royal Beachfront Cabana #1", category: "Cabana", subcategory: "Cabana", status: "FREE", max_duration_minutes: 90, price: "₹2,500/hr", location: "Private Shoreline", description: "Beachfront cabana with butler call service and fruit platter." },
  { id: 9, name: "Hydrotherapy Spa Cabana", category: "Spa", subcategory: "Wellness", status: "FREE", max_duration_minutes: 60, price: "₹3,500/session", location: "Lotus Wellness Sanctuary", description: "Hot spring mineral soak, steam therapy and restorative massage." },
  { id: 10, name: "Infinity Pool VIP Daybed #2", category: "Pool", subcategory: "Pool", status: "FREE", max_duration_minutes: 120, price: "Complimentary", location: "Cliffside Pool Deck", description: "Panoramic cliffside daybeds with poolside cocktail & refreshment service." },
];

export const seedAssets = [
  { id: "SPA_HEATER", name: "Guest tower · HVAC unit", risk: 84, last: "18 Sep 2026", signal: "Service overdue", tone: "red" },
  { id: "P-018", name: "Pool plant · circulation pump", risk: 62, last: "03 Aug 2026", signal: "Estimated usage elevated", tone: "amber" },
  { id: "EL-112", name: "East wing · elevator motor", risk: 38, last: "22 Sep 2026", signal: "Within baseline", tone: "teal" },
  { id: "CH-009", name: "Kitchen · chiller unit", risk: 27, last: "25 Sep 2026", signal: "Within baseline", tone: "teal" },
];

export const seedBookings = [
  { booking_id: 1, guest_name: "Alexander Wright", email: "guest@smartresort360.com", room_number: "101", check_in_date: "2026-09-25", check_out_date: "2026-09-29", booking_status: "CHECKED_IN" },
  { booking_id: 2, guest_name: "Sophia Chen", email: "sophia.chen@example.com", room_number: "204", check_in_date: "2026-09-26", check_out_date: "2026-09-30", booking_status: "CHECKED_IN" },
  { booking_id: 3, guest_name: "Marcus Vance", email: "marcus.v@example.com", room_number: "308", check_in_date: "2026-09-26", check_out_date: "2026-10-02", booking_status: "CONFIRMED" },
];

export const seedUsers = [
  { id: 1, full_name: "Resort General Manager", email: "resort360test@gmail.com", role: "MANAGER", department: "Leadership" },
  { id: 2, full_name: "Carlos Mendoza", email: "maintenance@smartresort360.com", role: "STAFF", department: "Maintenance" },
  { id: 3, full_name: "Alexander Wright", email: "guest@smartresort360.com", role: "GUEST", room_number: "101" },
];

export const schedulingFactors = [
  { label: "Stay length", value: "+24 pts", detail: "Multi-night reservation priority" },
  { label: "Guest tier", value: "+22 pts", detail: "Loyalty and stay tier weight" },
  { label: "Wait time", value: "+20 pts", detail: "Elapsed queue duration" },
  { label: "Schedule fit", value: "+22 pts", detail: "No conflicting reservations" },
];

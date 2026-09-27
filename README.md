# Smart Resort 360 🌴🏖️

> **Autonomous AI Operating Layer for Intelligent Hospitality Management**  
> Connecting Resort Operations, Real-Time Meteorology, Guest Personalization, and Predictive Intelligence.

---

## 🌟 Key Features

### 1. 🏨 Role-Based Workspaces & Portals
- **General Manager Command Center**: Live occupancy rates, real-time revenue analytics, intelligence decision streams, workforce allocation, and emergency broadcasts.
- **Engineering & Staff Dispatch Hub**: Autonomous ticket assignment, preventive HVAC/equipment maintenance workflows, live task management, and shift coordination.
- **Guest In-Stay Experience App**:
  - 🍽️ **Food & Drinks**: Multi-venue browsing with interactive **2-Page Seafood Menu** (The Cove Signature Seafood & Grill) and **5-Page Sunset Bar & Cocktails Menu** (Azure Sunset Lounge & Cocktail Bar) with prices in INR (₹).
  - 🟢 **Pure Vegetarian & Jain Dining**: 100% pure veg dedicated culinary venue (Rasoi Royal).
  - 🎱 **Indoor Activities**: Royal Snooker, 8-Ball Pool Arena, Championship Carrom.
  - ⛳ **Outdoor Sports**: Floodlit Cricket Nets, BWF Badminton Court, Championship 9-Hole Golf Putting Green.
  - 🌿 **Wellness & Spa**: Lotus Sanctuary Spa, Yoga Deck, Cliffside Infinity Pool.
  - 🧾 **Digital Folio**: Transparent billing breakdown with INR currency formatting.
  - 🤖 **AI Concierge**: Context-aware recommendations and waitlist alternatives.

### 2. 🌤️ Multi-Dashboard Live Weather & Device GPS Integration
- Integrated Open-Meteo live meteorological engine tracking ambient temperature, humidity, wind velocity, precipitation, and conditions.
- **📍 Live Device GPS Detection**: One-click detection of the user's exact device GPS coordinates via the HTML5 Geolocation API, alongside preset major Indian city hubs (Goa, Mumbai, Bengaluru, Delhi, etc.).
- Weather widgets rendered across Manager, Staff, and Guest dashboards with contextual leisure/operational recommendations.

### 3. 🗺️ Geospatial GIS Digital Twin & Impact Propagation
- Interactive vector GIS map visualizing resort zones (Lagoon Sanctuary, Beachfront, Hillside Villas, Sports Arena).
- Buggy fleet tracking with live status, battery indicators, and route overlays.
- Zone impact analysis linking weather alarms and maintenance statuses to resort physical zones.

### 4. 🔮 What-If Scenario Digital Twin Simulator
- Interactive simulator allowing operators to test variations in weather intensity, rainfall, storm duration, and temperature.
- Real-time cascading impact modeling predicting task backlogs, energy consumption spikes, revenue variance, and guest sentiment shifts.

### 5. 📱 Social Signals & Public Sentiment Intelligence
- Live traveler reaction monitoring, hashtag trending feeds (#SunridgeResort, #GoaWeather, #LuxuryStay), and AI sentiment classification.

---

## 🏗️ Architecture & Tech Stack

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Sonner Notifications, Radix UI.
* **Backend**: FastAPI (Python 3.11+), SQLite / SQLAlchemy ORM, Pydantic v2, Uvicorn.
* **APIs & Protocols**: Open-Meteo API, HTML5 Geolocation API, JWT / OTP Authentication.

---

## 🚀 Quickstart Guide

### 1. Clone the Repository
`ash
git clone https://github.com/cipherharsh/smart-resort_360.git
cd smart-resort_360
`

### 2. Run Backend (FastAPI)
`ash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python main.py
`
*Backend runs on http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)*

### 3. Run Frontend (React + Vite)
`ash
cd frontend
npm install
npm run dev
`
*Frontend runs on http://localhost:3000*

### 4. Or Run with Single-Click Runner
`ash
python run_app.py
`
or on Windows:
`cmd
start-dev.bat
`

---

## 📄 License
MIT License. Created for Hackathon & Advanced Autonomous AI Hospitality Operations.

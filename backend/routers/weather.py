# /backend/routers/weather.py
from fastapi import APIRouter, Query, Body
from typing import Optional
from services.weather_service import (
    fetch_live_weather,
    fetch_social_signals,
    run_digital_twin_simulation,
    fetch_geospatial_resort_data
)

router = APIRouter()

@router.get("", summary="Get live meteorological conditions and resort advisories")
@router.get("/", summary="Get live meteorological conditions and resort advisories")
def get_resort_weather(
    lat: float = Query(15.2993, description="Resort latitude (default: Goa coast)"),
    lon: float = Query(74.1240, description="Resort longitude (default: Goa coast)")
):
    """
    Returns real-time resort weather, hourly forecast, and intelligent 
    advisories tailored for Resort Managers, Operations Staff, and Guests.
    """
    return fetch_live_weather(lat=lat, lon=lon)


@router.get("/social-signals", summary="Get real-world social media and guest sentiment signals")
def get_social_signals():
    """
    Returns live aggregated traveler sentiment, trending weather hashtags,
    and platform posts (X, Instagram, TripAdvisor) correlating weather and resort experience.
    """
    return fetch_social_signals()


@router.get("/geospatial", summary="Get resort geospatial zones, entity nodes, and live sensor overlays")
def get_geospatial_data():
    """
    Returns GIS boundaries, amenity locations, GPS buggy telemetry,
    and environmental sensor coordinates for the map-based visualization.
    """
    return fetch_geospatial_resort_data()


@router.get("/digital-twin/simulate", summary="Run interactive Digital Twin What-If scenario (GET)")
@router.post("/digital-twin/simulate", summary="Run interactive Digital Twin What-If scenario (POST)")
def simulate_digital_twin_scenario(
    rainfall_mm_hr: float = Query(25.0, description="Rainfall intensity in mm/hour"),
    wind_kmh: float = Query(35.0, description="Wind speed in km/h"),
    temp_c: float = Query(30.0, description="Ambient temperature in Celsius"),
    duration_hrs: float = Query(4.0, description="Scenario duration in hours"),
    locus: str = Query("Coastal Front & Sports Arena", description="Geographic impact locus")
):
    """
    Executes Digital Twin impact propagation: calculates displaced guests,
    amenity closures, indoor surge, buggy speed governor, HVAC kW spike,
    and net financial impact in INR (₹).
    """
    return run_digital_twin_simulation(
        rainfall_mm_hr=rainfall_mm_hr,
        wind_kmh=wind_kmh,
        temp_c=temp_c,
        duration_hrs=duration_hrs,
        locus=locus
    )


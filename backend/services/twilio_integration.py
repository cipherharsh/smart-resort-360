import os
import logging
from typing import Dict, Any, Optional

try:
    from twilio.rest import Client
    from twilio.twiml.voice_response import VoiceResponse, Say
    TWILIO_AVAILABLE = True
except ImportError:
    Client = None  # type: ignore
    VoiceResponse = None  # type: ignore
    Say = None  # type: ignore
    TWILIO_AVAILABLE = False

logger = logging.getLogger("twilio_integration")


class TwilioVoiceService:
    """
    Manages outbound voice escalations and dynamic TwiML generation for amenity waitlists and SOS alerts.
    """

    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.from_phone = os.getenv("TWILIO_PHONE_NUMBER", "+15005550006")
        self._client: Optional[Client] = None

    @property
    def client(self) -> Optional[Client]:
        if self._client is None and self.account_sid and self.auth_token:
            try:
                self._client = Client(self.account_sid, self.auth_token)
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
        return self._client

    def generate_waitlist_twiml(self, guest_name: str, amenity_name: str, claim_window_minutes: int = 15) -> str:
        """
        Generates standard TwiML XML for synthetic voice notification.
        """
        response = VoiceResponse()
        response.say(
            f"Hello {guest_name}! This is the Smart Resort 360 automated concierge service. "
            f"Your waitlist spot for the {amenity_name} is now available! "
            f"Please proceed to the {amenity_name} reception within the next {claim_window_minutes} minutes "
            "to claim your reservation. Thank you and enjoy your stay!",
            voice="Polly.Joanna-Neural",
            language="en-US",
        )
        response.pause(length=1)
        response.say("Goodbye!", voice="Polly.Joanna-Neural")
        return str(response)

    def generate_emergency_twiml(self, alert_type: str, location: str, message: str) -> str:
        """
        Generates urgent TwiML XML for staff emergency dispatch calls.
        """
        response = VoiceResponse()
        response.say(
            f"URGENT ALERT: Smart Resort Emergency Notification. "
            f"Alert Type: {alert_type}. "
            f"Location: {location}. "
            f"Message: {message}. "
            f"All available security and response staff please respond immediately.",
            voice="Polly.Matthew-Neural",
            language="en-US",
        )
        return str(response)

    def trigger_voice_call(
        self,
        to_phone: str,
        guest_name: str,
        amenity_name: str,
        claim_window_minutes: int = 15,
    ) -> Dict[str, Any]:
        """
        Triggers an outbound voice call via Twilio.
        If credentials are not present, operates in simulated hackathon mode with realistic response.
        """
        twiml_content = self.generate_waitlist_twiml(guest_name, amenity_name, claim_window_minutes)

        if self.client and self.account_sid and self.auth_token:
            try:
                call = self.client.calls.create(
                    twiml=twiml_content,
                    to=to_phone,
                    from_=self.from_phone,
                )
                logger.info(f"Twilio call initiated. SID: {call.sid} to {to_phone}")
                return {
                    "success": True,
                    "call_sid": call.sid,
                    "status": call.status,
                    "to": to_phone,
                    "mode": "live_twilio",
                    "twiml_dispatched": twiml_content,
                }
            except Exception as e:
                logger.error(f"Twilio API error: {e}. Falling back to logged dispatch.")
                return {
                    "success": False,
                    "error": str(e),
                    "mode": "fallback_simulated",
                    "twiml_dispatched": twiml_content,
                }
        else:
            # Simulated mode for development/hackathons
            logger.info(f"[SIMULATED TWILIO VOICE CALL] Outbound to {to_phone} for guest '{guest_name}' (Amenity: {amenity_name})")
            return {
                "success": True,
                "call_sid": f"CA_SIMULATED_{os.urandom(8).hex()}",
                "status": "queued",
                "to": to_phone,
                "mode": "simulated_hackathon",
                "twiml_dispatched": twiml_content,
            }


twilio_service = TwilioVoiceService()

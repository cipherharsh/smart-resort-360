# /backend/agents/department_head.py
import re
import logging
from datetime import datetime, timedelta
from typing import TypedDict, Optional, Dict, Any

from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import SessionLocal
from models.models import Employee, ServiceTicket

logger = logging.getLogger("department_head_agent")


class DepartmentHeadState(TypedDict):
    message: str
    guest_id: Optional[int]
    location: str
    detected_department: Optional[str]
    issue_category: Optional[str]
    urgency: Optional[str]
    sla_minutes: Optional[int]
    assigned_employee_id: Optional[int]
    assigned_employee_name: Optional[str]
    ticket_id: Optional[int]
    ticket_created: bool
    sla_deadline: Optional[datetime]
    reply: Optional[str]


def supervisor_node(state: DepartmentHeadState) -> Dict[str, Any]:
    """
    Supervisor Agent Node: Analyzes natural language guest query,
    extracts location context, assigns responsible department and classifies urgency level.
    """
    text = state["message"].lower()
    raw_location = state.get("location") or "Main Resort"

    # Location extraction heuristic if mentioned in text
    cabana_match = re.search(r"cabana\s*(\d+|[a-zA-Z]+)", text)
    room_match = re.search(r"room\s*(\d+)", text)
    pool_match = re.search(r"(main pool|infinity pool|spa pool|beach area|tennis court)", text)

    extracted_location = raw_location
    if cabana_match:
        extracted_location = f"Cabana {cabana_match.group(1).title()}"
    elif room_match:
        extracted_location = f"Room {room_match.group(1)}"
    elif pool_match:
        extracted_location = pool_match.group(1).title()

    # Department & Category classification
    if any(k in text for k in ["glass", "hazard", "broken glass", "blood", "spill", "leak", "dirty", "trash", "towel", "clean", "mop", "bedsheet"]):
        dept = "Housekeeping"
        category = "Sanitation & Physical Hazards" if "glass" in text or "hazard" in text else "Housekeeping Service"
    elif any(k in text for k in ["ac", "air condition", "heat", "cold", "power", "light", "plug", "tv", "water pressure", "drain", "broken door", "pipe"]):
        dept = "Maintenance"
        category = "Engineering & Repairs"
    elif any(k in text for k in ["food", "drink", "cocktail", "lunch", "dinner", "breakfast", "room service", "snack", "order", "wine", "beer", "menu"]):
        dept = "F&B"
        category = "Food & Beverage Order"
    elif any(k in text for k in ["security", "fight", "theft", "stolen", "noise", "intruder", "suspicious", "danger", "safe"]):
        dept = "Security"
        category = "Guest Security & Safety"
    else:
        dept = "Front Desk"
        category = "General Guest Concierge"

    # Urgency and SLA Countdown determination
    if any(k in text for k in ["emergency", "fire", "broken glass", "hazard", "injury", "blood", "immediate", "urgent", "overflowing"]):
        urgency = "CRITICAL"
        sla_mins = 10
    elif any(k in text for k in ["broken", "leak", "stuck", "hot", "no power", "not working"]):
        urgency = "HIGH"
        sla_mins = 20
    elif any(k in text for k in ["towel", "extra", "pillows", "order", "late checkout", "question"]):
        urgency = "MEDIUM"
        sla_mins = 35
    else:
        urgency = "LOW"
        sla_mins = 60

    return {
        "location": extracted_location,
        "detected_department": dept,
        "issue_category": category,
        "urgency": urgency,
        "sla_minutes": sla_mins,
    }


def staff_assignment_node(state: DepartmentHeadState) -> Dict[str, Any]:
    """
    Staff Dispatch Tool Node: Queries database for active staff in the target department
    and selects optimal employee based on active ticket workload.
    """
    dept = state.get("detected_department", "Front Desk")
    db: Session = SessionLocal()
    try:
        # Find active staff members in this department
        candidates = db.query(Employee).filter(
            Employee.department == dept,
            Employee.is_active.is_(True),
        ).all()

        if not candidates:
            # Fallback to any active manager or staff
            candidates = db.query(Employee).filter(Employee.is_active.is_(True)).all()

        if candidates:
            # Select employee with least open tickets (load balancing)
            selected_emp = candidates[0]
            min_tickets = 9999
            for emp in candidates:
                open_cnt = db.query(ServiceTicket).filter(
                    ServiceTicket.assigned_employee_id == emp.employee_id,
                    ServiceTicket.status.in_(["OPEN", "IN_PROGRESS"]),
                ).count()
                if open_cnt < min_tickets:
                    min_tickets = open_cnt
                    selected_emp = emp

            return {
                "assigned_employee_id": selected_emp.employee_id,
                "assigned_employee_name": selected_emp.full_name,
            }
        else:
            return {
                "assigned_employee_id": None,
                "assigned_employee_name": "On-Duty Duty Manager",
            }
    finally:
        db.close()


def ticket_creation_node(state: DepartmentHeadState) -> Dict[str, Any]:
    """
    Service Ticket Execution Node: Writes persistent ServiceTicket into PostgreSQL
    with calculated SLA deadline countdown.
    """
    db: Session = SessionLocal()
    try:
        sla_deadline = datetime.utcnow() + timedelta(minutes=state.get("sla_minutes", 30))

        ticket = ServiceTicket(
            guest_id=state.get("guest_id"),
            location=state.get("location", "Resort Grounds"),
            issue_category=state.get("issue_category", "Guest Request"),
            assigned_department=state.get("detected_department", "Front Desk"),
            assigned_employee_id=state.get("assigned_employee_id"),
            status="OPEN",
            created_at=datetime.utcnow(),
            sla_deadline=sla_deadline,
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)

        logger.info(
            f"Created ServiceTicket #{ticket.ticket_id} for Dept '{ticket.assigned_department}' "
            f"at '{ticket.location}' (Urgency: {state.get('urgency')}, SLA: {state.get('sla_minutes')} mins)"
        )

        return {
            "ticket_id": ticket.ticket_id,
            "ticket_created": True,
            "sla_deadline": sla_deadline,
        }
    except Exception as e:
        logger.error(f"Error creating ServiceTicket: {e}")
        return {
            "ticket_id": None,
            "ticket_created": False,
            "sla_deadline": datetime.utcnow() + timedelta(minutes=30),
        }
    finally:
        db.close()


def response_formulator_node(state: DepartmentHeadState) -> Dict[str, Any]:
    """
    Concierge Synthesis Node: Generates conversational, reassuring guest reply
    referencing ticket ID, assigned specialist, and estimated response SLA.
    """
    dept = state.get("detected_department", "our team")
    loc = state.get("location", "your location")
    urgency = state.get("urgency", "MEDIUM")
    sla_mins = state.get("sla_minutes", 30)
    staff_name = state.get("assigned_employee_name", "a dedicated team member")
    ticket_id = state.get("ticket_id")

    ticket_ref = f"Ticket #{ticket_id}" if ticket_id else "High-Priority Dispatch"

    if urgency == "CRITICAL":
        reply = (
            f"🚨 Priority Alert Logged ({ticket_ref}): We have dispatched {dept} lead '{staff_name}' "
            f"to {loc} immediately. Because this issue is marked {urgency}, our maximum SLA response "
            f"time is {sla_mins} minutes. Please maintain a safe perimeter while our specialists secure the area."
        )
    elif urgency == "HIGH":
        reply = (
            f"✅ We've assigned your request to {dept} specialist '{staff_name}' ({ticket_ref}). "
            f"Our team is en route to {loc} with an estimated SLA turnaround of {sla_mins} minutes."
        )
    else:
        reply = (
            f"Thank you for contacting Resort Services. Your request has been logged under {ticket_ref} "
            f"and routed to our {dept} department. Staff member '{staff_name}' is attending to this "
            f"at {loc} (Estimated SLA: {sla_mins} minutes)."
        )

    return {"reply": reply}


# ==========================================
# LANGGRAPH WORKFLOW ASSEMBLY
# ==========================================

def build_department_head_graph():
    workflow = StateGraph(DepartmentHeadState)

    # Register Nodes
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("staff_assigner", staff_assignment_node)
    workflow.add_node("ticket_creator", ticket_creation_node)
    workflow.add_node("responder", response_formulator_node)

    # Set Graph Edges
    workflow.set_entry_point("supervisor")
    workflow.add_edge("supervisor", "staff_assigner")
    workflow.add_edge("staff_assigner", "ticket_creator")
    workflow.add_edge("ticket_creator", "responder")
    workflow.add_edge("responder", END)

    return workflow.compile()


department_head_graph = build_department_head_graph()


def run_department_head(
    message: str,
    location: str = "Room",
    guest_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Executes the multi-agent department head supervisor workflow for an incoming guest request.
    """
    initial_state: DepartmentHeadState = {
        "message": message,
        "guest_id": guest_id,
        "location": location,
        "detected_department": None,
        "issue_category": None,
        "urgency": None,
        "sla_minutes": None,
        "assigned_employee_id": None,
        "assigned_employee_name": None,
        "ticket_id": None,
        "ticket_created": False,
        "sla_deadline": None,
        "reply": None,
    }

    result = department_head_graph.invoke(initial_state)
    return result

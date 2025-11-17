# type: ignore
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from solver import generate_timetable  # <-- This is our new AI solver
from supabase import create_client, Client
from postgrest.exceptions import APIError

load_dotenv()

# --- Supabase Setup ---
SUPABASE_URL = os.getenv("SUPABASE_URL") or ""
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing Supabase credentials. Check your .env file.")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- FastAPI Setup ---
app = FastAPI(title="Timetable Generator")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class SubjectAssignment(BaseModel):
    subject_id: str
    teacher_id: str

class GenerateRequest(BaseModel):
    branch: str
    semester: int
    days: List[str]
    slots: List[str]
    assignments: List[SubjectAssignment]
    save_to_db: bool = True
    generated_by: Optional[str] = None

# --- Helper Function ---
def get_slot_times(slot_list: List[str], current_slot: str):
    try:
        idx = slot_list.index(current_slot)
        start_time = current_slot
        if idx + 1 < len(slot_list):
            end_time = slot_list[idx+1]
        else:
            hour = int(start_time.split(':')[0])
            end_time = f"{hour+1:02d}:00"
        return start_time, end_time
    except ValueError:
        return current_slot, current_slot

# --- API Endpoint ---
@app.post("/generate-timetable")
async def generate(req: GenerateRequest):
    
    config = req.dict()
    
    try:
        # --- 1. Fetch ALL data needed for the AI ---
        subject_ids = [assign["subject_id"] for assign in config["assignments"]]
        teacher_ids = [assign["teacher_id"] for assign in config["assignments"]]
        class_name = f"{config['branch']} {config['semester']} Sem"

        # Fetch subjects (with new fields)
        sb_subjects = supabase.table("subjects").select("*") \
            .in_("id", subject_ids) \
            .execute()

        # Fetch rooms (with new fields)
        sb_rooms = supabase.table("rooms").select("*").execute()

        # Fetch teacher availability
        sb_availability = supabase.table("teacher_availability").select("*") \
            .in_("teacher_id", teacher_ids) \
            .execute()
        
        # --- 2. Build the Config for the AI ---
        # Format data for easy access by the solver
        config["subjects_data"] = {str(s["id"]): s for s in sb_subjects.data}
        config["rooms_data"] = sb_rooms.data # List of room dicts
        
        # Format availability: { teacher_id: { day: (start, end) } }
        teacher_availability = {}
        for avail in sb_availability.data:
            t_id = str(avail["teacher_id"])
            if t_id not in teacher_availability:
                teacher_availability[t_id] = {}
            teacher_availability[t_id][avail["day_of_week"]] = (
                avail["start_time"], avail["end_time"]
            )
        config["teacher_availability"] = teacher_availability

        # --- 3. Call the new AI solver ---
        print("Calling AI solver...")
        # The solver will return the *best* timetable it can find
        result = generate_timetable(config) 
        
        if "error" in result:
            print(f"Solver Error: {result['error']}")
            return HTTPException(status_code=400, detail=result["error"])

        # --- 4. Save to DB (if requested) ---
        if config.get("save_to_db"):
            rows_to_insert = []
            
            # `result` is now the single best timetable
            for day, entries in result.items():
                for entry in entries:
                    if not entry["subject_id"]: # Skip blank slots
                        continue
                    
                    start_time, end_time = get_slot_times(config["slots"], entry["slot"])

                    rows_to_insert.append({
                        "day": day,
                        "start_time": start_time,
                        "end_time": end_time,
                        "subject_id": entry["subject_id"],
                        "teacher_id": entry["teacher_id"],
                        "room_id": entry["room_id"],
                        "class_name": class_name,
                        "branch": config["branch"],
                        "semester": config["semester"],
                        "updated_by": config.get("generated_by")
                    })
            
            if rows_to_insert:
                print(f"Inserting {len(rows_to_insert)} rows into Supabase...")
                supabase.table("timetable").delete() \
                    .eq("branch", config["branch"]) \
                    .eq("semester", config["semester"]) \
                    .execute()
                
                supabase.table("timetable").insert(rows_to_insert).execute()

        # Return the new timetable to the frontend
        return {"message": "Timetable generated and saved", "timetable": result}

    except APIError as e:
        print("Supabase API Error:", e)
        return HTTPException(status_code=500, detail=f"Database error: {e.message}")
    except Exception as e:
        print("General Error:", e)
        import traceback
        traceback.print_exc()
        return HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
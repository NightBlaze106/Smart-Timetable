# Smart Timetable – AI Timetable Generator

An intelligent timetable generation system built with FastAPI, Supabase, and a custom scheduling engine. Automates class scheduling using teacher availability, subject hours, and constraint-based optimization.

## Features
- Automatic timetable generation
- Teacher/subject/hour management
- Hard constraints (no clashes, correct hour limits)
- Soft constraints (gaps, consecutive periods, afternoon balance)
- Supabase Postgres + Auth integration
- Clean REST API with FastAPI
- Modular backend structure

## Tech Stack
- Python + FastAPI
- Supabase Postgres
- Supabase Auth
- Uvicorn
- React (frontend WIP)

## Folder Structure
ai-timetable/
├── timetable-backend/
│   ├── main.py
│   ├── routers/
│   ├── services/
│   ├── core/
│   ├── models/
│   ├── utils/
│   ├── .env
│   └── requirements.txt
└── timetable-frontend/ (WIP)

## Setup

### 1. Clone
    git clone https://github.com/NightBlaze106/Smart-Timetable.git
    cd Smart-Timetable/ai-timetable/timetable-backend

### 2. Virtual Environment
    python -m venv .venv
    .\.venv\Scripts\activate

### 3. Install Dependencies
    pip install -r requirements.txt

### 4. Environment Variables
Create `.env` inside timetable-backend:

    SUPABASE_URL=your-url
    SUPABASE_SERVICE_ROLE_KEY=your-key
    HOST=0.0.0.0
    PORT=8000

### 5. Run Server
    uvicorn main:app --reload

API Docs:  
http://localhost:8000/docs

## Timetable Engine (Overview)

### Hard Constraints
- Teacher cannot handle two classes at the same time
- Class cannot have more than one subject in a slot
- Subject hours must fit available slots
- Teacher hour limits enforced

### Soft Constraints
- Penalize gaps
- Penalize long consecutive classes
- Encourage balanced morning/afternoon distribution
- Improve overall timetable score

## Security
- `.env`, `.venv`, and `__pycache__` are ignored
- Supabase keys must never be committed
- Regenerate keys if leaked

## Roadmap
- React admin dashboard
- Teacher portal
- Student timetable view
- Export to PDF/Excel
- Notifications
- Deployment (Render/Supabase Edge)

## License
MIT License.

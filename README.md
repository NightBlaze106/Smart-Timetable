# Smart Timetable – AI Timetable Generator

An intelligent timetable generator built with FastAPI, Supabase, and a constraint-based scheduling engine. Automates class scheduling using teacher availability, subject hour requirements, and optimized scoring.

## Features
- Automatic timetable generation
- Hard constraints (no clashes, no double booking)
- Soft constraints (gaps, consecutive periods, afternoon load balancing)
- Teacher / subject / hour allocation management
- Supabase Postgres + Auth
- Clean modular FastAPI backend
- React frontend (WIP)

## Tech Stack
- Python, FastAPI, Uvicorn
- Supabase Postgres
- Supabase Auth
- Vite + React (frontend)
- JWT-based authentication

## Folder Structure
ai-timetable/
├── timetable-backend/
│   ├── main.py
│   ├── routers/
│   ├── services/
│   ├── core/
│   ├── models/
│   ├── utils/
│   ├── .env        (backend environment)
│   └── requirements.txt
└── timetable-frontend/
    ├── index.html
    ├── src/
    ├── .env        (frontend environment)
    └── package.json

## Backend Setup

### 1. Clone
    git clone https://github.com/NightBlaze106/Smart-Timetable.git
    cd Smart-Timetable/ai-timetable/timetable-backend

### 2. Virtual Environment
    python -m venv .venv
    .\.venv\Scripts\activate

### 3. Install Dependencies
    pip install -r requirements.txt

### 4. Backend .env
Create file: timetable-backend/.env

    SUPABASE_URL=your-supabase-url
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
    HOST=0.0.0.0
    PORT=8000

### 5. Run Backend
    uvicorn main:app --reload

API Docs:  
http://localhost:8000/docs

## Frontend Setup (Vite + React)

### 1. Go to frontend folder
    cd ../timetable-frontend

### 2. Install dependencies
    npm install

### 3. Frontend .env
Create file: timetable-frontend/.env

    VITE_SUPABASE_URL=your-supabase-url
    VITE_SUPABASE_ANON_KEY=your-anon-key

### 4. Start frontend
    npm run dev

Frontend runs on Vite (default port 5173).

## Timetable Engine – How It Works

### Hard Constraints
- A teacher cannot be in two classes at the same time
- A class cannot have more than one subject per slot
- Subject hours must fit the weekly availability
- Teacher cannot exceed assigned hours

### Soft Constraints (Scoring)
- Penalise unnecessary gaps
- Penalise too many consecutive periods
- Encourage balanced morning/afternoon distribution
- Improve overall timetable score via iterative attempts

The engine evaluates multiple schedules and selects the highest-scoring valid one.

## Security Notes
- `.env`, `.venv`, and `__pycache__` are ignored
- Never commit service-role keys or anon keys
- Regenerate Supabase keys immediately if leaked

## Roadmap
- React admin dashboard
- Teacher portal
- Student timetable view
- Export PDF / Excel
- Notifications & timetable updates
- Deployment (Render / Supabase Edge)

## License
MIT License.

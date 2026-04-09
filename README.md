# TicketShield

TicketShield is a secure football ticket booking platform built with Next.js, Supabase, and a Python-based AI risk scoring service.

The project focuses on reducing suspicious booking behavior during seat selection and checkout by combining behavioral event tracking, server-side risk evaluation, and an admin monitoring dashboard.

## Demo Scope

This repository includes:

- Public booking flow for football matches
- Authentication with Supabase
- Match browsing and seat selection
- Payment flow with secure checkout checks
- Ticket history and profile pages
- Admin dashboard for matches, tickets, users, promotions, and AI security monitoring
- Python AI service for session risk scoring

## Key Features

- Real-time-style booking flow with match and seat selection
- Supabase-backed authentication and data access
- Internationalized routing with Vietnamese and English locales
- AI-assisted risk detection during checkout
- Security event logging for booking sessions
- Admin dashboard with risk review and enforcement context
- User blocking and ticket status management
- Promotion management and match administration

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

### Backend and Data

- Supabase
- Next.js Route Handlers

### AI Service

- FastAPI
- scikit-learn
- joblib
- NumPy
- pandas

## Project Structure

```text
app/                 Next.js app routes
components/          UI components
hooks/               Client hooks
lib/                 Business logic, AI integration, admin analytics
messages/            i18n message files
utils/               Supabase and app utilities
python-ai/           Python risk scoring service
.github/workflows/   CI configuration
```

## Security and AI Flow

TicketShield calculates behavioral features from the user's seat selection session, then sends those features to a Python risk scoring service.

Flow summary:

1. User interacts with the seat map
2. Session behavior is converted into structured features
3. The app sends those features to the AI risk service
4. The AI service returns a risk level such as `low`, `warning`, or `high`
5. The app uses that result during secure checkout and stores related booking event metadata
6. Admin users can inspect suspicious sessions in the AI Security dashboard

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PYTHON_AI_URL=http://127.0.0.1:8000/predict
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the Next.js app

```bash
npm run dev
```

### 3. Run the Python AI service

Open another terminal:

```bash
cd python-ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn predict_api:app --host 127.0.0.1 --port 8000
```

### 4. Open the app

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
```

## Admin Modules

The admin area currently includes:

- Dashboard
- Matches management
- Tickets management
- User blocking and unblocking
- Promotions management
- AI security monitoring
- Settings overview

## AI Model Notes

The Python service inside `python-ai/` contains:

- `predict_api.py`: inference API
- `train_model.py`: retraining script
- `risk_model.pkl`: trained model artifact
- `risk_model_meta.json`: model metadata and evaluation summary

Dataset files are not included in the repository by default.

## Current Limitations

- Local setup requires a working Supabase project
- The Python AI service must be running for full risk-check behavior
- Deployment secrets and seeded demo data are not documented in this repository yet

## CI

GitHub Actions runs:

- dependency install
- lint
- typecheck
- production build

## Author

NguyenViAn

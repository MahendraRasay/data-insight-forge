# InsightForge

InsightForge is a stateless full-stack data analysis app that lets you upload a CSV file, inspect the dataset, generate visualizations, surface rule-based insights, and export a PDF report.

## What It Does

- Upload a CSV file for automated analysis
- Show dataset overview and summary statistics
- Display missing values and correlation heatmaps
- Generate histograms, boxplots, scatter plots, and other charts
- Surface rule-based quality insights such as missingness, outliers, duplicates, and skewness
- Download a PDF report with the analysis results

## Architecture

React frontend -> Node.js Express backend -> embedded Python FastAPI analysis service

The app does not use a database. Uploaded files and generated artifacts are temporary.

Temporary folders:

- server/uploads
- server/python_service/generated_reports
- server/python_service/temp_charts

## Project Structure

client/
- src/
  - components/
  - pages/
- package.json

server/
- src/
  - routes/
  - controllers/
- python_service/
  - app.py
  - utils/
  - requirements.txt
- uploads/
- package.json

## Prerequisites

- Node.js 18 or newer
- Python 3.10 or newer
- npm

## Environment Variables

Frontend and backend use separate `.env` files.

### server/.env

```env
PORT=5000
# Leave unset for embedded Python mode.
# Set this only if using an external Python service.
# PYTHON_SERVICE_URL=http://127.0.0.1:8000
MAX_FILE_SIZE_MB=500
OPENAI_MODEL=gpt-4.1-mini
MAX_CONTEXT_ROWS=8
OPENAI_API_KEY=
```

`OPENAI_API_KEY` is optional. Add it only if you want AI insights and chat responses; the app still runs without it.

### client/.env

```env
VITE_SERVER_URL=http://localhost:5000/api
```

## Install Dependencies

Run these commands from the project root.

### 1) Python environment for the embedded ML service

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r server\python_service\requirements.txt
```

If you already have the `.venv` folder created, activate it and install the requirements.

### 2) Node dependencies

```powershell
cd server
npm install
cd ..
cd client
npm install
cd ..
```

## Run the Project Properly

Start backend and frontend in separate terminals.

### Terminal 1: Backend (Node + embedded Python)

```powershell
cd server
npm run install-python-deps
npm run dev
```

### Terminal 2: Frontend

```powershell
cd client
npm run dev
```

## Open the App

After both services are running, open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/health

## Deployment (Free-Friendly)

Recommended layout:

- Frontend: Cloudflare Pages
- Backend: one Render Web Service (`server` folder)

### Render backend

Use the `server` folder as the Render root.

```text
Root Directory: server
Build Command: npm install && python -m pip install -r python_service/requirements.txt
Start Command: npm start
```

Backend env vars on Render:

```env
MAX_FILE_SIZE_MB=500
OPENAI_MODEL=gpt-4.1-mini
MAX_CONTEXT_ROWS=8
OPENAI_API_KEY=
```

Leave `PYTHON_SERVICE_URL` unset so the Node gateway starts the embedded Python service automatically.

If Render’s image exposes `python3` instead of `python`, use this build command instead:

```text
npm install && python3 -m pip install -r python_service/requirements.txt
```

### Cloudflare Pages frontend

Use the `client` folder as the Cloudflare Pages project root.

```env
VITE_SERVER_URL=https://your-backend.onrender.com/api
```

Cloudflare Pages settings:

```text
Root Directory: client
Build Command: npm install && npm run build
Build Output Directory: dist
```

## API Endpoints

Backend API:

- `POST /api/upload`
- `POST /api/chat`
- `POST /api/download`
- `GET /health`

Embedded Python API (internal, auto-started when `PYTHON_SERVICE_URL` is unset):

- `POST /analyze`
- `POST /chat`
- `POST /download`
- `GET /health`

## Notes

- The frontend is focused on dataset analysis and visualization.
- Files are stored temporarily and cleaned up after processing.
- AI features are optional and only require `OPENAI_API_KEY` if you want LLM-backed insights and chat.
- If the key is missing, the app still works with rule-based analysis.

## Troubleshooting

- If the frontend does not load, confirm Vite is running on port 5173.
- If upload requests fail, confirm backend is running on port 5000.
- If `npm run dev` fails with `EADDRINUSE`, free the port or use another port:

  ```powershell
  $env:PORT=5001
  npm run dev
  ```

- If AI responses are empty or fallback text appears, check backend `OPENAI_API_KEY`.
- If PowerShell blocks activation of `.venv`, use the Python executable directly from `.venv\Scripts\python.exe`.

## Verification

When everything is correct, the following should respond successfully:

```powershell
Invoke-RestMethod http://localhost:5000/health
```

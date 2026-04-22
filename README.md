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

React frontend -> Node.js Express gateway -> Python FastAPI ML service -> OpenAI API

The app does not use a database. Uploaded files and generated artifacts are temporary.

Temporary folders:

- server/uploads
- ml-service/generated_reports
- ml-service/temp_charts

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
- uploads/
- package.json

ml-service/
- app.py
- utils/
- generated_reports/
- requirements.txt

## Prerequisites

- Node.js 18 or newer
- Python 3.10 or newer
- npm

## Environment Variables

Each service uses its own `.env` file.

### ml-service/.env

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
MAX_CONTEXT_ROWS=8
```

If `OPENAI_API_KEY` is empty, the app still returns rule-based insights and fallback responses for AI features.

### server/.env

```env
PORT=5000
PYTHON_SERVICE_URL=http://localhost:8000
MAX_FILE_SIZE_MB=500
```

### client/.env

```env
VITE_SERVER_URL=http://localhost:5000/api
```

## Install Dependencies

Run these commands from the project root.

### 1) Python environment for the ML service

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r ml-service\requirements.txt
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

Start each service in its own terminal window.

### Terminal 1: ML service

```powershell
cd ml-service
& ..\.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: Node gateway

```powershell
cd server
npm run dev
```

### Terminal 3: React client

```powershell
cd client
npm run dev
```

## Open the App

After all three services are running, open:

- Frontend: http://localhost:5173
- Gateway health: http://localhost:5000/health
- ML service health: http://localhost:8000/health

## Recommended Workflow

1. Open the frontend in the browser.
2. Upload a CSV file.
3. Wait for the dataset analysis to complete.
4. Review summary cards, insights, and charts.
5. Download the PDF report when needed.

## API Endpoints

### Gateway API

- `POST /api/upload`
- `POST /api/chat`
- `POST /api/download`

### ML Service API

- `POST /analyze`
- `POST /chat`
- `POST /download`

### Health Checks

- `GET /health` on the gateway
- `GET /health` on the ML service

## Notes

- The frontend is focused on dataset analysis and visualization.
- Files are stored temporarily and cleaned up after processing.
- AI features depend on the backend environment variables, especially `OPENAI_API_KEY`.
- If the key is missing, the app still works for rule-based analysis.

## Troubleshooting

- If the frontend does not load, confirm Vite is running on port 5173.
- If upload requests fail, confirm the gateway is running on port 5000.
- If analysis fails, confirm the ML service is running on port 8000.
- If AI responses are empty or fallback text appears, check `ml-service/.env`.
- If PowerShell blocks activation of `.venv`, use the Python executable directly from `.venv\Scripts\python.exe`.

## Verification

When everything is correct, the following should respond successfully:

```powershell
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:8000/health
```

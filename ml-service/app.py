import io
import os
from typing import Any, Dict

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from utils.charts import generate_charts
from utils.insights import (
    answer_dataset_question,
    generate_llm_insights,
    generate_rule_based_insights,
)
from utils.pdf_report import generate_pdf_report

load_dotenv()

app = FastAPI(title="AI Data Insight Engine - ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
MAX_CONTEXT_ROWS = int(os.getenv("MAX_CONTEXT_ROWS", "8"))


class ChatRequest(BaseModel):
    question: str
    context: Dict[str, Any]


class DownloadRequest(BaseModel):
    filename: str = "ai_data_insight_report.pdf"
    analysis: Dict[str, Any]


def _to_json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(k): _to_json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_to_json_safe(item) for item in value]
    if isinstance(value, (np.integer, np.floating)):
        return value.item()
    if isinstance(value, np.ndarray):
        return value.tolist()
    if pd.isna(value):
        return None
    return value


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "ml-service"}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)) -> JSONResponse:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    try:
        data = await file.read()
        df = pd.read_csv(io.BytesIO(data))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {exc}") from exc

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded CSV is empty")

    numeric_df = df.select_dtypes(include=[np.number])

    overview = {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "memory_usage_mb": round(float(df.memory_usage(deep=True).sum() / (1024 * 1024)), 3),
    }

    summary_stats = _to_json_safe(df.describe(include="all").fillna("").to_dict())
    missing_values = _to_json_safe(df.isna().sum().to_dict())
    missing_percentages = _to_json_safe((df.isna().mean() * 100).round(2).to_dict())
    dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
    duplicate_count = int(df.duplicated().sum())

    categorical_columns = df.select_dtypes(include=["object", "category", "bool"])
    categorical_summary: Dict[str, Any] = {}
    for column in categorical_columns.columns:
        series = categorical_columns[column].astype("string")
        top_categories = [
            {"value": _to_json_safe(index), "count": int(count)}
            for index, count in series.value_counts(dropna=False).head(5).items()
        ]

        categorical_summary[column] = {
            "unique_count": int(series.nunique(dropna=True)),
            "missing_count": int(series.isna().sum()),
            "top_categories": top_categories,
        }

    corr_data: Dict[str, Any] = {}
    if not numeric_df.empty:
        corr_data = _to_json_safe(numeric_df.corr(numeric_only=True).fillna(0).to_dict())

    charts = generate_charts(df)
    rule_insights = generate_rule_based_insights(df)
    ai_insights = generate_llm_insights(
        model=OPENAI_MODEL,
        api_key=OPENAI_API_KEY,
        summary_stats=summary_stats,
        missing_values=missing_values,
        correlations=corr_data,
        dtypes=dtypes,
    )

    sample_rows = _to_json_safe(df.head(MAX_CONTEXT_ROWS).to_dict(orient="records"))
    dataset_context = {
        "overview": overview,
        "summary_stats": summary_stats,
        "missing_values": missing_values,
        "correlations": corr_data,
        "dtypes": dtypes,
        "sample_rows": sample_rows,
    }

    return JSONResponse(
        {
            "filename": file.filename,
            "overview": overview,
            "summary_stats": summary_stats,
            "missing_values": missing_values,
            "missing_percentages": missing_percentages,
            "correlation_matrix": corr_data,
            "dtypes": dtypes,
            "duplicate_count": duplicate_count,
            "categorical_summary": categorical_summary,
            "charts": charts,
            "rule_based_insights": rule_insights,
            "ai_insights": ai_insights,
            "sample_rows": sample_rows,
            "dataset_context": dataset_context,
        }
    )


@app.post("/chat")
def chat(request: ChatRequest) -> Dict[str, str]:
    try:
        answer = answer_dataset_question(
            model=OPENAI_MODEL,
            api_key=OPENAI_API_KEY,
            context=request.context,
            question=request.question,
        )
        return {"answer": answer}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate chat response: {exc}") from exc


@app.post("/download")
def download(request: DownloadRequest) -> Response:
    try:
        pdf_bytes = generate_pdf_report(request.analysis)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {exc}") from exc

    headers = {
        "Content-Disposition": f"attachment; filename={request.filename}",
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)

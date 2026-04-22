import json
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from openai import OpenAI


def generate_rule_based_insights(df: pd.DataFrame) -> List[str]:
    insights: List[str] = []

    missing_pct = (df.isna().mean() * 100).sort_values(ascending=False)
    high_missing = missing_pct[missing_pct > 30]
    for col, pct in high_missing.items():
        insights.append(
            f"Column '{col}' has {pct:.1f}% missing values, which may reduce analysis quality."
        )

    duplicate_rows = int(df.duplicated().sum())
    if duplicate_rows > 0:
        insights.append(
            f"Detected {duplicate_rows} duplicate rows. Consider deduplicating before modeling."
        )

    numeric_df = df.select_dtypes(include=[np.number])
    if not numeric_df.empty:
        corr = numeric_df.corr(numeric_only=True)
        upper = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool))
        strong_pairs = [
            (r, c, upper.loc[r, c])
            for r in upper.index
            for c in upper.columns
            if pd.notna(upper.loc[r, c]) and abs(float(upper.loc[r, c])) > 0.8
        ]
        for left, right, value in strong_pairs[:8]:
            direction = "positive" if value > 0 else "negative"
            insights.append(
                f"Strong {direction} correlation between '{left}' and '{right}' (r={value:.2f})."
            )

        q1 = numeric_df.quantile(0.25)
        q3 = numeric_df.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper_bounds = q3 + 1.5 * iqr
        for col in numeric_df.columns:
            outlier_mask = (numeric_df[col] < lower[col]) | (numeric_df[col] > upper_bounds[col])
            outlier_count = int(outlier_mask.sum())
            if outlier_count > 0:
                pct = (outlier_count / max(len(numeric_df), 1)) * 100
                if pct > 2:
                    insights.append(
                        f"Column '{col}' has {outlier_count} potential outliers ({pct:.1f}% of rows) based on IQR."
                    )

        skew_values = numeric_df.skew(numeric_only=True).dropna()
        skewed = skew_values[abs(skew_values) > 1]
        for col, skew in skewed.items():
            skew_type = "right-skewed" if skew > 0 else "left-skewed"
            insights.append(
                f"Column '{col}' is highly {skew_type} (skewness={skew:.2f}), which may impact assumptions."
            )

        low_var_cols = []
        for col in numeric_df.columns:
            if numeric_df[col].nunique(dropna=True) <= 1:
                low_var_cols.append(col)
            else:
                variance = float(numeric_df[col].var())
                if variance < 1e-8:
                    low_var_cols.append(col)

        for col in low_var_cols:
            insights.append(
                f"Column '{col}' has near-constant values and may provide little predictive signal."
            )

    if not insights:
        insights.append("No major data-quality or statistical red flags were detected by rule-based checks.")

    return insights


def _safe_json(data: Any) -> str:
    return json.dumps(data, ensure_ascii=True, default=str)


def build_llm_summary_payload(
    summary_stats: Dict[str, Any],
    missing_values: Dict[str, Any],
    correlations: Dict[str, Any],
    dtypes: Dict[str, str],
) -> str:
    return (
        "Dataset Summary:\n"
        + _safe_json(summary_stats)
        + "\n\nMissing Values:\n"
        + _safe_json(missing_values)
        + "\n\nCorrelations:\n"
        + _safe_json(correlations)
        + "\n\nColumn Types:\n"
        + _safe_json(dtypes)
    )


def generate_llm_insights(
    *,
    model: str,
    api_key: str,
    summary_stats: Dict[str, Any],
    missing_values: Dict[str, Any],
    correlations: Dict[str, Any],
    dtypes: Dict[str, str],
) -> List[str]:
    if not api_key:
        return [
            "OpenAI API key is not configured. Add OPENAI_API_KEY in the ML service environment to enable intelligent insights."
        ]

    payload = build_llm_summary_payload(summary_stats, missing_values, correlations, dtypes)

    prompt = (
        "You are a senior data scientist and business analyst.\n\n"
        "Analyze the dataset summary and generate meaningful, human-readable insights.\n\n"
        "Focus on:\n"
        "- Key patterns\n"
        "- Strong correlations\n"
        "- Data quality issues\n"
        "- Business implications\n"
        "- Actionable recommendations\n\n"
        "Avoid technical jargon.\n\n"
        f"{payload}\n\n"
        "Output:\n"
        "- Bullet point insights\n"
        "- Clear explanations"
    )

    client = OpenAI(api_key=api_key)
    response = client.responses.create(
        model=model,
        input=prompt,
        max_output_tokens=600,
        temperature=0.3,
    )

    text = response.output_text.strip()
    if not text:
        return ["The model returned an empty insight response."]

    lines = [line.strip("- \t") for line in text.splitlines() if line.strip()]
    return lines if lines else [text]


def answer_dataset_question(
    *,
    model: str,
    api_key: str,
    context: Dict[str, Any],
    question: str,
) -> str:
    if not api_key:
        return "OpenAI API key is not configured, so chat is unavailable."

    prompt = (
        "You are a data analyst.\n\n"
        "Answer the user's question based on the dataset context below.\n\n"
        f"Context:\n{_safe_json(context)}\n\n"
        f"Question:\n{question}\n\n"
        "Answer clearly and concisely."
    )

    client = OpenAI(api_key=api_key)
    response = client.responses.create(
        model=model,
        input=prompt,
        max_output_tokens=400,
        temperature=0.2,
    )

    return response.output_text.strip() or "No answer was generated for this question."

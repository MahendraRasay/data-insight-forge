import base64
import io
from typing import Dict, List

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


def _fig_to_base64() -> str:
    buffer = io.BytesIO()
    plt.savefig(buffer, format="png", dpi=140, bbox_inches="tight")
    buffer.seek(0)
    encoded = base64.b64encode(buffer.read()).decode("utf-8")
    buffer.close()
    plt.close()
    return encoded


def generate_charts(df: pd.DataFrame) -> Dict[str, str]:
    charts: Dict[str, str] = {}
    numeric_cols: List[str] = list(df.select_dtypes(include=[np.number]).columns)

    if numeric_cols:
        selected = numeric_cols[:4]

        fig, axes = plt.subplots(len(selected), 1, figsize=(8, 2.5 * len(selected)))
        if len(selected) == 1:
            axes = [axes]
        for ax, col in zip(axes, selected):
            sns.histplot(df[col].dropna(), kde=True, ax=ax, color="#2563eb")
            ax.set_title(f"Histogram - {col}")
        plt.tight_layout()
        charts["histograms"] = _fig_to_base64()

        fig, axes = plt.subplots(len(selected), 1, figsize=(8, 2.5 * len(selected)))
        if len(selected) == 1:
            axes = [axes]
        for ax, col in zip(axes, selected):
            sns.boxplot(x=df[col], ax=ax, color="#f59e0b")
            ax.set_title(f"Boxplot - {col}")
        plt.tight_layout()
        charts["boxplots"] = _fig_to_base64()

        if len(numeric_cols) >= 2:
            x_col, y_col = numeric_cols[0], numeric_cols[1]
            plt.figure(figsize=(7, 5))
            sns.scatterplot(data=df, x=x_col, y=y_col, alpha=0.7, color="#059669")
            plt.title(f"Scatter Plot - {x_col} vs {y_col}")
            charts["scatter"] = _fig_to_base64()

        corr = df[numeric_cols].corr(numeric_only=True)
        if not corr.empty:
            plt.figure(figsize=(8, 6))
            sns.heatmap(corr, annot=True, fmt=".2f", cmap="YlGnBu")
            plt.title("Correlation Heatmap")
            charts["correlation_heatmap"] = _fig_to_base64()

    return charts

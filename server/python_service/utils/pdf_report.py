import base64
import io
from datetime import datetime
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def _build_overview_table(overview: Dict[str, Any]) -> Table:
    rows = [["Metric", "Value"]]
    for key, value in overview.items():
        rows.append([str(key), str(value)])

    table = Table(rows, colWidths=[7 * cm, 8 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ]
        )
    )
    return table


def _append_bullets(story: List[Any], title: str, bullets: List[str], bullet_style: ParagraphStyle) -> None:
    story.append(Paragraph(title, bullet_style))
    for item in bullets:
        story.append(Paragraph(f"- {item}", bullet_style))
    story.append(Spacer(1, 0.3 * cm))


def _chart_image_from_base64(image_data: str, width_cm: float = 15.5) -> Image:
    raw = base64.b64decode(image_data)
    buffer = io.BytesIO(raw)
    image = Image(buffer)
    image.drawWidth = width_cm * cm
    image.drawHeight = image.drawWidth * 0.6
    return image


def generate_pdf_report(analysis: Dict[str, Any]) -> bytes:
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = styles["Heading2"]
    body_style = styles["BodyText"]

    body_style.fontSize = 10
    body_style.leading = 14

    story: List[Any] = []
    story.append(Paragraph("AI Data Insight Report", title_style))
    story.append(
        Paragraph(
            f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
            body_style,
        )
    )
    story.append(Spacer(1, 0.5 * cm))

    overview = analysis.get("overview", {})
    story.append(Paragraph("Dataset Overview", heading_style))
    story.append(_build_overview_table(overview))
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph("Summary Statistics", heading_style))
    summary_stats = analysis.get("summary_stats", {})
    story.append(Paragraph(str(summary_stats)[:4500], body_style))
    story.append(Spacer(1, 0.4 * cm))

    correlation_matrix = analysis.get("correlation_matrix", {})
    if correlation_matrix:
        story.append(Paragraph("Correlation Matrix", heading_style))
        story.append(Paragraph(str(correlation_matrix)[:4500], body_style))
        story.append(Spacer(1, 0.4 * cm))

    duplicate_count = analysis.get("duplicate_count")
    if duplicate_count is not None:
        story.append(Paragraph("Duplicate Rows", heading_style))
        story.append(Paragraph(f"Duplicate rows detected: {duplicate_count}", body_style))
        story.append(Spacer(1, 0.4 * cm))

    charts = analysis.get("charts", {})
    if charts:
        story.append(Paragraph("Visualizations", heading_style))
        for label, encoded in charts.items():
            story.append(Paragraph(label.replace("_", " ").title(), body_style))
            story.append(_chart_image_from_base64(encoded))
            story.append(Spacer(1, 0.3 * cm))

    rule_insights = analysis.get("rule_based_insights", [])

    _append_bullets(story, "Rule-Based Insights", rule_insights, body_style)

    story.append(Paragraph("Conclusion", heading_style))
    story.append(
        Paragraph(
            "Use these findings to prioritize data cleaning, validate assumptions with domain stakeholders, and drive targeted business actions.",
            body_style,
        )
    )

    doc.build(story)
    pdf_buffer.seek(0)
    return pdf_buffer.read()

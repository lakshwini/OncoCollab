"""
OncoCollab — Générateur PDF du compte-rendu RCP.
Utilise ReportLab. Template adapté à la charte OncoCollab (dérivée de l'UI sombre du projet,
mais le PDF reste sur fond blanc pour impression / archivage médical).
"""

import logging
from datetime import datetime
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    HRFlowable,
)
from reportlab.lib import colors

logger = logging.getLogger(__name__)

# Charte OncoCollab — bleu médical primaire, accent saumon
ONCOCOLLAB_PRIMARY = colors.HexColor("#0F4C81")
ONCOCOLLAB_ACCENT = colors.HexColor("#E76F51")
ONCOCOLLAB_LIGHT = colors.HexColor("#EAF1F8")
ONCOCOLLAB_TEXT = colors.HexColor("#1F2937")
ONCOCOLLAB_MUTED = colors.HexColor("#6B7280")


class MeetingReportPDF:
    def __init__(self, organization_name: str = "OncoCollab"):
        self.organization_name = organization_name
        self.styles = getSampleStyleSheet()
        self._setup_styles()
        logger.info(f"PDF generator prêt (org={organization_name})")

    def _setup_styles(self):
        self.styles.add(
            ParagraphStyle(
                name="OC_Title",
                parent=self.styles["Heading1"],
                fontSize=20,
                textColor=ONCOCOLLAB_PRIMARY,
                fontName="Helvetica-Bold",
                alignment=TA_CENTER,
                spaceAfter=8,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="OC_Subtitle",
                parent=self.styles["Normal"],
                fontSize=11,
                textColor=ONCOCOLLAB_MUTED,
                fontName="Helvetica-Oblique",
                alignment=TA_CENTER,
                spaceAfter=20,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="OC_OrgHeader",
                parent=self.styles["Normal"],
                fontSize=10,
                textColor=ONCOCOLLAB_PRIMARY,
                fontName="Helvetica-Bold",
                alignment=TA_CENTER,
                spaceAfter=4,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="OC_Section",
                parent=self.styles["Heading2"],
                fontSize=14,
                textColor=ONCOCOLLAB_PRIMARY,
                fontName="Helvetica-Bold",
                spaceBefore=14,
                spaceAfter=8,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="OC_Subsection",
                parent=self.styles["Heading3"],
                fontSize=12,
                textColor=ONCOCOLLAB_ACCENT,
                fontName="Helvetica-Bold",
                spaceBefore=8,
                spaceAfter=4,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="OC_Body",
                parent=self.styles["Normal"],
                fontSize=10.5,
                textColor=ONCOCOLLAB_TEXT,
                alignment=TA_JUSTIFY,
                leading=14,
                spaceAfter=8,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="OC_Bullet",
                parent=self.styles["Normal"],
                fontSize=10.5,
                textColor=ONCOCOLLAB_TEXT,
                leftIndent=14,
                bulletIndent=4,
                spaceAfter=4,
                leading=13,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="OC_Meta",
                parent=self.styles["Normal"],
                fontSize=9.5,
                textColor=ONCOCOLLAB_MUTED,
                spaceAfter=2,
            )
        )

    def generate(
        self,
        structured_data: dict,
        output_path: str,
        report_title: str = "Compte-rendu de RCP",
        meeting_id: str = "",
        meeting_date: str = "",
    ) -> str:
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)

        doc = SimpleDocTemplate(
            str(out),
            pagesize=A4,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=1.6 * cm,
            bottomMargin=1.6 * cm,
            title=report_title,
            author=self.organization_name,
        )

        story = []
        story.extend(self._header(report_title, meeting_id, meeting_date))
        story.extend(self._metadata(structured_data))
        story.extend(self._participants(structured_data))
        story.extend(self._summary(structured_data))
        story.extend(self._patients(structured_data))
        story.extend(self._sections(structured_data))
        story.extend(self._key_points(structured_data))
        story.extend(self._action_items(structured_data))
        story.extend(self._decisions(structured_data))
        story.extend(self._footer())

        doc.build(story)
        logger.info(f"PDF généré: {out}")
        return str(out)

    def _header(self, title: str, meeting_id: str, meeting_date: str):
        elems = []
        elems.append(Paragraph(self.organization_name.upper(), self.styles["OC_OrgHeader"]))
        elems.append(Paragraph(title, self.styles["OC_Title"]))
        subtitle = "Compte-rendu généré automatiquement"
        if meeting_date:
            subtitle += f" — {meeting_date}"
        elems.append(Paragraph(subtitle, self.styles["OC_Subtitle"]))
        elems.append(
            HRFlowable(width="100%", thickness=1, color=ONCOCOLLAB_PRIMARY, spaceAfter=10)
        )
        if meeting_id:
            elems.append(Paragraph(f"Identifiant réunion : {meeting_id}", self.styles["OC_Meta"]))
        elems.append(
            Paragraph(
                f"Généré le : {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
                self.styles["OC_Meta"],
            )
        )
        elems.append(Spacer(1, 0.3 * cm))
        return elems

    def _metadata(self, data):
        elems = []
        meta = data.get("meeting_metadata", {}) or {}
        rows = []
        if meta.get("type"):
            rows.append(("Type", str(meta.get("type"))))
        if meta.get("specialty"):
            rows.append(("Spécialité", str(meta.get("specialty"))))
        if meta.get("duration_estimate"):
            rows.append(("Durée estimée", str(meta.get("duration_estimate"))))

        if rows:
            for label, val in rows:
                elems.append(
                    Paragraph(f"<b>{label} :</b> {val}", self.styles["OC_Meta"])
                )
            elems.append(Spacer(1, 0.3 * cm))
        return elems

    def _participants(self, data):
        elems = []
        participants = data.get("participants") or []
        if not participants:
            return elems
        elems.append(Paragraph("Participants", self.styles["OC_Section"]))
        for p in participants:
            elems.append(Paragraph(f"• {self._safe(str(p))}", self.styles["OC_Bullet"]))
        elems.append(Spacer(1, 0.2 * cm))
        return elems

    def _summary(self, data):
        elems = []
        summary = (data.get("summary") or "").strip()
        if not summary:
            return elems
        elems.append(Paragraph("Résumé", self.styles["OC_Section"]))
        elems.append(Paragraph(self._safe(summary), self.styles["OC_Body"]))
        return elems

    def _patients(self, data):
        elems = []
        patients = data.get("patients_discussed") or []
        if not patients:
            return elems
        elems.append(Paragraph("Patients discutés", self.styles["OC_Section"]))
        for i, p in enumerate(patients, 1):
            label = self._safe(str(p.get("label") or f"Patient {i}"))
            elems.append(Paragraph(label, self.styles["OC_Subsection"]))
            if p.get("context"):
                elems.append(
                    Paragraph(f"<b>Contexte :</b> {self._safe(str(p['context']))}", self.styles["OC_Body"])
                )
            if p.get("discussion"):
                elems.append(
                    Paragraph(f"<b>Discussion :</b> {self._safe(str(p['discussion']))}", self.styles["OC_Body"])
                )
            if p.get("decision"):
                elems.append(
                    Paragraph(f"<b>Décision :</b> {self._safe(str(p['decision']))}", self.styles["OC_Body"])
                )
            if p.get("next_steps"):
                elems.append(
                    Paragraph(f"<b>Suite :</b> {self._safe(str(p['next_steps']))}", self.styles["OC_Body"])
                )
            elems.append(Spacer(1, 0.1 * cm))
        return elems

    def _sections(self, data):
        elems = []
        sections = data.get("sections") or []
        if not sections:
            return elems
        elems.append(Paragraph("Déroulé de la réunion", self.styles["OC_Section"]))
        for s in sections:
            title = self._safe(str(s.get("title") or "Section"))
            content = self._safe(str(s.get("content") or ""))
            elems.append(Paragraph(title, self.styles["OC_Subsection"]))
            if content:
                elems.append(Paragraph(content, self.styles["OC_Body"]))
        return elems

    def _key_points(self, data):
        elems = []
        points = data.get("key_points") or []
        if not points:
            return elems
        elems.append(Paragraph("Points clés", self.styles["OC_Section"]))
        for p in points:
            elems.append(Paragraph(f"• {self._safe(str(p))}", self.styles["OC_Bullet"]))
        return elems

    def _action_items(self, data):
        elems = []
        items = data.get("action_items") or []
        if not items:
            return elems
        elems.append(Paragraph("Actions à mener", self.styles["OC_Section"]))

        table_data = [["Tâche", "Responsable", "Échéance"]]
        for it in items:
            table_data.append(
                [
                    Paragraph(self._safe(str(it.get("task") or "—")), self.styles["OC_Body"]),
                    Paragraph(self._safe(str(it.get("responsible") or "À définir")), self.styles["OC_Body"]),
                    Paragraph(self._safe(str(it.get("deadline") or "—")), self.styles["OC_Body"]),
                ]
            )
        table = Table(table_data, colWidths=[8.5 * cm, 4.5 * cm, 3.5 * cm])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), ONCOCOLLAB_PRIMARY),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 10.5),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                    ("TOPPADDING", (0, 0), (-1, 0), 8),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 1), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
                    ("GRID", (0, 0), (-1, -1), 0.5, ONCOCOLLAB_LIGHT),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ONCOCOLLAB_LIGHT]),
                ]
            )
        )
        elems.append(table)
        elems.append(Spacer(1, 0.3 * cm))
        return elems

    def _decisions(self, data):
        elems = []
        decisions = data.get("decisions") or []
        if not decisions:
            return elems
        elems.append(Paragraph("Décisions prises", self.styles["OC_Section"]))
        for i, d in enumerate(decisions, 1):
            elems.append(
                Paragraph(f"{i}. {self._safe(str(d))}", self.styles["OC_Body"])
            )
        return elems

    def _footer(self):
        elems = []
        elems.append(Spacer(1, 0.5 * cm))
        elems.append(
            HRFlowable(width="100%", thickness=0.5, color=ONCOCOLLAB_LIGHT, spaceBefore=8, spaceAfter=6)
        )
        elems.append(
            Paragraph(
                "Ce document a été généré automatiquement par OncoCollab à partir d'un enregistrement audio. "
                "Il doit être relu et validé par un médecin avant toute utilisation clinique.",
                self.styles["OC_Meta"],
            )
        )
        return elems

    @staticmethod
    def _safe(text: str) -> str:
        """Échappe les caractères XML problématiques pour ReportLab Paragraph."""
        if text is None:
            return ""
        return (
            text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )

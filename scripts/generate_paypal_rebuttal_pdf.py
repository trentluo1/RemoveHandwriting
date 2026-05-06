from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path("/Users/trent/Documents/cursor-project/RemoveHandwriting")
OUTPUT_DIR = ROOT / "artifacts" / "paypal-dispute"
OUTPUT_PDF = OUTPUT_DIR / "paypal_dispute_rebuttal_PP-R-KOH-627480350_2026-05-06.pdf"


@dataclass(frozen=True)
class Exhibit:
    title: str
    path: Path
    caption: str


EXHIBITS: list[Exhibit] = [
    Exhibit(
        title="Exhibit A",
        path=Path("/var/folders/nv/9n4sdmx11j385j3h_lpxb9zm0000gn/T/TemporaryItems/NSIRD_screencaptureui_sVTerR/截屏2026-05-06 11.47.32.png"),
        caption=(
            "PayPal dispute details submitted by the buyer. The buyer claims the product was "
            "not as described and requests a refund of USD 39.90."
        ),
    ),
    Exhibit(
        title="Exhibit B",
        path=Path("/var/folders/nv/9n4sdmx11j385j3h_lpxb9zm0000gn/T/TemporaryItems/NSIRD_screencaptureui_CuFLwd/截屏2026-05-06 11.47.54.png"),
        caption=(
            "Buyer email excerpt referencing refund language and a mobile-app PDF complaint. "
            "This complaint was raised after substantial paid use had already occurred on the web platform."
        ),
    ),
    Exhibit(
        title="Exhibit C",
        path=Path("/var/folders/nv/9n4sdmx11j385j3h_lpxb9zm0000gn/T/TemporaryItems/NSIRD_screencaptureui_1A7a27/截屏2026-05-06 11.52.22.png"),
        caption=(
            "Login gate requiring the user to affirmatively accept the Terms of Service and Refund Policy before continuing."
        ),
    ),
    Exhibit(
        title="Exhibit D",
        path=Path("/var/folders/nv/9n4sdmx11j385j3h_lpxb9zm0000gn/T/TemporaryItems/NSIRD_screencaptureui_a9vqZr/截屏2026-05-06 11.59.42.png"),
        caption=(
            "Admin user record showing the account email, subscription state, remaining subscription credits, "
            "legal consent acceptance time, and legal consent version."
        ),
    ),
    Exhibit(
        title="Exhibit E",
        path=Path("/var/folders/nv/9n4sdmx11j385j3h_lpxb9zm0000gn/T/TemporaryItems/NSIRD_screencaptureui_BrwnIt/截屏2026-05-06 11.48.48.png"),
        caption=(
            "Admin process-job history showing 31 completed web processing jobs. Visible sample completion times "
            "are in the normal operating range and demonstrate actual successful delivery of the service."
        ),
    ),
]


def add_page_number(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#667085"))
    canvas.drawRightString(doc.pagesize[0] - 36, 24, f"Page {canvas.getPageNumber()}")
    canvas.restoreState()


def build_styles():
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "TitleCustom",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=21,
            leading=26,
            textColor=colors.HexColor("#14213D"),
            alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "subtitle": ParagraphStyle(
            "SubtitleCustom",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=colors.HexColor("#475467"),
            alignment=TA_CENTER,
            spaceAfter=14,
        ),
        "heading": ParagraphStyle(
            "HeadingCustom",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=10,
            spaceAfter=7,
        ),
        "body": ParagraphStyle(
            "BodyCustom",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10.3,
            leading=15.2,
            textColor=colors.HexColor("#1F2937"),
            alignment=TA_LEFT,
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "BulletCustom",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10.1,
            leading=14.6,
            textColor=colors.HexColor("#1F2937"),
            leftIndent=14,
            firstLineIndent=-8,
            bulletIndent=0,
            spaceAfter=4,
        ),
        "small": ParagraphStyle(
            "SmallCustom",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=12.5,
            textColor=colors.HexColor("#667085"),
            spaceAfter=4,
        ),
        "caption": ParagraphStyle(
            "CaptionCustom",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=13,
            textColor=colors.HexColor("#334155"),
            spaceBefore=6,
            spaceAfter=4,
        ),
    }
    return styles


def paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def bullets(items: Iterable[str], style: ParagraphStyle) -> list[Paragraph]:
    return [Paragraph(item, style, bulletText="•") for item in items]


def exhibit_image(exhibit: Exhibit, max_width: float, max_height: float) -> Image:
    with PILImage.open(exhibit.path) as img:
        width, height = img.size
    scale = min(max_width / width, max_height / height)
    return Image(str(exhibit.path), width=width * scale, height=height * scale)


def build_document() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    styles = build_styles()

    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=A4,
        leftMargin=42,
        rightMargin=42,
        topMargin=42,
        bottomMargin=38,
        title="Seller Response to PayPal Dispute PP-R-KOH-627480350",
        author="RemoveHandwriting",
        subject="PayPal dispute rebuttal",
    )

    story = []

    story.append(paragraph("Seller Response to PayPal Dispute", styles["title"]))
    story.append(paragraph("Case ID: PP-R-KOH-627480350", styles["title"]))
    story.append(
        paragraph(
            "Prepared for PayPal review regarding the buyer dispute filed on May 6, 2026, for USD 39.90.",
            styles["subtitle"],
        )
    )

    summary_table = Table(
        [
            ["Buyer Email", "mrmgsnyu@gmail.com"],
            ["Disputed Amount", "USD 39.90"],
            ["Purchase Type", "Basic Yearly subscription / 720 subscription credits per year"],
            ["Dispute Date", "May 6, 2026"],
            ["Core Position", "Service was delivered, repeatedly used, and the account exceeded the refund policy's light-usage threshold."],
        ],
        colWidths=[1.55 * inch, 4.75 * inch],
    )
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#CBD5E1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.7),
                ("LEADING", (0, 0), (-1, -1), 12),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0F172A")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(summary_table)
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#D0D5DD")))
    story.append(Spacer(1, 10))

    story.append(paragraph("Executive Summary", styles["heading"]))
    story.append(
        paragraph(
            "The buyer claims the product was not as described and requests a full refund. "
            "The account evidence does not support that claim. Before purchase, the buyer was required "
            "to accept the Terms of Service and Refund Policy. After purchase, the buyer successfully "
            "used the paid web service 31 times. The refund policy allows review within 3 days only for "
            "light testing, defined as fewer than 5 completed image-processing requests. This account "
            "materially exceeded that threshold.",
            styles["body"],
        )
    )
    story.extend(
        bullets(
            [
                "The service was actually delivered and consumed: internal records show 31 completed web processing jobs.",
                "The account profile shows legal consent accepted on 05/05/2026 at 09:58:12, version 1.0.0.",
                "The login flow requires affirmative acceptance of both the Terms of Service and Refund Policy before the user can continue.",
                "The account still showed 689 subscription credits remaining, which is consistent with 31 credits consumed from a 720-credit yearly plan.",
                "The refund policy is expressly limited to light testing: fewer than 5 completed image-processing requests.",
            ],
            styles["bullet"],
        )
    )

    story.append(paragraph("Chronology of Relevant Facts", styles["heading"]))
    story.extend(
        bullets(
            [
                "05/05/2026, 09:58:12: Account record shows the buyer accepted legal terms version 1.0.0.",
                "05/05/2026: The buyer purchased the USD 39.90 yearly plan associated with 720 subscription credits per year.",
                "05/05/2026 after purchase: Admin usage history shows 31 completed processing jobs on the web platform.",
                "Visible sample processing durations in the usage log range from about 3.6 seconds to 14.4 seconds, confirming normal successful job completion rather than non-delivery.",
                "05/06/2026: The buyer filed a PayPal dispute requesting a full refund.",
            ],
            styles["bullet"],
        )
    )

    story.append(paragraph("Applicable Terms and Refund Rules", styles["heading"]))
    story.extend(
        bullets(
            [
                "Terms & Conditions: 'Supported formats: JPG, PNG, and PDF files.'",
                "Terms & Conditions: 'All fees are non-refundable unless otherwise stated in our refund policy.'",
                "Refund Policy: every new user receives 3 free credits before paying, so quality can be tested without risk.",
                "Refund Policy: paid refunds within 3 days are intended only for 'light testing' and are defined as 'fewer than 5 completed image processing requests.'",
                "Refund Policy: for heavy or frequent usage, requests may be reviewed case by case.",
                "Bulk web workflow: the product copy expressly discloses 'Process up to 20 images at once.' This is a stated workflow limit, not a hidden defect.",
            ],
            styles["bullet"],
        )
    )

    story.append(paragraph("Point-by-Point Response to the Buyer's Claims", styles["heading"]))
    story.append(
        paragraph(
            "<b>1. 'Item not as described'</b><br/>"
            "The account data shows the opposite. The buyer successfully used the paid service 31 times on the web platform. "
            "A product that is repeatedly and successfully consumed after purchase is not an undelivered or unusable product.",
            styles["body"],
        )
    )
    story.append(
        paragraph(
            "<b>2. '3-day refund promise'</b><br/>"
            "The seller's refund policy is not an unconditional 3-day refund. It is a 3-day review window for light paid testing only, "
            "defined as fewer than 5 completed image-processing requests. This account far exceeded that threshold with 31 completed jobs.",
            styles["body"],
        )
    )
    story.append(
        paragraph(
            "<b>3. 'Only 20 images can be processed at once in the browser'</b><br/>"
            "That limit is openly disclosed in the product's bulk-processing page. A disclosed throughput limit is not a misrepresentation. "
            "It is simply part of the product workflow.",
            styles["body"],
        )
    )
    story.append(
        paragraph(
            "<b>4. 'Cannot convert PDF in the app'</b><br/>"
            "The buyer's own complaint mixes a mobile-app workflow issue with a paid service that was in fact used extensively on the web platform. "
            "The relevant internal usage records for this dispute show successful paid use on <b>Web</b>, not failed delivery of the purchased service.",
            styles["body"],
        )
    )
    story.append(
        paragraph(
            "<b>5. 'Too slow / not practical'</b><br/>"
            "The usage history shows repeated successful completions with normal processing times. Even if the buyer later decided the workflow did not match a preferred use case, "
            "that does not negate actual service delivery or justify a full refund after extensive consumption beyond the policy threshold.",
            styles["body"],
        )
    )
    story.append(
        paragraph(
            "<b>6. 'No conversion data saved'</b><br/>"
            "The product's privacy-first design states that uploaded images are processed in memory and are not permanently stored on the servers. "
            "This is a disclosed privacy feature, not a delivery failure.",
            styles["body"],
        )
    )

    story.append(paragraph("Why the Evidence Supports Denial of the Full Refund", styles["heading"]))
    story.extend(
        bullets(
            [
                "The buyer had a free trial before purchase and therefore had a no-risk opportunity to test quality first.",
                "The buyer expressly accepted the Terms of Service and Refund Policy before continuing to login and purchase.",
                "The buyer then consumed the paid service well beyond the refund policy's light-usage limit.",
                "The complaint was raised only after substantial successful use had already occurred.",
                "The claimed browser batch limit was disclosed in advance.",
            ],
            styles["bullet"],
        )
    )

    story.append(paragraph("Requested Outcome", styles["heading"]))
    request_box = Table(
        [[
            paragraph(
                "For these reasons, we respectfully request that PayPal deny the buyer's full-refund claim and resolve the dispute in the seller's favor. "
                "At minimum, the evidence does not support a full refund after substantial successful post-purchase use that clearly exceeds the published refund threshold.",
                styles["body"],
            )
        ]],
        colWidths=[6.7 * inch],
    )
    request_box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EEF4FF")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#98A2B3")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )
    story.append(request_box)
    story.append(Spacer(1, 10))
    story.append(
        paragraph(
            "Prepared from the seller's internal account records, published terms, published refund policy, and the attached screenshots supplied for this dispute response.",
            styles["small"],
        )
    )

    for exhibit in EXHIBITS:
        story.append(PageBreak())
        story.append(paragraph(exhibit.title, styles["heading"]))
        story.append(paragraph(exhibit.caption, styles["caption"]))
        story.append(Spacer(1, 8))
        story.append(
            KeepTogether(
                [
                    exhibit_image(exhibit, max_width=doc.width, max_height=doc.height - 120),
                    Spacer(1, 6),
                    paragraph(str(exhibit.path), styles["small"]),
                ]
            )
        )

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)


if __name__ == "__main__":
    missing = [ex.path for ex in EXHIBITS if not ex.path.exists()]
    if missing:
        missing_text = "\n".join(str(p) for p in missing)
        raise SystemExit(f"Missing exhibit files:\n{missing_text}")
    build_document()
    print(OUTPUT_PDF)

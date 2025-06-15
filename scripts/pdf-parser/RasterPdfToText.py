import os

import cv2
import numpy as np
import pytesseract
from pdf2image import convert_from_path
from PIL import Image

# ---- CONFIG ----
# INPUT_PDF = "C:/_/aeon/fvtt-system-draw-steel/Draw Steel - Delian Tomb - Monsters - 2025-04.pdf"  # path to input rasterized PDF
INPUT_PDF = "C:/_/aeon/fvtt-system-draw-steel/scripts/pdf-parser/delian-tomb-rasterized.pdf"  # path to input rasterized PDF

OUTPUT_DIR = "ocr-output"
SAVE_IMAGES = False  # set to True to save binarized images
DPI = 300

# ---- SCRIPT ----
os.makedirs(OUTPUT_DIR, exist_ok=True)
all_text = []

print("Converting PDF to images...")
pages = convert_from_path(INPUT_PDF, dpi=DPI)

for i, page in enumerate(pages):
    width, height = page.size
    mid_x = width // 2
    page_num = i + 1

    # Split into left and right halves
    left = page.crop((0, 0, mid_x, height))
    right = page.crop((mid_x, 0, width, height))

    for side, label in [(left, "left"), (right, "right")]:
        # Grayscale
        gray = np.array(side.convert("L"))

        # Adaptive threshold (binarization)
        binary = cv2.adaptiveThreshold(
            gray,
            maxValue=255,
            adaptiveMethod=cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            thresholdType=cv2.THRESH_BINARY,
            blockSize=21,
            C=15,
        )

        # Convert back to PIL for Tesseract
        binary_pil = Image.fromarray(binary)

        # OCR
        text = pytesseract.image_to_string(binary_pil, config="--psm 1")

        # Save text
        out_txt = os.path.join(OUTPUT_DIR, f"page_{page_num:02d}_{label}.txt")
        with open(out_txt, "w", encoding="utf-8") as f:
            f.write(text)

        all_text.append(f"--- Page {page_num} {label} ---\n{text.strip()}\n")

        # Optional: save binarized image
        if SAVE_IMAGES:
            out_img = os.path.join(OUTPUT_DIR, f"page_{page_num:02d}_{label}.png")
            binary_pil.save(out_img)

# Save full combined text
with open(
    os.path.join(OUTPUT_DIR, "full_combined_ocr.txt"), "w", encoding="utf-8"
) as f:
    f.write("\n\n".join(all_text))

print(f"OCR complete. Output saved to '{OUTPUT_DIR}'")

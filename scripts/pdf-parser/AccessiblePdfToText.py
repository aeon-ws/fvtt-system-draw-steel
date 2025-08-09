import os

import pdfplumber

OUTPUT_DIR = "C:/_/aeon/fvtt-system-draw-steel/ocr-output"

# 1. Extract text from PDF
with pdfplumber.open(
    "C:/_/aeon/fvtt-system-draw-steel/Draw_Steel_Monsters_v1.pdf"
) as pdf:
    full_text = "\n".join(page.extract_text() for page in pdf.pages)

    with open(
        os.path.join(OUTPUT_DIR, "monster_v2_native_ocr.txt"), "w", encoding="utf-8"
    ) as f:
        f.write(full_text)

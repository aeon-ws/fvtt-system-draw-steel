import pymupdf

doc = pymupdf.open("C:/_/aeon/fvtt-system-draw-steel/Draw_Steel_Monsters_v1.pdf")

for page in doc:
    # Extract tagged text if available
    tagged_text = page.get_text("tagged")
    print(tagged_text)

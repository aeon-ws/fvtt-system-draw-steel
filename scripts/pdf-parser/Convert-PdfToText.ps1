
magick -density 300 "c:\_\aeon\fvtt-system-draw-steel\Draw Steel - Delian Tomb - Monsters - 2025-04.pdf" -quality 100 "c:\_\aeon\fvtt-system-draw-steel\pdf\output-%03d.pdf"
magick -density 300 "c:\_\aeon\fvtt-system-draw-steel\pdf\x\output-*.pdf" -quality 100 "c:\_\aeon\fvtt-system-draw-steel\pdf\_delian-tomb-rasterized-1-5.pdf"

python "C:\_\aeon\fvtt-system-draw-steel\scripts\pdf-parser\RasterPdfToText.py"

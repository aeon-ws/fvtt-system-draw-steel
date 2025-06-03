from typing import Annotated

from typer import Option, Typer

pdf = Typer(no_args_is_help=True, name="ads")


@pdf.command(no_args_is_help=False, name="export")
def export(
    pdf_file_path: Annotated[
        str, Option(case_sensitive=False)
    ] = "c:/_/aeon/fvtt-system-draw-steel/Draw Steel - Delian Tomb - Monsters - 2025-04.pdf",
    ocr_folder_path: Annotated[
        str, Option(case_sensitive=False)
    ] = "c:/_/aeon/fvtt-system-draw-steel/ocr-output",
) -> None:
    print(
        f"Exporting data from PDF [{pdf_file_path}] to OCR file in folder [{ocr_folder_path}]..."
    )

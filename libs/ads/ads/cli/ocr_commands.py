from typing import Annotated

from typer import Option, Typer

from ads.api.monster_parser import export_monsters

ocr = Typer(no_args_is_help=True, pretty_exceptions_show_locals=False)


@ocr.command(no_args_is_help=False, name="export")
def export(
    ocr_file_path: Annotated[
        str, Option(case_sensitive=False)
    ] = "c:/_/aeon/fvtt-system-draw-steel/ocr-output/full_combined_ocr.txt",
    yaml_folder_path: Annotated[
        str, Option(case_sensitive=False)
    ] = "c:/_/aeon/fvtt-system-draw-steel/packs/_source/monsters",
) -> None:
    print(
        f"Exporting data from OCR file [{ocr_file_path}] to YAML files in folder [{yaml_folder_path}]..."
    )
    export_monsters(ocr_file_path, yaml_folder_path)

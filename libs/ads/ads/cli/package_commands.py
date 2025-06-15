from typing import Annotated

from typer import Option, Typer

package = Typer(no_args_is_help=True)


@package.command(no_args_is_help=False, name="pack")
def pack(
    yaml_folder_path: Annotated[
        str, Option(case_sensitive=False)
    ] = "c:/_/aeon/fvtt-system-draw-steel/packs/_source/monsters",
) -> None:
    print(f"Packing YAML files from {yaml_folder_path} to Foundry compendium...")

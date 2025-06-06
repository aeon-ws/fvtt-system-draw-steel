from typer import Typer

from ads.cli.ocr_commands import ocr
from ads.cli.package_commands import package
from ads.cli.pdf_commands import pdf

ads = Typer(no_args_is_help=True, pretty_exceptions_show_locals=False, name="ads")
ads.add_typer(ocr, name="ocr")
ads.add_typer(package, name="package")
ads.add_typer(pdf, name="pdf")

if __name__ == "__main__":
    ads()

#!/usr/bin/env python3
"""Render the ConX Dynamic Panel brand images from the master artwork.

Outputs match the Home Assistant brand image specification:
  icon.png     256x256      icon@2x.png  512x512
  logo.png     shortest side 256         logo@2x.png  shortest side 512

The same files are written to the integration ``brand/`` directory (served by
Home Assistant 2026.3+) and to the ``brands/custom_integrations`` mirror that a
future home-assistant/brands submission would use.

Usage: python3 scripts/build_brand_images.py [--masters DIR]
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageFilter
except ImportError:  # pragma: no cover - developer tooling only
    sys.exit("Pillow is required: python3 -m pip install Pillow")

REPO_ROOT = Path(__file__).resolve().parent.parent
MASTER_DIR = REPO_ROOT / "brands" / "master"
TARGETS = (
    REPO_ROOT / "custom_components" / "conx_dynamic_panel" / "brand",
    REPO_ROOT / "brands" / "custom_integrations" / "conx_dynamic_panel",
)

BACKGROUND = (22, 24, 28)
# Trim tolerance against the master background so the subject keeps a small,
# deliberate margin instead of the generous framing the master art ships with.
TRIM_TOLERANCE = 18
LOGO_PADDING_RATIO = 0.06
PALETTE_COLORS = 64
SNAP_TOLERANCE = 12
DENOISE_RADIUS = 7


def _trim_to_subject(image: Image.Image) -> Image.Image:
    """Crop uniform background down to the artwork plus a small margin."""
    rgb = image.convert("RGB")
    background = Image.new("RGB", rgb.size, BACKGROUND)
    diff = ImageChops.difference(rgb, background).convert("L")
    box = diff.point(lambda v: 255 if v > TRIM_TOLERANCE else 0).getbbox()
    if box is None:
        return rgb
    left, top, right, bottom = box
    pad = round(max(right - left, bottom - top) * LOGO_PADDING_RATIO)
    return rgb.crop(
        (
            max(left - pad, 0),
            max(top - pad, 0),
            min(right + pad, rgb.width),
            min(bottom + pad, rgb.height),
        )
    )


def _flatten(image: Image.Image) -> Image.Image:
    """Composite onto the brand charcoal so edges stay clean when scaled."""
    canvas = Image.new("RGB", image.size, BACKGROUND)
    rgba = image.convert("RGBA")
    canvas.paste(rgba, mask=rgba.split()[3])
    return canvas


def _denoise(image: Image.Image) -> Image.Image:
    """Strip the master artwork's rendering grain while keeping hard edges.

    A median filter is used rather than a blur because the mark is flat vector
    style: speckle disappears but the gold strokes and dot rims stay crisp.
    """
    return image.filter(ImageFilter.MedianFilter(size=DENOISE_RADIUS))


def _flatten_background(image: Image.Image) -> Image.Image:
    """Snap near-background pixels to the exact brand charcoal.

    Left alone, residual backdrop variation defeats PNG compression and shows
    up as banding once the image is quantized, so anything close enough to the
    backdrop is forced to a single value.
    """
    background = Image.new("RGB", image.size, BACKGROUND)
    diff = ImageChops.difference(image, background).convert("L")
    mask = diff.point(lambda v: 255 if v > SNAP_TOLERANCE else 0)
    flattened = background.copy()
    flattened.paste(image, mask=mask)
    return flattened


def _save(image: Image.Image, name: str) -> None:
    # The artwork is flat vector-style, so an indexed palette is visually
    # lossless here and keeps the shipped PNGs an order of magnitude smaller.
    cleaned = _flatten_background(image)
    palette = cleaned.quantize(colors=PALETTE_COLORS, method=Image.MEDIANCUT, dither=Image.NONE)
    for target in TARGETS:
        target.mkdir(parents=True, exist_ok=True)
        path = target / name
        palette.save(path, format="PNG", optimize=True)
        size_kb = path.stat().st_size / 1024
        print(f"{path.relative_to(REPO_ROOT)} {image.width}x{image.height} {size_kb:.0f}KB")


def build_icon(master: Path) -> None:
    source = _flatten_background(_denoise(_flatten(Image.open(master))))
    side = min(source.size)
    left = (source.width - side) // 2
    top = (source.height - side) // 2
    square = source.crop((left, top, left + side, top + side))
    for name, size in (("icon.png", 256), ("icon@2x.png", 512)):
        _save(square.resize((size, size), Image.LANCZOS), name)


def build_logo(master: Path) -> None:
    source = _flatten_background(_denoise(_trim_to_subject(_flatten(Image.open(master)))))
    for name, shortest in (("logo.png", 256), ("logo@2x.png", 512)):
        scale = shortest / min(source.size)
        size = (round(source.width * scale), round(source.height * scale))
        _save(source.resize(size, Image.LANCZOS), name)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--masters",
        type=Path,
        default=MASTER_DIR,
        help="directory holding icon-master.png and logo-master.png",
    )
    args = parser.parse_args()

    icon_master = args.masters / "icon-master.png"
    logo_master = args.masters / "logo-master.png"
    for master in (icon_master, logo_master):
        if not master.is_file():
            return print(f"missing master artwork: {master}") or 1

    build_icon(icon_master)
    build_logo(logo_master)

    # The brands mirror is documentation-only; keep it byte-identical.
    primary, mirror = TARGETS
    for path in sorted(primary.glob("*.png")):
        shutil.copyfile(path, mirror / path.name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

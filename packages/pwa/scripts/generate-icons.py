"""Generate PNG app icons from the brand mark in public/icon.svg.

No SVG rasterizer is available in this environment, so the mark is rebuilt with
Pillow by sampling the same Bezier curves and arc as the SVG path. Run with:

    python packages/pwa/scripts/generate-icons.py

Outputs (in packages/pwa/public/): icon-192.png, icon-512.png,
icon-maskable-512.png. Re-run whenever the brand mark changes.
"""

import math
import os

from PIL import Image, ImageDraw

PAPER = (247, 244, 236, 255)  # #f7f4ec
MOSS = (79, 122, 74, 255)  # #4f7a4a
STEM = (138, 107, 79, 255)  # #8a6b4f

SS = 4  # supersample factor for smooth edges
BASE = 512


def cubic(p0, p1, p2, p3, n=40):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
        pts.append((x, y))
    return pts


def leaf_outline():
    # Mirrors: M256 132 c-46 36 -72 78 -72 124 a72 72 0 0 0 144 0 c0 -46 -26 -88 -72 -124 z
    pts = []
    pts += cubic((256, 132), (210, 168), (184, 210), (184, 256))
    # Bottom semicircle, radius 72 centered at (256, 256): (184,256) -> bottom -> (328,256)
    for i in range(41):
        t = i / 40
        pts.append((256 - 72 * math.cos(math.pi * t), 256 + 72 * math.sin(math.pi * t)))
    pts += cubic((328, 256), (328, 210), (302, 168), (256, 132))
    return pts


def render(size, maskable):
    big = size * SS
    scale = big / BASE
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if maskable:
        # Maskable icons are clipped by the platform; fill the whole canvas so no
        # transparent corner shows through the mask.
        draw.rectangle([0, 0, big, big], fill=PAPER)
    else:
        radius = 96 * scale
        draw.rounded_rectangle([0, 0, big - 1, big - 1], radius=radius, fill=PAPER)

    draw.polygon([(x * scale, y * scale) for x, y in leaf_outline()], fill=MOSS)

    # Stem: rect x244 y300 w24 h92 rx12
    draw.rounded_rectangle(
        [244 * scale, 300 * scale, (244 + 24) * scale, (300 + 92) * scale],
        radius=12 * scale,
        fill=STEM,
    )

    return img.resize((size, size), Image.LANCZOS)


def main():
    out = os.path.join(os.path.dirname(__file__), "..", "public")
    render(192, False).save(os.path.join(out, "icon-192.png"))
    render(512, False).save(os.path.join(out, "icon-512.png"))
    render(512, True).save(os.path.join(out, "icon-maskable-512.png"))
    print("icons written to", os.path.normpath(out))


if __name__ == "__main__":
    main()

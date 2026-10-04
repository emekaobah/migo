"""Generate Migo launcher/splash artwork from the same wordmark BrandMark renders.

Not an invented logo: BrandMark draws "migo" in the system bold face, and this
draws the identical wordmark so the launcher icon and splash match the app.
Replace when the client's vector original lands (OPEN-QUESTIONS #5).
"""

from PIL import Image, ImageDraw, ImageFont

NAVY = (1, 0, 101, 255)
WHITE = (255, 255, 255, 255)
BLACK = (0, 0, 0, 255)
WORD = "migo"
TRACKING = -0.02  # -0.02em, matching the -0.5px at 26px in brand-mark.tsx
OUT = "assets/images"


def wordmark(px, fill):
    """Render "migo" in SF Pro Bold, cropped tight to its ink."""
    font = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", px)
    font.set_variation_by_name("Bold")
    pad = px
    canvas = Image.new("RGBA", (px * 6, px * 3), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    x = pad
    for ch in WORD:
        draw.text((x, pad), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + px * TRACKING
    return canvas.crop(canvas.getbbox())


def place(mark, canvas_px, width_frac, bg):
    """Centre the mark on a square canvas at a given fraction of its width."""
    img = Image.new("RGBA", (canvas_px, canvas_px), bg)
    target_w = round(canvas_px * width_frac)
    scaled = mark.resize(
        (target_w, round(mark.height * target_w / mark.width)), Image.LANCZOS
    )
    img.alpha_composite(
        scaled, ((canvas_px - scaled.width) // 2, (canvas_px - scaled.height) // 2)
    )
    return img


white_mark = wordmark(512, WHITE)
black_mark = wordmark(512, BLACK)

# Launcher icon: navy field, wordmark at 60% width — clears the iOS squircle mask.
place(white_mark, 1024, 0.60, NAVY).save(f"{OUT}/icon.png")

# Web favicon: the same lockup, downscaled from the full-size render.
place(white_mark, 1024, 0.60, NAVY).resize((48, 48), Image.LANCZOS).save(
    f"{OUT}/favicon.png"
)

# Android adaptive foreground: only the centre 66% survives every mask shape,
# so the wordmark sits at 44% of the canvas — 66% of the safe zone.
place(white_mark, 1024, 0.44, (0, 0, 0, 0)).save(f"{OUT}/android-icon-foreground.png")

# Monochrome variant: same geometry, opaque black; Android applies its own tint.
place(black_mark, 1024, 0.44, (0, 0, 0, 0)).save(f"{OUT}/android-icon-monochrome.png")

# Splash: bare wordmark on transparent, drawn over the navy backgroundColor.
# app.json sets imageWidth 120; rendering at 480 gives 4x headroom.
splash = white_mark.resize(
    (480, round(white_mark.height * 480 / white_mark.width)), Image.LANCZOS
)
splash.save(f"{OUT}/splash-icon.png")

for name in (
    "icon.png",
    "favicon.png",
    "android-icon-foreground.png",
    "android-icon-monochrome.png",
    "splash-icon.png",
):
    im = Image.open(f"{OUT}/{name}")
    print(f"{name:34} {im.size[0]}x{im.size[1]}  {im.mode}")

from pathlib import Path
from random import Random
import textwrap

from PIL import Image, ImageDraw, ImageFont

from app.models import Campaign


BASE_DIR = Path(__file__).resolve().parent.parent.parent
GENERATED_DIR = BASE_DIR / "generated_campaigns"

GENERATED_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# FONT HELPERS
# ============================================================

def get_font(size: int, bold: bool = False):
    candidates = []

    if bold:
        candidates = [
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/calibrib.ttf",
        ]
    else:
        candidates = [
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/calibri.ttf",
        ]

    for font_path in candidates:
        path = Path(font_path)

        if path.exists():
            return ImageFont.truetype(
                str(path),
                size,
            )

    return ImageFont.load_default()


# ============================================================
# TEXT HELPERS
# ============================================================

def draw_centered(
    draw,
    text,
    y,
    font,
    fill,
    width,
):
    bbox = draw.textbbox(
        (0, 0),
        text,
        font=font,
    )

    text_width = bbox[2] - bbox[0]

    x = (width - text_width) // 2

    draw.text(
        (x, y),
        text,
        font=font,
        fill=fill,
    )


def draw_wrapped_center(
    draw,
    text,
    y,
    font,
    fill,
    width,
    max_chars=30,
    line_gap=12,
):
    lines = textwrap.wrap(
        text,
        width=max_chars,
    )

    current_y = y

    for line in lines:
        bbox = draw.textbbox(
            (0, 0),
            line,
            font=font,
        )

        text_width = (
            bbox[2] - bbox[0]
        )

        x = (width - text_width) // 2

        draw.text(
            (x, current_y),
            line,
            font=font,
            fill=fill,
        )

        line_height = (
            bbox[3] - bbox[1]
        )

        current_y += (
            line_height + line_gap
        )

    return current_y


def rounded_box(
    draw,
    xy,
    radius,
    fill,
    outline=None,
    width=1,
):
    draw.rounded_rectangle(
        xy,
        radius=radius,
        fill=fill,
        outline=outline,
        width=width,
    )


# ============================================================
# DECORATIVE ELEMENTS
# ============================================================

def draw_blobs(
    draw,
    rng,
    width,
    height,
    colors,
):
    for _ in range(7):

        size = rng.randint(
            120,
            420,
        )

        x = rng.randint(
            -150,
            width - 50,
        )

        y = rng.randint(
            -150,
            height - 50,
        )

        color = rng.choice(
            colors
        )

        draw.ellipse(
            [
                x,
                y,
                x + size,
                y + size,
            ],
            fill=color,
        )


def draw_grid(
    draw,
    width,
    height,
    color,
    spacing=70,
):
    for x in range(
        0,
        width,
        spacing,
    ):
        draw.line(
            [
                (x, 0),
                (x, height),
            ],
            fill=color,
            width=1,
        )

    for y in range(
        0,
        height,
        spacing,
    ):
        draw.line(
            [
                (0, y),
                (width, y),
            ],
            fill=color,
            width=1,
        )


def draw_sparkles(
    draw,
    rng,
    width,
    height,
    color,
):
    for _ in range(18):

        x = rng.randint(
            60,
            width - 60,
        )

        y = rng.randint(
            60,
            height - 60,
        )

        size = rng.randint(
            4,
            12,
        )

        draw.line(
            [
                (x - size, y),
                (x + size, y),
            ],
            fill=color,
            width=2,
        )

        draw.line(
            [
                (x, y - size),
                (x, y + size),
            ],
            fill=color,
            width=2,
        )


def draw_dots(
    draw,
    rng,
    width,
    height,
    color,
):
    for _ in range(45):

        x = rng.randint(
            20,
            width - 20,
        )

        y = rng.randint(
            20,
            height - 20,
        )

        radius = rng.randint(
            2,
            7,
        )

        draw.ellipse(
            [
                x - radius,
                y - radius,
                x + radius,
                y + radius,
            ],
            fill=color,
        )


# ============================================================
# FAKE FOOD VISUAL
# ============================================================

def draw_food_illustration(
    draw,
    rng,
    cx,
    cy,
    scale,
    primary,
    secondary,
):
    """
    Creates a stylized food illustration locally.
    This is not AI photography, but gives the poster
    an actual visual focal point.
    """

    # Plate shadow
    draw.ellipse(
        [
            cx - 230 * scale,
            cy + 130 * scale,
            cx + 230 * scale,
            cy + 210 * scale,
        ],
        fill="#00000040",
    )

    # Plate
    draw.ellipse(
        [
            cx - 240 * scale,
            cy - 10 * scale,
            cx + 240 * scale,
            cy + 170 * scale,
        ],
        fill="#f5f5f5",
    )

    # Burger bottom
    draw.rounded_rectangle(
        [
            cx - 170 * scale,
            cy + 20 * scale,
            cx + 170 * scale,
            cy + 100 * scale,
        ],
        radius=int(25 * scale),
        fill="#8b4513",
    )

    # Patty
    draw.rounded_rectangle(
        [
            cx - 175 * scale,
            cy - 15 * scale,
            cx + 175 * scale,
            cy + 45 * scale,
        ],
        radius=int(20 * scale),
        fill="#3b2116",
    )

    # Cheese
    draw.polygon(
        [
            (
                cx - 165 * scale,
                cy - 30 * scale,
            ),
            (
                cx + 165 * scale,
                cy - 30 * scale,
            ),
            (
                cx + 120 * scale,
                cy + 15 * scale,
            ),
            (
                cx - 120 * scale,
                cy + 15 * scale,
            ),
        ],
        fill=primary,
    )

    # Lettuce
    for offset in [-110, -40, 40, 110]:
        draw.ellipse(
            [
                cx + offset * scale - 45 * scale,
                cy - 55 * scale,
                cx + offset * scale + 45 * scale,
                cy - 10 * scale,
            ],
            fill=secondary,
        )

    # Bun
    draw.rounded_rectangle(
        [
            cx - 190 * scale,
            cy - 150 * scale,
            cx + 190 * scale,
            cy - 40 * scale,
        ],
        radius=int(65 * scale),
        fill="#d88935",
    )

    # Bun highlight
    draw.ellipse(
        [
            cx - 120 * scale,
            cy - 125 * scale,
            cx - 90 * scale,
            cy - 95 * scale,
        ],
        fill="#f4d29a",
    )

    draw.ellipse(
        [
            cx - 20 * scale,
            cy - 130 * scale,
            cx + 10 * scale,
            cy - 100 * scale,
        ],
        fill="#f4d29a",
    )

    draw.ellipse(
        [
            cx + 80 * scale,
            cy - 120 * scale,
            cx + 110 * scale,
            cy - 90 * scale,
        ],
        fill="#f4d29a",
    )

    # Fries
    fry_x = cx + 230 * scale
    fry_y = cy - 20 * scale

    for i in range(7):

        offset = (
            i - 3
        ) * 24 * scale

        draw.rounded_rectangle(
            [
                fry_x + offset,
                fry_y - rng.randint(
                    30,
                    80,
                ) * scale,
                fry_x + offset + 18 * scale,
                fry_y + 120 * scale,
            ],
            radius=int(
                7 * scale
            ),
            fill="#f2c14e",
        )

    # Sauce dots
    for _ in range(8):

        x = rng.randint(
            int(cx - 150 * scale),
            int(cx + 150 * scale),
        )

        y = rng.randint(
            int(cy - 80 * scale),
            int(cy + 70 * scale),
        )

        r = rng.randint(
            4,
            10,
        )

        draw.ellipse(
            [
                x - r,
                y - r,
                x + r,
                y + r,
            ],
            fill="#d94a38",
        )


# ============================================================
# CREATIVE GENERATORS
# ============================================================

def generate_style_one(
    image,
    draw,
    campaign,
    coupon_code,
    rng,
):
    """
    Premium dark food campaign.
    """

    width, height = image.size

    draw_blobs(
        draw,
        rng,
        width,
        height,
        [
            "#3d1717",
            "#241414",
            "#412b13",
        ],
    )

    draw_sparkles(
        draw,
        rng,
        width,
        height,
        "#ffffff80",
    )

    white = "#ffffff"
    muted = "#d4d4d4"
    accent = "#f2b84b"

    small = get_font(
        28,
        True,
    )

    title = get_font(
        78,
        True,
    )

    body = get_font(
        30,
        False,
    )

    coupon = get_font(
        38,
        True,
    )

    draw_centered(
        draw,
        "DESITRUE • SPECIAL OFFER",
        70,
        small,
        accent,
        width,
    )

    y = 150

    y = draw_wrapped_center(
        draw,
        campaign.title,
        y,
        title,
        white,
        width,
        17,
        12,
    )

    draw_food_illustration(
        draw,
        rng,
        540,
        570,
        1.05,
        "#f5c542",
        "#5aa469",
    )

    message_y = 800

    draw_wrapped_center(
        draw,
        campaign.message,
        message_y,
        body,
        muted,
        width,
        45,
        8,
    )

    if coupon_code:

        rounded_box(
            draw,
            [
                280,
                925,
                800,
                1000,
            ],
            22,
            accent,
        )

        draw_centered(
            draw,
            f"USE CODE  {coupon_code.upper()}",
            942,
            coupon,
            "#111111",
            width,
        )


def generate_style_two(
    image,
    draw,
    campaign,
    coupon_code,
    rng,
):
    """
    Bright modern promotional campaign.
    """

    width, height = image.size

    draw.rectangle(
        [0, 0, width, height],
        fill="#f4efe5",
    )

    draw_grid(
        draw,
        width,
        height,
        "#ded6c8",
        80,
    )

    accent = rng.choice(
        [
            "#e85d04",
            "#d62828",
            "#8338ec",
            "#1982c4",
        ]
    )

    dark = "#171717"

    # Accent circle
    draw.ellipse(
        [
            600,
            -150,
            1200,
            450,
        ],
        fill=accent,
    )

    small = get_font(
        26,
        True,
    )

    title = get_font(
        74,
        True,
    )

    body = get_font(
        30,
        False,
    )

    coupon = get_font(
        34,
        True,
    )

    draw.text(
        (75, 70),
        "DESITRUE",
        font=small,
        fill=dark,
    )

    draw.text(
        (75, 125),
        "WEEKEND",
        font=small,
        fill=accent,
    )

    y = 210

    lines = textwrap.wrap(
        campaign.title,
        width=16,
    )

    for line in lines[:3]:

        draw.text(
            (75, y),
            line,
            font=title,
            fill=dark,
        )

        y += 92

    draw_food_illustration(
        draw,
        rng,
        760,
        580,
        0.9,
        accent,
        "#5b8c5a",
    )

    draw_wrapped_center(
        draw,
        campaign.message,
        720,
        body,
        dark,
        width,
        38,
        8,
    )

    if coupon_code:

        rounded_box(
            draw,
            [
                75,
                880,
                510,
                980,
            ],
            28,
            accent,
        )

        draw.text(
            (110, 915),
            f"CODE: {coupon_code.upper()}",
            font=coupon,
            fill="#ffffff",
        )


def generate_style_three(
    image,
    draw,
    campaign,
    coupon_code,
    rng,
):
    """
    Premium minimalist campaign.
    """

    width, height = image.size

    background = rng.choice(
        [
            "#101010",
            "#151515",
            "#1b1b1b",
        ]
    )

    draw.rectangle(
        [0, 0, width, height],
        fill=background,
    )

    accent = rng.choice(
        [
            "#e63946",
            "#f4a261",
            "#2a9d8f",
            "#e9c46a",
        ]
    )

    draw.ellipse(
        [
            120,
            170,
            960,
            1010,
        ],
        outline=accent,
        width=8,
    )

    draw.ellipse(
        [
            200,
            250,
            880,
            930,
        ],
        outline="#ffffff30",
        width=3,
    )

    small = get_font(
        24,
        True,
    )

    title = get_font(
        76,
        True,
    )

    body = get_font(
        28,
        False,
    )

    coupon = get_font(
        32,
        True,
    )

    draw_centered(
        draw,
        "A LITTLE SOMETHING FOR YOU",
        75,
        small,
        accent,
        width,
    )

    y = 150

    y = draw_wrapped_center(
        draw,
        campaign.title,
        y,
        title,
        "#ffffff",
        width,
        18,
        10,
    )

    draw_food_illustration(
        draw,
        rng,
        540,
        560,
        0.78,
        accent,
        "#5b8c5a",
    )

    draw_wrapped_center(
        draw,
        campaign.message,
        760,
        body,
        "#cfcfcf",
        width,
        42,
        8,
    )

    if coupon_code:

        draw_centered(
            draw,
            f"CODE  •  {coupon_code.upper()}",
            925,
            coupon,
            accent,
            width,
        )


def generate_style_four(
    image,
    draw,
    campaign,
    coupon_code,
    rng,
):
    """
    High-energy social-media style.
    """

    width, height = image.size

    accent_one = rng.choice(
        [
            "#ff006e",
            "#8338ec",
            "#3a86ff",
            "#fb5607",
        ]
    )

    accent_two = rng.choice(
        [
            "#ffbe0b",
            "#06d6a0",
            "#ffffff",
        ]
    )

    draw.rectangle(
        [0, 0, width, height],
        fill="#090909",
    )

    draw_blobs(
        draw,
        rng,
        width,
        height,
        [
            accent_one,
            "#181818",
            "#242424",
        ],
    )

    draw_dots(
        draw,
        rng,
        width,
        height,
        "#ffffff50",
    )

    small = get_font(
        25,
        True,
    )

    title = get_font(
        86,
        True,
    )

    body = get_font(
        30,
        False,
    )

    coupon = get_font(
        38,
        True,
    )

    draw.text(
        (65, 65),
        "🔥 LIMITED DROP",
        font=small,
        fill=accent_two,
    )

    y = 140

    y = draw_wrapped_center(
        draw,
        campaign.title,
        y,
        title,
        "#ffffff",
        width,
        15,
        10,
    )

    draw_food_illustration(
        draw,
        rng,
        540,
        590,
        0.92,
        accent_two,
        "#5b8c5a",
    )

    draw_wrapped_center(
        draw,
        campaign.message,
        790,
        body,
        "#ffffff",
        width,
        40,
        8,
    )

    if coupon_code:

        rounded_box(
            draw,
            [
                250,
                925,
                830,
                1010,
            ],
            25,
            accent_one,
        )

        draw_centered(
            draw,
            f"USE {coupon_code.upper()}",
            945,
            coupon,
            "#ffffff",
            width,
        )


def generate_style_five(
    image,
    draw,
    campaign,
    coupon_code,
    rng,
):
    """
    Luxury restaurant-style campaign.
    """

    width, height = image.size

    draw.rectangle(
        [0, 0, width, height],
        fill="#211a16",
    )

    gold = "#d4af37"

    draw.rectangle(
        [
            30,
            30,
            width - 30,
            height - 30,
        ],
        outline=gold,
        width=3,
    )

    draw.rectangle(
        [
            50,
            50,
            width - 50,
            height - 50,
        ],
        outline="#ffffff25",
        width=1,
    )

    small = get_font(
        24,
        True,
    )

    title = get_font(
        72,
        True,
    )

    body = get_font(
        29,
        False,
    )

    coupon = get_font(
        34,
        True,
    )

    draw_centered(
        draw,
        "DESITRUE",
        85,
        small,
        gold,
        width,
    )

    draw_centered(
        draw,
        "CURATED FOR YOU",
        125,
        small,
        "#ffffff",
        width,
    )

    y = 205

    y = draw_wrapped_center(
        draw,
        campaign.title,
        y,
        title,
        "#ffffff",
        width,
        18,
        10,
    )

    draw_food_illustration(
        draw,
        rng,
        540,
        570,
        0.82,
        gold,
        "#607d52",
    )

    draw_wrapped_center(
        draw,
        campaign.message,
        770,
        body,
        "#ddd3c8",
        width,
        40,
        8,
    )

    if coupon_code:

        draw_centered(
            draw,
            f"EXCLUSIVE • {coupon_code.upper()}",
            930,
            coupon,
            gold,
            width,
        )


# ============================================================
# MAIN GENERATOR
# ============================================================

def generate_campaign_image(
    campaign: Campaign,
    coupon_code: str | None = None,
):
    """
    Generate a randomized campaign creative.

    Every call gets a new random seed, so pressing
    Generate / Regenerate produces a different design.
    """

    width = 1080
    height = 1080

    # --------------------------------------------------------
    # NEW RANDOM SEED EVERY GENERATION
    # --------------------------------------------------------

    seed = (
        hash(
            (
                campaign.id,
                campaign.updated_at,
            )
        )
        ^ Random().randint(
            0,
            999999999,
        )
    )

    rng = Random(seed)

    # --------------------------------------------------------
    # BASE IMAGE
    # --------------------------------------------------------

    image = Image.new(
        "RGB",
        (width, height),
        "#111111",
    )

    draw = ImageDraw.Draw(image)

    # --------------------------------------------------------
    # RANDOM STYLE
    # --------------------------------------------------------

    styles = [
        generate_style_one,
        generate_style_two,
        generate_style_three,
        generate_style_four,
        generate_style_five,
    ]

    style = rng.choice(styles)

    style(
        image,
        draw,
        campaign,
        coupon_code,
        rng,
    )

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    filename = (
        f"campaign_{campaign.id}_{seed}.jpg"
    )

    output_path = (
        GENERATED_DIR / filename
    )

    image.save(
        output_path,
        format="JPEG",
        quality=95,
        optimize=True,
    )

    return (
        f"/generated-campaigns/{filename}"
    )
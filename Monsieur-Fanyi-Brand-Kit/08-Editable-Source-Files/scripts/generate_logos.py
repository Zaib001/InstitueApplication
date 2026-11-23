"""
Monsieur Fanyi - Official Brand Asset Generator
Script 01: Logo & Mark Generation (SVG, High-Res PNG, Favicons)
"""

import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = r"d:\Instructor\Monsieur-Fanyi-Brand-Kit"
LOGO_DIR = os.path.join(BASE_DIR, "01-Official-Logo")
SVG_DIR = os.path.join(LOGO_DIR, "SVG")
PNG_DIR = os.path.join(LOGO_DIR, "PNG")
FAVICON_DIR = os.path.join(LOGO_DIR, "Favicon-and-App-Icons")
FONT_DIR = os.path.join(BASE_DIR, "02-Brand-Colors-and-Typography", "Fonts")

for d in [SVG_DIR, PNG_DIR, FAVICON_DIR]:
    os.makedirs(d, exist_ok=True)

# -------------------------------------------------------------
# 1. SVG Definitions (Exact match with website components)
# -------------------------------------------------------------

# Horizontal Primary (Light Background)
SVG_HORIZONTAL_LIGHT = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120" width="520" height="120" fill="none">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&amp;family=DM+Sans:ital,wght@1,500&amp;display=swap');
      .title-monsieur { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 40px; fill: #152E4D; letter-spacing: -0.03em; }
      .title-fanyi { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 40px; fill: #F59E0B; letter-spacing: -0.03em; }
      .subtitle { font-family: 'DM Sans', system-ui, -apple-system, sans-serif; font-weight: 500; font-style: italic; font-size: 15px; fill: #64748B; letter-spacing: -0.01em; }
    </style>
  </defs>
  <!-- Logomark Badge -->
  <g id="badge-container" transform="translate(15, 15)">
    <rect width="90" height="90" rx="22" fill="#F59E0B" fill-opacity="0.12" />
    <g id="mark" transform="translate(10, 10) scale(1.944)">
      <!-- Livre d'or ouvert -->
      <path d="M6 24C10 21 15 21 18 24C21 21 26 21 30 24V11C26 8 21 8 18 11C15 8 10 8 6 11V24Z" fill="#F59E0B" />
      <path d="M18 11V24" stroke="#D97706" stroke-width="1.5" />
      <!-- Toque academique bleu marine -->
      <path d="M18 5L7 10L18 15L29 10L18 5Z" fill="#152E4D" />
      <path d="M11 12.5V17C11 19 14 20.5 18 20.5C22 20.5 25 19 25 17V12.5" stroke="#152E4D" stroke-width="1.5" fill="none" />
      <path d="M27 11V18" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" />
    </g>
  </g>
  <!-- Wordmark & Tagline -->
  <g transform="translate(125, 20)">
    <text x="0" y="44" class="title-monsieur">Monsieur<tspan class="title-fanyi">Fanyi</tspan></text>
    <text x="2" y="70" class="subtitle">Le bon prof, au bon moment</text>
  </g>
</svg>"""

# Horizontal Dark Background
SVG_HORIZONTAL_DARK = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120" width="520" height="120" fill="none">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&amp;family=DM+Sans:ital,wght@1,500&amp;display=swap');
      .title-monsieur-dark { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 40px; fill: #FFFFFF; letter-spacing: -0.03em; }
      .title-fanyi-dark { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 40px; fill: #F59E0B; letter-spacing: -0.03em; }
      .subtitle-dark { font-family: 'DM Sans', system-ui, -apple-system, sans-serif; font-weight: 500; font-style: italic; font-size: 15px; fill: #94A3B8; letter-spacing: -0.01em; }
    </style>
  </defs>
  <!-- Logomark Badge -->
  <g id="badge-container" transform="translate(15, 15)">
    <rect width="90" height="90" rx="22" fill="#FFFFFF" fill-opacity="0.10" />
    <g id="mark" transform="translate(10, 10) scale(1.944)">
      <!-- Livre d'or ouvert -->
      <path d="M6 24C10 21 15 21 18 24C21 21 26 21 30 24V11C26 8 21 8 18 11C15 8 10 8 6 11V24Z" fill="#F59E0B" />
      <path d="M18 11V24" stroke="#D97706" stroke-width="1.5" />
      <!-- Toque academique blanche / doree -->
      <path d="M18 5L7 10L18 15L29 10L18 5Z" fill="#FFFFFF" />
      <path d="M11 12.5V17C11 19 14 20.5 18 20.5C22 20.5 25 19 25 17V12.5" stroke="#FFFFFF" stroke-width="1.5" fill="none" />
      <path d="M27 11V18" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" />
    </g>
  </g>
  <!-- Wordmark & Tagline -->
  <g transform="translate(125, 20)">
    <text x="0" y="44" class="title-monsieur-dark">Monsieur<tspan class="title-fanyi-dark">Fanyi</tspan></text>
    <text x="2" y="70" class="subtitle-dark">Le bon prof, au bon moment</text>
  </g>
</svg>"""

# Stacked Centered Light
SVG_STACKED_LIGHT = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 300" width="360" height="300" fill="none">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&amp;family=DM+Sans:ital,wght@1,500&amp;display=swap');
      .stacked-title-monsieur { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 36px; fill: #152E4D; letter-spacing: -0.03em; text-anchor: middle; }
      .stacked-title-fanyi { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 36px; fill: #F59E0B; letter-spacing: -0.03em; }
      .stacked-subtitle { font-family: 'DM Sans', system-ui, -apple-system, sans-serif; font-weight: 500; font-style: italic; font-size: 15px; fill: #64748B; letter-spacing: -0.01em; text-anchor: middle; }
    </style>
  </defs>
  <!-- Logomark Badge Centered -->
  <g id="badge-container" transform="translate(130, 24)">
    <rect width="100" height="100" rx="24" fill="#F59E0B" fill-opacity="0.12" />
    <g id="mark" transform="translate(11, 11) scale(2.166)">
      <path d="M6 24C10 21 15 21 18 24C21 21 26 21 30 24V11C26 8 21 8 18 11C15 8 10 8 6 11V24Z" fill="#F59E0B" />
      <path d="M18 11V24" stroke="#D97706" stroke-width="1.5" />
      <path d="M18 5L7 10L18 15L29 10L18 5Z" fill="#152E4D" />
      <path d="M11 12.5V17C11 19 14 20.5 18 20.5C22 20.5 25 19 25 17V12.5" stroke="#152E4D" stroke-width="1.5" fill="none" />
      <path d="M27 11V18" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" />
    </g>
  </g>
  <!-- Wordmark -->
  <text x="180" y="190" class="stacked-title-monsieur">Monsieur<tspan class="stacked-title-fanyi">Fanyi</tspan></text>
  <text x="180" y="222" class="stacked-subtitle">Le bon prof, au bon moment</text>
  <text x="180" y="250" font-family="'DM Sans', sans-serif" font-weight="600" font-size="11px" fill="#94A3B8" letter-spacing="0.15em" text-anchor="middle">GUINÉE • ÉDUCATION</text>
</svg>"""

# Stacked Centered Dark
SVG_STACKED_DARK = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 300" width="360" height="300" fill="none">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&amp;family=DM+Sans:ital,wght@1,500&amp;display=swap');
      .stacked-title-monsieur-dark { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 36px; fill: #FFFFFF; letter-spacing: -0.03em; text-anchor: middle; }
      .stacked-title-fanyi-dark { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 36px; fill: #F59E0B; letter-spacing: -0.03em; }
      .stacked-subtitle-dark { font-family: 'DM Sans', system-ui, -apple-system, sans-serif; font-weight: 500; font-style: italic; font-size: 15px; fill: #94A3B8; letter-spacing: -0.01em; text-anchor: middle; }
    </style>
  </defs>
  <!-- Logomark Badge Centered -->
  <g id="badge-container" transform="translate(130, 24)">
    <rect width="100" height="100" rx="24" fill="#FFFFFF" fill-opacity="0.10" />
    <g id="mark" transform="translate(11, 11) scale(2.166)">
      <path d="M6 24C10 21 15 21 18 24C21 21 26 21 30 24V11C26 8 21 8 18 11C15 8 10 8 6 11V24Z" fill="#F59E0B" />
      <path d="M18 11V24" stroke="#D97706" stroke-width="1.5" />
      <path d="M18 5L7 10L18 15L29 10L18 5Z" fill="#FFFFFF" />
      <path d="M11 12.5V17C11 19 14 20.5 18 20.5C22 20.5 25 19 25 17V12.5" stroke="#FFFFFF" stroke-width="1.5" fill="none" />
      <path d="M27 11V18" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" />
    </g>
  </g>
  <!-- Wordmark -->
  <text x="180" y="190" class="stacked-title-monsieur-dark">Monsieur<tspan class="stacked-title-fanyi-dark">Fanyi</tspan></text>
  <text x="180" y="222" class="stacked-subtitle-dark">Le bon prof, au bon moment</text>
  <text x="180" y="250" font-family="'DM Sans', sans-serif" font-weight="600" font-size="11px" fill="#64748B" letter-spacing="0.15em" text-anchor="middle">GUINÉE • ÉDUCATION</text>
</svg>"""

# Standalone Mark (Raw 36x36 vector scalable)
SVG_MARK_STANDALONE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36" fill="none">
  <!-- Livre ouvert couleur doree -->
  <path d="M6 24C10 21 15 21 18 24C21 21 26 21 30 24V11C26 8 21 8 18 11C15 8 10 8 6 11V24Z" fill="#F59E0B" />
  <path d="M18 11V24" stroke="#D97706" stroke-width="1.5" />
  <!-- Toque d'etudiant bleu marine -->
  <path d="M18 5L7 10L18 15L29 10L18 5Z" fill="#152E4D" />
  <path d="M11 12.5V17C11 19 14 20.5 18 20.5C22 20.5 25 19 25 17V12.5" stroke="#152E4D" stroke-width="1.5" fill="none" />
  <path d="M27 11V18" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" />
</svg>"""

# Standalone Mark with Badge (Navbar Icon replica)
SVG_MARK_BADGE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" fill="none">
  <rect width="100" height="100" rx="26" fill="#F59E0B" fill-opacity="0.12" />
  <g transform="translate(11, 11) scale(2.166)">
    <path d="M6 24C10 21 15 21 18 24C21 21 26 21 30 24V11C26 8 21 8 18 11C15 8 10 8 6 11V24Z" fill="#F59E0B" />
    <path d="M18 11V24" stroke="#D97706" stroke-width="1.5" />
    <path d="M18 5L7 10L18 15L29 10L18 5Z" fill="#152E4D" />
    <path d="M11 12.5V17C11 19 14 20.5 18 20.5C22 20.5 25 19 25 17V12.5" stroke="#152E4D" stroke-width="1.5" fill="none" />
    <path d="M27 11V18" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" />
  </g>
</svg>"""

# Monochrome Black
SVG_MONOCHROME_BLACK = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120" width="520" height="120" fill="none">
  <defs>
    <style>
      .title-mono-black { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-weight: 800; font-size: 40px; fill: #000000; letter-spacing: -0.03em; }
      .sub-mono-black { font-family: 'DM Sans', system-ui, sans-serif; font-weight: 500; font-style: italic; font-size: 15px; fill: #333333; letter-spacing: -0.01em; }
    </style>
  </defs>
  <g transform="translate(15, 15)">
    <rect width="90" height="90" rx="22" fill="#000000" fill-opacity="0.08" />
    <g transform="translate(10, 10) scale(1.944)">
      <path d="M6 24C10 21 15 21 18 24C21 21 26 21 30 24V11C26 8 21 8 18 11C15 8 10 8 6 11V24Z" fill="#000000" />
      <path d="M18 11V24" stroke="#FFFFFF" stroke-width="1.5" />
      <path d="M18 5L7 10L18 15L29 10L18 5Z" fill="#000000" />
      <path d="M11 12.5V17C11 19 14 20.5 18 20.5C22 20.5 25 19 25 17V12.5" stroke="#000000" stroke-width="1.5" fill="none" />
      <path d="M27 11V18" stroke="#000000" stroke-width="1.5" stroke-linecap="round" />
    </g>
  </g>
  <g transform="translate(125, 20)">
    <text x="0" y="44" class="title-mono-black">MonsieurFanyi</text>
    <text x="2" y="70" class="sub-mono-black">Le bon prof, au bon moment</text>
  </g>
</svg>"""

# Monochrome White
SVG_MONOCHROME_WHITE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120" width="520" height="120" fill="none">
  <defs>
    <style>
      .title-mono-white { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-weight: 800; font-size: 40px; fill: #FFFFFF; letter-spacing: -0.03em; }
      .sub-mono-white { font-family: 'DM Sans', system-ui, sans-serif; font-weight: 500; font-style: italic; font-size: 15px; fill: #E2E8F0; letter-spacing: -0.01em; }
    </style>
  </defs>
  <g transform="translate(15, 15)">
    <rect width="90" height="90" rx="22" fill="#FFFFFF" fill-opacity="0.15" />
    <g transform="translate(10, 10) scale(1.944)">
      <path d="M6 24C10 21 15 21 18 24C21 21 26 21 30 24V11C26 8 21 8 18 11C15 8 10 8 6 11V24Z" fill="#FFFFFF" />
      <path d="M18 11V24" stroke="#000000" stroke-width="1.5" />
      <path d="M18 5L7 10L18 15L29 10L18 5Z" fill="#FFFFFF" />
      <path d="M11 12.5V17C11 19 14 20.5 18 20.5C22 20.5 25 19 25 17V12.5" stroke="#FFFFFF" stroke-width="1.5" fill="none" />
      <path d="M27 11V18" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" />
    </g>
  </g>
  <g transform="translate(125, 20)">
    <text x="0" y="44" class="title-mono-white">MonsieurFanyi</text>
    <text x="2" y="70" class="sub-mono-white">Le bon prof, au bon moment</text>
  </g>
</svg>"""

svg_files = {
    "monsieur-fanyi-logo-horizontal-light.svg": SVG_HORIZONTAL_LIGHT,
    "monsieur-fanyi-logo-horizontal-dark.svg": SVG_HORIZONTAL_DARK,
    "monsieur-fanyi-logo-stacked-light.svg": SVG_STACKED_LIGHT,
    "monsieur-fanyi-logo-stacked-dark.svg": SVG_STACKED_DARK,
    "monsieur-fanyi-mark-standalone.svg": SVG_MARK_STANDALONE,
    "monsieur-fanyi-mark-badge.svg": SVG_MARK_BADGE,
    "monsieur-fanyi-monochrome-black.svg": SVG_MONOCHROME_BLACK,
    "monsieur-fanyi-monochrome-white.svg": SVG_MONOCHROME_WHITE,
    "favicon.svg": SVG_MARK_STANDALONE,
}

for name, content in svg_files.items():
    fp = os.path.join(SVG_DIR, name)
    with open(fp, "w", encoding="utf-8") as f:
        f.write(content)
    # Also copy favicon.svg to favicon directory
    if name == "favicon.svg":
        with open(os.path.join(FAVICON_DIR, name), "w", encoding="utf-8") as f:
            f.write(content)

print(f"Generated {len(svg_files)} SVG logo assets in {SVG_DIR}")


# -------------------------------------------------------------
# 2. High-Resolution PNG Rendering via Pillow
# -------------------------------------------------------------

def draw_book_and_cap(draw, origin_x, origin_y, scale, cap_color=(21, 46, 77), book_color=(245, 158, 11), spine_color=(217, 119, 6), tassel_color=(245, 158, 11)):
    """
    Renders the exact vector coordinates of book + mortarboard into Pillow draw object at high resolution.
    Vector coordinates scale from 36x36 base.
    """
    s = scale
    ox, oy = origin_x, origin_y

    def pt(x, y):
        return (ox + x * s, oy + y * s)

    # 1. Open book polygon / curves
    # Left page
    left_page = [
        pt(6, 11), pt(10, 8), pt(15, 8), pt(18, 11),
        pt(18, 24), pt(15, 21), pt(10, 21), pt(6, 24)
    ]
    # Right page
    right_page = [
        pt(18, 11), pt(21, 8), pt(26, 8), pt(30, 11),
        pt(30, 24), pt(26, 21), pt(21, 21), pt(18, 24)
    ]
    draw.polygon(left_page, fill=book_color)
    draw.polygon(right_page, fill=book_color)

    # Spine line
    draw.line([pt(18, 11), pt(18, 24)], fill=spine_color, width=max(2, int(1.5 * s)))

    # 2. Student mortarboard top (Diamond)
    cap_top = [pt(18, 5), pt(7, 10), pt(18, 15), pt(29, 10)]
    draw.polygon(cap_top, fill=cap_color)

    # Cap skull bottom arc / polygon
    cap_bottom = [
        pt(11, 12.5), pt(11, 17), pt(14, 20.5), pt(18, 20.5),
        pt(22, 20.5), pt(25, 17), pt(25, 12.5), pt(23, 14),
        pt(18, 16), pt(13, 14)
    ]
    draw.polygon(cap_bottom, fill=cap_color)

    # Tassel
    draw.line([pt(27, 11), pt(27, 18)], fill=tassel_color, width=max(2, int(1.6 * s)))
    # Tassel fringe
    draw.ellipse([pt(26.2, 17.5), pt(27.8, 19)], fill=tassel_color)


def generate_png_logo_horizontal(is_dark=False, scale_factor=4):
    """
    Renders 520x120 base at scale_factor (e.g. 2080x480 px, ultra-crisp transparent PNG)
    """
    w, h = 520 * scale_factor, 120 * scale_factor
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    pjs_path = os.path.join(FONT_DIR, "PlusJakartaSans-Variable.ttf")
    dms_path = os.path.join(FONT_DIR, "DMSans-Italic-Variable.ttf")

    title_size = int(40 * scale_factor)
    sub_size = int(15.5 * scale_factor)

    font_title = ImageFont.truetype(pjs_path, title_size)
    font_sub = ImageFont.truetype(dms_path, sub_size)

    # Badge background
    bx, by = 15 * scale_factor, 15 * scale_factor
    bw, bh = 90 * scale_factor, 90 * scale_factor
    br = 22 * scale_factor
    badge_bg = (255, 255, 255, 28) if is_dark else (245, 158, 11, 32)
    draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=br, fill=badge_bg)

    # Render Mark inside badge
    cap_col = (255, 255, 255, 255) if is_dark else (21, 46, 77, 255)
    book_col = (245, 158, 11, 255)
    spine_col = (217, 119, 6, 255)
    mark_scale = (70 * scale_factor) / 36.0
    mx = bx + 10 * scale_factor
    my = by + 10 * scale_factor
    draw_book_and_cap(draw, mx, my, mark_scale, cap_color=cap_col, book_color=book_col, spine_color=spine_col)

    # Text rendering
    tx = 125 * scale_factor
    ty = 22 * scale_factor

    col_monsieur = (255, 255, 255, 255) if is_dark else (21, 46, 77, 255)
    col_fanyi = (245, 158, 11, 255)
    col_sub = (148, 163, 184, 255) if is_dark else (100, 116, 139, 255)

    draw.text((tx, ty), "Monsieur", font=font_title, fill=col_monsieur)
    m_bbox = font_title.getbbox("Monsieur")
    m_width = m_bbox[2] - m_bbox[0]
    draw.text((tx + m_width - int(1.5 * scale_factor), ty), "Fanyi", font=font_title, fill=col_fanyi)

    sub_y = ty + title_size + int(12 * scale_factor)
    draw.text((tx + int(2 * scale_factor), sub_y), "Le bon prof, au bon moment", font=font_sub, fill=col_sub)

    filename = "monsieur-fanyi-logo-horizontal-dark.png" if is_dark else "monsieur-fanyi-logo-horizontal-light.png"
    im.save(os.path.join(PNG_DIR, filename), "PNG", dpi=(300, 300))
    print(f"Generated {filename} ({w}x{h} px)")


def generate_png_logo_stacked(is_dark=False, scale_factor=4):
    """
    Renders 360x300 base at scale_factor (1440x1200 px, ultra-crisp transparent PNG)
    """
    w, h = 360 * scale_factor, 300 * scale_factor
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    pjs_path = os.path.join(FONT_DIR, "PlusJakartaSans-Variable.ttf")
    dms_path = os.path.join(FONT_DIR, "DMSans-Italic-Variable.ttf")
    dms_reg = os.path.join(FONT_DIR, "DMSans-Variable.ttf")

    title_size = int(36 * scale_factor)
    sub_size = int(15 * scale_factor)
    tag_size = int(11 * scale_factor)

    font_title = ImageFont.truetype(pjs_path, title_size)
    font_sub = ImageFont.truetype(dms_path, sub_size)
    font_tag = ImageFont.truetype(dms_reg, tag_size)

    # Centered Badge
    bw, bh = 100 * scale_factor, 100 * scale_factor
    bx = (w - bw) // 2
    by = 24 * scale_factor
    br = 24 * scale_factor
    badge_bg = (255, 255, 255, 28) if is_dark else (245, 158, 11, 32)
    draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=br, fill=badge_bg)

    cap_col = (255, 255, 255, 255) if is_dark else (21, 46, 77, 255)
    book_col = (245, 158, 11, 255)
    spine_col = (217, 119, 6, 255)
    mark_scale = (78 * scale_factor) / 36.0
    mx = bx + int(11 * scale_factor)
    my = by + int(11 * scale_factor)
    draw_book_and_cap(draw, mx, my, mark_scale, cap_color=cap_col, book_color=book_col, spine_color=spine_col)

    # Wordmark Centered
    col_monsieur = (255, 255, 255, 255) if is_dark else (21, 46, 77, 255)
    col_fanyi = (245, 158, 11, 255)
    col_sub = (148, 163, 184, 255) if is_dark else (100, 116, 139, 255)

    m_bbox = font_title.getbbox("Monsieur")
    m_w = m_bbox[2] - m_bbox[0]
    f_bbox = font_title.getbbox("Fanyi")
    f_w = f_bbox[2] - f_bbox[0]
    total_title_w = m_w + f_w - int(2 * scale_factor)
    title_x = (w - total_title_w) // 2
    title_y = by + bh + int(24 * scale_factor)

    draw.text((title_x, title_y), "Monsieur", font=font_title, fill=col_monsieur)
    draw.text((title_x + m_w - int(2 * scale_factor), title_y), "Fanyi", font=font_title, fill=col_fanyi)

    # Subtitle
    sub_text = "Le bon prof, au bon moment"
    sub_bbox = font_sub.getbbox(sub_text)
    sub_w = sub_bbox[2] - sub_bbox[0]
    sub_x = (w - sub_w) // 2
    sub_y = title_y + title_size + int(10 * scale_factor)
    draw.text((sub_x, sub_y), sub_text, font=font_sub, fill=col_sub)

    # Tagline "GUINÉE • ÉDUCATION"
    tag_text = "GUINÉE • ÉDUCATION"
    tag_bbox = font_tag.getbbox(tag_text)
    tag_w = tag_bbox[2] - tag_bbox[0]
    tag_x = (w - tag_w) // 2
    tag_y = sub_y + sub_size + int(10 * scale_factor)
    draw.text((tag_x, tag_y), tag_text, font=font_tag, fill=(148, 163, 184, 255) if is_dark else (148, 163, 184, 255))

    filename = "monsieur-fanyi-logo-stacked-dark.png" if is_dark else "monsieur-fanyi-logo-stacked-light.png"
    im.save(os.path.join(PNG_DIR, filename), "PNG", dpi=(300, 300))
    print(f"Generated {filename} ({w}x{h} px)")


def generate_png_mark(size=1024, with_badge=True, is_dark=False):
    """
    Renders square mark icon at high resolution (1024x1024 px)
    """
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    cap_col = (255, 255, 255, 255) if is_dark else (21, 46, 77, 255)
    book_col = (245, 158, 11, 255)
    spine_col = (217, 119, 6, 255)

    if with_badge:
        pad = int(size * 0.08)
        radius = int(size * 0.24)
        badge_bg = (255, 255, 255, 28) if is_dark else (245, 158, 11, 32)
        draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=radius, fill=badge_bg)
        
        inner_pad = int(size * 0.18)
        mark_w = size - 2 * inner_pad
        scale = mark_w / 36.0
        draw_book_and_cap(draw, inner_pad, inner_pad, scale, cap_color=cap_col, book_color=book_col, spine_color=spine_col)
        name = "monsieur-fanyi-mark-dark-badge.png" if is_dark else "monsieur-fanyi-mark-badge.png"
    else:
        pad = int(size * 0.12)
        mark_w = size - 2 * pad
        scale = mark_w / 36.0
        draw_book_and_cap(draw, pad, pad, scale, cap_color=cap_col, book_color=book_col, spine_color=spine_col)
        name = "monsieur-fanyi-mark-dark.png" if is_dark else "monsieur-fanyi-mark-light.png"

    im.save(os.path.join(PNG_DIR, name), "PNG", dpi=(300, 300))
    print(f"Generated {name} ({size}x{size} px)")
    return im


def generate_favicons():
    """
    Generates multi-resolution favicons, Apple touch icons, and Android chrome icons
    """
    # Base icon 512x512
    base = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(base)
    # Background rounded container for clear visibility on any tab/screen
    draw.rounded_rectangle([16, 16, 496, 496], radius=110, fill=(245, 158, 11, 38))
    draw_book_and_cap(draw, 64, 64, 384 / 36.0)

    # 1. Android Chrome 512x512 & 192x192
    base.save(os.path.join(FAVICON_DIR, "android-chrome-512x512.png"), "PNG")
    base.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(FAVICON_DIR, "android-chrome-192x192.png"), "PNG")

    # 2. Apple Touch Icon 180x180 (solid white/light background for iOS home screen)
    apple = Image.new("RGBA", (180, 180), (255, 255, 255, 255))
    draw_apple = ImageDraw.Draw(apple)
    draw_apple.rounded_rectangle([8, 8, 172, 172], radius=40, fill=(245, 158, 11, 25))
    draw_book_and_cap(draw_apple, 24, 24, 132 / 36.0)
    apple.save(os.path.join(FAVICON_DIR, "apple-touch-icon.png"), "PNG")

    # 3. Standard PNG favicons 32x32 & 16x16
    fav32 = base.resize((32, 32), Image.Resampling.LANCZOS)
    fav16 = base.resize((16, 16), Image.Resampling.LANCZOS)
    fav32.save(os.path.join(FAVICON_DIR, "favicon-32x32.png"), "PNG")
    fav16.save(os.path.join(FAVICON_DIR, "favicon-16x16.png"), "PNG")

    # 4. Multi-layer ICO
    fav48 = base.resize((48, 48), Image.Resampling.LANCZOS)
    fav48.save(os.path.join(FAVICON_DIR, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Generated complete favicon and app icon suite in", FAVICON_DIR)


# Execute all
generate_png_logo_horizontal(is_dark=False)
generate_png_logo_horizontal(is_dark=True)
generate_png_logo_stacked(is_dark=False)
generate_png_logo_stacked(is_dark=True)
generate_png_mark(size=1024, with_badge=True, is_dark=False)
generate_png_mark(size=1024, with_badge=True, is_dark=True)
generate_png_mark(size=1024, with_badge=False, is_dark=False)
generate_png_mark(size=1024, with_badge=False, is_dark=True)
generate_favicons()

# Create README.md for 01-Official-Logo
readme_logo = """# Monsieur Fanyi — Bibliothèque des Logos Officiels

Ce dossier contient l'ensemble des déclinaisons du logo officiel de **Monsieur Fanyi**, conformes à l'identité visuelle déployée sur le site web [monsieurfanyi.com](https://monsieurfanyi.com).

## 1. Structure du Dossier

- **`SVG/`** : Fichiers vectoriels infinis (formats maîtres pour imprimeurs, infographistes, Canva, Figma et Adobe Illustrator).
  - `monsieur-fanyi-logo-horizontal-light.svg` : Logo principal horizontal pour fonds clairs.
  - `monsieur-fanyi-logo-horizontal-dark.svg` : Logo principal horizontal pour fonds sombres.
  - `monsieur-fanyi-logo-stacked-light.svg` : Logo centré vertical pour affiches et bannières.
  - `monsieur-fanyi-logo-stacked-dark.svg` : Logo centré vertical pour fonds foncés.
  - `monsieur-fanyi-mark-badge.svg` : Emblème seul sous forme de badge arrondi officiel (icône du header).
  - `monsieur-fanyi-mark-standalone.svg` : Emblème pur (livre doré + toque académique).
  - `monsieur-fanyi-monochrome-black.svg` : Version 100% noir pour documents administratifs et impressions noir & blanc.
  - `monsieur-fanyi-monochrome-white.svg` : Version 100% blanc pour incrustation sur photos contrastées.
- **`PNG/`** : Fichiers images haute résolution 300 DPI sur fond transparent (exportés en 2080px à 1440px de largeur).
- **`Favicon-and-App-Icons/`** : Icônes web et mobiles (`favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-512x512.png`).

## 2. Anatomie du Logo

1. **L'Emblème (Logomark)** :
   - Un **livre ouvert doré** (`#F59E0B`, reliure `#D97706`), symbolisant la connaissance, la rigueur académique et l'accès à l'excellence.
   - Une **toque académique bleu marine** (`#152E4D`), incarnant la réussite scolaire, le diplôme et la qualification certifiée de nos enseignants.
   - Le pompon doré suspendu (`#F59E0B`), marquant l'aboutissement et l'élévation des élèves guinéens.
2. **Le Wordmark (Typographie de marque)** :
   - **Monsieur** en *Plus Jakarta Sans ExtraBold* bleu marine profond (`#152E4D`).
   - **Fanyi** en *Plus Jakarta Sans ExtraBold* or chaleureux (`#F59E0B`).
3. **Le Slogan Officiel (Signature)** :
   - *« Le bon prof, au bon moment »* composé en *DM Sans Medium Italic* gris ardoise (`#64748B`).

## 3. Règles d'Usage Strictes

- **Ne pas déformer ni étirer** le logo.
- **Ne pas modifier les couleurs officielles** (Bleu marine `#152E4D` et Or `#F59E0B`).
- **Ne pas dissocier** la toque du livre ouvert sans validation expresse.
- Toujours maintenir une zone de dégagement minimale égale à la hauteur de la lettre « M » autour du logo.
"""

with open(os.path.join(LOGO_DIR, "README.md"), "w", encoding="utf-8") as f:
    f.write(readme_logo)

print("Logo generation complete!")


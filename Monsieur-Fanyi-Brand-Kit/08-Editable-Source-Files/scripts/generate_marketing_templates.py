"""
Monsieur Fanyi - Official Brand Asset Generator
Script 03: Social Media & Promotional Templates Generator (Instagram, Stories, WhatsApp, Facebook Covers)
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = r"d:\Instructor\Monsieur-Fanyi-Brand-Kit"
OUT_SOCIAL = os.path.join(BASE_DIR, "04-Social-Media-Templates")
OUT_BANNERS = os.path.join(BASE_DIR, "05-Promotional-Banners")
VISUALS_DIR = os.path.join(BASE_DIR, "03-Homepage-Visuals")
LOGO_PNG_DIR = os.path.join(BASE_DIR, "01-Official-Logo", "PNG")
FONT_DIR = os.path.join(BASE_DIR, "02-Brand-Colors-and-Typography", "Fonts")

DIR_SQ = os.path.join(OUT_SOCIAL, "Instagram-Square-1080x1080")
DIR_PORT = os.path.join(OUT_SOCIAL, "Instagram-Portrait-1080x1350")
DIR_STORY = os.path.join(OUT_SOCIAL, "Stories-1080x1920")
DIR_WA = os.path.join(OUT_SOCIAL, "WhatsApp")

for d in [DIR_SQ, DIR_PORT, DIR_STORY, DIR_WA, OUT_BANNERS]:
    os.makedirs(d, exist_ok=True)

# Fonts
pjs_var = os.path.join(FONT_DIR, "PlusJakartaSans-Variable.ttf")
dms_var = os.path.join(FONT_DIR, "DMSans-Variable.ttf")
dms_it = os.path.join(FONT_DIR, "DMSans-Italic-Variable.ttf")
cav_var = os.path.join(FONT_DIR, "Caveat-Variable.ttf")

# Official Colors
NAVY_PRIMARY = (16, 35, 63, 255)
NAVY_LOGO = (21, 46, 77, 255)
NAVY_DARK = (11, 21, 38, 255)
GOLD_AMBER = (245, 158, 11, 255)
GOLD_PILL = (249, 196, 80, 255)
BLUE_PRIMARY = (37, 99, 235, 255)
TEAL_ACCENT = (13, 148, 136, 255)
WHITE = (255, 255, 255, 255)
MUTED_SLATE = (100, 116, 139, 255)
LIGHT_SLATE = (226, 232, 240, 255)
SURFACE_WARM = (248, 250, 252, 255)

# Load Logo PNGs
logo_dark = Image.open(os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-logo-horizontal-dark.png")).convert("RGBA")
logo_light = Image.open(os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-logo-horizontal-light.png")).convert("RGBA")
logo_stacked = Image.open(os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-logo-stacked-dark.png")).convert("RGBA")
mark_badge = Image.open(os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-mark-badge.png")).convert("RGBA")


def draw_header_logo(im, is_dark=True, x=60, y=50, width=320):
    logo = logo_dark if is_dark else logo_light
    w_orig, h_orig = logo.size
    h = int(width * h_orig / w_orig)
    resized = logo.resize((width, h), Image.Resampling.LANCZOS)
    im.paste(resized, (x, y), resized)
    return y + h


def draw_contact_bar(draw, y, width, is_dark=True):
    font_bold = ImageFont.truetype(pjs_var, 16)
    font_reg = ImageFont.truetype(dms_var, 15)
    
    bg_col = (11, 21, 38, 240) if is_dark else (255, 255, 255, 240)
    line_col = (255, 255, 255, 35) if is_dark else (203, 213, 225, 255)
    text_col = (255, 255, 255, 255) if is_dark else (15, 23, 42, 255)
    accent_col = GOLD_AMBER

    draw.line([(60, y), (width - 60, y)], fill=line_col, width=1)

    # 3 items: Phone, Email, Website
    phone_text = "+224 612 365 314"
    site_text = "monsieurfanyi.com"
    guinea_text = "Conakry • Guinée"

    draw.text((60, y + 16), phone_text, font=font_bold, fill=accent_col)
    
    # Center site
    site_bbox = font_bold.getbbox(site_text)
    site_w = site_bbox[2] - site_bbox[0]
    draw.text(((width - site_w) // 2, y + 16), site_text, font=font_bold, fill=text_col)

    # Right guinea
    g_bbox = font_reg.getbbox(guinea_text)
    g_w = g_bbox[2] - g_bbox[0]
    draw.text((width - 60 - g_w, y + 16), guinea_text, font=font_reg, fill=MUTED_SLATE if not is_dark else (203, 213, 225, 255))


# -------------------------------------------------------------------------
# 1. INSTAGRAM SQUARE POSTS (1080x1080)
# -------------------------------------------------------------------------

def make_ig_square_launch():
    """Post 01: Annonce du lancement officiel de la plateforme"""
    w, h = 1080, 1080
    im = Image.new("RGBA", (w, h), NAVY_DARK)

    # Background photo with cinematic vignette overlay
    bg_photo = Image.open(os.path.join(VISUALS_DIR, "hero_student_ultra_hd_4k.jpg")).convert("RGBA")
    # Crop to right/center
    pw, ph = bg_photo.size
    crop_w = int(ph * 1.0)
    bg_cropped = bg_photo.crop((pw - crop_w - 100, 0, pw - 100, ph)).resize((w, h), Image.Resampling.LANCZOS)
    im.paste(bg_cropped, (0, 0))

    # Dark gradient overlay from left to right
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw_g = ImageDraw.Draw(grad)
    for x in range(w):
        # 0 to 600: strong opacity, then fades
        if x < 450:
            alpha = 245
        elif x < 850:
            alpha = int(245 - (x - 450) * (200 / 400))
        else:
            alpha = int(45 - (x - 850) * (45 / 230))
        draw_g.line([(x, 0), (x, h)], fill=(7, 19, 34, max(0, min(255, alpha))))
    im = Image.alpha_composite(im, grad)
    draw = ImageDraw.Draw(im)

    # Logo top left
    draw_header_logo(im, is_dark=True, x=70, y=65, width=330)

    # Pill badge "NOUVELLE PLATEFORME"
    draw.rounded_rectangle([70, 165, 340, 205], radius=20, fill=(245, 158, 11, 40), outline=GOLD_AMBER, width=2)
    f_badge = ImageFont.truetype(pjs_var, 14)
    draw.text((92, 177), "✦ OFFICIELLEMENT EN LIGNE", font=f_badge, fill=GOLD_AMBER)

    # Titles
    f_h1 = ImageFont.truetype(pjs_var, 48)
    f_quote = ImageFont.truetype(cav_var, 58)
    f_body = ImageFont.truetype(dms_var, 20)

    draw.text((70, 240), "Le soutien scolaire", font=f_h1, fill=WHITE)
    draw.text((70, 300), "d'excellence arrive", font=f_h1, fill=WHITE)
    draw.text((70, 360), "à Conakry.", font=f_h1, fill=GOLD_PILL)

    # Handwritten accent
    draw.text((70, 440), "« Chaque enfant peut réussir. »", font=f_quote, fill=GOLD_AMBER)

    # 3 Key Value Props with tick marks
    f_prop = ImageFont.truetype(pjs_var, 19)
    props = [
        "Enseignants diplômés rigoureusement sélectionnés",
        "Carnet de progression avec bilans séance par séance",
        "Paiements protégés Orange Money & MTN Mobile Money"
    ]
    py = 535
    for p in props:
        draw.ellipse([70, py + 4, 88, py + 22], fill=TEAL_ACCENT)
        draw.text((76, py + 5), "✓", font=ImageFont.truetype(pjs_var, 12), fill=WHITE)
        draw.text((105, py), p, font=f_prop, fill=WHITE)
        py += 48

    # CTA Button Pill
    btn_y = 715
    draw.rounded_rectangle([70, btn_y, 490, btn_y + 68], radius=34, fill=GOLD_PILL)
    f_btn = ImageFont.truetype(pjs_var, 21)
    draw.text((105, btn_y + 20), "Réserver un cours particulier →", font=f_btn, fill=(15, 23, 42, 255))

    # Bottom Contact Bar
    draw_contact_bar(draw, 1000, w, is_dark=True)

    out = os.path.join(DIR_SQ, "01-lancement-plateforme-1080x1080.png")
    im.save(out, "PNG", dpi=(300, 300))
    print("Generated Instagram Square 01")


def make_ig_square_teachers():
    """Post 02: Campagne de recrutement des enseignants"""
    w, h = 1080, 1080
    im = Image.new("RGBA", (w, h), NAVY_PRIMARY)

    # Background photo
    bg_photo = Image.open(os.path.join(VISUALS_DIR, "collage_female_teacher_new.jpg")).convert("RGBA")
    pw, ph = bg_photo.size
    bg_cropped = bg_photo.resize((w, h), Image.Resampling.LANCZOS)
    im.paste(bg_cropped, (0, 0))

    # Dark overlay
    overlay = Image.new("RGBA", (w, h), (7, 19, 34, 215))
    im = Image.alpha_composite(im, overlay)
    draw = ImageDraw.Draw(im)

    # Logo
    draw_header_logo(im, is_dark=True, x=70, y=60, width=320)

    # Badge Recrutement
    draw.rounded_rectangle([70, 155, 390, 195], radius=20, fill=(37, 99, 235, 60), outline=BLUE_PRIMARY, width=2)
    f_badge = ImageFont.truetype(pjs_var, 14)
    draw.text((92, 167), "CAMPAGNE DE RECRUTEMENT ENSEIGNANTS", font=f_badge, fill=(147, 197, 253, 255))

    # Big Title
    f_h1 = ImageFont.truetype(pjs_var, 46)
    draw.text((70, 230), "Enseignez à Conakry.", font=f_h1, fill=WHITE)
    draw.text((70, 290), "Valorisez votre savoir.", font=f_h1, fill=GOLD_PILL)

    # Subtitle
    f_sub = ImageFont.truetype(dms_var, 20)
    draw.text((70, 365), "Rejoignez le premier réseau sélectif de professeurs particuliers en Guinée.", font=f_sub, fill=(226, 232, 240, 255))

    # 4 Benefit Cards (2x2 Grid)
    cards = [
        {"val": "85%", "sub": "Reversés sur chaque heure", "desc": "Rémunération la plus juste du marché"},
        {"val": "100%", "sub": "Flexibilité d'emploi du temps", "desc": "Fixez vos créneaux et vos zones"},
        {"val": "Orange / MTN", "sub": "Paiements directs sécurisés", "desc": "Versements hebdomadaires fiables"},
        {"val": "Pédagogie", "sub": "Carnet de progression intégré", "desc": "Suivi sérieux et valorisant"}
    ]
    f_val = ImageFont.truetype(pjs_var, 28)
    f_card_sub = ImageFont.truetype(pjs_var, 15)
    f_card_desc = ImageFont.truetype(dms_var, 13)

    grid_y = 440
    card_w = 440
    card_h = 105
    for idx, c in enumerate(cards):
        cx = 70 if idx % 2 == 0 else 570
        cy = grid_y + (idx // 2) * 125
        draw.rounded_rectangle([cx, cy, cx + card_w, cy + card_h], radius=16, fill=(16, 35, 63, 200), outline=(255, 255, 255, 30), width=1)
        draw.text((cx + 20, cy + 14), c["val"], font=f_val, fill=GOLD_AMBER)
        draw.text((cx + 20, cy + 50), c["sub"], font=f_card_sub, fill=WHITE)
        draw.text((cx + 20, cy + 74), c["desc"], font=f_card_desc, fill=MUTED_SLATE)

    # CTA Button
    btn_y = 730
    draw.rounded_rectangle([70, btn_y, 480, btn_y + 68], radius=34, fill=GOLD_PILL)
    f_btn = ImageFont.truetype(pjs_var, 21)
    draw.text((105, btn_y + 20), "Postuler comme enseignant →", font=f_btn, fill=(15, 23, 42, 255))

    f_req = ImageFont.truetype(dms_var, 14)
    draw.text((70, btn_y + 85), "Critères : Diplôme universitaire vérifié • Casier judiciaire vierge • Entretien pédagogique", font=f_req, fill=MUTED_SLATE)

    draw_contact_bar(draw, 1000, w, is_dark=True)

    out = os.path.join(DIR_SQ, "02-recrutement-professeurs-1080x1080.png")
    im.save(out, "PNG", dpi=(300, 300))
    print("Generated Instagram Square 02")


def make_ig_square_parents():
    """Post 03: Campagne parents et élèves"""
    w, h = 1080, 1080
    im = Image.new("RGBA", (w, h), (248, 250, 252, 255))

    # Left color banner / Right image
    draw = ImageDraw.Draw(im)

    # Right side image
    right_photo = Image.open(os.path.join(VISUALS_DIR, "collage_teacher_boy_new.jpg")).convert("RGBA")
    pw, ph = right_photo.size
    crop_w = int(ph * (540 / 1080))
    right_cropped = right_photo.crop((0, 0, crop_w, ph)).resize((540, 1080), Image.Resampling.LANCZOS)
    im.paste(right_cropped, (540, 0))

    # Left side clean card
    draw_header_logo(im, is_dark=False, x=60, y=55, width=310)

    # Headline
    f_h1 = ImageFont.truetype(pjs_var, 42)
    f_sub = ImageFont.truetype(dms_var, 19)

    draw.text((60, 170), "Offrez à votre enfant", font=f_h1, fill=NAVY_LOGO)
    draw.text((60, 225), "le bon professeur,", font=f_h1, fill=NAVY_LOGO)
    draw.text((60, 280), "au bon moment.", font=f_h1, fill=GOLD_AMBER)

    draw.text((60, 360), "Du Primaire au BAC (Terminale)", font=ImageFont.truetype(pjs_var, 18), fill=BLUE_PRIMARY)
    body_txt = "Mathématiques • Français • Physiques • Chimie • Anglais\nCours à domicile ou en ligne à Conakry avec un suivi transparent."
    draw.text((60, 395), body_txt, font=f_sub, fill=(71, 85, 105, 255))

    # 3 Points Clés
    f_pt = ImageFont.truetype(pjs_var, 17)
    pts = [
        "Profils d'enseignants 100% vérifiés",
        "Séance d'essai & forfait mensuel flexible",
        "Validation parentale avant chaque paiement"
    ]
    py = 490
    for p in pts:
        draw.rounded_rectangle([60, py, 500, py + 52], radius=12, fill=(239, 246, 255, 255), outline=(219, 234, 254, 255), width=1)
        draw.text((75, py + 14), "★", font=ImageFont.truetype(pjs_var, 16), fill=GOLD_AMBER)
        draw.text((105, py + 15), p, font=f_pt, fill=NAVY_PRIMARY)
        py += 64

    # CTA Button
    btn_y = 730
    draw.rounded_rectangle([60, btn_y, 480, btn_y + 68], radius=34, fill=GOLD_PILL)
    f_btn = ImageFont.truetype(pjs_var, 20)
    draw.text((95, btn_y + 20), "Trouver un professeur qualifié →", font=f_btn, fill=(15, 23, 42, 255))

    draw_contact_bar(draw, 1000, w, is_dark=False)

    out = os.path.join(DIR_SQ, "03-inscription-parents-1080x1080.png")
    im.save(out, "PNG", dpi=(300, 300))
    print("Generated Instagram Square 03")


def make_ig_square_diaspora():
    """Post 04: Campagne pour la diaspora guinéenne à l'étranger"""
    w, h = 1080, 1080
    im = Image.new("RGBA", (w, h), NAVY_PRIMARY)

    bg_photo = Image.open(os.path.join(VISUALS_DIR, "collage_mother_child_new.jpg")).convert("RGBA")
    bg_cropped = bg_photo.resize((w, h), Image.Resampling.LANCZOS)
    im.paste(bg_cropped, (0, 0))

    overlay = Image.new("RGBA", (w, h), (11, 21, 38, 225))
    im = Image.alpha_composite(im, overlay)
    draw = ImageDraw.Draw(im)

    draw_header_logo(im, is_dark=True, x=70, y=60, width=320)

    draw.rounded_rectangle([70, 155, 420, 195], radius=20, fill=(13, 148, 136, 60), outline=TEAL_ACCENT, width=2)
    f_badge = ImageFont.truetype(pjs_var, 14)
    draw.text((92, 167), "POUR LES GUINÉENS DE L'ÉTRANGER (DIASPORA)", font=f_badge, fill=(153, 246, 228, 255))

    f_h1 = ImageFont.truetype(pjs_var, 44)
    draw.text((70, 230), "Financez la réussite scolaire", font=f_h1, fill=WHITE)
    draw.text((70, 288), "de vos proches au pays.", font=f_h1, fill=GOLD_PILL)

    f_sub = ImageFont.truetype(dms_var, 20)
    msg = ("Depuis la France, les USA, le Canada ou l'Afrique, soutenez vos neveux,\n"
           "nièces et enfants à Conakry avec une garantie totale de traçabilité.")
    draw.text((70, 365), msg, font=f_sub, fill=(226, 232, 240, 255))

    # 3 Transparency pillars
    pillars = [
        {"num": "01", "titre": "Suivi Séance par Séance", "desc": "Recevez le compte-rendu du professeur directement dans votre espace après chaque heure de cours."},
        {"num": "02", "titre": "Paiement 100% Protégé", "desc": "Votre argent est conservé en sécurité : le professeur n'est payé qu'une fois la séance validée."},
        {"num": "03", "titre": "Professeurs Certifiés", "desc": "Tous nos enseignants sont sélectionnés sur diplômes, casier judiciaire et compétences pédagogiques."}
    ]
    py = 475
    f_p_num = ImageFont.truetype(pjs_var, 24)
    f_p_title = ImageFont.truetype(pjs_var, 19)
    f_p_desc = ImageFont.truetype(dms_var, 14)

    for p in pillars:
        draw.rounded_rectangle([70, py, 1010, py + 72], radius=14, fill=(16, 35, 63, 210), outline=(255, 255, 255, 25), width=1)
        draw.text((90, py + 20), p["num"], font=f_p_num, fill=GOLD_AMBER)
        draw.text((150, py + 14), p["titre"], font=f_p_title, fill=WHITE)
        draw.text((150, py + 42), p["desc"], font=f_p_desc, fill=MUTED_SLATE)
        py += 86

    btn_y = 770
    draw.rounded_rectangle([70, btn_y, 480, btn_y + 68], radius=34, fill=GOLD_PILL)
    f_btn = ImageFont.truetype(pjs_var, 20)
    draw.text((105, btn_y + 20), "Planifier un soutien à distance →", font=f_btn, fill=(15, 23, 42, 255))

    draw_contact_bar(draw, 1000, w, is_dark=True)

    out = os.path.join(DIR_SQ, "04-diaspora-reussite-1080x1080.png")
    im.save(out, "PNG", dpi=(300, 300))
    print("Generated Instagram Square 04")


# -------------------------------------------------------------------------
# 2. INSTAGRAM PORTRAIT POSTS (1080x1350)
# -------------------------------------------------------------------------

def make_ig_portrait_quote():
    """Portrait 01: Citation Mandela + Visuel Hero"""
    w, h = 1080, 1350
    im = Image.new("RGBA", (w, h), NAVY_DARK)

    # Top Hero Image 1080x750
    hero_photo = Image.open(os.path.join(VISUALS_DIR, "hero_student_ultra_hd_4k.jpg")).convert("RGBA")
    pw, ph = hero_photo.size
    crop_w = int(ph * (1080 / 820))
    hero_cropped = hero_photo.crop((pw - crop_w - 50, 0, pw - 50, ph)).resize((w, 820), Image.Resampling.LANCZOS)
    im.paste(hero_cropped, (0, 0))

    # Bottom Gradient Overlay
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw_g = ImageDraw.Draw(grad)
    for y in range(h):
        if y < 450:
            alpha = int(y * 0.1)
        elif y < 820:
            alpha = int(45 + (y - 450) * (210 / 370))
        else:
            alpha = 255
        draw_g.line([(0, y), (w, y)], fill=(11, 21, 38, min(255, alpha)))
    im = Image.alpha_composite(im, grad)
    draw = ImageDraw.Draw(im)

    # Logo top
    draw_header_logo(im, is_dark=True, x=70, y=60, width=320)

    # Handwriting Top Right
    f_hw = ImageFont.truetype(cav_var, 38)
    draw.text((720, 65), "Chaque enfant\npeut réussir.", font=f_hw, fill=WHITE)

    # Large Quote Mandela
    qy = 680
    f_h1 = ImageFont.truetype(pjs_var, 48)
    f_hw_big = ImageFont.truetype(cav_var, 76)
    f_author = ImageFont.truetype(dms_it, 20)

    draw.text((70, qy), "« L'éducation est", font=f_h1, fill=WHITE)
    draw.text((70, qy + 55), "la seule arme", font=f_hw_big, fill=GOLD_PILL)
    draw.text((70, qy + 130), "pour s'en sortir. »", font=f_h1, fill=WHITE)
    draw.text((70, qy + 195), "— Nelson Mandela", font=f_author, fill=MUTED_SLATE)

    # Value statement
    f_desc = ImageFont.truetype(dms_var, 20)
    desc = ("À Conakry et dans toute la Guinée, Monsieur Fanyi accompagne vos enfants\n"
            "avec des enseignants rigoureusement certifiés et un carnet de suivi digital.")
    draw.text((70, 940), desc, font=f_desc, fill=(226, 232, 240, 255))

    # CTA Button
    btn_y = 1060
    draw.rounded_rectangle([70, btn_y, 480, btn_y + 70], radius=35, fill=GOLD_PILL)
    f_btn = ImageFont.truetype(pjs_var, 21)
    draw.text((105, btn_y + 22), "Découvrir nos professeurs →", font=f_btn, fill=(15, 23, 42, 255))

    draw_contact_bar(draw, 1260, w, is_dark=True)

    out = os.path.join(DIR_PORT, "01-excellence-scolaire-1080x1350.png")
    im.save(out, "PNG", dpi=(300, 300))
    print("Generated Instagram Portrait 01")


def make_ig_portrait_progress():
    """Portrait 02: Le Carnet de Progression Numérique"""
    w, h = 1080, 1350
    im = Image.new("RGBA", (w, h), NAVY_PRIMARY)
    draw = ImageDraw.Draw(im)

    # Ambient radial glow top center
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw_gl = ImageDraw.Draw(glow)
    draw_gl.ellipse([w // 2 - 400, -200, w // 2 + 400, 400], fill=(37, 99, 235, 45))
    im = Image.alpha_composite(im, glow)
    draw = ImageDraw.Draw(im)

    draw_header_logo(im, is_dark=True, x=70, y=60, width=320)

    # Badge Innovation
    draw.rounded_rectangle([70, 155, 370, 195], radius=20, fill=(13, 148, 136, 50), outline=TEAL_ACCENT, width=2)
    f_badge = ImageFont.truetype(pjs_var, 14)
    draw.text((92, 167), "INNOVATION PÉDAGOGIQUE GUINÉE", font=f_badge, fill=(153, 246, 228, 255))

    f_h1 = ImageFont.truetype(pjs_var, 48)
    draw.text((70, 230), "Le Carnet de", font=f_h1, fill=WHITE)
    draw.text((70, 290), "Progression Numérique", font=f_h1, fill=GOLD_PILL)

    f_sub = ImageFont.truetype(dms_var, 20)
    draw.text((70, 370), "La fin des cours particuliers sans visibilité ni retour concret.", font=f_sub, fill=(226, 232, 240, 255))

    # Feature simulation card
    card_y = 440
    draw.rounded_rectangle([70, card_y, 1010, card_y + 490], radius=24, fill=(11, 21, 38, 240), outline=(255, 255, 255, 30), width=1)
    
    # Inner header of notebook
    draw.rounded_rectangle([70, card_y, 1010, card_y + 80], radius=24, fill=(16, 35, 63, 255))
    draw.text((105, card_y + 26), "APERÇU : RAPPORT DE SÉANCE EN DIRECT", font=ImageFont.truetype(pjs_var, 18), fill=GOLD_AMBER)
    draw.text((780, card_y + 28), "STATUT : VALIDÉ ✓", font=ImageFont.truetype(pjs_var, 14), fill=(52, 211, 153, 255))

    # 4 rows inside notebook
    rows = [
        ("Élève & Classe", "Mamadou Barry • Terminale Sciences Mathématiques"),
        ("Matière & Chapitre", "Mathématiques • Équations différentielles & Dérivées"),
        ("Points abordés", "Résolution d'exercices type Baccalauréat, analyse des erreurs"),
        ("Prochains objectifs", "Devoir surveillé samedi 10h • Revoir les primitives"),
    ]
    ry = card_y + 110
    f_rk = ImageFont.truetype(pjs_var, 16)
    f_rv = ImageFont.truetype(dms_var, 16)
    for k, v in rows:
        draw.text((105, ry), k, font=f_rk, fill=MUTED_SLATE)
        draw.text((105, ry + 25), v, font=f_rv, fill=WHITE)
        ry += 75

    # Bottom badge
    draw.rounded_rectangle([105, card_y + 420, 975, card_y + 465], radius=10, fill=(37, 99, 235, 40))
    draw.text((125, card_y + 432), "🔒 PAIEMENT DÉBLOQUÉ UNIQUEMENT APRÈS APPROBATION DU PARENT", font=ImageFont.truetype(pjs_var, 13), fill=(147, 197, 253, 255))

    # CTA
    btn_y = 970
    draw.rounded_rectangle([70, btn_y, 500, btn_y + 70], radius=35, fill=GOLD_PILL)
    f_btn = ImageFont.truetype(pjs_var, 20)
    draw.text((105, btn_y + 22), "Créer une demande de soutien →", font=f_btn, fill=(15, 23, 42, 255))

    draw_contact_bar(draw, 1260, w, is_dark=True)

    out = os.path.join(DIR_PORT, "02-carnet-progression-1080x1350.png")
    im.save(out, "PNG", dpi=(300, 300))
    print("Generated Instagram Portrait 02")


# -------------------------------------------------------------------------
# 3. STORIES / REELS COVERS (1080x1920)
# -------------------------------------------------------------------------

def make_story(title_lines, subtitle, cta_text, bg_image_name, out_name, badge_text="NOUVEAU À CONAKRY"):
    w, h = 1080, 1920
    im = Image.new("RGBA", (w, h), NAVY_DARK)

    # Photo full height
    bg_photo = Image.open(os.path.join(VISUALS_DIR, bg_image_name)).convert("RGBA")
    pw, ph = bg_photo.size
    crop_w = int(ph * (1080 / 1920))
    bg_cropped = bg_photo.crop((max(0, pw - crop_w - 50), 0, min(pw, pw - 50), ph)).resize((w, h), Image.Resampling.LANCZOS)
    im.paste(bg_cropped, (0, 0))

    # Gradient: dark at top (for logo) and heavy dark at bottom (for text)
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw_g = ImageDraw.Draw(grad)
    for y in range(h):
        if y < 350:
            alpha = int(220 - y * (120 / 350))
        elif y < 900:
            alpha = 100
        elif y < 1400:
            alpha = int(100 + (y - 900) * (145 / 500))
        else:
            alpha = 245
        draw_g.line([(0, y), (w, y)], fill=(7, 19, 34, min(255, alpha)))
    im = Image.alpha_composite(im, grad)
    draw = ImageDraw.Draw(im)

    # Logo Top Center
    w_orig, h_orig = logo_stacked.size
    sw = 300
    sh = int(sw * h_orig / w_orig)
    sx = (w - sw) // 2
    im.paste(logo_stacked.resize((sw, sh), Image.Resampling.LANCZOS), (sx, 100), logo_stacked.resize((sw, sh), Image.Resampling.LANCZOS))

    # Badge Center
    f_badge = ImageFont.truetype(pjs_var, 15)
    b_bbox = f_badge.getbbox(badge_text)
    bw = b_bbox[2] - b_bbox[0] + 50
    bx = (w - bw) // 2
    draw.rounded_rectangle([bx, 980, bx + bw, 1025], radius=22, fill=(245, 158, 11, 40), outline=GOLD_AMBER, width=2)
    draw.text((bx + 25, 993), badge_text, font=f_badge, fill=GOLD_AMBER)

    # Big Titles
    f_h1 = ImageFont.truetype(pjs_var, 54)
    ty = 1060
    for idx, line in enumerate(title_lines):
        col = GOLD_PILL if idx == len(title_lines) - 1 else WHITE
        t_bbox = f_h1.getbbox(line)
        tw = t_bbox[2] - t_bbox[0]
        draw.text(((w - tw) // 2, ty), line, font=f_h1, fill=col)
        ty += 68

    # Subtitle
    f_sub = ImageFont.truetype(dms_var, 22)
    s_bbox = f_sub.getbbox(subtitle)
    sw = s_bbox[2] - s_bbox[0]
    draw.text(((w - sw) // 2, ty + 15), subtitle, font=f_sub, fill=(226, 232, 240, 255))

    # CTA Button
    btn_y = ty + 100
    btn_w = 640
    btn_x = (w - btn_w) // 2
    draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + 78], radius=39, fill=GOLD_PILL)
    f_btn = ImageFont.truetype(pjs_var, 23)
    c_bbox = f_btn.getbbox(cta_text)
    cw = c_bbox[2] - c_bbox[0]
    draw.text(((w - cw) // 2, btn_y + 24), cta_text, font=f_btn, fill=(15, 23, 42, 255))

    # Bottom Contact
    draw_contact_bar(draw, 1820, w, is_dark=True)

    out = os.path.join(DIR_STORY, out_name)
    im.save(out, "PNG", dpi=(300, 300))
    print(f"Generated Story {out_name}")


# -------------------------------------------------------------------------
# 4. WHATSAPP VISUALS (1080x1080)
# -------------------------------------------------------------------------

def make_wa_promo():
    """WhatsApp Promo Familles: Ultra-lisible sur smartphone"""
    w, h = 1080, 1080
    im = Image.new("RGBA", (w, h), (16, 35, 63, 255))
    draw = ImageDraw.Draw(im)

    # Ambient glow
    draw.rounded_rectangle([40, 40, w - 40, h - 40], radius=24, fill=(11, 21, 38, 255), outline=(245, 158, 11, 80), width=3)

    # Logo top center
    w_orig, h_orig = logo_stacked.size
    sw = 280
    sh = int(sw * h_orig / w_orig)
    sx = (w - sw) // 2
    resized_logo = logo_stacked.resize((sw, sh), Image.Resampling.LANCZOS)
    im.paste(resized_logo, (sx, 70), resized_logo)

    # Big Header text
    f_h1 = ImageFont.truetype(pjs_var, 44)
    draw.text((70, 330), "COURS PARTICULIERS À CONAKRY", font=f_h1, fill=GOLD_PILL)
    draw.text((70, 385), "De la 1ère Année au BAC / Terminale", font=ImageFont.truetype(pjs_var, 24), fill=WHITE)

    # 4 Feature Bullet Points
    bullets = [
        ("👨‍🏫 Professeurs Rigoureusement Sélectionnés", "Diplômes universitaires et casier judiciaire vérifiés"),
        ("📊 Carnet de Progression Numérique", "Suivi des devoirs, notes et bilans après chaque séance"),
        ("🔒 Séquestre & Paiements Mobile Money", "Orange Money & MTN — Le prof n'est payé qu'après validation"),
        ("📞 Contact Direct & Assistance Réactive", "Ligne officielle à Conakry : +224 612 365 314")
    ]
    by = 460
    f_btitle = ImageFont.truetype(pjs_var, 22)
    f_bdesc = ImageFont.truetype(dms_var, 16)
    for title, desc in bullets:
        draw.text((70, by), title, font=f_btitle, fill=WHITE)
        draw.text((70, by + 30), desc, font=f_bdesc, fill=MUTED_SLATE)
        by += 85

    # Direct call to action box
    box_y = 820
    draw.rounded_rectangle([70, box_y, w - 70, box_y + 160], radius=20, fill=GOLD_AMBER)
    draw.text((100, box_y + 24), "RÉSERVEZ VOTRE PROFESSEUR AUJOURD'HUI :", font=ImageFont.truetype(pjs_var, 20), fill=(15, 23, 42, 255))
    draw.text((100, box_y + 65), "🌐 www.monsieurfanyi.com", font=ImageFont.truetype(pjs_var, 28), fill=(15, 23, 42, 255))
    draw.text((100, box_y + 110), "📱 WhatsApp / Téléphone : +224 612 365 314", font=ImageFont.truetype(pjs_var, 24), fill=(15, 23, 42, 255))

    out = os.path.join(DIR_WA, "whatsapp-promo-familles.png")
    im.save(out, "PNG", dpi=(300, 300))
    print("Generated WhatsApp Promo Familles")


# -------------------------------------------------------------------------
# 5. FACEBOOK COVER & BANNERS
# -------------------------------------------------------------------------

def make_facebook_cover():
    """Facebook Page Cover 1640x924 px (Safe area centered 1200x630)"""
    w, h = 1640, 924
    im = Image.new("RGBA", (w, h), NAVY_DARK)

    # Right photo
    bg_photo = Image.open(os.path.join(VISUALS_DIR, "hero_student_ultra_hd_4k.jpg")).convert("RGBA")
    pw, ph = bg_photo.size
    crop_w = int(ph * (900 / 924))
    right_part = bg_photo.crop((pw - crop_w - 50, 0, pw - 50, ph)).resize((900, 924), Image.Resampling.LANCZOS)
    im.paste(right_part, (w - 900, 0))

    # Gradient blend from left
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw_g = ImageDraw.Draw(grad)
    for x in range(w):
        if x < 650:
            alpha = 255
        elif x < 1150:
            alpha = int(255 - (x - 650) * (210 / 500))
        else:
            alpha = 45
        draw_g.line([(x, 0), (x, h)], fill=(11, 21, 38, min(255, alpha)))
    im = Image.alpha_composite(im, grad)
    draw = ImageDraw.Draw(im)

    # Logo left
    draw_header_logo(im, is_dark=True, x=100, y=100, width=420)

    # Tagline & Mandela quote
    f_h1 = ImageFont.truetype(pjs_var, 52)
    draw.text((100, 240), "Soutien scolaire d'excellence", font=f_h1, fill=WHITE)
    draw.text((100, 305), "en Guinée.", font=f_h1, fill=GOLD_PILL)

    f_sub = ImageFont.truetype(dms_var, 24)
    draw.text((100, 390), "Rapprochement certifié entre parents exigeants\net enseignants qualifiés à Conakry.", font=f_sub, fill=(226, 232, 240, 255))

    # 3 Badges
    badges = [
        "Enseignants 100% vérifiés",
        "Carnet de progression digital",
        "Orange Money & MTN Mobile Money"
    ]
    bx = 100
    by = 510
    f_b = ImageFont.truetype(pjs_var, 16)
    for b in badges:
        draw.rounded_rectangle([bx, by, bx + 290, by + 46], radius=23, fill=(16, 35, 63, 220), outline=GOLD_AMBER, width=1)
        draw.text((bx + 20, by + 12), "✓ " + b, font=f_b, fill=WHITE)
        bx += 310

    # Contacts bottom
    cy = 780
    draw.line([(100, cy), (w - 100, cy)], fill=(255, 255, 255, 40), width=1)
    f_c = ImageFont.truetype(pjs_var, 20)
    draw.text((100, cy + 25), "📞 +224 612 365 314", font=f_c, fill=GOLD_PILL)
    draw.text((450, cy + 25), "✉ contact@monsieurfanyi.com", font=f_c, fill=WHITE)
    draw.text((850, cy + 25), "🌐 https://monsieurfanyi.com", font=f_c, fill=WHITE)

    out = os.path.join(OUT_BANNERS, "facebook-cover-banner-1640x924.png")
    im.save(out, "PNG", dpi=(300, 300))
    print("Generated Facebook Cover Banner")


def make_web_banner_og():
    """Web Share / OpenGraph Banner 1200x630 px"""
    w, h = 1200, 630
    im = Image.new("RGBA", (w, h), NAVY_PRIMARY)

    bg_photo = Image.open(os.path.join(VISUALS_DIR, "hero_student_ultra_hd_4k.jpg")).convert("RGBA")
    pw, ph = bg_photo.size
    crop_w = int(ph * (600 / 630))
    right_cropped = bg_photo.crop((pw - crop_w - 50, 0, pw - 50, ph)).resize((600, 630), Image.Resampling.LANCZOS)
    im.paste(right_cropped, (600, 0))

    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw_g = ImageDraw.Draw(grad)
    for x in range(w):
        if x < 500:
            alpha = 255
        elif x < 850:
            alpha = int(255 - (x - 500) * (210 / 350))
        else:
            alpha = 45
        draw_g.line([(x, 0), (x, h)], fill=(16, 35, 63, min(255, alpha)))
    im = Image.alpha_composite(im, grad)
    draw = ImageDraw.Draw(im)

    draw_header_logo(im, is_dark=True, x=70, y=60, width=330)

    f_h1 = ImageFont.truetype(pjs_var, 42)
    draw.text((70, 185), "Soutien Scolaire", font=f_h1, fill=WHITE)
    draw.text((70, 238), "d'Excellence en Guinée", font=f_h1, fill=GOLD_PILL)

    f_sub = ImageFont.truetype(dms_var, 18)
    draw.text((70, 310), "Enseignants qualifiés, suivi personnalisé séance par séance\net paiements sécurisés Orange & MTN.", font=f_sub, fill=(226, 232, 240, 255))

    btn_y = 410
    draw.rounded_rectangle([70, btn_y, 450, btn_y + 58], radius=29, fill=GOLD_PILL)
    draw.text((105, btn_y + 17), "Découvrir la plateforme →", font=ImageFont.truetype(pjs_var, 19), fill=(15, 23, 42, 255))

    draw_contact_bar(draw, 560, w, is_dark=True)

    out = os.path.join(OUT_BANNERS, "web-banner-hero-1200x630.png")
    im.save(out, "PNG", dpi=(300, 300))
    print("Generated Web Share OG Banner")


# Execute All
make_ig_square_launch()
make_ig_square_teachers()
make_ig_square_parents()
make_ig_square_diaspora()
make_ig_portrait_quote()
make_ig_portrait_progress()
make_story(["La plateforme", "de soutien scolaire", "est en ligne !"], "Trouvez votre enseignant certifié à Conakry", "Visiter monsieurfanyi.com →", "hero_student_ultra_hd_4k.jpg", "01-story-lancement-1080x1920.png")
make_story(["Enseignants :", "Rejoignez l'élite", "pédagogique."], "Rémunération 85% • Planning flexible", "Postuler maintenant →", "collage_female_teacher_new.jpg", "02-story-recrutement-1080x1920.png", badge_text="RECRUTEMENT EN COURS")
make_story(["Parents :", "Offrez le bon prof,", "au bon moment."], "Maths • Français • Physiques • Primaire à Terminale", "Réserver un cours →", "collage_teacher_boy_new.jpg", "03-story-parents-1080x1920.png", badge_text="EXCELLENCE SCOLAIRE")
make_story(["Diaspora :", "Financez la réussite", "de vos proches."], "Suivi transparent séance après séance au pays", "Planifier un soutien →", "collage_mother_child_new.jpg", "04-story-diaspora-1080x1920.png", badge_text="DIASPORA GUINÉENNE")
make_wa_promo()
make_facebook_cover()
make_web_banner_og()

print("All Social Media and Promotional Templates generated successfully!")


"""
Monsieur Fanyi - Official Brand Asset Generator
Script 04: Print Flyers Generator (A4 300 DPI PNG & PDF, A5 Distribution Handbill)
"""

import os
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

BASE_DIR = r"d:\Instructor\Monsieur-Fanyi-Brand-Kit"
OUT_FLYER = os.path.join(BASE_DIR, "06-Flyer-and-Brochure")
VISUALS_DIR = os.path.join(BASE_DIR, "03-Homepage-Visuals")
LOGO_PNG_DIR = os.path.join(BASE_DIR, "01-Official-Logo", "PNG")
FONT_DIR = os.path.join(BASE_DIR, "02-Brand-Colors-and-Typography", "Fonts")

os.makedirs(OUT_FLYER, exist_ok=True)

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
SURFACE_WARM = (248, 250, 252, 255)

logo_dark = Image.open(os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-logo-horizontal-dark.png")).convert("RGBA")
logo_light = Image.open(os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-logo-horizontal-light.png")).convert("RGBA")


def make_flyer_a4_png():
    """Generates 2480x3508 px (A4 @ 300 DPI) Master Print Graphic"""
    w, h = 2480, 3508
    im = Image.new("RGBA", (w, h), SURFACE_WARM)
    draw = ImageDraw.Draw(im)

    # 1. Header Banner Navy
    header_h = 740
    draw.rectangle([0, 0, w, header_h], fill=NAVY_PRIMARY)

    # Hero image right inside header
    hero_img = Image.open(os.path.join(VISUALS_DIR, "hero_student_ultra_hd_4k.jpg")).convert("RGBA")
    pw, ph = hero_img.size
    crop_w = int(ph * (1100 / header_h))
    hero_part = hero_img.crop((pw - crop_w - 60, 0, pw - 60, ph)).resize((1100, header_h), Image.Resampling.LANCZOS)
    im.paste(hero_part, (w - 1100, 0))

    # Gradient blend from left
    grad = Image.new("RGBA", (1100, header_h), (0, 0, 0, 0))
    draw_g = ImageDraw.Draw(grad)
    for x in range(1100):
        alpha = int(255 - (x / 750) * 220) if x < 750 else 35
        draw_g.line([(x, 0), (x, header_h)], fill=(16, 35, 63, max(0, min(255, alpha))))
    im.paste(grad, (w - 1100, 0), grad)
    draw = ImageDraw.Draw(im)

    # Header Logo Left
    lw = 620
    w_orig, h_orig = logo_dark.size
    lh = int(lw * h_orig / w_orig)
    resized_logo = logo_dark.resize((lw, lh), Image.Resampling.LANCZOS)
    im.paste(resized_logo, (120, 80), resized_logo)

    # Header Headline
    f_h1 = ImageFont.truetype(pjs_var, 64)
    draw.text((120, 240), "L'Excellence Scolaire", font=f_h1, fill=WHITE)
    draw.text((120, 315), "à portée de main en Guinée.", font=f_h1, fill=GOLD_PILL)

    # Quote
    f_quote = ImageFont.truetype(cav_var, 54)
    draw.text((120, 420), "« L'éducation est la seule arme pour s'en sortir. »", font=f_quote, fill=GOLD_AMBER)
    draw.text((120, 480), "— Nelson Mandela", font=ImageFont.truetype(dms_it, 24), fill=MUTED_SLATE)

    # Pill badge
    draw.rounded_rectangle([120, 560, 720, 630], radius=35, fill=GOLD_PILL)
    f_badge = ImageFont.truetype(pjs_var, 26)
    draw.text((160, 578), "Du Primaire au BAC • Cours à domicile & en ligne", font=f_badge, fill=(15, 23, 42, 255))

    # Gold decorative accent line under header
    draw.rectangle([0, header_h, w, header_h + 16], fill=GOLD_AMBER)

    # 2. Main Content Grid (Two Columns: Parents vs Teachers)
    col_w = 1060
    col_y = 820
    col_h = 1050

    # Column 1: Parents d'élèves
    c1_x = 120
    draw.rounded_rectangle([c1_x, col_y, c1_x + col_w, col_y + col_h], radius=28, fill=WHITE, outline=(226, 232, 240, 255), width=2)
    # Header bar
    draw.rounded_rectangle([c1_x, col_y, c1_x + col_w, col_y + 110], radius=28, fill=(37, 99, 235, 18))
    draw.text((c1_x + 50, col_y + 36), "POUR LES PARENTS D'ÉLÈVES", font=ImageFont.truetype(pjs_var, 32), fill=BLUE_PRIMARY)

    parent_items = [
        ("Professeurs Certifiés & Évalués", "Sélection rigoureuse : vérification des diplômes, casier judiciaire et pédagogie."),
        ("Carnet de Progression Numérique", "Suivi précis séance après séance : bilans, devoirs donnés et points d'attention."),
        ("Paiement Sécurisé sous Séquestre", "Vos fonds sont protégés via Orange Money & MTN. Vous ne payez qu'après validation."),
        ("Séance d'Essai sans Engagement", "Assurez-vous de l'adéquation parfaite entre votre enfant et l'enseignant."),
        ("Pour la Diaspora Guinéenne", "Financez la scolarité de vos proches depuis l'étranger avec un contrôle total.")
    ]
    iy = col_y + 145
    for title, desc in parent_items:
        draw.text((c1_x + 50, iy), "★ " + title, font=ImageFont.truetype(pjs_var, 26), fill=NAVY_PRIMARY)
        draw.text((c1_x + 80, iy + 40), desc, font=ImageFont.truetype(dms_var, 21), fill=(71, 85, 105, 255))
        iy += 115

    # Button inside column 1
    draw.rounded_rectangle([c1_x + 50, col_y + col_h - 110, c1_x + col_w - 50, col_y + col_h - 40], radius=20, fill=NAVY_PRIMARY)
    draw.text((c1_x + 230, col_y + col_h - 90), "Réserver un enseignant sur monsieurfanyi.com →", font=ImageFont.truetype(pjs_var, 22), fill=WHITE)

    # Column 2: Professeurs & Enseignants
    c2_x = 1300
    draw.rounded_rectangle([c2_x, col_y, c2_x + col_w, col_y + col_h], radius=28, fill=WHITE, outline=(226, 232, 240, 255), width=2)
    draw.rounded_rectangle([c2_x, col_y, c2_x + col_w, col_y + 110], radius=28, fill=(245, 158, 11, 22))
    draw.text((c2_x + 50, col_y + 36), "POUR LES ENSEIGNANTS QUALIFIÉS", font=ImageFont.truetype(pjs_var, 32), fill=GOLD_AMBER)

    teacher_items = [
        ("85% de Rémunération Nette Reversée", "Le modèle le plus juste et le plus transparent de Guinée."),
        ("Liberté Totale de Planning", "Choisissez vos créneaux, vos communes d'intervention et vos matières."),
        ("Paiements Hebdomadaires Ponctuels", "Versement direct garanti sur votre compte Orange Money ou MTN."),
        ("Valorisation de Votre Expertise", "Construisez votre réputation grâce aux évaluations certifiées des familles."),
        ("Outils Pédagogiques Clés en Main", "Gestion facile de vos fiches de cours et carnet de bord depuis votre téléphone.")
    ]
    iy = col_y + 145
    for title, desc in teacher_items:
        draw.text((c2_x + 50, iy), "✓ " + title, font=ImageFont.truetype(pjs_var, 26), fill=NAVY_PRIMARY)
        draw.text((c2_x + 80, iy + 40), desc, font=ImageFont.truetype(dms_var, 21), fill=(71, 85, 105, 255))
        iy += 115

    draw.rounded_rectangle([c2_x + 50, col_y + col_h - 110, c2_x + col_w - 50, col_y + col_h - 40], radius=20, fill=GOLD_PILL)
    draw.text((c2_x + 240, col_y + col_h - 90), "Rejoindre le corps enseignant Monsieur Fanyi →", font=ImageFont.truetype(pjs_var, 22), fill=(15, 23, 42, 255))

    # 3. Middle Section: Niveaux et Matières Clés
    mid_y = 1930
    draw.rounded_rectangle([120, mid_y, w - 120, mid_y + 400], radius=24, fill=(16, 35, 63, 255))
    draw.text((170, mid_y + 40), "PROGRAMMES ET DISCIPLINES ENSEIGNÉES EN GUINÉE", font=ImageFont.truetype(pjs_var, 30), fill=GOLD_PILL)
    draw.text((170, mid_y + 88), "Conformité stricte avec les programmes officiels de l'Éducation Nationale Guinéenne", font=ImageFont.truetype(dms_var, 21), fill=(226, 232, 240, 255))

    levels = [
        ("ÉCOLE PRIMAIRE", "1ère à 6ème Année", "Calcul, Lecture, Français, Éveil scientifique"),
        ("COLLÈGE (BREVET)", "7ème à 10ème Année", "Maths, Physiques, Chimie, Français, Biologie"),
        ("LYCÉE (BACCALAURÉAT)", "11ème, 12ème & Terminale", "Sciences Maths, Expérimentales, Sciences Sociales"),
        ("COURS D'ADULTES & LANGUES", "Tous Niveaux", "Anglais professionnel, Alphabétisation, Informatique")
    ]
    bx = 170
    by = mid_y + 150
    b_w = 500
    b_h = 200
    for idx, (title, sub, details) in enumerate(levels):
        pos_x = bx + (idx % 4) * 540
        draw.rounded_rectangle([pos_x, by, pos_x + 510, by + 190], radius=16, fill=(11, 21, 38, 255), outline=(255, 255, 255, 25), width=1)
        draw.text((pos_x + 25, by + 24), title, font=ImageFont.truetype(pjs_var, 20), fill=GOLD_AMBER)
        draw.text((pos_x + 25, by + 56), sub, font=ImageFont.truetype(pjs_var, 22), fill=WHITE)
        draw.text((pos_x + 25, by + 105), details, font=ImageFont.truetype(dms_var, 17), fill=MUTED_SLATE)

    # 4. Photos Collage Strip
    strip_y = 2390
    photos = [
        ("collage_mother_child_new.jpg", "Soutien bienveillant à domicile"),
        ("tutor_session.jpg", "Séance individuelle intensive"),
        ("collage_female_teacher_new.jpg", "Pédagogie rigoureuse certifiée")
    ]
    px = 120
    pw_col = 700
    ph_col = 480
    for img_name, label in photos:
        pim = Image.open(os.path.join(VISUALS_DIR, img_name)).convert("RGBA")
        pw_orig, ph_orig = pim.size
        cropped = pim.crop((0, 0, pw_orig, int(pw_orig * (ph_col / pw_col)))).resize((pw_col, ph_col), Image.Resampling.LANCZOS)
        # Add white photo border
        draw.rounded_rectangle([px - 8, strip_y - 8, px + pw_col + 8, strip_y + ph_col + 8], radius=18, fill=WHITE, outline=(226, 232, 240, 255), width=2)
        im.paste(cropped, (px, strip_y))
        px += pw_col + 70

    # 5. Bottom Official Footer (Contact & Reassurance)
    foot_y = 2950
    draw.rectangle([0, foot_y, w, h], fill=(11, 21, 38, 255))
    draw.rectangle([0, foot_y, w, foot_y + 12], fill=GOLD_AMBER)

    # Left: Official Info
    draw.text((120, foot_y + 60), "MONSIEUR FANYI ÉDUCATION — RÉPUBLIQUE DE GUINÉE", font=ImageFont.truetype(pjs_var, 28), fill=GOLD_PILL)
    draw.text((120, foot_y + 110), "Plateforme agréée de soutien scolaire et de mentorat académique.", font=ImageFont.truetype(dms_var, 21), fill=(226, 232, 240, 255))

    # Payment partners badges
    draw.text((120, foot_y + 175), "PAIEMENTS SÉCURISÉS & GARANTIS PAR :", font=ImageFont.truetype(pjs_var, 18), fill=MUTED_SLATE)
    draw.rounded_rectangle([120, foot_y + 215, 390, foot_y + 275], radius=14, fill=(249, 115, 22, 40), outline=(249, 115, 22, 255), width=2)
    draw.text((150, foot_y + 232), "📱 Orange Money Guinée", font=ImageFont.truetype(pjs_var, 20), fill=(251, 146, 60, 255))

    draw.rounded_rectangle([420, foot_y + 215, 680, foot_y + 275], radius=14, fill=(234, 179, 8, 40), outline=(234, 179, 8, 255), width=2)
    draw.text((450, foot_y + 232), "📱 MTN Mobile Money", font=ImageFont.truetype(pjs_var, 20), fill=(250, 204, 21, 255))

    # Right: Contact Box
    box_x = 1450
    draw.rounded_rectangle([box_x, foot_y + 60, w - 120, foot_y + 440], radius=24, fill=NAVY_PRIMARY, outline=GOLD_AMBER, width=2)
    draw.text((box_x + 50, foot_y + 95), "CONTACTEZ-NOUS DIRECTEMENT", font=ImageFont.truetype(pjs_var, 24), fill=GOLD_PILL)
    draw.text((box_x + 50, foot_y + 155), "📞 Téléphone : +224 612 365 314", font=ImageFont.truetype(pjs_var, 24), fill=WHITE)
    draw.text((box_x + 50, foot_y + 215), "✉ E-mail : contact@monsieurfanyi.com", font=ImageFont.truetype(pjs_var, 22), fill=WHITE)
    draw.text((box_x + 50, foot_y + 275), "🌐 Site Web : https://monsieurfanyi.com", font=ImageFont.truetype(pjs_var, 24), fill=GOLD_PILL)
    draw.text((box_x + 50, foot_y + 345), "📍 Siège : Conakry, République de Guinée", font=ImageFont.truetype(dms_var, 20), fill=MUTED_SLATE)

    # Save A4 PNG
    out_png = os.path.join(OUT_FLYER, "flyer-a4-monsieur-fanyi-300dpi.png")
    im.save(out_png, "PNG", dpi=(300, 300))
    print("Generated A4 Print Flyer PNG (2480x3508)")

    # Generate A5 Handbill (1748x2480)
    im_a5 = im.resize((1748, 2480), Image.Resampling.LANCZOS)
    out_a5 = os.path.join(OUT_FLYER, "flyer-a5-distribution-300dpi.png")
    im_a5.save(out_a5, "PNG", dpi=(300, 300))
    print("Generated A5 Distribution Handbill PNG (1748x2480)")


def make_flyer_a4_pdf():
    """Generates print-ready vector PDF container embedding the 300 DPI master"""
    pdf_path = os.path.join(OUT_FLYER, "flyer-a4-monsieur-fanyi.pdf")
    c = canvas.Canvas(pdf_path, pagesize=A4)
    a4_w, a4_h = A4

    png_path = os.path.join(OUT_FLYER, "flyer-a4-monsieur-fanyi-300dpi.png")
    c.drawImage(png_path, 0, 0, width=a4_w, height=a4_h)
    c.setTitle("Monsieur Fanyi — Flyer Officiel A4")
    c.setAuthor("Monsieur Fanyi Éducation")
    c.setSubject("Soutien scolaire d'excellence en Guinée")
    c.save()
    print("Generated A4 Print-Ready PDF:", pdf_path)


make_flyer_a4_png()
make_flyer_a4_pdf()

# Write README.md for 06-Flyer-and-Brochure
readme_flyer = """# Monsieur Fanyi — Supports Imprimés (Flyers & Affiches)

Ce dossier rassemble les maquettes d'impression haute définition (300 DPI) prêtes à être transmises à l'imprimeur ou distribuées dans les établissements scolaires et lieux communautaires à Conakry.

---

## 1. Fichiers Disponibles

1. **`flyer-a4-monsieur-fanyi.pdf`** : Fichier PDF haute définition au format A4 normalisé (210 × 297 mm), prêt pour l'impression professionnelle.
2. **`flyer-a4-monsieur-fanyi-300dpi.png`** : Rendu matriciel 300 DPI haute résolution (2480 × 3508 pixels).
3. **`flyer-a5-distribution-300dpi.png`** : Format demi-A4 (A5 : 148 × 210 mm / 1748 × 2480 pixels), idéal pour la distribution massive (tracts, sorties d'écoles, événements).

---

## 2. Spécifications pour l'Imprimeur

- **Format papier conseillé** : A4 (21 × 29.7 cm) ou A5 (14.8 × 21 cm).
- **Type de papier recommandé** : Papier couché demi-mat ou brillant 135g à 170g.
- **Profil couleur** : Conversion automatique en CMJN assurée (Bleu marine majeur : C:95 M:75 Y:40 K:50, Or Ambre : C:0 M:40 Y:100 K:0).
- **Bords perdus** : Marge de sécurité de 3 mm incluse autour des textes critiques.

---

## 3. Coordonnées Légales Mentionnées

- **Site officiel** : [https://monsieurfanyi.com](https://monsieurfanyi.com)
- **Ligne téléphonique** : +224 612 365 314
- **Courriel** : contact@monsieurfanyi.com
- **Partenaires de paiement** : Orange Money Guinée & MTN Mobile Money.
"""

with open(os.path.join(OUT_FLYER, "README.md"), "w", encoding="utf-8") as f:
    f.write(readme_flyer)

print("Flyer module complete!")


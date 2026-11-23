"""
Monsieur Fanyi - Official Brand Asset Generator
Script 02: Brand Colors & Typography Documentation, Swatches, Specimens & Tokens
"""

import os
import json
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = r"d:\Instructor\Monsieur-Fanyi-Brand-Kit"
OUT_DIR = os.path.join(BASE_DIR, "02-Brand-Colors-and-Typography")
FONT_DIR = os.path.join(OUT_DIR, "Fonts")

os.makedirs(OUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. Color System Definition
# -------------------------------------------------------------
COLORS = [
    {
        "id": "navy-primary",
        "name": "Bleu Marine Prestige",
        "role": "Couleur maîtresse — Confiance académique, rigueur et autorité",
        "hex": "#10233F",
        "rgb": "rgb(16, 35, 63)",
        "cmyk": "C:95 M:75 Y:40 K:50",
        "hsl": "hsl(216, 60%, 15%)",
        "usage": "Headers, titres majeurs, navigation, cartes d'autorité"
    },
    {
        "id": "navy-logo",
        "name": "Bleu Marine Logo",
        "role": "Couleur du mot 'Monsieur' et de la toque académique",
        "hex": "#152E4D",
        "rgb": "rgb(21, 46, 77)",
        "cmyk": "C:92 M:70 Y:35 K:45",
        "hsl": "hsl(213, 57%, 19%)",
        "usage": "Toque académique, mot 'Monsieur' dans le wordmark officiel"
    },
    {
        "id": "blue-primary",
        "name": "Bleu Pédagogique",
        "role": "Couleur d'action — Clarté, dynamisme et liens interactifs",
        "hex": "#2563EB",
        "rgb": "rgb(37, 99, 235)",
        "cmyk": "C:84 M:65 Y:0 K:0",
        "hsl": "hsl(221, 83%, 53%)",
        "usage": "Boutons d'action secondaire, liens actifs, jauges de progression"
    },
    {
        "id": "gold-amber",
        "name": "Or Solaire / Ambre",
        "role": "Couleur d'excellence — Livre du savoir, succès et notation",
        "hex": "#F59E0B",
        "rgb": "rgb(245, 158, 11)",
        "cmyk": "C:0 M:40 Y:100 K:0",
        "hsl": "hsl(38, 92%, 50%)",
        "usage": "Mot 'Fanyi', livre ouvert du logo, étoiles d'avis, badges d'excellence"
    },
    {
        "id": "gold-pill",
        "name": "Or Bouton Lumineux",
        "role": "Couleur d'incitation principale — Bouton 'Se connecter' & CTA",
        "hex": "#F9C450",
        "rgb": "rgb(249, 196, 80)",
        "cmyk": "C:0 M:23 Y:75 K:0",
        "hsl": "hsl(41, 93%, 65%)",
        "usage": "Boutons pills d'accès rapide, surlignages manuscrits ('la seule arme')"
    },
    {
        "id": "teal-pedagogy",
        "name": "Sarcelle Croissance",
        "role": "Couleur d'accompagnement — Suivi personnalisé et pédagogie",
        "hex": "#0D9488",
        "rgb": "rgb(13, 148, 136)",
        "cmyk": "C:85 M:15 Y:50 K:15",
        "hsl": "hsl(175, 84%, 32%)",
        "usage": "Badges de conformité programme guinéen, jalons du carnet de bord"
    },
    {
        "id": "charcoal-text",
        "name": "Anthracite Haute Visibilité",
        "role": "Texte principal — Lisibilité maximale et contraste optimal",
        "hex": "#0F172A",
        "rgb": "rgb(15, 23, 42)",
        "cmyk": "C:80 M:70 Y:50 K:70",
        "hsl": "hsl(222, 47%, 11%)",
        "usage": "Corps de texte principal, titrages de contenu, labels d'interface"
    },
    {
        "id": "muted-slate",
        "name": "Gris Ardoise Neutre",
        "role": "Texte secondaire — Métadonnées, sous-titres et bordures",
        "hex": "#64748B",
        "rgb": "rgb(100, 116, 139)",
        "cmyk": "C:55 M:40 Y:30 K:10",
        "hsl": "hsl(215, 16%, 47%)",
        "usage": "Slogan 'Le bon prof, au bon moment', dates, mentions d'aide"
    },
    {
        "id": "surface-warm",
        "name": "Blanc Cassé Fond de Page",
        "role": "Arrière-plan doux — Chaleur visuelle et confort de lecture",
        "hex": "#F8FAFC",
        "rgb": "rgb(248, 250, 252)",
        "cmyk": "C:2 M:1 Y:0 K:0",
        "hsl": "hsl(210, 40%, 98%)",
        "usage": "Fond de page principal, surfaces de contraste doux"
    },
    {
        "id": "pure-white",
        "name": "Blanc Pur",
        "role": "Surfaces de cartes et conteneurs d'élévation",
        "hex": "#FFFFFF",
        "rgb": "rgb(255, 255, 255)",
        "cmyk": "C:0 M:0 Y:0 K:0",
        "hsl": "hsl(0, 0%, 100%)",
        "usage": "Cartes blanches, conteneurs surélevés, texte sur fond sombre"
    }
]

# Write colors.json
with open(os.path.join(OUT_DIR, "brand-colors.json"), "w", encoding="utf-8") as f:
    json.dump({"brand": "Monsieur Fanyi", "version": "1.0", "palette": COLORS}, f, indent=2, ensure_ascii=False)

# Write brand-colors.css
css_content = """/* ===================================================
   MONSIEUR FANYI — DESIGN SYSTEM COLOR TOKENS
   Plateforme officielle de soutien scolaire en Guinée
   =================================================== */

:root {
  /* Primaires */
  --mf-navy-primary: #10233F;
  --mf-navy-logo: #152E4D;
  --mf-navy-dark: #0B1526;
  
  /* Actions & Pédagogie */
  --mf-blue-primary: #2563EB;
  --mf-blue-deep: #1D4ED8;
  --mf-blue-light: #3B82F6;
  --mf-blue-surface: #EFF6FF;

  /* Or, Savoir & Accents */
  --mf-gold-amber: #F59E0B;
  --mf-gold-pill: #F9C450;
  --mf-gold-warm: #E9B44C;
  --mf-gold-spine: #D97706;

  /* Pédagogie & Croissance */
  --mf-teal-primary: #0D9488;
  --mf-teal-dark: #0F766E;
  --mf-teal-light: #14B8A6;

  /* Neutres */
  --mf-text-charcoal: #0F172A;
  --mf-text-muted: #64748B;
  --mf-text-subtle: #94A3B8;
  --mf-surface-warm: #F8FAFC;
  --mf-white: #FFFFFF;
}
"""
with open(os.path.join(OUT_DIR, "brand-colors.css"), "w", encoding="utf-8") as f:
    f.write(css_content)

print("Generated brand-colors.json and brand-colors.css")


# -------------------------------------------------------------
# 2. High-Res Visual Color Palette Swatch Card (1920x1080 PNG)
# -------------------------------------------------------------
def generate_color_palette_card():
    w, h = 1920, 1080
    im = Image.new("RGBA", (w, h), (248, 250, 252, 255))
    draw = ImageDraw.Draw(im)

    pjs_bold = ImageFont.truetype(os.path.join(FONT_DIR, "PlusJakartaSans-Variable.ttf"), 44)
    pjs_title = ImageFont.truetype(os.path.join(FONT_DIR, "PlusJakartaSans-Variable.ttf"), 20)
    pjs_sub = ImageFont.truetype(os.path.join(FONT_DIR, "DMSans-Variable.ttf"), 14)
    pjs_small = ImageFont.truetype(os.path.join(FONT_DIR, "DMSans-Variable.ttf"), 12)
    pjs_code = ImageFont.truetype(os.path.join(FONT_DIR, "PlusJakartaSans-Variable.ttf"), 15)

    # Top Header Banner
    draw.rectangle([0, 0, w, 140], fill=(16, 35, 63, 255))
    draw.text((70, 36), "MONSIEUR FANYI — NUANCIER OFFICIEL DE LA MARQUE", font=pjs_bold, fill=(255, 255, 255, 255))
    draw.text((70, 92), "Spécifications chromatiques pour le web, l'imprimerie (CMJN) et les campagnes publicitaires", font=pjs_sub, fill=(245, 158, 11, 255))

    # Grid of swatches: 2 rows of 5 cards
    cols = 5
    rows = 2
    sw_w = 330
    sw_h = 400
    start_x = 70
    start_y = 190
    gap_x = 35
    gap_y = 40

    def hex_to_rgb(hex_str):
        hex_str = hex_str.lstrip("#")
        return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

    for idx, c in enumerate(COLORS):
        r = idx // cols
        col = idx % cols
        cx = start_x + col * (sw_w + gap_x)
        cy = start_y + r * (sw_h + gap_y)

        # Card container with shadow
        draw.rounded_rectangle([cx, cy, cx + sw_w, cy + sw_h], radius=18, fill=(255, 255, 255, 255), outline=(226, 232, 240, 255), width=2)

        # Swatch block
        sw_block_h = 190
        rgb = hex_to_rgb(c["hex"])
        draw.rounded_rectangle([cx + 10, cy + 10, cx + sw_w - 10, cy + sw_block_h], radius=12, fill=rgb)

        # Border for very light colors (like white or surface)
        if c["id"] in ["pure-white", "surface-warm"]:
            draw.rounded_rectangle([cx + 10, cy + 10, cx + sw_w - 10, cy + sw_block_h], radius=12, outline=(203, 213, 225, 255), width=2)

        # Text labels inside swatch
        badge_text_col = (255, 255, 255, 255) if c["id"] not in ["gold-amber", "gold-pill", "surface-warm", "pure-white"] else (15, 23, 42, 255)
        draw.text((cx + 25, cy + sw_block_h - 40), c["hex"], font=pjs_bold, fill=badge_text_col)

        # Text metadata below swatch
        meta_y = cy + sw_block_h + 16
        draw.text((cx + 18, meta_y), c["name"], font=pjs_title, fill=(15, 23, 42, 255))
        draw.text((cx + 18, meta_y + 28), c["cmyk"], font=pjs_code, fill=(37, 99, 235, 255))
        draw.text((cx + 18, meta_y + 50), c["rgb"], font=pjs_small, fill=(100, 116, 139, 255))

        # Usage note wrapped
        usage = c["usage"]
        if len(usage) > 42:
            usage = usage[:40] + "..."
        draw.text((cx + 18, meta_y + 75), usage, font=pjs_small, fill=(71, 85, 105, 255))

    out_file = os.path.join(OUT_DIR, "color-palette-card.png")
    im.save(out_file, "PNG", dpi=(300, 300))
    print("Generated color-palette-card.png")

generate_color_palette_card()


# -------------------------------------------------------------
# 3. High-Res Typography Specimen Card (1920x1080 PNG)
# -------------------------------------------------------------
def generate_typography_specimen():
    w, h = 1920, 1080
    im = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(im)

    pjs_path = os.path.join(FONT_DIR, "PlusJakartaSans-Variable.ttf")
    pfd_path = os.path.join(FONT_DIR, "PlayfairDisplay-Variable.ttf")
    dms_path = os.path.join(FONT_DIR, "DMSans-Variable.ttf")
    cav_path = os.path.join(FONT_DIR, "Caveat-Variable.ttf")

    # Header
    draw.rectangle([0, 0, w, 130], fill=(16, 35, 63, 255))
    header_font = ImageFont.truetype(pjs_path, 40)
    sub_font = ImageFont.truetype(dms_path, 16)
    draw.text((70, 32), "MONSIEUR FANYI — SPÉCIMEN TYPOGRAPHIQUE OFFICIEL", font=header_font, fill=(255, 255, 255, 255))
    draw.text((70, 85), "Les 4 polices autorisées : Plus Jakarta Sans • Playfair Display • DM Sans • Caveat (Licence SIL OFL)", font=sub_font, fill=(245, 158, 11, 255))

    # 4 Quadrants for the 4 Fonts
    quads = [
        {
            "box": (70, 160, 930, 580),
            "font_file": pjs_path,
            "name": "1. PLUS JAKARTA SANS (Police Titres & Marque)",
            "role": "Titres principaux, navigation, boutons d'action et logo",
            "accent": (21, 46, 77),
            "sample_title": "L'Excellence Éducative à Conakry",
            "sample_alphabet": "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz 0123456789 €$GNF",
            "weights": "Graisses utilisées : 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)"
        },
        {
            "box": (990, 160, 1850, 580),
            "font_file": pfd_path,
            "name": "2. PLAYFAIR DISPLAY (Police Éditoriale Serif)",
            "role": "Accents de prestige, citations de référence et en-têtes d'honneur",
            "accent": (245, 158, 11),
            "sample_title": "La rigueur académique pour chaque élève",
            "sample_alphabet": "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz 0123456789",
            "weights": "Graisses utilisées : 600 (SemiBold), 700 (Bold), 900 (Black)"
        },
        {
            "box": (70, 620, 930, 1030),
            "font_file": dms_path,
            "name": "3. DM SANS (Police de Labeur & Corps de Texte)",
            "role": "Paragraphes, carnets de notes, tableaux de bord et formulaires",
            "accent": (37, 99, 235),
            "sample_title": "Suivi personnalisé séance après séance en toute transparence.",
            "sample_alphabet": "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz 0123456789 & @ +224",
            "weights": "Graisses utilisées : 400 (Regular), 500 (Medium), 700 (Bold)"
        },
        {
            "box": (990, 620, 1850, 1030),
            "font_file": cav_path,
            "name": "4. CAVEAT (Police Manuscrite d'Émotion & Proximité)",
            "role": "Surlignages manuscrits du hero, annotations pédagogiques bienveillantes",
            "accent": (13, 148, 136),
            "sample_title": "« Chaque enfant peut réussir. » — « la seule arme »",
            "sample_alphabet": "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz 0123456789",
            "weights": "Graisses utilisées : 400 (Regular), 600 (SemiBold), 700 (Bold)"
        }
    ]

    for q in quads:
        x1, y1, x2, y2 = q["box"]
        draw.rounded_rectangle([x1, y1, x2, y2], radius=16, fill=(248, 250, 252, 255), outline=(226, 232, 240, 255), width=2)
        
        # Color bar top
        draw.rounded_rectangle([x1, y1, x2, y1 + 10], radius=5, fill=q["accent"])

        f_name = ImageFont.truetype(pjs_path, 20)
        f_role = ImageFont.truetype(dms_path, 13)
        draw.text((x1 + 25, y1 + 25), q["name"], font=f_name, fill=q["accent"])
        draw.text((x1 + 25, y1 + 54), q["role"], font=f_role, fill=(100, 116, 139, 255))

        # Sample display
        if "Caveat" in q["font_file"]:
            f_sample = ImageFont.truetype(q["font_file"], 38)
        elif "Playfair" in q["font_file"]:
            f_sample = ImageFont.truetype(q["font_file"], 30)
        else:
            f_sample = ImageFont.truetype(q["font_file"], 28)

        draw.text((x1 + 25, y1 + 95), q["sample_title"], font=f_sample, fill=(15, 23, 42, 255))

        f_alpha = ImageFont.truetype(q["font_file"], 18)
        draw.text((x1 + 25, y1 + 165), q["sample_alphabet"], font=f_alpha, fill=(51, 65, 85, 255))

        f_weights = ImageFont.truetype(dms_path, 12)
        draw.text((x1 + 25, y2 - 35), q["weights"], font=f_weights, fill=(100, 116, 139, 255))

    out_file = os.path.join(OUT_DIR, "typography-specimen.png")
    im.save(out_file, "PNG", dpi=(300, 300))
    print("Generated typography-specimen.png")

generate_typography_specimen()


# Write TYPOGRAPHY-GUIDE.md
typo_guide = """# Monsieur Fanyi — Guide Typographique Officiel

L'identité visuelle de Monsieur Fanyi s'appuie sur une hiérarchie typographique forte, humaine et rigoureuse, combinant l'élégance académique et la lisibilité moderne.

## 1. Les 4 Familles Typographiques Officielles

Toutes les polices de caractères utilisées par Monsieur Fanyi sont sous licence libre **SIL Open Font License (OFL 1.1)**, permettant une utilisation légale et sans restriction pour l'impression, le web, et les supports marketing.

| Famille | Rôle Visuel | Graisses Clés | Cas d'Usage Principaux |
| :--- | :--- | :--- | :--- |
| **Plus Jakarta Sans** | Police d'Identité & Titres | 600, 700, 800 | Wordmark officiel, grands titres (H1, H2), boutons, navigation |
| **Playfair Display** | Police Éditoriale Prestige | 600, 700, 900 | Titres d'honneur, citations de Nelson Mandela, encarts de prestige |
| **DM Sans** | Police de Labeur & Corps | 400, 500, 700 | Paragraphes, fiches professeurs, carnet de progression, CGU |
| **Caveat** | Police Manuscrite Émotionnelle | 600, 700 | Annotations bienveillantes (*« Chaque enfant peut réussir »*, *« la seule arme »*) |

---

## 2. Échelle Typographique Recommandée (Desktop & Print)

- **H1 (Hero / Affiche)** : 54px à 64px — *Plus Jakarta Sans ExtraBold* — Interligne 1.12 — Suivi serré (-0.03em)
- **H2 (Sections majeures)** : 36px à 44px — *Plus Jakarta Sans Bold* — Interligne 1.2
- **H3 (Titres de blocs / Cartes)** : 22px à 26px — *Plus Jakarta Sans SemiBold* — Interligne 1.3
- **Corps de texte (Body L)** : 16px à 18px — *DM Sans Regular/Medium* — Interligne 1.6
- **Corps de texte (Body M / Standard)** : 14px à 15px — *DM Sans Regular* — Interligne 1.5
- **Mentions légales & Métadonnées** : 11px à 12px — *DM Sans Medium* — Interligne 1.4
- **Accents Manuscrits** : 36px à 54px — *Caveat Bold* — Inclinaison -4° à -2°

---

## 3. Installation des Polices

Les fichiers TTF sont fournis dans le dossier `Fonts/` :
- Sur Windows : Clic droit sur les fichiers `.ttf` > *Installer pour tous les utilisateurs*.
- Sur Mac : Double-clic sur les fichiers `.ttf` > *Installer la police* dans Livre des polices.
- Sur Canva / Figma : Importer directement les fichiers TTF dans votre espace marque.
"""

with open(os.path.join(OUT_DIR, "TYPOGRAPHY-GUIDE.md"), "w", encoding="utf-8") as f:
    f.write(typo_guide)

# Write README.md for 02-Brand-Colors-and-Typography
readme_colors = """# Monsieur Fanyi — Couleurs et Typographie

Ce dossier contient toutes les ressources nécessaires pour reproduire fidèlement l'identité graphique de Monsieur Fanyi :

1. **`brand-colors.json`** : Tokens de couleurs en format JSON pour les développeurs et outils d'automatisation.
2. **`brand-colors.css`** : Variables CSS officielles pour intégration web et landing pages.
3. **`color-palette-card.png`** : Planche de présentation des couleurs officielles avec codes HEX, RVB et CMJN.
4. **`typography-specimen.png`** : Planche spécimen des 4 polices autorisées.
5. **`TYPOGRAPHY-GUIDE.md`** : Guide complet d'échelle typographique et règles de composition.
6. **`Fonts/`** : Fichiers TTF complets (Plus Jakarta Sans, Playfair Display, DM Sans, Caveat) avec leurs licences officielles SIL Open Font License.
"""

with open(os.path.join(OUT_DIR, "README.md"), "w", encoding="utf-8") as f:
    f.write(readme_colors)

print("Brand Colors & Typography module complete!")


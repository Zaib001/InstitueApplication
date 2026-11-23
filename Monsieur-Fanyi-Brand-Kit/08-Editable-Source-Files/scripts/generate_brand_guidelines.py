"""
Monsieur Fanyi - Official Brand Asset Generator
Script 05: Brand Identity Guidelines Manual (Multi-Page PDF & Markdown Reference)
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

BASE_DIR = r"d:\Instructor\Monsieur-Fanyi-Brand-Kit"
OUT_GUIDELINES = os.path.join(BASE_DIR, "07-Brand-Guidelines")
VISUALS_DIR = os.path.join(BASE_DIR, "03-Homepage-Visuals")
LOGO_PNG_DIR = os.path.join(BASE_DIR, "01-Official-Logo", "PNG")
COLORS_DIR = os.path.join(BASE_DIR, "02-Brand-Colors-and-Typography")

os.makedirs(OUT_GUIDELINES, exist_ok=True)

PDF_PATH = os.path.join(OUT_GUIDELINES, "Monsieur-Fanyi-Brand-Guidelines.pdf")

# Color definitions for ReportLab
C_NAVY_PRIMARY = colors.HexColor("#10233F")
C_NAVY_LOGO = colors.HexColor("#152E4D")
C_NAVY_DARK = colors.HexColor("#0B1526")
C_GOLD_AMBER = colors.HexColor("#F59E0B")
C_GOLD_PILL = colors.HexColor("#F9C450")
C_BLUE_PRIMARY = colors.HexColor("#2563EB")
C_TEAL = colors.HexColor("#0D9488")
C_CHARCOAL = colors.HexColor("#0F172A")
C_MUTED = colors.HexColor("#64748B")
C_LIGHT_BG = colors.HexColor("#F8FAFC")
C_WHITE = colors.white
C_BORDER = colors.HexColor("#E2E8F0")

PAGE_W, PAGE_H = A4


class BrandGuideBuilder:
    def __init__(self, filename):
        self.c = canvas.Canvas(filename, pagesize=A4)
        self.page_num = 1
        self.total_pages = 11

    def draw_running_header(self, title="GUIDE D'IDENTITÉ VISUELLE"):
        c = self.c
        c.saveState()
        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(54, PAGE_H - 36, "MONSIEUR FANYI — SOUTIEN SCOLAIRE D'EXCELLENCE EN GUINÉE")
        c.setFillColor(C_MUTED)
        c.setFont("Helvetica", 8)
        c.drawRightString(PAGE_W - 54, PAGE_H - 36, title.upper())
        c.setStrokeColor(C_BORDER)
        c.setLineWidth(0.75)
        c.line(54, PAGE_H - 44, PAGE_W - 54, PAGE_H - 44)
        c.restoreState()

    def draw_running_footer(self):
        c = self.c
        c.saveState()
        c.setStrokeColor(C_BORDER)
        c.setLineWidth(0.75)
        c.line(54, 44, PAGE_W - 54, 44)
        c.setFillColor(C_MUTED)
        c.setFont("Helvetica", 8)
        c.drawString(54, 30, "monsieurfanyi.com • Ligne officielle : +224 612 365 314 • Conakry, Guinée")
        c.drawRightString(PAGE_W - 54, 30, f"Page {self.page_num} sur {self.total_pages}")
        c.restoreState()

    def new_page(self):
        self.c.showPage()
        self.page_num += 1

    # -------------------------------------------------------------
    # PAGE 1: Couverture Officielle
    # -------------------------------------------------------------
    def page_cover(self):
        c = self.c
        # Navy dark background
        c.setFillColor(C_NAVY_DARK)
        c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

        # Ambient gold accent bar
        c.setFillColor(C_GOLD_AMBER)
        c.rect(0, PAGE_H - 12, PAGE_W, 12, fill=1, stroke=0)
        c.rect(0, 0, PAGE_W, 12, fill=1, stroke=0)

        # Logo dark centered
        logo_path = os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-logo-stacked-dark.png")
        if os.path.exists(logo_path):
            c.drawImage(logo_path, (PAGE_W - 200) / 2, PAGE_H - 260, width=200, height=166, mask="auto")

        # Decorative line
        c.setStrokeColor(C_GOLD_AMBER)
        c.setLineWidth(2)
        c.line((PAGE_W - 120) / 2, PAGE_H - 290, (PAGE_W + 120) / 2, PAGE_H - 290)

        # Title
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica-Bold", 26)
        c.drawCentredString(PAGE_W / 2, PAGE_H - 340, "GUIDE OFFICIEL D'IDENTITÉ DE MARQUE")

        c.setFillColor(C_GOLD_PILL)
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(PAGE_W / 2, PAGE_H - 368, "NORMES GRAPHIQUES, CHARTE & KIT MARKETING")

        # White content card in bottom half
        c.setFillColor(colors.HexColor("#10233F"))
        c.roundRect(54, 80, PAGE_W - 108, PAGE_H - 490, 16, fill=1, stroke=0)

        # Key details inside card
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(84, PAGE_H - 435, "Spécifications de la Plateforme :")

        details = [
            ("Marque déposée :", "Monsieur Fanyi (Guinée • Éducation)"),
            ("Signature officielle :", "« Le bon prof, au bon moment »"),
            ("URL de production :", "https://monsieurfanyi.com"),
            ("Contacts autorisés :", "+224 612 365 314 • contact@monsieurfanyi.com"),
            ("Version du document :", "Version 1.0 (Novembre 2026)"),
            ("Portée du kit :", "Web, Publicité, Réseaux Sociaux, Affichage & Imprimerie")
        ]
        dy = PAGE_H - 465
        for k, v in details:
            c.setFillColor(C_GOLD_AMBER)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(84, dy, k)
            c.setFillColor(C_WHITE)
            c.setFont("Helvetica", 10)
            c.drawString(220, dy, v)
            dy -= 24

        # Mandela quote block inside card
        c.setFillColor(colors.HexColor("#071322"))
        c.roundRect(84, 110, PAGE_W - 168, 65, 8, fill=1, stroke=0)
        c.setFillColor(C_GOLD_PILL)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(PAGE_W / 2, 150, "« L'éducation est la seule arme pour s'en sortir. »")
        c.setFillColor(C_MUTED)
        c.setFont("Helvetica-Oblique", 9)
        c.drawCentredString(PAGE_W / 2, 130, "— Nelson Mandela • Récit de marque Monsieur Fanyi")

        self.new_page()

    # -------------------------------------------------------------
    # PAGE 2: 1. Présentation de la Marque & Vision
    # -------------------------------------------------------------
    def page_brand_overview(self):
        self.draw_running_header("1. Présentation de la Marque & Vision")
        c = self.c

        # Title
        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(54, PAGE_H - 80, "1. Présentation de la Marque & Mission")
        c.setFillColor(C_GOLD_AMBER)
        c.rect(54, PAGE_H - 90, 50, 3, fill=1, stroke=0)

        # Introduction paragraphs
        c.setFillColor(C_CHARCOAL)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(54, PAGE_H - 120, "Monsieur Fanyi est la plateforme de référence du soutien scolaire d'excellence en Guinée.")
        
        c.setFont("Helvetica", 10)
        text1 = (
            "Fondée sur l'exigence académique et l'égalité des chances, Monsieur Fanyi répond au défi majeur des familles "
            "guinéennes : trouver des enseignants qualifiés, fiables et méthodologiquement compétents pour accompagner leurs enfants "
            "du Primaire jusqu'au Baccalauréat."
        )
        # Wrap text helper
        self.draw_wrapped_text(text1, 54, PAGE_H - 140, PAGE_W - 108, 14)

        # 3 Pillars
        pillars = [
            ("L'Excellence Pédagogique", "Seuls les enseignants diplômés d'université et validés par entretien rigoureux sont admis sur la plateforme. Aucun professeur non vérifié ne peut intervenir."),
            ("La Transparence Totale", "Chaque séance fait l'objet d'un rapport détaillé consigné dans le Carnet de Progression Numérique, accessible en temps réel aux parents et aux élèves."),
            ("La Sécurité Financière", "Fonds conservés sous séquestre : le professeur n'est rémunéré qu'une fois la séance effectivement réalisée et validée par la famille via Orange Money ou MTN.")
        ]
        py = PAGE_H - 220
        for title, desc in pillars:
            c.setFillColor(C_LIGHT_BG)
            c.roundRect(54, py - 45, PAGE_W - 108, 55, 8, fill=1, stroke=0)
            c.setStrokeColor(C_BORDER)
            c.roundRect(54, py - 45, PAGE_W - 108, 55, 8, fill=0, stroke=1)
            
            c.setFillColor(C_BLUE_PRIMARY)
            c.setFont("Helvetica-Bold", 11)
            c.drawString(70, py - 12, "✦ " + title)
            c.setFillColor(C_CHARCOAL)
            c.setFont("Helvetica", 9)
            c.drawString(70, py - 30, desc)
            py -= 70

        # Secondary Section: Positionnement & Cibles
        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(54, py - 20, "Positionnement & Publics Cibles")
        c.setFillColor(C_BORDER)
        c.line(54, py - 28, PAGE_W - 54, py - 28)

        targets = [
            ("Les Familles & Parents à Conakry", "Parents soucieux de la réussite scolaire de leurs enfants, recherchant rigueur, ponctualité et sécurité."),
            ("Les Élèves (Primaire, Collège, Lycée)", "Apprenants préparant leurs examens nationaux (Certificat d'Études Primaires, Brevet, Baccalauréat)."),
            ("Le Corps Enseignant Guinéen", "Professeurs passionnés recherchant une juste valorisation de leur travail (85% de rémunération nette)."),
            ("La Diaspora Guinéenne à l'Étranger", "Ressortissants en France, USA, Canada finançant les cours de leurs proches restés au pays avec une traçabilité totale.")
        ]
        ty = py - 50
        for name, note in targets:
            c.setFillColor(C_NAVY_LOGO)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(70, ty, "• " + name + " :")
            c.setFillColor(C_MUTED)
            c.setFont("Helvetica", 9)
            c.drawString(250, ty, note)
            ty -= 25

        # Quote highlight bottom
        c.setFillColor(C_NAVY_DARK)
        c.roundRect(54, 75, PAGE_W - 108, 70, 10, fill=1, stroke=0)
        c.setFillColor(C_GOLD_PILL)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(PAGE_W / 2, 120, "Signature de Marque : « Le bon prof, au bon moment »")
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica", 9)
        c.drawCentredString(PAGE_W / 2, 98, "Cette promesse engage l'institution à toujours proposer l'enseignant le plus adapté au profil de l'élève.")

        self.draw_running_footer()
        self.new_page()

    # -------------------------------------------------------------
    # PAGE 3: 2. Anatomie du Logo & Signification
    # -------------------------------------------------------------
    def page_logo_anatomy(self):
        self.draw_running_header("2. Anatomie du Logo & Signification")
        c = self.c

        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(54, PAGE_H - 80, "2. Anatomie du Logo & Composantes")
        c.setFillColor(C_GOLD_AMBER)
        c.rect(54, PAGE_H - 90, 50, 3, fill=1, stroke=0)

        # Big Logo Display Box
        c.setFillColor(C_LIGHT_BG)
        c.roundRect(54, PAGE_H - 260, PAGE_W - 108, 150, 12, fill=1, stroke=0)
        c.setStrokeColor(C_BORDER)
        c.roundRect(54, PAGE_H - 260, PAGE_W - 108, 150, 12, fill=0, stroke=1)

        logo_light_path = os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-logo-horizontal-light.png")
        if os.path.exists(logo_light_path):
            c.drawImage(logo_light_path, (PAGE_W - 380) / 2, PAGE_H - 235, width=380, height=88, mask="auto")

        # 4 Anatomical Explanations
        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(54, PAGE_H - 290, "Les Composantes Symboliques de l'Identité")

        components = [
            ("1. Le Livre d'Or Ouvert (#F59E0B)", "Évoque l'accès universel au savoir, l'assiduité studieuse et les programmes officiels de l'Éducation Nationale Guinéenne. Sa teinte or ambrée symbolise la chaleur, le potentiel et l'élévation intellectuelle."),
            ("2. La Toque Académique (#152E4D)", "Positionnée sur le sommet du livre, elle symbolise le sacre du diplôme, la rigueur de l'enseignement supérieur et l'exigence de qualification imposée à tous nos professeurs certifiés."),
            ("3. Le Pompon Suspendu (#F59E0B)", "Marqueur traditionnel du lauréat et de la réussite aux examens nationaux (Certificat, Brevet, Baccalauréat guinéen)."),
            ("4. Le Wordmark « Monsieur Fanyi »", "« Monsieur » est composé en Bleu Marine profond (#152E4D) pour l'autorité et le respect envers le maître. « Fanyi » est composé en Or (#F59E0B), mot d'affection et d'excellence culturelle."),
            ("5. La Signature « Le bon prof, au bon moment »", "Composée en DM Sans Italic gris ardoise (#64748B), elle rappelle la réactivité et la pertinence du jumelage pédagogique opéré par la plateforme.")
        ]
        cy = PAGE_H - 325
        for title, desc in components:
            c.setFillColor(C_NAVY_LOGO)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(54, cy, title)
            c.setFillColor(C_CHARCOAL)
            c.setFont("Helvetica", 9)
            self.draw_wrapped_text(desc, 54, cy - 14, PAGE_W - 108, 13)
            cy -= 54

        self.draw_running_footer()
        self.new_page()

    # -------------------------------------------------------------
    # PAGE 4: 3. Déclinaisons Autorisées du Logo
    # -------------------------------------------------------------
    def page_logo_variants(self):
        self.draw_running_header("3. Déclinaisons Autorisées du Logo")
        c = self.c

        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(54, PAGE_H - 80, "3. Déclinaisons Autorisées du Logo")
        c.setFillColor(C_GOLD_AMBER)
        c.rect(54, PAGE_H - 90, 50, 3, fill=1, stroke=0)

        # 2x2 Grid of visual logo variants
        # Variant A: Horizontal Light
        c.setFillColor(C_LIGHT_BG)
        c.roundRect(54, PAGE_H - 240, 235, 130, 8, fill=1, stroke=0)
        c.setStrokeColor(C_BORDER)
        c.roundRect(54, PAGE_H - 240, 235, 130, 8, fill=0, stroke=1)
        p_hl = os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-logo-horizontal-light.png")
        if os.path.exists(p_hl):
            c.drawImage(p_hl, 64, PAGE_H - 200, width=215, height=50, mask="auto")
        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(171, PAGE_H - 225, "1. Horizontal Fond Clair (Standard)")

        # Variant B: Horizontal Dark
        c.setFillColor(C_NAVY_DARK)
        c.roundRect(305, PAGE_H - 240, 235, 130, 8, fill=1, stroke=0)
        p_hd = os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-logo-horizontal-dark.png")
        if os.path.exists(p_hd):
            c.drawImage(p_hd, 315, PAGE_H - 200, width=215, height=50, mask="auto")
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(422, PAGE_H - 225, "2. Horizontal Fond Sombre (Inversé)")

        # Variant C: Stacked Light
        c.setFillColor(C_LIGHT_BG)
        c.roundRect(54, PAGE_H - 390, 235, 135, 8, fill=1, stroke=0)
        c.setStrokeColor(C_BORDER)
        c.roundRect(54, PAGE_H - 390, 235, 135, 8, fill=0, stroke=1)
        p_sl = os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-logo-stacked-light.png")
        if os.path.exists(p_sl):
            c.drawImage(p_sl, 105, PAGE_H - 365, width=130, height=108, mask="auto")
        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(171, PAGE_H - 380, "3. Centré / Empilé Fond Clair")

        # Variant D: Stacked Dark
        c.setFillColor(C_NAVY_DARK)
        c.roundRect(305, PAGE_H - 390, 235, 135, 8, fill=1, stroke=0)
        p_sd = os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-logo-stacked-dark.png")
        if os.path.exists(p_sd):
            c.drawImage(p_sd, 355, PAGE_H - 365, width=130, height=108, mask="auto")
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(422, PAGE_H - 380, "4. Centré / Empilé Fond Sombre")

        # Emblème seul (Badges)
        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(54, PAGE_H - 425, "Emblème Seul & Badges d'Application")

        # Badge Light & Dark
        p_mb = os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-mark-badge.png")
        p_mdb = os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-mark-dark-badge.png")
        if os.path.exists(p_mb):
            c.drawImage(p_mb, 70, PAGE_H - 510, width=70, height=70, mask="auto")
        c.setFillColor(C_NAVY_DARK)
        c.roundRect(170, PAGE_H - 510, 70, 70, 8, fill=1, stroke=0)
        if os.path.exists(p_mdb):
            c.drawImage(p_mdb, 170, PAGE_H - 510, width=70, height=70, mask="auto")

        c.setFillColor(C_CHARCOAL)
        c.setFont("Helvetica", 9)
        desc_badge = (
            "L'emblème seul (toque + livre doré) peut être utilisé isolément pour les favicons de navigateurs, "
            "les avatars de profils sur les réseaux sociaux (WhatsApp, Facebook, LinkedIn) ou les icônes d'application mobile."
        )
        self.draw_wrapped_text(desc_badge, 260, PAGE_H - 450, 280, 13)

        # Monochromes
        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(54, PAGE_H - 540, "Déclinaisons Monochromes Officielles")

        c.setFillColor(C_CHARCOAL)
        c.setFont("Helvetica", 9)
        c.drawString(54, PAGE_H - 560, "• Version 100% Noir : Réservée aux impressions noir et blanc, factures papier et tampons encreurs.")
        c.drawString(54, PAGE_H - 578, "• Version 100% Blanc : Utilisable en filigrane ou sur photographies très contrastées.")

        self.draw_running_footer()
        self.new_page()

    # -------------------------------------------------------------
    # PAGE 5: 4. Règles de Protection & Usages Interdits
    # -------------------------------------------------------------
    def page_logo_rules(self):
        self.draw_running_header("4. Règles de Protection & Usages Interdits")
        c = self.c

        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(54, PAGE_H - 80, "4. Zone de Protection & Règles Strictes")
        c.setFillColor(C_GOLD_AMBER)
        c.rect(54, PAGE_H - 90, 50, 3, fill=1, stroke=0)

        # Zone de protection diagram box
        c.setFillColor(C_LIGHT_BG)
        c.roundRect(54, PAGE_H - 240, PAGE_W - 108, 135, 10, fill=1, stroke=0)
        c.setStrokeColor(C_BORDER)
        c.roundRect(54, PAGE_H - 240, PAGE_W - 108, 135, 10, fill=0, stroke=1)

        # Draw logo inside box with dotted boundary
        p_hl = os.path.join(LOGO_PNG_DIR, "monsieur-fanyi-logo-horizontal-light.png")
        if os.path.exists(p_hl):
            c.drawImage(p_hl, 100, PAGE_H - 200, width=260, height=60, mask="auto")

        # Dashed line around
        c.setStrokeColor(C_BLUE_PRIMARY)
        c.setDash(3, 3)
        c.roundRect(85, PAGE_H - 215, 290, 90, 6, fill=0, stroke=1)
        c.setDash()

        c.setFillColor(C_BLUE_PRIMARY)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(390, PAGE_H - 165, "Zone de Protection « X »")
        c.setFillColor(C_CHARCOAL)
        c.setFont("Helvetica", 8.5)
        c.drawString(390, PAGE_H - 180, "La zone de dégagement minimale")
        c.drawString(390, PAGE_H - 192, "autour du logo doit toujours être")
        c.drawString(390, PAGE_H - 204, "égale à la hauteur de la lettre « M ».")

        # Minimum Size
        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(54, PAGE_H - 265, "Tailles Minimales de Reproduction")

        sizes = [
            ("Support Digital / Web :", "Largeur minimale : 140 pixels (avec slogan), 100 pixels (sans slogan)."),
            ("Support Imprimé :", "Largeur minimale : 35 mm (avec slogan), 25 mm (sans slogan)."),
            ("Favicon / Avatar seul :", "Dimensions minimales : 16 × 16 pixels (format vectoriel recommandé).")
        ]
        sy = PAGE_H - 285
        for label, val in sizes:
            c.setFillColor(C_NAVY_LOGO)
            c.setFont("Helvetica-Bold", 9)
            c.drawString(70, sy, "• " + label)
            c.setFillColor(C_CHARCOAL)
            c.setFont("Helvetica", 9)
            c.drawString(220, sy, val)
            sy -= 20

        # Prohibited Alterations (Red Box)
        c.setFillColor(colors.HexColor("#FEF2F2"))
        c.roundRect(54, 80, PAGE_W - 108, PAGE_H - 440, 10, fill=1, stroke=0)
        c.setStrokeColor(colors.HexColor("#FCA5A5"))
        c.roundRect(54, 80, PAGE_W - 108, PAGE_H - 440, 10, fill=0, stroke=1)

        c.setFillColor(colors.HexColor("#DC2626"))
        c.setFont("Helvetica-Bold", 12)
        c.drawString(70, PAGE_H - 375, "⛔ USAGES STRICTEMENT INTERDITS (PROHIBITIONS)")

        prohibitions = [
            ("1. Ne jamais déformer le ratio", "Interdiction d'étirer ou d'écraser le logo horizontalement ou verticalement."),
            ("2. Ne pas altérer les couleurs", "Ne jamais remplacer l'or (#F59E0B) ou le bleu marine (#152E4D) par des teintes fantaisistes."),
            ("3. Ne pas ajouter d'effets lourds", "Proscrire les biseaux, contours grossiers, ombres portées agressives ou lueurs fluo."),
            ("4. Ne pas dissocier les éléments", "La toque académique et le livre ouvert ne doivent pas être repositionnés différemment."),
            ("5. Ne pas placer sur fond confus", "Ne jamais poser le logo sur une photographie contrastée sans voile d'ombrage protecteur."),
            ("6. Ne pas réécrire le mot-symbole", "Toujours utiliser les fichiers sources officiels fournis dans le kit (SVG ou PNG 300 DPI).")
        ]
        py = PAGE_H - 400
        for title, expl in prohibitions:
            c.setFillColor(colors.HexColor("#991B1B"))
            c.setFont("Helvetica-Bold", 9.5)
            c.drawString(70, py, title)
            c.setFillColor(C_CHARCOAL)
            c.setFont("Helvetica", 8.5)
            c.drawString(250, py, expl)
            py -= 22

        self.draw_running_footer()
        self.new_page()

    # -------------------------------------------------------------
    # PAGE 6: 5. Palette Chromatique Officielle
    # -------------------------------------------------------------
    def page_color_palette(self):
        self.draw_running_header("5. Palette Chromatique Officielle")
        c = self.c

        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(54, PAGE_H - 80, "5. Palette Chromatique Officielle")
        c.setFillColor(C_GOLD_AMBER)
        c.rect(54, PAGE_H - 90, 50, 3, fill=1, stroke=0)

        c.setFillColor(C_CHARCOAL)
        c.setFont("Helvetica", 9.5)
        c.drawString(54, PAGE_H - 110, "Spécifications complètes pour le web, l'affichage urbain et les impressions en quadrichromie (CMJN).")

        # Color Table
        c.setFillColor(C_NAVY_PRIMARY)
        c.rect(54, PAGE_H - 145, PAGE_W - 108, 24, fill=1, stroke=0)
        c.setFillColor(C_WHITE)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(64, PAGE_H - 138, "Nuance & Nom")
        c.drawString(170, PAGE_H - 138, "Code HEX")
        c.drawString(245, PAGE_H - 138, "RVB")
        c.drawString(335, PAGE_H - 138, "CMJN (Print)")
        c.drawString(425, PAGE_H - 138, "Rôle & Application")

        colors_table = [
            ("Bleu Marine Prestige", "#10233F", "16, 35, 63", "95, 75, 40, 50", "Fondations de marque, headers"),
            ("Bleu Marine Logo", "#152E4D", "21, 46, 77", "92, 70, 35, 45", "Toque du logo & mot Monsieur"),
            ("Or Solaire / Ambre", "#F59E0B", "245, 158, 11", "0, 40, 100, 0", "Livre doré, mot Fanyi, étoiles"),
            ("Or Bouton Lumineux", "#F9C450", "249, 196, 80", "0, 23, 75, 0", "Boutons pills 'Se connecter' & CTA"),
            ("Bleu Pédagogique", "#2563EB", "37, 99, 235", "84, 65, 0, 0", "Actions secondaires, liens"),
            ("Sarcelle Croissance", "#0D9488", "13, 148, 136", "85, 15, 50, 15", "Pédagogie & carnet de notes"),
            ("Anthracite Texte", "#0F172A", "15, 23, 42", "80, 70, 50, 70", "Corps de texte haute lisibilité"),
            ("Gris Ardoise Neutre", "#64748B", "100, 116, 139", "55, 40, 30, 10", "Slogan & textes secondaires"),
            ("Blanc Cassé Surface", "#F8FAFC", "248, 250, 252", "2, 1, 0, 0", "Fond de page doux"),
            ("Blanc Pur", "#FFFFFF", "255, 255, 255", "0, 0, 0, 0", "Cartes d'élévation & contrastes")
        ]

        ty = PAGE_H - 165
        for idx, (nom, hex_c, rgb_c, cmyk_c, role) in enumerate(colors_table):
            bg = C_LIGHT_BG if idx % 2 == 0 else C_WHITE
            c.setFillColor(bg)
            c.rect(54, ty - 5, PAGE_W - 108, 20, fill=1, stroke=0)

            # Color preview circle
            c.setFillColor(colors.HexColor(hex_c))
            c.circle(62, ty + 5, 5, fill=1, stroke=1)

            c.setFillColor(C_NAVY_PRIMARY)
            c.setFont("Helvetica-Bold", 8.5)
            c.drawString(75, ty + 2, nom)

            c.setFillColor(C_BLUE_PRIMARY)
            c.setFont("Helvetica-Bold", 8.5)
            c.drawString(170, ty + 2, hex_c)

            c.setFillColor(C_CHARCOAL)
            c.setFont("Helvetica", 8)
            c.drawString(245, ty + 2, rgb_c)

            c.setFillColor(C_MUTED)
            c.drawString(335, ty + 2, cmyk_c)

            c.setFillColor(C_CHARCOAL)
            c.drawString(425, ty + 2, role)

            ty -= 20

        # Swatch Image Card Preview
        swatch_card_path = os.path.join(COLORS_DIR, "color-palette-card.png")
        if os.path.exists(swatch_card_path):
            c.drawImage(swatch_card_path, 54, 75, width=PAGE_W - 108, height=195, mask="auto")

        self.draw_running_footer()
        self.new_page()

    # -------------------------------------------------------------
    # PAGE 7: 6. Typographie & Hiérarchie des Textes
    # -------------------------------------------------------------
    def page_typography(self):
        self.draw_running_header("6. Typographie & Hiérarchie des Textes")
        c = self.c

        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(54, PAGE_H - 80, "6. Typographie & Polices Officielles")
        c.setFillColor(C_GOLD_AMBER)
        c.rect(54, PAGE_H - 90, 50, 3, fill=1, stroke=0)

        c.setFillColor(C_CHARCOAL)
        c.setFont("Helvetica", 9.5)
        c.drawString(54, PAGE_H - 110, "Les 4 familles typographiques officielles de Monsieur Fanyi sous licence libre SIL Open Font License.")

        fonts = [
            ("1. PLUS JAKARTA SANS", "Police de Marque, Titres & Boutons", "PlusJakartaSans-Variable.ttf", "Utilisée pour le wordmark officiel, les grands titres H1/H2, la navigation et les boutons."),
            ("2. PLAYFAIR DISPLAY", "Police Serif d'Élégance & Prestige", "PlayfairDisplay-Variable.ttf", "Utilisée pour les citations d'autorité (Nelson Mandela) et les en-têtes cérémoniels."),
            ("3. DM SANS", "Police de Labeur & Corps de Texte", "DMSans-Variable.ttf", "Assure une lisibilité parfaite des longs paragraphes, bilans de cours et mentions légales."),
            ("4. CAVEAT", "Police Manuscrite d'Émotion & Proximité", "Caveat-Variable.ttf", "Exprime l'accompagnement humain et bienveillant : « Chaque enfant peut réussir. »")
        ]

        fy = PAGE_H - 145
        for name, role, filename, usage in fonts:
            c.setFillColor(C_LIGHT_BG)
            c.roundRect(54, fy - 48, PAGE_W - 108, 54, 8, fill=1, stroke=0)
            c.setStrokeColor(C_BORDER)
            c.roundRect(54, fy - 48, PAGE_W - 108, 54, 8, fill=0, stroke=1)

            c.setFillColor(C_NAVY_PRIMARY)
            c.setFont("Helvetica-Bold", 10.5)
            c.drawString(70, fy - 14, name)

            c.setFillColor(C_GOLD_AMBER)
            c.setFont("Helvetica-Bold", 9)
            c.drawRightString(PAGE_W - 70, fy - 14, role)

            c.setFillColor(C_CHARCOAL)
            c.setFont("Helvetica", 8.5)
            c.drawString(70, fy - 32, usage)

            c.setFillColor(C_MUTED)
            c.setFont("Helvetica-Oblique", 8)
            c.drawString(70, fy - 44, "Fichier source : Fonts/" + filename + " (Licence SIL OFL 1.1)")

            fy -= 68

        # Typography Specimen Image Preview
        spec_path = os.path.join(COLORS_DIR, "typography-specimen.png")
        if os.path.exists(spec_path):
            c.drawImage(spec_path, 54, 75, width=PAGE_W - 108, height=195, mask="auto")

        self.draw_running_footer()
        self.new_page()

    # -------------------------------------------------------------
    # PAGE 8: 7. Éléments Graphiques & Composants UI
    # -------------------------------------------------------------
    def page_ui_elements(self):
        self.draw_running_header("7. Éléments Graphiques & Composants UI")
        c = self.c

        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(54, PAGE_H - 80, "7. Éléments Graphiques & Composants UI")
        c.setFillColor(C_GOLD_AMBER)
        c.rect(54, PAGE_H - 90, 50, 3, fill=1, stroke=0)

        # 4 Core Graphic Patterns
        elements = [
            ("1. Le Bouton Pill Or Lumineux (#F9C450)", "Élément signature d'interaction majeure (Bouton 'Se connecter', CTA d'action). Coins arrondis complets (rounded-full / radius 9999px), typographie Plus Jakarta Sans Bold, texte foncé #0F172A pour un contraste certifié WCAG AAA."),
            ("2. Les Cartes Glassmorphism Douces", "Arrière-plan translucide blanc (rgba(255,255,255,0.92)) avec flou d'arrière-plan (backdrop-filter: blur(12px)) et bordure fine ardoise (#E2E8F0). Offre une impression de pureté et d'élévation moderne sans alourdir la page."),
            ("3. Les Badges d'Accréditation Éducative", "Conteneurs en gélule avec fond teinté doux et bordure saturée (ex: badge vert sarcelle pour la conformité programme, badge bleu pour le recrutement, badge or pour les avis certifiés)."),
            ("4. Les Gradients d'Ambiance Subtils", "Dégradés radiaux doux intégrant 8% de bleu (#2563EB) et 5% d'or (#F59E0B) pour enrichir les arrière-plans neutres sans perturber la lisibilité du texte.")
        ]
        ey = PAGE_H - 125
        for title, desc in elements:
            c.setFillColor(C_NAVY_LOGO)
            c.setFont("Helvetica-Bold", 10.5)
            c.drawString(54, ey, title)
            c.setFillColor(C_CHARCOAL)
            c.setFont("Helvetica", 9)
            self.draw_wrapped_text(desc, 54, ey - 14, PAGE_W - 108, 13)
            ey -= 60

        # Visual Demo Boxes
        c.setFillColor(C_LIGHT_BG)
        c.roundRect(54, 75, PAGE_W - 108, PAGE_H - 420, 12, fill=1, stroke=0)

        # Demo 1: Button Pill
        c.setFillColor(C_GOLD_PILL)
        c.roundRect(80, PAGE_H - 440, 210, 36, 18, fill=1, stroke=0)
        c.setFillColor(C_CHARCOAL)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(185, PAGE_H - 427, "Se connecter • Espace Parent")

        # Demo 2: Badge Verified
        c.setFillColor(colors.HexColor("#EFF6FF"))
        c.roundRect(310, PAGE_H - 440, 190, 36, 18, fill=1, stroke=0)
        c.setStrokeColor(C_BLUE_PRIMARY)
        c.roundRect(310, PAGE_H - 440, 190, 36, 18, fill=0, stroke=1)
        c.setFillColor(C_BLUE_PRIMARY)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(405, PAGE_H - 427, "✓ Enseignant 100% Vérifié")

        # Demo 3: Glass Card mockup
        c.setFillColor(C_WHITE)
        c.roundRect(80, 100, PAGE_W - 160, 170, 10, fill=1, stroke=0)
        c.setStrokeColor(C_BORDER)
        c.roundRect(80, 100, PAGE_W - 160, 170, 10, fill=0, stroke=1)

        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(100, 245, "Aperçu Composant : Carte de Suivi Séance")
        c.setFillColor(C_MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(100, 228, "Exemple de composition respectant les règles d'élévation et de typographie.")

        c.setFillColor(C_GOLD_AMBER)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(100, 190, "Matière : Mathématiques (Terminale SM)")
        c.drawString(100, 170, "Professeur : Mohamed Camara (Certifié)")
        c.drawString(100, 150, "Statut : Rapport validé par le parent • Séance débloquée")

        self.draw_running_footer()
        self.new_page()

    # -------------------------------------------------------------
    # PAGE 9: 8. Direction Photographique & Iconographie
    # -------------------------------------------------------------
    def page_photography(self):
        self.draw_running_header("8. Direction Photographique & Iconographie")
        c = self.c

        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(54, PAGE_H - 80, "8. Direction Photographique & Iconographie")
        c.setFillColor(C_GOLD_AMBER)
        c.rect(54, PAGE_H - 90, 50, 3, fill=1, stroke=0)

        # Principles
        c.setFillColor(C_CHARCOAL)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(54, PAGE_H - 110, "Principes Directeurs pour l'Imagerie Officielle :")

        principles = [
            ("1. Authenticité & Représentation Locale", "Les sujets doivent refléter la jeunesse et les enseignants guinéens dans des attitudes naturelles, studieuses et dignes."),
            ("2. Lumière Naturelle & Chaleur", "Privilégier la lumière du jour, les ambiances de classe vivantes et les intérieurs soignés évitant tout artifice outrancier."),
            ("3. Concentration & Pédagogie", "Mettre en scène l'échange bienveillant : explication sur cahier, travail au tableau, écoute attentive."),
            ("4. Respect & Protection des Mineurs", "Toutes les images d'élèves sont cadrées dans un contexte strictement éducatif et valorisant.")
        ]
        py = PAGE_H - 135
        for title, desc in principles:
            c.setFillColor(C_NAVY_LOGO)
            c.setFont("Helvetica-Bold", 9.5)
            c.drawString(54, py, title)
            c.setFillColor(C_CHARCOAL)
            c.setFont("Helvetica", 8.5)
            c.drawString(220, py, desc)
            py -= 22

        # Grid of 3 approved photos thumbnails
        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(54, PAGE_H - 240, "Visuels Officiels Clés (Disponibles dans 03-Homepage-Visuals/)")

        photos = [
            ("hero_student_ultra_hd.jpg", "Écolier Guinéen (Hero)", "Ultra-HD 4K • Visuel central"),
            ("collage_teacher_boy_new.jpg", "Séance de Tutorat", "Tutorat attentif à domicile"),
            ("collage_female_teacher_new.jpg", "Enseignante Certifiée", "Rigueur et bienveillance")
        ]
        px = 54
        pw = 155
        ph = 115
        for img_name, label, sub in photos:
            p_path = os.path.join(VISUALS_DIR, img_name)
            if os.path.exists(p_path):
                c.drawImage(p_path, px, PAGE_H - 375, width=pw, height=ph, mask="auto")
                c.setStrokeColor(C_BORDER)
                c.rect(px, PAGE_H - 375, pw, ph, fill=0, stroke=1)
            c.setFillColor(C_NAVY_PRIMARY)
            c.setFont("Helvetica-Bold", 8.5)
            c.drawString(px, PAGE_H - 390, label)
            c.setFillColor(C_MUTED)
            c.setFont("Helvetica", 7.5)
            c.drawString(px, PAGE_H - 402, sub)
            px += pw + 15

        # Iconography Box
        c.setFillColor(C_LIGHT_BG)
        c.roundRect(54, 75, PAGE_W - 108, PAGE_H - 495, 10, fill=1, stroke=0)
        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(70, 175, "Bibliothèque d'Icônes Autorisée")
        c.setFillColor(C_CHARCOAL)
        c.setFont("Helvetica", 9)
        c.drawString(70, 155, "La plateforme utilise exclusivement la collection Lucide Icons (style Outline épuré, stroke-width 1.75 à 2px).")
        c.drawString(70, 135, "Icônes maîtresses : GraduationCap (diplôme), Sparkles (excellence), ShieldCheck (sécurité), BookOpen (savoir), Phone, Mail.")

        self.draw_running_footer()
        self.new_page()

    # -------------------------------------------------------------
    # PAGE 10: 9. Normes de Communication & Allégations
    # -------------------------------------------------------------
    def page_messaging_claims(self):
        self.draw_running_header("9. Normes de Communication & Allégations")
        c = self.c

        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(54, PAGE_H - 80, "9. Normes Rédactionnelles & Allégations")
        c.setFillColor(C_GOLD_AMBER)
        c.rect(54, PAGE_H - 90, 50, 3, fill=1, stroke=0)

        # Tone of voice
        c.setFillColor(C_CHARCOAL)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(54, PAGE_H - 110, "Tonalité Rédactionnelle : Rigueur, Bienveillance & Prestige")
        
        c.setFont("Helvetica", 9)
        ton_text = (
            "La communication de Monsieur Fanyi s'exprime en français soigné, respectueux et encourageant. "
            "Le vocabulaire valorise l'effort scolaire, la clarté pédagogique et la probité des transactions."
        )
        self.draw_wrapped_text(ton_text, 54, PAGE_H - 128, PAGE_W - 108, 13)

        # Authorized Claims vs Prohibited Claims Table
        c.setFillColor(colors.HexColor("#ECFDF5"))
        c.roundRect(54, PAGE_H - 310, PAGE_W - 108, 150, 8, fill=1, stroke=0)
        c.setStrokeColor(colors.HexColor("#A7F3D0"))
        c.roundRect(54, PAGE_H - 310, PAGE_W - 108, 150, 8, fill=0, stroke=1)

        c.setFillColor(colors.HexColor("#065F46"))
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(70, PAGE_H - 175, "✓ ALLÉGATIONS OFFICIELLES VÉRIFIÉES & AUTORISÉES")

        auth_claims = [
            ("Paiements Locaux Sécurisés", "Orange Money Guinée et MTN Mobile Money sont les canaux opérationnels protégés par séquestre."),
            ("Sélection des Enseignants", "Tous les professeurs admis ont passé la vérification de diplômes universitaires et de casier."),
            ("Carnet de Progression", "L'accès au suivi séance après séance est effectif dès la première leçon."),
            ("Rémunération Juste", "Le reversement de 85% de la valeur de l'heure aux enseignants est garanti contractuellement.")
        ]
        ay = PAGE_H - 195
        for title, desc in auth_claims:
            c.setFillColor(colors.HexColor("#047857"))
            c.setFont("Helvetica-Bold", 8.5)
            c.drawString(70, ay, "• " + title + " :")
            c.setFillColor(C_CHARCOAL)
            c.setFont("Helvetica", 8.5)
            c.drawString(210, ay, desc)
            ay -= 22

        # Prohibited Claims (Card Payments Warning)
        c.setFillColor(colors.HexColor("#FFFBEB"))
        c.roundRect(54, 75, PAGE_W - 108, PAGE_H - 400, 8, fill=1, stroke=0)
        c.setStrokeColor(colors.HexColor("#FDE68A"))
        c.roundRect(54, 75, PAGE_W - 108, PAGE_H - 400, 8, fill=0, stroke=1)

        c.setFillColor(colors.HexColor("#92400E"))
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(70, PAGE_H - 335, "⚠ ALLÉGATION INTERDITE AVANT INTÉGRATION TECHNIQUE")

        c.setFillColor(C_CHARCOAL)
        c.setFont("Helvetica", 8.5)
        warn_text = (
            "RÈGLE STRICTE CLIENT : Ne jamais annoncer les paiements directs par cartes bancaires internationales "
            "(Visa / Mastercard) comme actifs tant que le module de paiement international n'est pas déployé en production.\n\n"
            "Formulation correcte pour la diaspora : 'Accompagnement dédié pour les Guinéens de l'étranger "
            "et solutions de paiement vérifiées via le service administratif Monsieur Fanyi.'"
        )
        self.draw_wrapped_text(warn_text, 70, PAGE_H - 355, PAGE_W - 140, 13)

        self.draw_running_footer()
        self.new_page()

    # -------------------------------------------------------------
    # PAGE 11: 10. Exemples de Campagnes & Contacts
    # -------------------------------------------------------------
    def page_campaigns_and_contacts(self):
        self.draw_running_header("10. Campagnes Marketing & Contacts Officiels")
        c = self.c

        c.setFillColor(C_NAVY_PRIMARY)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(54, PAGE_H - 80, "10. Gabarits Marketing & Contacts")
        c.setFillColor(C_GOLD_AMBER)
        c.rect(54, PAGE_H - 90, 50, 3, fill=1, stroke=0)

        c.setFillColor(C_CHARCOAL)
        c.setFont("Helvetica", 9.5)
        c.drawString(54, PAGE_H - 110, "Inventaire des 12 gabarits marketing haute définition générés dans le kit :")

        templates = [
            ("Instagram Carré (1080×1080)", "4 posts clés : Lancement, Recrutement Enseignants, Inscription Parents, Diaspora."),
            ("Instagram Portrait (1080×1350)", "2 visuels immersion : Citation Nelson Mandela & Carnet de Progression Numérique."),
            ("Stories Plein Écran (1080×1920)", "4 stories animables : Nouveautés, Recrutement, Inscriptions, Diaspora."),
            ("WhatsApp Format Mobile (1080×1080)", "Visuel ultra-contrasté pour statut et groupes WhatsApp à Conakry."),
            ("Bannières Web & Facebook", "Couverture de page Facebook (1640×924) & bannière OpenGraph (1200×630)."),
            ("Supports Imprimés A4 & A5", "Flyer A4 300 DPI (PDF & PNG) et tract A5 pour distribution scolaire.")
        ]
        ty = PAGE_H - 135
        for name, desc in templates:
            c.setFillColor(C_BLUE_PRIMARY)
            c.setFont("Helvetica-Bold", 9)
            c.drawString(54, ty, "• " + name + " :")
            c.setFillColor(C_CHARCOAL)
            c.setFont("Helvetica", 8.5)
            c.drawString(235, ty, desc)
            ty -= 20

        # Official Contacts Card
        c.setFillColor(C_NAVY_DARK)
        c.roundRect(54, 75, PAGE_W - 108, PAGE_H - 370, 12, fill=1, stroke=0)
        c.setStrokeColor(C_GOLD_AMBER)
        c.setLineWidth(2)
        c.roundRect(54, 75, PAGE_W - 108, PAGE_H - 370, 12, fill=0, stroke=1)

        c.setFillColor(C_GOLD_PILL)
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(PAGE_W / 2, PAGE_H - 300, "COORDONNÉES OFFICIELLES DE CONTACT")

        c.setFillColor(C_WHITE)
        c.setFont("Helvetica", 10)
        c.drawCentredString(PAGE_W / 2, PAGE_H - 325, "À faire figurer obligatoirement sur l'ensemble des créations publicitaires :")

        box_items = [
            ("Ligne Téléphonique Directe :", "+224 612 365 314"),
            ("Courriel Officiel :", "contact@monsieurfanyi.com"),
            ("Site Web Officiel :", "https://monsieurfanyi.com"),
            ("Siège Social :", "Conakry, République de Guinée"),
            ("Moyens de Paiement :", "Orange Money Guinée • MTN Mobile Money")
        ]
        by = PAGE_H - 365
        for k, v in box_items:
            c.setFillColor(C_GOLD_AMBER)
            c.setFont("Helvetica-Bold", 10)
            c.drawRightString(PAGE_W / 2 - 20, by, k)
            c.setFillColor(C_WHITE)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(PAGE_W / 2 + 10, by, v)
            by -= 24

        c.setFillColor(C_MUTED)
        c.setFont("Helvetica-Oblique", 8.5)
        c.drawCentredString(PAGE_W / 2, 95, "© 2026 Monsieur Fanyi Éducation. Tous droits réservés. Reproduction conforme sous réserve du respect strict de la présente charte.")

        self.draw_running_footer()

    def draw_wrapped_text(self, text, x, y, max_w, line_h):
        words = text.split()
        lines = []
        curr = ""
        for w in words:
            test = (curr + " " + w).strip()
            if self.c.stringWidth(test, self.c._fontname, self.c._fontsize) <= max_w:
                curr = test
            else:
                lines.append(curr)
                curr = w
        if curr:
            lines.append(curr)

        for line in lines:
            self.c.drawString(x, y, line)
            y -= line_h

    def build(self):
        self.page_cover()
        self.page_brand_overview()
        self.page_logo_anatomy()
        self.page_logo_variants()
        self.page_logo_rules()
        self.page_color_palette()
        self.page_typography()
        self.page_ui_elements()
        self.page_photography()
        self.page_messaging_claims()
        self.page_campaigns_and_contacts()
        self.c.save()
        print(f"Generated complete Brand Guidelines PDF: {PDF_PATH}")


# Execute Builder
builder = BrandGuideBuilder(PDF_PATH)
builder.build()

# Write Comprehensive Brand-Guidelines.md
md_path = os.path.join(OUT_GUIDELINES, "Brand-Guidelines.md")
md_content = """# Monsieur Fanyi — Guide Officiel d'Identité de Marque & Normes Graphiques

**Plateforme de Référence pour le Soutien Scolaire d'Excellence en Guinée**  
*Version 1.0 — Novembre 2026 • Document de référence pour Ousman, Mohamed et les équipes marketing*

---

## Sommaire

1. [Vision & Présentation de la Marque](#1-vision--présentation-de-la-marque)
2. [Anatomie du Logo & Symbolique](#2-anatomie-du-logo--symbolique)
3. [Déclinaisons Autorisées](#3-déclinaisons-autorisées)
4. [Règles de Protection & Usages Interdits](#4-règles-de-protection--usages-interdits)
5. [Palette Chromatique Officielle](#5-palette-chromatique-officielle)
6. [Typographie Officielle (SIL OFL)](#6-typographie-officielle-sil-ofl)
7. [Éléments Graphiques & Composants UI](#7-éléments-graphiques--composants-ui)
8. [Direction Photographique & Iconographie](#8-direction-photographique--iconographie)
9. [Normes Rédactionnelles & Allégations Vérifiées](#9-normes-rédactionnelles--allégations-vérifiées)
10. [Coordonnées Officielles de Contact](#10-coordonnées-officielles-de-contact)

---

## 1. Vision & Présentation de la Marque

**Monsieur Fanyi** est la plateforme guinéenne certifiée rapprochant parents exigeants et enseignants hautement qualifiés.  
Sa mission est de garantir la réussite scolaire de chaque élève, de la 1ère Année de primaire jusqu'au Baccalauréat (Terminale), grâce à un modèle tripartite fondé sur :

- **L'excellence pédagogique** : Sélection rigoureuse sur diplômes universitaires, casier judiciaire vierge et entretien.
- **La transparence continue** : Carnet de Progression Numérique avec bilans de séance consultables en direct.
- **La sécurité financière** : Système de séquestre garantissant que l'enseignant n'est rétribué qu'après validation du cours par la famille.

**Signature officielle de marque** : *« Le bon prof, au bon moment »*  
**Citation philosophique de référence** : *« L'éducation est la seule arme pour s'en sortir. »* — Nelson Mandela.

---

## 2. Anatomie du Logo & Symbolique

Le logo officiel de Monsieur Fanyi est composé de deux entités indissociables :

1. **L'Emblème (Logomark)** :
   - **Le Livre d'Or Ouvert** (`#F59E0B`, reliure `#D97706`) : Représente la soif d'apprendre, la rigueur des programmes officiels guinéens et la transmission du savoir.
   - **La Toque Académique** (`#152E4D`) : Coiffe le livre pour exprimer le diplôme, la réussite aux examens et la qualification supérieure des professeurs.
   - **Le Pompon d'Or** (`#F59E0B`) : Marque l'élévation et l'excellence finale de l'élève.
2. **Le Mot-Symbole (Wordmark)** :
   - **Monsieur** en *Plus Jakarta Sans ExtraBold* Bleu Marine (`#152E4D` sur fond clair, `#FFFFFF` sur fond sombre).
   - **Fanyi** en *Plus Jakarta Sans ExtraBold* Or Ambré (`#F59E0B`).
   - **Le Slogan** en *DM Sans Medium Italic* Gris Ardoise (`#64748B`).

---

## 3. Déclinaisons Autorisées

| Version | Fichier SVG | Fichier PNG (300 DPI) | Usage Privilégié |
| :--- | :--- | :--- | :--- |
| **Horizontal Fond Clair** | `SVG/monsieur-fanyi-logo-horizontal-light.svg` | `PNG/monsieur-fanyi-logo-horizontal-light.png` | En-têtes web, devis, courriers officiels |
| **Horizontal Fond Sombre** | `SVG/monsieur-fanyi-logo-horizontal-dark.svg` | `PNG/monsieur-fanyi-logo-horizontal-dark.png` | Bannières photo, fonds bleu marine, footer |
| **Centré / Empilé Clair** | `SVG/monsieur-fanyi-logo-stacked-light.svg` | `PNG/monsieur-fanyi-logo-stacked-light.png` | Affiches A4, flyers, kakémonos |
| **Centré / Empilé Sombre** | `SVG/monsieur-fanyi-logo-stacked-dark.svg` | `PNG/monsieur-fanyi-logo-stacked-dark.png` | Stories Instagram, couvertures vidéo |
| **Emblème Badge** | `SVG/monsieur-fanyi-mark-badge.svg` | `PNG/monsieur-fanyi-mark-badge.png` | Avatars réseaux sociaux, favicons |
| **Monochrome Noir** | `SVG/monsieur-fanyi-monochrome-black.svg` | `PNG/monsieur-fanyi-monochrome-black.png` | Impressions N&B, tampons administratifs |
| **Monochrome Blanc** | `SVG/monsieur-fanyi-monochrome-white.svg` | `PNG/monsieur-fanyi-monochrome-white.png` | Incrustations en filigrane sur photos |

---

## 4. Règles de Protection & Usages Interdits

- **Zone de protection** : Tout élément graphique ou textuel étranger doit respecter une distance minimale égale à la hauteur du « M » autour du logo.
- **Taille minimale d'affichage** :
  - Écran : 140 pixels de large (avec slogan), 100 pixels (sans slogan).
  - Print : 35 mm de large (avec slogan), 25 mm (sans slogan).
- **Interdictions strictes** :
  - Ne jamais étirer ou déformer les proportions.
  - Ne jamais modifier les teintes officielles.
  - Ne jamais dissocier la toque du livre ouvert sans autorisation expresse.
  - Ne jamais placer le logo sur un fond encombré sans filtre d'assombrissement.

---

## 5. Palette Chromatique Officielle

| Nuance | HEX | RVB | CMJN (Print) | Rôle dans l'Identité |
| :--- | :--- | :--- | :--- | :--- |
| **Bleu Marine Prestige** | `#10233F` | `16, 35, 63` | `C:95 M:75 Y:40 K:50` | Titres majeurs, fonds institutionnels |
| **Bleu Marine Logo** | `#152E4D` | `21, 46, 77` | `C:92 M:70 Y:35 K:45` | Toque et mot « Monsieur » du logo |
| **Or Solaire / Ambre** | `#F59E0B` | `245, 158, 11` | `C:0 M:40 Y:100 K:0` | Livre du logo, mot « Fanyi », étoiles |
| **Or Bouton Lumineux** | `#F9C450` | `249, 196, 80` | `C:0 M:23 Y:75 K:0` | Boutons d'action pill « Se connecter », CTA |
| **Bleu Pédagogique** | `#2563EB` | `37, 99, 235` | `C:84 M:65 Y:0 K:0` | Boutons secondaires, liens cliquables |
| **Sarcelle Croissance** | `#0D9488` | `13, 148, 136` | `C:85 M:15 Y:50 K:15` | Accompagnement, conformité pédagogique |
| **Anthracite Texte** | `#0F172A` | `15, 23, 42` | `C:80 M:70 Y:50 K:70` | Corps de texte principal à haute lisibilité |
| **Gris Ardoise Neutre** | `#64748B` | `100, 116, 139` | `C:55 M:40 Y:30 K:10` | Slogan, dates, métadonnées secondaires |
| **Blanc Cassé Surface** | `#F8FAFC` | `248, 250, 252` | `C:2 M:1 Y:0 K:0` | Fond de page chaleureux et reposant |
| **Blanc Pur** | `#FFFFFF` | `255, 255, 255` | `C:0 M:0 Y:0 K:0` | Cartes d'élévation et contrastes nets |

---

## 6. Typographie Officielle (SIL OFL)

1. **Plus Jakarta Sans** : Titres H1, H2, H3, boutons, navigation, mot-symbole.
2. **Playfair Display** : Titres d'honneur, citations de Nelson Mandela.
3. **DM Sans** : Paragraphes, carnets de notes, fiches de suivi, mentions légales.
4. **Caveat** : Accents manuscrits émotionnels (*« Chaque enfant peut réussir »*, *« la seule arme »*).

*Tous les fichiers TTF et leurs licences sont disponibles dans `02-Brand-Colors-and-Typography/Fonts/`.*

---

## 7. Éléments Graphiques & Composants UI

- **Bouton Pill Or** : Forme gélule (`rounded-full`), couleur `#F9C450`, texte `#0F172A` en Plus Jakarta Sans Bold.
- **Glassmorphism** : Arrière-plans `rgba(255,255,255,0.92)` avec flou `12px` et bordure `#E2E8F0`.
- **Badges d'accréditation** : Pilules colorées confirmant l'approbation d'un enseignant ou d'un cours.
- **Gradients de profondeur** : Dégradés radiaux doux à 8% d'opacité.

---

## 8. Direction Photographique & Iconographie

- **Authenticité et dignité** : Écoliers et professeurs guinéens en situation réelle d'apprentissage.
- **Lumière naturelle** : Ambiance lumineuse chaleureuse et valorisante.
- **Icônes autorisées** : Bibliothèque Lucide Icons en tracé fin (stroke 1.75 à 2px).

---

## 9. Normes Rédactionnelles & Allégations Vérifiées

### ✅ Allégations Autorisées
- *« Enseignants certifiés et rigoureusement sélectionnés sur diplômes et casier judiciaire. »*
- *« Suivi en direct via le Carnet de Progression Numérique. »*
- *« Paiements sécurisés sous séquestre par Orange Money Guinée et MTN Mobile Money. »*
- *« 85% du montant reversé directement aux enseignants qualifiés. »*

### ⛔ Allégation Prohibée
- **Ne jamais annoncer les cartes bancaires internationales (Visa/Mastercard) comme fonctionnelles** avant leur intégration technique effective. Toujours mentionner la solution administrative d'accompagnement pour la diaspora.

---

## 10. Coordonnées Officielles de Contact

- **Téléphone officiel** : `+224 612 365 314`
- **Courriel officiel** : `contact@monsieurfanyi.com`
- **Site web officiel** : `https://monsieurfanyi.com`
- **Localisation** : Conakry, République de Guinée
"""

with open(md_path, "w", encoding="utf-8") as f:
    f.write(md_content)

# Write README.md for 07-Brand-Guidelines
readme_guidelines = """# Monsieur Fanyi — Guide de Marque Officiel

Ce dossier contient les références normatives complètes de la marque **Monsieur Fanyi** :

1. **`Monsieur-Fanyi-Brand-Guidelines.pdf`** : Le manuel officiel complet de 11 pages au format PDF haute résolution, prêt pour consultation et impression.
2. **`Brand-Guidelines.md`** : La version Markdown exhaustive pour référence textuelle immédiate.
"""

with open(os.path.join(OUT_GUIDELINES, "README.md"), "w", encoding="utf-8") as f:
    f.write(readme_guidelines)

print("Brand Guidelines manual complete!")

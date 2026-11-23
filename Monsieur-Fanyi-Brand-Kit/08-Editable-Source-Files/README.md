# Monsieur Fanyi — Fichiers Sources Modifiables & Scripts d'Automatisation

Ce dossier contient l'ensemble des fichiers sources permettant à l'équipe de modifier les textes, d'adapter les dimensions ou de régénérer tous les livrables de marque.

---

## 1. Contenu du Dossier

- **`templates/`** : Modèles HTML5 & CSS3 éditables en direct dans n'importe quel navigateur :
  - `instagram-square-template.html` : Modèle de post Instagram carré (1080×1080 px) avec texte modifiable (`contenteditable="true"`).
  - `flyer-a4-template.html` : Modèle de flyer A4 imprimable avec règles CSS `@page { size: A4; }`.
- **`scripts/`** : Scripts Python modulaires exploitant Pillow et ReportLab :
  - `generate_logos.py` : Régénère les SVGs, les PNGs haute résolution (300 DPI) et les favicons.
  - `generate_colors_and_typography.py` : Produit les nuanciers, le spécimen de polices et les fichiers CSS/JSON.
  - `generate_marketing_templates.py` : Génère l'ensemble des 12 gabarits pour les réseaux sociaux.
  - `generate_flyers.py` : Conçoit le flyer A4 300 DPI et le PDF haute fidélité.
  - `generate_brand_guidelines.py` : Compile le manuel complet de 11 pages `Monsieur-Fanyi-Brand-Guidelines.pdf`.
  - `build_all.py` : Script maître réexécutant tous les générateurs en une seule commande.
- **`design-tokens.json`** : Spécification des tokens de design (Couleurs, Typographie, Espacements, Ombres, Éléments de marque) compatible avec Figma, Tokens Studio et Tailwind CSS.

---

## 2. Comment Régénérer l'Intégralité des Actifs

Dans un terminal Python :

```bash
cd "Monsieur-Fanyi-Brand-Kit/08-Editable-Source-Files/scripts"
python build_all.py
```

Tous les fichiers PNG, SVG et PDF seront automatiquement réexportés avec les dernières valeurs modifiées.


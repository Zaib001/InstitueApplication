"""
Monsieur Fanyi - Master Brand Kit Build Script
Executes all asset generation scripts in sequence and validates output integrity.
"""

import os
import subprocess
import sys

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = [
    "generate_logos.py",
    "generate_colors_and_typography.py",
    "generate_marketing_templates.py",
    "generate_flyers.py",
    "generate_brand_guidelines.py"
]

print("=========================================================")
print("  MONSIEUR FANYI — GÉNÉRATEUR DU KIT DE MARQUE OFFICIEL   ")
print("=========================================================")

for s in SCRIPTS:
    script_path = os.path.join(SCRIPTS_DIR, s)
    print(f"\n[EXECUTION] Lancement de {s}...")
    res = subprocess.run([sys.executable, script_path], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"[SUCCÈS] {s} terminé avec succès.")
        if res.stdout:
            for line in res.stdout.strip().splitlines()[-3:]:
                print("   ", line)
    else:
        print(f"[ERREUR] Échec de {s}:")
        print(res.stderr)
        sys.exit(1)

print("\n=========================================================")
print("  TOUS LES ACTIFS DE LA MARQUE ONT ÉTÉ GÉNÉRÉS AVEC SUCCÈS")
print("=========================================================")


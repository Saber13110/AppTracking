import barcode
from barcode.writer import ImageWriter
import os


def generate_barcode(value: str, output_dir: str = "static/barcodes"):
    """
    Génère un code-barre et sauvegarde l'image

    Args:
        value: La valeur à encoder dans le code-barre
        output_dir: Le dossier où sauvegarder l'image
    """
    # Créer le dossier s'il n'existe pas
    os.makedirs(output_dir, exist_ok=True)

    # Générer le code-barre
    code128 = barcode.get("code128", value, writer=ImageWriter())

    # Sauvegarder l'image
    filename = os.path.join(output_dir, f"{value}")
    code128.save(filename)

    print(f"✅ Code-barre généré: {filename}.png")
    return f"{filename}.png"


if __name__ == "__main__":
    # Exemple d'utilisation
    value = input("Entrez la valeur pour le code-barre: ")
    generate_barcode(value)

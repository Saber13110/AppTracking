from app.models.colis import ColisCreate, ColisUpdate, ColisFilter
from app.services.colis_service import ColisService
from app.models.database import ColisDB
from app.config import settings
import sys
import os
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .generate_barcode import generate_barcode
from typing import List

# Adjust the path to import modules from the backend directory
sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..')))

# Resolve the backend directory similar to generate_barcode and ColisService
BACKEND_DIR = Path(__file__).resolve().parents[2]

# Correct import for settings


# Database setup
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_colis(db: Session, colis_id: str, description: str = "") -> ColisDB:
    """Crée un nouveau colis avec l'ID fourni"""
    try:
        # Générer les identifiants
        reference = f"REF-{colis_id}"
        tcn = f"TCN-{datetime.now().strftime('%Y%m%d')}-{colis_id[-3:]}"
        code_barre = f"CB{colis_id}"

        # Générer le code-barre
        generate_barcode(code_barre)

        # Créer le colis
        db_colis = ColisDB(
            id=colis_id,
            reference=reference,
            tcn=tcn,
            code_barre=code_barre,
            description=description,
            status="En attente",
            location="Entrepôt principal",
            meta_data={
                "id_original": colis_id,
                "date_creation": datetime.now().isoformat()
            }
        )

        db.add(db_colis)
        db.commit()
        db.refresh(db_colis)
        print(f"✅ Colis créé avec succès: {colis_id}")
        print(f"   Référence: {db_colis.reference}")
        print(f"   TCN: {db_colis.tcn}")
        print(f"   Code-barre: {db_colis.code_barre}")
        return db_colis
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la création du colis {colis_id}: {str(e)}")
        raise


def update_colis(db: Session, colis_id: str, update_data: dict) -> ColisDB:
    """Met à jour un colis existant"""
    try:
        db_colis = db.query(ColisDB).filter(ColisDB.id == colis_id).first()
        if not db_colis:
            print(f"❌ Colis non trouvé avec l'ID: {colis_id}")
            return None

        for key, value in update_data.items():
            setattr(db_colis, key, value)

        db_colis.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_colis)
        print(f"✅ Colis mis à jour avec succès: {colis_id}")
        return db_colis
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la mise à jour du colis: {str(e)}")
        raise


def get_colis(db: Session, colis_id: str) -> ColisDB:
    """Récupère un colis par son ID"""
    colis = db.query(ColisDB).filter(ColisDB.id == colis_id).first()
    if colis:
        print(f"✅ Colis trouvé: {colis.id}")
        print(f"   Référence: {colis.reference}")
        print(f"   TCN: {colis.tcn}")
        print(f"   Code-barre: {colis.code_barre}")
        print(f"   Status: {colis.status}")
        print(f"   Location: {colis.location}")
        return colis
    print(f"❌ Colis non trouvé avec l'ID: {colis_id}")
    return None


def list_colis(db: Session) -> list:
    """Liste tous les colis"""
    colis = db.query(ColisDB).all()
    print(f"📦 Nombre de colis trouvés: {len(colis)}")
    for c in colis:
        print(f"\nID: {c.id}")
        print(f"Référence: {c.reference}")
        print(f"TCN: {c.tcn}")
        print(f"Code-barre: {c.code_barre}")
        print(f"Status: {c.status}")
        print(f"Location: {c.location}")
    return colis


def delete_colis(db: Session, colis_id: str) -> bool:
    """Supprime un colis"""
    try:
        db_colis = db.query(ColisDB).filter(ColisDB.id == colis_id).first()
        if not db_colis:
            print(f"❌ Colis non trouvé avec l'ID: {colis_id}")
            return False

        # Supprimer l'image du code-barre
        code_barre_path = os.path.join(
            BACKEND_DIR, "static", "barcodes", f"{db_colis.code_barre}.png")
        if os.path.exists(code_barre_path):
            os.remove(code_barre_path)

        db.delete(db_colis)
        db.commit()
        print(f"✅ Colis supprimé avec succès: {colis_id}")
        return True
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la suppression du colis: {str(e)}")
        raise


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper function to get a DB session outside FastAPI context


def get_db_session():
    return SessionLocal()


def create_colis_entry(db: Session, fedex_id: str, description: str = "Colis créé via script"):
    """Creates a single colis entry using ColisService"""
    colis_data = ColisCreate(id=fedex_id, description=description)
    colis_service = ColisService(db)
    try:
        db_colis = colis_service.create_colis(colis_data)
        print(
            "Successfully created colis with ID: "
            f"{db_colis.id}, Reference: {db_colis.reference}, "
            f"TCN: {db_colis.tcn}, Code Barre: {db_colis.code_barre}"
        )
        return db_colis
    except Exception as e:
        print(f"Error creating colis with ID {fedex_id}: {e}")
        return None


def bulk_create_colis(fedex_ids: List[str]):
    """Creates multiple colis entries from a list of FedEx IDs"""
    print(f"Attempting to create {len(fedex_ids)} colis entries...")
    db = get_db_session()
    try:
        for fedex_id in fedex_ids:
            create_colis_entry(db, fedex_id)
        db.commit()
        print("Bulk creation process finished.")
    except Exception as e:
        db.rollback()
        print(f"An error occurred during bulk creation: {e}")
    finally:
        db.close()


def main():
    args = sys.argv[1:]
    if not args:
        print("Usage: python -m app.scripts.manage_colis [command] [options]")
        print(
            "Commands: create [fedex_id] [description], bulk_create "
            "[fedex_id1] [fedex_id2] ..., get [identifier], list, "
            "update [id] [status] [location], delete [id]"
        )
        return

    command = args[0]

    if command == "bulk_create":
        if len(args) < 2:
            print(
                "Usage: python -m app.scripts.manage_colis bulk_create "
                "[fedex_id1] [fedex_id2] ..."
            )
            return
        fedex_ids = args[1:]
        bulk_create_colis(fedex_ids)
    elif command == "create":
        if len(args) < 2:
            print(
                "Usage: python -m app.scripts.manage_colis create "
                "[fedex_id] [description]"
            )
            return
        fedex_id = args[1]
        description = args[2] if len(args) > 2 else "Colis créé manuellement"
        db = get_db_session()
        create_colis_entry(db, fedex_id, description)
        db.commit()
        db.close()
    elif command == "get":
        if len(args) < 2:
            print("Usage: python -m app.scripts.manage_colis get [identifier]")
            return
        value = args[1]
        db = get_db_session()
        colis_service = ColisService(db)
        colis = colis_service.get_colis_by_identifier(value)
        if colis:
            print("Colis Found:")
            print(f"  ID: {colis.id}")
            print(f"  Reference: {colis.reference}")
            print(f"  TCN: {colis.tcn}")
            print(f"  Code Barre: {colis.code_barre}")
            print(f"  Description: {colis.description}")
            print(f"  Status: {colis.status}")
            print(f"  Location: {colis.location}")
            print(f"  Estimated Delivery: {colis.estimated_delivery}")
            print(f"  Created At: {colis.created_at}")
            print(f"  Updated At: {colis.updated_at}")
            print(f"  Meta Data: {colis.meta_data}")
        else:
            print(f"Colis with identifier {value} not found.")
        db.close()
    elif command == "list":
        db = get_db_session()
        colis_service = ColisService(db)
        colis_list, total = colis_service.search_colis(ColisFilter(
            page=1, page_size=1000))  # List up to 1000 for simplicity
        print(f"Found {total} colis:")
        for colis in colis_list:
            print(
                f"- ID: {colis.id}, Ref: {colis.reference}, "
                f"TCN: {colis.tcn}, CB: {colis.code_barre}, "
                f"Status: {colis.status}"
            )
        db.close()
    elif command == "update":
        if len(args) < 4:
            print(
                "Usage: python -m app.scripts.manage_colis update "
                "[id] [status] [location]"
            )
            return
        colis_id = args[1]
        status = args[2]
        location = args[3]
        db = get_db_session()
        colis_service = ColisService(db)
        colis_update = ColisUpdate(status=status, location=location)
        updated_colis = colis_service.update_colis(colis_id, colis_update)
        if updated_colis:
            print(f"Colis {colis_id} updated successfully.")
        else:
            print(f"Colis {colis_id} not found.")
        db.close()
    elif command == "delete":
        if len(args) < 2:
            print("Usage: python -m app.scripts.manage_colis delete [id]")
            return
        colis_id = args[1]
        db = get_db_session()
        colis_service = ColisService(db)
        deleted = colis_service.delete_colis(colis_id)
        if deleted:
            print(f"Colis {colis_id} deleted.")
        else:
            print(f"Colis {colis_id} not found.")
        db.close()
    else:
        print(f"Unknown command: {command}")
        print("Usage: python -m app.scripts.manage_colis [command] [options]")
        print(
            "Commands: create [fedex_id] [description], bulk_create "
            "[fedex_id1] [fedex_id2] ..., get [identifier], list, "
            "update [id] [status] [location], delete [id]"
        )


if __name__ == "__main__":
    main()

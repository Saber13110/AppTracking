import os
import logging
import uuid
import random
from datetime import datetime
import barcode
from barcode.writer import ImageWriter
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Tuple, Optional
from ..models.colis import ColisCreate, ColisUpdate, ColisFilter
from ..models.database import ColisDB
from sqlalchemy.sql import func

logger = logging.getLogger(__name__)


class ColisService:
    def __init__(self, db: Session):
        self.db = db
        self.barcode_folder = "static/barcodes"
        os.makedirs(self.barcode_folder, exist_ok=True)

    def generate_id(self) -> str:
        """Génère un ID unique pour le colis"""
        return str(uuid.uuid4())

    def generate_reference(self) -> str:
        """Génère une référence unique"""
        return f"REF-{uuid.uuid4().hex[:6].upper()}"

    def generate_tcn(self) -> str:
        """Génère un TCN unique"""
        date_part = datetime.utcnow().strftime("%Y%m%d")
        rand_part = str(random.randint(100, 999))
        return f"TCN-{date_part}-{rand_part}"

    def generate_code_barre(self) -> str:
        """Génère un code-barre unique"""
        return f"CB{random.randint(1000000000, 9999999999)}"

    def generate_codebar_image(self, value: str) -> str:
        """Génère et sauvegarde l'image du code-barre"""
        code128 = barcode.get("code128", value, writer=ImageWriter())
        filename = os.path.join(self.barcode_folder, f"{value}.png")
        code128.save(filename.replace(".png", ""))
        return filename

    def create_colis(self, colis_data: ColisCreate) -> ColisDB:
        """Crée un nouveau colis avec l'identifiant FedEx réel et génère les alias"""
        try:
            # Utiliser l'ID FedEx réel fourni
            colis_id = colis_data.id

            # Générer les alias
            reference = self.generate_reference()
            tcn = self.generate_tcn()
            code_barre = self.generate_code_barre()

            # Créer le colis dans la base de données
            db_colis = ColisDB(
                id=colis_id,
                reference=reference,
                tcn=tcn,
                code_barre=code_barre,
                description=colis_data.description,
                status="En attente",
                meta_data={}
            )
            self.db.add(db_colis)
            self.db.commit()
            self.db.refresh(db_colis)

            # Générer l'image du code-barre
            self.generate_codebar_image(code_barre)

            return db_colis
        except Exception as e:
            self.db.rollback()
            logger.error(
                f"Erreur lors de la création du colis avec ID {colis_data.id}: {str(e)}")
            raise

    def get_colis_by_id(self, colis_id: str) -> Optional[ColisDB]:
        """Récupère un colis par son ID"""
        return self.db.query(ColisDB).filter(ColisDB.id == colis_id).first()

    def get_colis_by_reference(self, reference: str) -> Optional[ColisDB]:
        """Récupère un colis par sa référence"""
        return self.db.query(ColisDB).filter(ColisDB.reference == reference).first()

    def get_colis_by_tcn(self, tcn: str) -> Optional[ColisDB]:
        """Récupère un colis par son TCN"""
        return self.db.query(ColisDB).filter(ColisDB.tcn == tcn).first()

    def get_colis_by_code_barre(self, code_barre: str) -> Optional[ColisDB]:
        """Récupère un colis par son code-barre"""
        return self.db.query(ColisDB).filter(ColisDB.code_barre == code_barre).first()

    def get_colis_by_identifier(self, identifier: str) -> Optional[ColisDB]:
        """Récupère un colis par n'importe quel type d'identifiant"""
        # Essayer d'abord avec l'ID direct
        colis = self.get_colis_by_id(identifier)
        if colis:
            return colis

        # Essayer avec la référence
        colis = self.get_colis_by_reference(identifier)
        if colis:
            return colis

        # Essayer avec le TCN
        colis = self.get_colis_by_tcn(identifier)
        if colis:
            return colis

        # Essayer avec le code-barre
        colis = self.get_colis_by_code_barre(identifier)
        if colis:
            return colis

        return None

    def update_colis(self, colis_id: str, colis_update: ColisUpdate) -> Optional[ColisDB]:
        """Met à jour un colis existant"""
        try:
            db_colis = self.get_colis_by_id(colis_id)
            if not db_colis:
                return None

            update_data = colis_update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_colis, key, value)

            db_colis.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(db_colis)
            return db_colis
        except Exception as e:
            self.db.rollback()
            logger.error(f"Erreur lors de la mise à jour du colis: {str(e)}")
            raise

    def search_colis(self, filters: ColisFilter) -> Tuple[List[ColisDB], int]:
        """Recherche des colis avec filtres"""
        query = self.db.query(ColisDB)

        if filters.status:
            query = query.filter(ColisDB.status == filters.status)
        if filters.location:
            query = query.filter(ColisDB.location == filters.location)
        if filters.reference:
            query = query.filter(
                ColisDB.reference.ilike(f"%{filters.reference}%"))
        if filters.tcn:
            query = query.filter(ColisDB.tcn.ilike(f"%{filters.tcn}%"))
        if filters.code_barre:
            query = query.filter(
                ColisDB.code_barre.ilike(f"%{filters.code_barre}%"))

        total = query.count()
        colis = query.offset((filters.page - 1) *
                             filters.page_size).limit(filters.page_size).all()
        return colis, total

    def get_colis_stats(self) -> Dict[str, Any]:
        """Récupère les statistiques des colis"""
        total = self.db.query(ColisDB).count()
        status_counts = (
            self.db.query(ColisDB.status, func.count(ColisDB.id))
            .group_by(ColisDB.status)
            .all()
        )
        location_counts = (
            self.db.query(ColisDB.location, func.count(ColisDB.id))
            .group_by(ColisDB.location)
            .all()
        )

        return {
            "total": total,
            "status_distribution": dict(status_counts),
            "location_distribution": dict(location_counts)
        }

    def delete_colis(self, colis_id: str) -> bool:
        """Delete a colis record and its barcode image"""
        try:
            db_colis = self.get_colis_by_id(colis_id)
            if not db_colis:
                return False

            image_path = os.path.join(
                self.barcode_folder, f"{db_colis.code_barre}.png")
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except Exception:
                    logger.warning(
                        f"Unable to remove barcode image {image_path}")

            self.db.delete(db_colis)
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(
                f"Erreur lors de la suppression du colis {colis_id}: {str(e)}")
            raise

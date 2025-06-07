from sqlalchemy import Column, String, Boolean, DateTime, JSON, Enum as SQLEnum, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from .notification import NotificationType, NotificationPriority
from .tracking import PackageStatus, PackageType
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class NotificationDB(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True)
    type = Column(SQLEnum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    priority = Column(SQLEnum(NotificationPriority), nullable=False)
    tracking_number = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    read_at = Column(DateTime, nullable=True)
    meta_data = Column(JSON, default=dict)

class ColisDB(Base):
    __tablename__ = "colis"

    id = Column(String, primary_key=True, index=True)
    reference = Column(String, unique=True, index=True)
    tcn = Column(String, unique=True, index=True)
    code_barre = Column(String, unique=True, index=True)
    description = Column(String)
    status = Column(String, default="En attente")
    location = Column(String, nullable=True)
    estimated_delivery = Column(DateTime, nullable=True)
    meta_data = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    tracking_events = relationship("TrackingEventDB", back_populates="colis")
    package_details = relationship("PackageDetailsDB", back_populates="colis", uselist=False)
    delivery_details = relationship("DeliveryDetailsDB", back_populates="colis", uselist=False)

class LocationDB(Base):
    __tablename__ = "locations"

    id = Column(String, primary_key=True, index=True)
    city = Column(String)
    state = Column(String)
    country = Column(String)
    postal_code = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TrackingEventDB(Base):
    __tablename__ = "tracking_events"

    id = Column(String, primary_key=True, index=True)
    colis_id = Column(String, ForeignKey("colis.id"))
    status = Column(String)
    description = Column(String)
    timestamp = Column(DateTime(timezone=True))
    location_id = Column(String, ForeignKey("locations.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    colis = relationship("ColisDB", back_populates="tracking_events")
    location = relationship("LocationDB")

class PackageDetailsDB(Base):
    __tablename__ = "package_details"

    id = Column(String, primary_key=True, index=True)
    colis_id = Column(String, ForeignKey("colis.id"))
    weight = Column(Float)
    dimensions = Column(JSON)
    service_type = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    colis = relationship("ColisDB", back_populates="package_details")

class DeliveryDetailsDB(Base):
    __tablename__ = "delivery_details"

    id = Column(String, primary_key=True, index=True)
    colis_id = Column(String, ForeignKey("colis.id"))
    estimated_delivery = Column(DateTime(timezone=True))
    actual_delivery = Column(DateTime(timezone=True))
    delivery_location_id = Column(String, ForeignKey("locations.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    colis = relationship("ColisDB", back_populates="delivery_details")
    delivery_location = relationship("LocationDB") 
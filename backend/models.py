# file: models.py

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Produk(Base):
    __tablename__ = "produk"
    
    kode = Column(String, primary_key=True, index=True)
    nama = Column(String, index=True, unique=True)
    harga = Column(Integer)
    jumlah = Column(Integer)

class Penjualan(Base):
    __tablename__ = "penjualan"

    id = Column(Integer, primary_key=True, index=True)
    metode_pembayaran = Column(String)
    total = Column(Integer)

    # Relationship untuk mengakses detail dari penjualan
    details = relationship("DetailPenjualan", back_populates="penjualan")

class DetailPenjualan(Base):
    __tablename__ = "detail_penjualan"

    id = Column(Integer, primary_key=True, index=True)
    penjualan_id = Column(Integer, ForeignKey("penjualan.id"))
    produk_id = Column(String, ForeignKey("produk.kode"))
    quantity = Column(Integer)

    # Relationship untuk mengakses data penjualan dan produk dari detail
    penjualan = relationship("Penjualan", back_populates="details")
    produk = relationship("Produk")

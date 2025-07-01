from sqlalchemy.orm import Session
from . import models, schemas
from fastapi import HTTPException


def get_produk_by_kode(db: Session, kode: str):
    return db.query(models.Produk).filter(models.Produk.kode == kode).first()

def get_produk_by_nama(db: Session, nama: str):
    return db.query(models.Produk).filter(models.Produk.nama == nama).first()

def get_all_produk_nama(db: Session):
    return db.query(models.Produk.nama).all()

def get_produks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Produk).offset(skip).limit(limit).all()

def create_produk(db: Session, produk: schemas.ProdukCreate):
    db_produk = models.Produk(**produk.dict())
    db.add(db_produk)
    db.commit()
    db.refresh(db_produk)
    return db_produk

def create_penjualan(db: Session, penjualan: schemas.PenjualanCreate):
    total_penjualan = 0
    produk_details_to_commit = []

    # Loop 1: Validasi dan Kalkulasi
    for item in penjualan.produk_items:
        produk = get_produk_by_kode(db, item.produk_id)
        if not produk:
            raise HTTPException(status_code=404, detail=f"Produk dengan kode {item.produk_id} tidak ditemukan")

        if produk.jumlah < item.quantity: # <-- PERBAIKAN: Cek stok
            raise HTTPException(status_code=400, detail=f"Stok produk '{produk.nama}' tidak mencukupi. Sisa: {produk.jumlah}")

        total_penjualan += produk.harga * item.quantity
        produk_details_to_commit.append({"produk_obj": produk, "quantity": item.quantity})

    # Buat entri Penjualan utama
    db_penjualan = models.Penjualan(
        metode_pembayaran=penjualan.metode_pembayaran,
        total=total_penjualan
    )
    db.add(db_penjualan)
    db.flush() # Gunakan flush untuk mendapatkan ID penjualan sebelum commit

    # Loop 2: Buat detail penjualan dan kurangi stok
    for detail in produk_details_to_commit:
        # Buat entri detail
        db_detail = models.DetailPenjualan(
            penjualan_id=db_penjualan.id,
            produk_id=detail["produk_obj"].kode,
            quantity=detail["quantity"]
        )
        db.add(db_detail)

        # Kurangi stok produk
        detail["produk_obj"].jumlah -= detail["quantity"]
        db.add(detail["produk_obj"])

    # Commit semua perubahan sekaligus (atomic transaction)
    db.commit()
    db.refresh(db_penjualan)
    return db_penjualan

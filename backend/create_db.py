from database import engine, Base
from models import Produk, Penjualan, DetailPenjualan

print("Membuat tabel database...")
Base.metadata.create_all(bind=engine)
print("Tabel berhasil dibuat.")

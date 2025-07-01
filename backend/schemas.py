# file: schemas.py

from pydantic import BaseModel, ConfigDict
from typing import List

# --- Skema untuk Produk ---
class ProdukBase(BaseModel):
    kode: str
    nama: str
    harga: int
    jumlah: int

class ProdukCreate(ProdukBase):
    pass

class Produk(ProdukBase):
    model_config = ConfigDict(from_attributes=True)

# --- Skema untuk Penjualan ---
class DetailPenjualanBase(BaseModel):
    produk_id: str
    quantity: int

class DetailPenjualanCreate(DetailPenjualanBase):
    pass

class PenjualanBase(BaseModel):
    metode_pembayaran: str

class PenjualanCreate(PenjualanBase):
    produk_items: List[DetailPenjualanCreate]

class Penjualan(PenjualanBase):
    id: int
    total: int

# --- Skema untuk Login ---
class LoginData(BaseModel):
    username: str
    password: str

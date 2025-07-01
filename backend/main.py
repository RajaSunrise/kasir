# file: main.py

from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List

from . import crud, models, schemas
from .database import SessionLocal

app = FastAPI(title="API Kasir Sederhana", version="1.0.0")


templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Konfigurasi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/barang")
def barang(request: Request):
    return templates.TemplateResponse("input_barang.html", {"request": request})

@app.get("/kasir")
def kasir(request: Request):
    return templates.TemplateResponse("kasir.html", {"request": request})

# --- Endpoint API untuk Produk ---

@app.post("/api/produk/", response_model=schemas.Produk, status_code=201, tags=["Produk"])
def create_produk_endpoint(produk: schemas.ProdukCreate, db: Session = Depends(get_db)):
    """Membuat produk baru."""
    db_produk = crud.get_produk_by_kode(db, kode=produk.kode)
    if db_produk:
        raise HTTPException(status_code=400, detail="Kode produk sudah terdaftar")
    return crud.create_produk(db=db, produk=produk)

@app.get("/api/produk/nama/{nama}", response_model=schemas.Produk, tags=["Produk"])
def read_produk_by_nama_endpoint(nama: str, db: Session = Depends(get_db)):
    """Mencari produk berdasarkan nama."""
    db_produk = crud.get_produk_by_nama(db, nama=nama)
    if db_produk is None:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    return db_produk

@app.get("/api/produk/nama/", response_model=List[str], tags=["Produk"])
def read_all_nama_produk_endpoint(db: Session = Depends(get_db)):
    """Mendapatkan semua nama produk."""
    nama_list = crud.get_all_produk_nama(db)
    return [nama[0] for nama in nama_list]

@app.get("/api/produk/", response_model=List[schemas.Produk], tags=["Produk"])
def read_produk_list_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Mendapatkan daftar semua produk."""
    produks = crud.get_produks(db, skip=skip, limit=limit)
    return produks

# --- Endpoint API untuk Penjualan ---

@app.post("/api/penjualan/", response_model=schemas.Penjualan, status_code=201, tags=["Penjualan"])
def create_penjualan_endpoint(penjualan: schemas.PenjualanCreate, db: Session = Depends(get_db)):
    """Membuat transaksi penjualan baru."""
    return crud.create_penjualan(db=db, penjualan=penjualan)


@app.get("/login", tags=["Halaman"])
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/api/login", tags=["Autentikasi"])
def login_post(login_data: schemas.LoginData, response: Response):
    """
    Login user.
    PERINGATAN: Ini adalah metode login yang SANGAT TIDAK AMAN.
    Di aplikasi nyata, gunakan hashing password (misal: passlib) dan database user.
    """
    if login_data.username == "kasir" and login_data.password == "kasiraja":
        response.set_cookie(key="session", value="logged_in_kasir", httponly=True, samesite="lax")
        return {"message": "Login berhasil"}
    else:
        raise HTTPException(status_code=401, detail="Username atau password salah")

@app.post("/api/logout", tags=["Autentikasi"])
async def logout(response: Response):
    """Logout user dengan menghapus cookie."""
    response.delete_cookie(key="session")
    return {"message": "Logout berhasil"}

@app.get("/api/check-login", tags=["Autentikasi"])
async def check_login(request: Request):
    """Mengecek status login dari cookie."""
    session = request.cookies.get("session")
    if session == "logged_in_kasir":
        return JSONResponse(content={"logged_in": True})
    return JSONResponse(content={"logged_in": False})

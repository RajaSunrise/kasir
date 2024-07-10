from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from sqlalchemy.orm import Session


from . import models, database
from pydantic import BaseModel

app = FastAPI()

# template dan staticfiles
templates = Jinja2Templates(directory="frontend")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Konfigurasi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ProdukCreate(BaseModel):
    kode: str
    nama: str
    harga: int
    jumlah: int

class DetailPenjualanSchema(BaseModel):
    produk_id: str
    quantity: int

class PenjualanCreate(BaseModel):
    metode_pembayaran: str
    produk_items: list[DetailPenjualanSchema]

class LoginData(BaseModel):
    username: str
    password: str

@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/barang")
def barang(request: Request):
    return templates.TemplateResponse("input_barang.html", {"request": request})

@app.get("/kasir")
def kasir(request: Request):
    return templates.TemplateResponse("kasir.html", {"request": request})

@app.post("/produk/")
def create_produk(produk: ProdukCreate, db: Session = Depends(get_db)):
    db_produk = models.Produk(**produk.dict())
    db.add(db_produk)
    db.commit()
    db.refresh(db_produk)
    return db_produk

@app.get("/produk/nama/{nama}")
def read_produk_by_nama(nama: str, db: Session = Depends(get_db)):
    produk = db.query(models.Produk).filter(models.Produk.nama == nama).first()
    if produk is None:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    return produk

@app.get("/produk/nama/")
def read_all_nama_produk(db: Session = Depends(get_db)):
    produk_list = db.query(models.Produk.nama).all()
    return [produk.nama for produk in produk_list]

@app.get("/produk/")
def read_produk_list(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    produk = db.query(models.Produk).offset(skip).limit(limit).all()
    return produk

@app.post("/penjualan/")
def create_penjualan(penjualan: PenjualanCreate, db: Session = Depends(get_db)):
    total_penjualan = 0
    for item in penjualan.produk_items:
        produk = db.query(models.Produk).filter(models.Produk.kode == item.produk_id).first()
        if not produk:
            raise HTTPException(status_code=404, detail=f"Produk dengan ID {item.produk_id} tidak ditemukan")
        
        total_penjualan += produk.harga * item.quantity

    db_penjualan = models.Penjualan(
        metode_pembayaran=penjualan.metode_pembayaran,
        total=total_penjualan
    )
    db.add(db_penjualan)
    db.commit()
    db.refresh(db_penjualan)

    for item in penjualan.produk_items:
        detail_penjualan = models.DetailPenjualan(
            penjualan_id=db_penjualan.id,
            produk_id=item.produk_id,
            quantity=item.quantity
        )
        db.add(detail_penjualan)
    db.commit()

    return db_penjualan

@app.get("/login")
def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/login")
def login_post(login_data: LoginData, response: Response):
    if login_data.username == "kasir" and login_data.password == "kasiraja":
        response.set_cookie(key="session", value="logged_in", httponly=True)
        return {"message": "Login successful"}
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password")

@app.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="session")
    return {"message": "Logged out successfully"}

@app.get("/check-login")
async def check_login(request: Request):
    session = request.cookies.get("session")
    if session:
        return JSONResponse(content={"logged_in": True})
    return JSONResponse(content={"logged_in": False})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pytz
import shutil
import os
from testing import image_similarity
from models import Verification, SessionLocal
import time

# Configura la zona horaria local
tz = pytz.timezone('America/Managua')

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def save_image(file: UploadFile, prefix: str):
    filename = f"{prefix}_{datetime.now(tz).strftime('%Y%m%d%H%M%S')}_{file.filename}"
    with open(filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return filename

@app.post("/verify-signature/")
async def verify_signature(reference: UploadFile = File(...), test: UploadFile = File(...)):
    ref_path = save_image(reference, "ref")
    test_path = save_image(test, "test")
    try:
        start = time.perf_counter()
        similarity = image_similarity(ref_path, test_path)
        processing_time = round(time.perf_counter() - start, 2)  # en segundos

        result = "Verdadera" if similarity < 0.5 else "Falsificada"
        confidence = round((1 - similarity) * 100, 2) if similarity < 1 else 0.0

        now = datetime.now(tz)
        print("Hora local:", now)

        # Guardar en la base de datos
        db = SessionLocal()
        verification = Verification(
            date=now.strftime("%Y-%m-%d"),
            time=now.strftime("%H:%M"),
            result=result,
            confidence=confidence,
            reference_image=ref_path,
            test_image=test_path,
            processing_time=processing_time,
        )
        db.add(verification)
        db.commit()
        db.refresh(verification)
        db.close()

        return {"result": result, "score": similarity, "processing_time": processing_time}
    finally:
        pass  # No borres las imágenes, las necesitas para el historial

@app.get("/history/")
def get_history():
    db = SessionLocal()
    verifications = db.query(Verification).order_by(Verification.id.desc()).all()
    db.close()
    return [
        {
            "id": v.id,
            "date": v.date,
            "time": v.time,
            "result": "authentic" if v.result == "Verdadera" else "fake",
            "confidence": int(v.confidence),
            "referenceImage": f"http://192.168.41.49:8000/files/{os.path.basename(v.reference_image)}",
            "testImage": f"http://192.168.41.49:8000/files/{os.path.basename(v.test_image)}",
            "processingTime": v.processing_time,
        
        }
        for v in verifications
    ]

# Servir archivos estáticos (imágenes)
from fastapi.staticfiles import StaticFiles
app.mount("/files", StaticFiles(directory="."), name="files")
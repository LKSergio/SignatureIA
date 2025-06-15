from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from testing import image_similarity

app = FastAPI()

# Permitir peticiones desde tu frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambia esto en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/verify-signature/")
async def verify_signature(reference: UploadFile = File(...), test: UploadFile = File(...)):
    ref_path = f"temp_{reference.filename}"
    test_path = f"temp_{test.filename}"
    with open(ref_path, "wb") as buffer:
        shutil.copyfileobj(reference.file, buffer)
    with open(test_path, "wb") as buffer:
        shutil.copyfileobj(test.file, buffer)
    try:
        similarity = image_similarity(ref_path, test_path)
        result = "Verdadera" if similarity < 0.5 else "Falsificada"
        return {"result": result, "score": similarity}
    finally:
        os.remove(ref_path)
        os.remove(test_path)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import joblib
import os

MODEL_PATH = os.getenv("MODEL_PATH", "rice_yield_model.pkl")

try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    raise RuntimeError(f"Failed to load model from {MODEL_PATH}: {e}")

app = FastAPI(title="Rice Yield API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # for dev; tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Features(BaseModel):
    # core
    district: str
    season: str
    Soil_pH: Optional[float] = None
    Organic_Carbon: Optional[float] = None
    Nitrogen: Optional[float] = None
    Phosphorus: Optional[float] = None
    Potassium: Optional[float] = None
    total_rainfall: Optional[float] = None
    avg_temp: Optional[float] = None
    Humidity: Optional[float] = None
    # management (some models may not use them; safe to send)
    variety: Optional[str] = "Unknown"
    irrigation: Optional[str] = "Unknown"
    fertilizer: Optional[float] = 0.0
    pesticide: Optional[float] = 0.0
    sowingDensity: Optional[float] = 0.0

def _default(v, fallback):
    return fallback if v is None else v

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(payload: Features):
    """
    Normalize incoming keys to EXACT training column names.
    This avoids errors like: ValueError: columns are missing: {'Nitrogen(kg/ha)'}
    """
    row = {
        "District": payload.district,
        "Season": payload.season,
        "Year": 2024,

        # soil & weather (with safe defaults if user skipped personalization)
        "Soil_pH": _default(payload.Soil_pH, 6.5),
        "Organic_Carbon(%)": _default(payload.Organic_Carbon, 0.8),
        "Nitrogen(kg/ha)": _default(payload.Nitrogen, 100.0),
        "Phosphorus(kg/ha)": _default(payload.Phosphorus, 40.0),
        "Potassium(kg/ha)": _default(payload.Potassium, 50.0),

        "avg_temp": _default(payload.avg_temp, 28.0),
        "avg_humidity": _default(payload.Humidity, 70.0),
        "Humidity(%)": _default(payload.Humidity, 70.0),  # some pipelines used this name
        "total_rainfall": _default(payload.total_rainfall, 800.0),

        # management
        "Rice_Variety": _default(payload.variety, "Unknown"),
        "Irrigation_Type": _default(payload.irrigation, "Unknown"),
        "Fertilizer_Use(kg/ha)": _default(payload.fertilizer, 0.0),
        "Pesticide_Use(kg/ha)": _default(payload.pesticide, 0.0),
        "Sowing_Density(kg/ha)": _default(payload.sowingDensity, 0.0),

        # harmless extras if your pipeline used dates
        "Sowing_Date": "2024-06-10",
        "Harvest_Date": "2024-10-10",
    }

    df = pd.DataFrame([row])

    try:
        pred = float(model.predict(df)[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model prediction failed: {e}")

    return {"predicted_yield": pred}

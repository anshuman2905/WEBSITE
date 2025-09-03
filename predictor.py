import pandas as pd
import joblib
import os
import random

MODEL_PATH = os.path.join(os.path.dirname(__file__), "rf_rice_bihar.joblib")

# Load trained model
model = joblib.load(MODEL_PATH)

FEATURES = ['Year', 'District', 'Area(ha)', 'Rainfall(mm)', 'Temp(C)', 'Humidity(%)',
            'SoilType', 'pH', 'N(kg/ha)', 'P(kg/ha)', 'K(kg/ha)',
            'FertilizerUsed(kg/ha)', 'IrrigationCount']

def predict_yield(input_data: dict) -> float:
    """
    Predict rice yield per hectare. Adds small random variation for game feel.
    """
    data = input_data.copy()
    
    # Force area to 1 ha so prediction is per hectare
    data['Area(ha)'] = 1

    # Build DataFrame in correct order
    df = pd.DataFrame([data])
    df = df.reindex(columns=FEATURES, fill_value=0)

    # Base prediction from model
    prediction = model.predict(df)[0]

    # Add small random variation (+/- 3% of prediction)
    variation = prediction * random.uniform(-0.03, 0.03)
    prediction += variation

    return round(float(prediction), 2)

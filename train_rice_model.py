# train_rice_model.py

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

# 1️⃣ Load dataset
data = pd.read_csv("bihar_rice_synthetic_300.csv")  # <-- replace with your actual dataset filename

# 2️⃣ Define features and target
target = "Yield(tons/ha)"
features = [
    'Year', 'District', 'Area(ha)', 'Rainfall(mm)', 'Temp(C)',
    'Humidity(%)', 'SoilType', 'pH', 'N(kg/ha)', 'P(kg/ha)', 'K(kg/ha)',
    'FertilizerUsed(kg/ha)', 'IrrigationCount'
]

X = data[features]
y = data[target]

# 3️⃣ Identify categorical and numerical columns
categorical_cols = ['District', 'SoilType']
numerical_cols = [col for col in features if col not in categorical_cols]

# 4️⃣ Preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        ('num', 'passthrough', numerical_cols),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols)
    ]
)

# 5️⃣ Model pipeline
model = Pipeline([
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(
        n_estimators=100,
        random_state=42
    ))
])

# 6️⃣ Split data for training/testing
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 7️⃣ Train model
model.fit(X_train, y_train)

# 8️⃣ Optional: check score on test set
score = model.score(X_test, y_test)
print(f"Model R² score on test set: {score:.4f}")

# 9️⃣ Save trained model
joblib.dump(model, "rf_rice_bihar.joblib")
print("Model saved as rf_rice_bihar.joblib!")

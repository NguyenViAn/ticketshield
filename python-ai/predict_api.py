from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

MODEL_FILE = "risk_model.pkl"

app = FastAPI(title="TicketShield Risk Prediction API")

model_package = joblib.load(MODEL_FILE)
model = model_package["model"]
label_encoder = model_package["label_encoder"]
feature_names = model_package["feature_names"]


class SessionFeatures(BaseModel):
    total_clicks: float
    seat_select_count: float
    seat_deselect_count: float
    seat_change_count: float
    invalid_seat_click_count: float
    cross_section_attempt_count: float
    tier_change_count: float
    selected_seat_count: float
    avg_click_interval_ms: float
    min_click_interval_ms: float
    time_to_first_seat_ms: float
    time_to_complete_selection_ms: float
    review_time_ms: float
    payment_entry_delay_ms: float
    checkout_attempt_count: float
    refresh_count: float
    session_duration_ms: float


@app.get("/")
def root():
    return {
        "message": "TicketShield AI Risk API is running",
        "features": feature_names,
    }


@app.post("/predict")
def predict(features: SessionFeatures):
    feature_dict = features.dict()

    ordered_values = [feature_dict[name] for name in feature_names]
    X = np.array([ordered_values])

    pred_encoded = model.predict(X)[0]
    pred_label = label_encoder.inverse_transform([pred_encoded])[0]

    confidence = None
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(X)[0]
        confidence = float(np.max(probabilities))

    return {
        "riskLevel": pred_label,
        "confidence": confidence,
        "featuresUsed": feature_names,
    }

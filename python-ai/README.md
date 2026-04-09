# TicketShield Python AI Service

This folder contains the Python risk scoring service used by the Next.js app.

## Included

- `predict_api.py`: FastAPI inference endpoint for `/predict`
- `risk_model.pkl`: trained model package used at runtime
- `risk_model_meta.json`: model metadata and evaluation summary
- `train_model.py`: local training script for regenerating the model

## Not Included

- `.venv/` and cache files
- local dataset exports and spreadsheets

The app calls this service through `PYTHON_AI_URL`. If the variable is not set, the frontend uses `http://127.0.0.1:8000/predict`.

## Run Locally

```bash
cd python-ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn predict_api:app --host 127.0.0.1 --port 8000
```

## Retraining

`train_model.py` expects the dataset CSV files to exist in the same folder. Those dataset files are still local-only and were not added to the repository in this change.

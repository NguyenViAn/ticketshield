import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier


MODEL_FILE = "risk_model.pkl"
META_FILE = "risk_model_meta.json"

DEFAULT_SPLIT_FILES = {
    "train": "ticketshield_session_risk_dataset_train.csv",
    "validation": "ticketshield_session_risk_dataset_validation.csv",
    "test": "ticketshield_session_risk_dataset_test.csv",
}
FULL_DATASET_FILE = "ticketshield_session_risk_dataset_full.csv"
LEGACY_DATASET_FILE = "session_risk_dataset.csv"
TARGET_COLUMN_CANDIDATES = ["risk_label", "label"]
LABEL_ORDER = ["low", "warning", "high"]
MAX_SELECTED_SEATS = 4
MIN_SELECTED_SEATS = 1
EXPECTED_FEATURES = [
    "total_clicks",
    "seat_select_count",
    "seat_deselect_count",
    "seat_change_count",
    "invalid_seat_click_count",
    "cross_section_attempt_count",
    "tier_change_count",
    "selected_seat_count",
    "avg_click_interval_ms",
    "min_click_interval_ms",
    "time_to_first_seat_ms",
    "time_to_complete_selection_ms",
    "review_time_ms",
    "payment_entry_delay_ms",
    "checkout_attempt_count",
    "refresh_count",
    "session_duration_ms",
]
DROP_COLUMNS = ["session_id", "match_id", "user_id", "split"]


def resolve_target_column(df: pd.DataFrame) -> str:
    for column in TARGET_COLUMN_CANDIDATES:
        if column in df.columns:
            return column

    raise ValueError(
        f"Missing target column. Expected one of: {', '.join(TARGET_COLUMN_CANDIDATES)}"
    )


def load_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found: {path}")

    df = pd.read_csv(path)
    if df.empty:
        raise ValueError(f"Dataset is empty: {path}")

    return df


def clean_dataset(df: pd.DataFrame, dataset_name: str) -> tuple[pd.DataFrame, dict]:
    cleaned = df.copy()
    target_column = resolve_target_column(cleaned)
    original_rows = len(cleaned)
    dropped_invalid_seat_count = 0

    cleaned[target_column] = cleaned[target_column].astype(str).str.lower().str.strip()

    if "selected_seat_count" in cleaned.columns:
        mask = cleaned["selected_seat_count"].between(MIN_SELECTED_SEATS, MAX_SELECTED_SEATS)
        dropped_invalid_seat_count = int((~mask).sum())
        cleaned = cleaned.loc[mask].copy()

    missing_feature_columns = [column for column in EXPECTED_FEATURES if column not in cleaned.columns]
    if missing_feature_columns:
        raise ValueError(
            f"Dataset '{dataset_name}' is missing required feature columns: {missing_feature_columns}"
        )

    invalid_labels = sorted(set(cleaned[target_column].unique()) - set(LABEL_ORDER))
    if invalid_labels:
        raise ValueError(
            f"Dataset '{dataset_name}' contains invalid labels {invalid_labels}. Allowed labels: {LABEL_ORDER}"
        )

    cleaned = cleaned.drop(columns=[column for column in DROP_COLUMNS if column in cleaned.columns], errors="ignore")
    cleaned = cleaned[EXPECTED_FEATURES + [target_column]].reset_index(drop=True)

    return cleaned, {
        "dataset": dataset_name,
        "rows_before_cleaning": original_rows,
        "rows_after_cleaning": len(cleaned),
        "dropped_selected_seat_count_out_of_range": dropped_invalid_seat_count,
        "target_column": target_column,
    }


def load_predefined_splits(base_dir: Path) -> tuple[dict[str, pd.DataFrame], list[dict]]:
    datasets: dict[str, pd.DataFrame] = {}
    cleaning_summary: list[dict] = []

    for split_name, file_name in DEFAULT_SPLIT_FILES.items():
        dataset, summary = clean_dataset(load_csv(base_dir / file_name), file_name)
        datasets[split_name] = dataset
        cleaning_summary.append(summary)

    return datasets, cleaning_summary


def load_full_dataset_by_split(base_dir: Path) -> tuple[dict[str, pd.DataFrame], list[dict]]:
    dataset_path = base_dir / FULL_DATASET_FILE
    if not dataset_path.exists():
        raise FileNotFoundError(f"Full dataset file not found: {dataset_path}")

    df = load_csv(dataset_path)
    if "split" not in df.columns:
        raise ValueError(f"Dataset '{FULL_DATASET_FILE}' does not include a split column.")

    datasets: dict[str, pd.DataFrame] = {}
    cleaning_summary: list[dict] = []

    for split_name in DEFAULT_SPLIT_FILES:
        split_df = df.loc[df["split"].astype(str).str.lower().str.strip() == split_name].copy()
        if split_df.empty:
            raise ValueError(f"Split '{split_name}' is missing from {FULL_DATASET_FILE}.")
        dataset, summary = clean_dataset(split_df, f"{FULL_DATASET_FILE}:{split_name}")
        datasets[split_name] = dataset
        cleaning_summary.append(summary)

    return datasets, cleaning_summary


def load_legacy_dataset(base_dir: Path) -> tuple[dict[str, pd.DataFrame], list[dict]]:
    dataset, summary = clean_dataset(load_csv(base_dir / LEGACY_DATASET_FILE), LEGACY_DATASET_FILE)
    if len(dataset) < 10:
        raise ValueError(
            f"Legacy dataset '{LEGACY_DATASET_FILE}' is too small after cleaning to train a useful model."
        )

    train_end = int(len(dataset) * 0.7)
    validation_end = int(len(dataset) * 0.85)

    datasets = {
        "train": dataset.iloc[:train_end].reset_index(drop=True),
        "validation": dataset.iloc[train_end:validation_end].reset_index(drop=True),
        "test": dataset.iloc[validation_end:].reset_index(drop=True),
    }

    return datasets, [summary]


def load_datasets(base_dir: Path) -> tuple[dict[str, pd.DataFrame], list[dict], str]:
    split_paths_exist = all((base_dir / filename).exists() for filename in DEFAULT_SPLIT_FILES.values())
    if split_paths_exist:
        datasets, summary = load_predefined_splits(base_dir)
        return datasets, summary, "predefined_split_files"

    full_dataset_path = base_dir / FULL_DATASET_FILE
    if full_dataset_path.exists():
        datasets, summary = load_full_dataset_by_split(base_dir)
        return datasets, summary, "full_dataset_with_split_column"

    datasets, summary = load_legacy_dataset(base_dir)
    return datasets, summary, "legacy_single_file"


def prepare_xy(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    target_column = resolve_target_column(df)
    x_values = df[EXPECTED_FEATURES].copy()
    y_values = df[target_column].astype(str).str.lower().str.strip()
    return x_values, y_values


def build_models() -> dict[str, Pipeline]:
    return {
        "logistic_regression": Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                (
                    "model",
                    LogisticRegression(
                        max_iter=1000,
                        random_state=42,
                        class_weight="balanced",
                    ),
                ),
            ]
        ),
        "decision_tree": Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                (
                    "model",
                    DecisionTreeClassifier(
                        max_depth=5,
                        min_samples_split=4,
                        min_samples_leaf=2,
                        random_state=42,
                        class_weight="balanced",
                    ),
                ),
            ]
        ),
        "random_forest": Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                (
                    "model",
                    RandomForestClassifier(
                        n_estimators=150,
                        max_depth=8,
                        min_samples_split=4,
                        min_samples_leaf=2,
                        random_state=42,
                        class_weight="balanced",
                    ),
                ),
            ]
        ),
    }


def evaluate_predictions(model_name: str, stage: str, y_true, y_pred, label_encoder: LabelEncoder) -> dict:
    decoded_true = label_encoder.inverse_transform(y_true)
    decoded_pred = label_encoder.inverse_transform(y_pred)

    accuracy = accuracy_score(decoded_true, decoded_pred)
    report_dict = classification_report(
        decoded_true,
        decoded_pred,
        labels=LABEL_ORDER,
        zero_division=0,
        output_dict=True,
    )
    matrix = confusion_matrix(decoded_true, decoded_pred, labels=LABEL_ORDER)

    print("\n" + "=" * 70)
    print(f"MODEL: {model_name} | STAGE: {stage}")
    print("=" * 70)
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(
        classification_report(
            decoded_true,
            decoded_pred,
            labels=LABEL_ORDER,
            zero_division=0,
        )
    )
    print("Confusion Matrix:")
    print(pd.DataFrame(matrix, index=LABEL_ORDER, columns=LABEL_ORDER))

    return {
        "accuracy": accuracy,
        "classification_report": report_dict,
        "confusion_matrix": matrix.tolist(),
    }


def train_and_select_best_model(datasets: dict[str, pd.DataFrame]):
    x_train, y_train = prepare_xy(datasets["train"])
    x_validation, y_validation = prepare_xy(datasets["validation"])
    x_test, y_test = prepare_xy(datasets["test"])

    label_encoder = LabelEncoder()
    label_encoder.fit(LABEL_ORDER)

    y_train_encoded = label_encoder.transform(y_train)
    y_validation_encoded = label_encoder.transform(y_validation)
    y_test_encoded = label_encoder.transform(y_test)

    models = build_models()

    best_model_name = None
    best_model = None
    best_validation_accuracy = -1.0
    all_results: dict[str, dict] = {}

    for model_name, pipeline in models.items():
        pipeline.fit(x_train, y_train_encoded)

        validation_predictions = pipeline.predict(x_validation)
        validation_results = evaluate_predictions(
            model_name,
            "validation",
            y_validation_encoded,
            validation_predictions,
            label_encoder,
        )
        all_results[model_name] = {"validation": validation_results}

        if validation_results["accuracy"] > best_validation_accuracy:
            best_validation_accuracy = validation_results["accuracy"]
            best_model_name = model_name
            best_model = pipeline

    if best_model_name is None or best_model is None:
        raise RuntimeError("Could not select a best model.")

    combined_train_validation = pd.concat([datasets["train"], datasets["validation"]], ignore_index=True)
    x_train_final, y_train_final = prepare_xy(combined_train_validation)
    y_train_final_encoded = label_encoder.transform(y_train_final)
    best_model.fit(x_train_final, y_train_final_encoded)

    test_predictions = best_model.predict(x_test)
    test_results = evaluate_predictions(
        best_model_name,
        "test",
        y_test_encoded,
        test_predictions,
        label_encoder,
    )
    all_results[best_model_name]["test"] = test_results

    model_package = {
        "model": best_model,
        "label_encoder": label_encoder,
        "feature_names": EXPECTED_FEATURES,
    }

    return model_package, best_model_name, best_validation_accuracy, all_results


def save_model(
    model_package,
    model_path: Path,
    meta_path: Path,
    best_model_name: str,
    best_validation_accuracy: float,
    all_results: dict,
    cleaning_summary: list[dict],
    dataset_source: str,
    datasets: dict[str, pd.DataFrame],
):
    joblib.dump(model_package, model_path)

    dataset_rows = {split_name: len(df) for split_name, df in datasets.items()}
    label_distribution = {
        split_name: df[resolve_target_column(df)].value_counts().sort_index().to_dict()
        for split_name, df in datasets.items()
    }

    meta = {
        "best_model_name": best_model_name,
        "best_validation_accuracy": best_validation_accuracy,
        "feature_names": model_package["feature_names"],
        "labels": LABEL_ORDER,
        "dataset_source": dataset_source,
        "dataset_rows": dataset_rows,
        "label_distribution": label_distribution,
        "cleaning_summary": cleaning_summary,
        "all_results": all_results,
    }

    with meta_path.open("w", encoding="utf-8") as file:
        json.dump(meta, file, ensure_ascii=False, indent=2)

    print(f"\nSaved model to: {model_path}")
    print(f"Saved metadata to: {meta_path}")


def main():
    base_dir = Path(__file__).resolve().parent
    datasets, cleaning_summary, dataset_source = load_datasets(base_dir)

    print("Dataset source:", dataset_source)
    print("Cleaning summary:")
    for item in cleaning_summary:
        print("-", json.dumps(item, ensure_ascii=False))

    for split_name, df in datasets.items():
        target_column = resolve_target_column(df)
        print(f"\n[{split_name}] shape: {df.shape}")
        print(df[target_column].value_counts().sort_index())

    print("\nTraining with features:")
    for feature in EXPECTED_FEATURES:
        print(f"- {feature}")

    model_package, best_model_name, best_validation_accuracy, all_results = train_and_select_best_model(datasets)

    save_model(
        model_package=model_package,
        model_path=base_dir / MODEL_FILE,
        meta_path=base_dir / META_FILE,
        best_model_name=best_model_name,
        best_validation_accuracy=best_validation_accuracy,
        all_results=all_results,
        cleaning_summary=cleaning_summary,
        dataset_source=dataset_source,
        datasets=datasets,
    )

    print("\nTraining complete.")


if __name__ == "__main__":
    main()

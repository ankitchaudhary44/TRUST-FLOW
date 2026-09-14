import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix

def generate_synthetic_data(n_samples=5000):
    np.random.seed(42)
    amount = np.random.lognormal(mean=3, sigma=1, size=n_samples)
    amount_deviation = amount / np.median(amount)
    is_new_beneficiary = np.random.choice([0, 1], p=[0.95, 0.05], size=n_samples)
    is_new_device = np.random.choice([0, 1], p=[0.98, 0.02], size=n_samples)
    time_of_day = np.random.randint(0, 24, size=n_samples)
    
    labels = np.zeros(n_samples)
    fraud_idx1 = np.where((amount_deviation > 5) & (is_new_beneficiary == 1))[0]
    fraud_idx2 = np.where((is_new_device == 1) & (time_of_day < 6) & (is_new_beneficiary == 1))[0]
    
    labels[fraud_idx1] = 1
    labels[fraud_idx2] = 1
    
    noise_idx = np.random.choice(n_samples, size=int(n_samples * 0.01), replace=False)
    labels[noise_idx] = 1 - labels[noise_idx]
    
    df = pd.DataFrame({
        'amount': amount,
        'amount_deviation': amount_deviation,
        'is_new_beneficiary': is_new_beneficiary,
        'is_new_device': is_new_device,
        'time_of_day': time_of_day,
        'is_fraud': labels
    })
    
    return df

def train_model():
    print("Generating synthetic dataset...")
    df = generate_synthetic_data(10000)
    
    X = df[['amount_deviation', 'is_new_beneficiary', 'is_new_device', 'time_of_day']]
    y = df['is_fraud']
    
    print(f"Class distribution:\n{y.value_counts(normalize=True)}")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42, class_weight='balanced')
    model.fit(X_train, y_train)
    
    print("Evaluating Model...")
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    print(classification_report(y_test, y_pred))
    print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")
    
    os.makedirs('apps/ml-service/app/models/saved', exist_ok=True)
    model_path = 'apps/ml-service/app/models/saved/rf_trust_model.pkl'
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_model()

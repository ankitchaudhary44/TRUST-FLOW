from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
import shap

app = Flask(__name__)
CORS(app)

model_path = os.path.join(os.path.dirname(__file__), 'models/saved/rf_trust_model.pkl')
model = None
explainer = None

try:
    if os.path.exists(model_path):
        model = joblib.load(model_path)
    else:
        model = joblib.load('apps/ml-service/app/models/saved/rf_trust_model.pkl')
    explainer = shap.TreeExplainer(model)
except Exception as e:
    print(f"Warning: Model or Explainer not loaded. {e}")

@app.route("/api/v1/evaluate", methods=["POST"])
def evaluate_transaction():
    context = request.json
    if not model or not explainer:
        return jsonify({"ml_risk_score": 0, "probability_of_anomaly": 0.0, "status": "model_not_loaded", "feature_contributions": {}})
        
    features = np.array([[
        context.get('amount_deviation', 1.0),
        context.get('is_new_beneficiary', 0),
        context.get('is_new_device', 0),
        context.get('time_of_day', 12)
    ]])
    feature_names = ['Amount Deviation', 'New Beneficiary', 'New Device', 'Time of Day']
    
    prob = model.predict_proba(features)[0][1]
    ml_risk_score = min(int(prob * 100), 100)
    
    shap_values = explainer.shap_values(features)
    
    if isinstance(shap_values, list):
        contributions = shap_values[1][0]
    elif len(shap_values.shape) == 3:
        contributions = shap_values[0, :, 1]
    else:
        contributions = shap_values[0]
    
    feature_contributions = {}
    for name, contrib in zip(feature_names, contributions):
        if contrib > 0.01:
            feature_contributions[name] = round(float(contrib * 100), 2)
    
    return jsonify({
        "ml_risk_score": ml_risk_score,
        "probability_of_anomaly": prob,
        "feature_contributions": feature_contributions,
        "status": "success"
    })

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "OK", "service": "TrustFlow ML Engine (Flask)"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)

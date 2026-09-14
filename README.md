# TrustFlow AI 🛡️

*Detecting the risk behind the transaction, not just the transaction itself.*

Hey there! 👋 Welcome to **TrustFlow AI**. I built this project to tackle a real-world problem: modern financial fraud. Traditional bank rules block transactions when they look slightly weird, which frustrates genuine users, or they let sophisticated scams slip through. 

TrustFlow solves this by combining **Behavioral Analytics**, **Machine Learning**, and **Generative AI** to make smarter, context-aware decisions in real-time.

---

## ✨ What makes this special?

*   **🕵️ Context-Aware Risk Engine**: It doesn't just look at the amount. It checks if the device is new, if the beneficiary is trusted, and what time of day it is.
*   **🧠 Explainable AI (SHAP)**: A Python-based ML microservice runs in the background. If a transaction is blocked, the model uses SHAP values to explain *exactly* why (e.g., "Amount deviation contributed 35% to the risk score").
*   **🤖 GenAI Forensic Investigator**: Powered by **Google Gemini 1.5 Pro**. Instead of an analyst manually digging through logs, Gemini instantly reads the transaction context and generates a human-readable forensic report.
*   **🔒 Strict Role-Based Portals**: Completely isolated experiences for **Customers** (making transfers) and **Analysts** (reviewing fraud alerts in a live dashboard).

## 🛠️ Tech Stack

*   **Frontend**: Next.js 14, React, Tailwind CSS, Recharts (for gorgeous, live analytics)
*   **Backend Core**: Node.js, Express, TypeScript, Prisma ORM
*   **ML Microservice**: Python, Flask, scikit-learn, SHAP
*   **Database**: SQLite (easy to run locally)
*   **AI Integration**: Google Gemini API

---

## 🚀 Running it Locally

Want to spin this up on your machine? It's structured as a Turborepo monorepo.

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup the Database
```bash
cd apps/api
npm run db:push
npm run seed
```

### 3. Setup the ML Engine
```bash
cd ../ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python scripts/train.py
```

### 4. Environment Variables
Create a `.env` file inside `apps/api/` and add your Gemini API Key (Note: `.env` is safely gitignored!):
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 5. Start the Services
You'll need three terminal tabs:
*   **Frontend:** `cd apps/web && npm run dev` (Runs on 3000)
*   **Backend:** `cd apps/api && npm run dev` (Runs on 4000)
*   **ML Service:** `cd apps/ml-service && source venv/bin/activate && python app/main.py` (Runs on 8000)

---

## 🌐 Deployment
*   **Frontend:** Pre-configured for **Vercel** (`vercel.json` included).
*   **Backend & ML:** Pre-configured for **Render** via Infrastructure-as-Code (`render.yaml` included).

---
*Built with ❤️ focusing on clean architecture and next-gen security.*

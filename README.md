# PhishGuard 🛡️

PhishGuard is an advanced, real-time cyber threat intelligence platform developed as a final-year computer science project. It proactively detects and mitigates phishing vectors across multiple mobile channels—including text messages (SMS), QR codes, and direct hyperlinks—leveraging state-of-the-art machine learning models.

## 🚀 Key Features

* **SMS Guard Engine**: Scans text messages, extracts structured URL fragments via regular expressions, and evaluates malicious risks.
* **QR Scanner Module**: Integrates native camera feeds to safely capture and audit QR-encoded link redirects.
* **Proactive Background Monitoring**: A background listener that safely inspects the system clipboard upon app refocus, alerting users to malicious copied data before execution.
* **Physical Feedback (Haptic Alarms)**: Employs specific device vibration intervals (long pulse arrays for immediate danger alerts) to elevate user experience.
* **Dynamic LLM Inference**: Routes heavy analysis tasks through a dynamic fallback pipeline of open-source conversational and text-generation AI architectures hosted on the Hugging Face Router.
* **Secure Session Architecture**: Sandboxed user authentication tracking powered by Flask, hashing algorithms, and local data isolation via `AsyncStorage`.

---

## 🛠️ Tech Stack

### Frontend (Mobile App)
* **Framework**: React Native (Expo CLI)
* **Navigation & Storage**: Custom Component States & Local `AsyncStorage`
* **Hardware Hooks**: `expo-camera` & `expo-notifications`

### Backend (REST API Architecture)
* **Core Framework**: Python / Flask
* **Database Engine**: MongoDB (Flask-PyMongo integration)
* **Production Server**: Gunicorn WSGI HTTP Server
* **Inference Hub**: Hugging Face Hub (AI Inference Routing Pipeline)

---

## 📂 System Architecture Overview

```text
PhishGuard/
├── App.js                         # Core layout mapping & clipboard event engine
├── .gitignore                     # Repository source exclusion list
├── assets/                        # Local image and design media vectors
└── src/
    ├── backend/
    │   ├── app.py                 # Core routing, authentication & database endpoints
    │   ├── ai_scanner.py          # Machine learning model fallback array pipelines
    │   └── requirements.txt       # Production library dependencies
    └── screen/
        ├── AuthScreen.js          # Authentication token forms
        ├── HomeScreen.js          # Unified service module routing grid
        ├── SmsScreen.js           # Clipboard parser & text vector utility
        ├── QRScannerScreen.js     # System camera barcode interface
        ├── HistoryScreen.js       # Stored analysis log metrics ledger
        └── Profile.js             # Local profile identity viewer card

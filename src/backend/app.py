import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
# Import the corrected AI scanner functions
from ai_scanner import configure_ai, get_ai_explanation

app = Flask(__name__)
CORS(app)  # Allows your React Native app to make requests without CORS blocks

# MongoDB Connection - Pulls from environment or falls back to local for testing
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/phishguard")
mongo = PyMongo(app)

# Initialize AI environment check configurations
configure_ai()

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "online", "message": "PhishGuard API Server is Live"}), 200

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Missing email or password"}), 400

    users_db = mongo.db.users
    existing_user = users_db.find_one({"email": data["email"]})

    if existing_user:
        return jsonify({"error": "User already exists with this email"}), 400

    hashed_password = generate_password_hash(data["password"])
    new_user_id = users_db.insert_one({
        "username": data.get("username", data["email"].split("@")[0]),
        "email": data["email"],
        "password": hashed_password
    }).inserted_id

    return jsonify({"message": "User registered successfully", "user_id": str(new_user_id)}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Missing login credentials"}), 400

    users_db = mongo.db.users
    user = users_db.find_one({"email": data["email"]})

    if not user or not check_password_hash(user["password"], data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": str(user["_id"]),
            "username": user.get("username"),
            "email": user["email"]
        }
    }), 200

@app.route("/scan", methods=["POST"])
def scan_url():
    data = request.get_json()
    if not data or not data.get("url"):
        return jsonify({"error": "No URL provided for analysis"}), 400

    target_url = data["url"]
    print(f"📡 Received scan request for: {target_url}")

    try:
        # Call the updated router-compatible AI scanning process
        result, explanation = get_ai_explanation(target_url)
        
        # Determine confidence metrics based on result consistency
        confidence = "High" if result != "Unknown" else "Low"

        return jsonify({
            "url": target_url,
            "result": result,
            "confidence": confidence,
            "explanation": explanation
        }), 200

    except Exception as e:
        print(f"❌ Scanning pipeline error: {str(e)}")
        return jsonify({"error": "An internal error occurred during analysis"}), 500

if __name__ == "__main__":
    # Standard Render port binding configurations
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
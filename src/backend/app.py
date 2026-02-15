import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from ai_scanner import configure_ai, get_ai_explanation
import datetime

app = Flask(__name__)
CORS(app)

# 1. Setup AI
configure_ai()

# 2. Setup MongoDB
# NOTE: Ensure you whitelist "0.0.0.0/0" in MongoDB Atlas Network Access so Render can connect.
app.config["MONGO_URI"] = "mongodb+srv://studd736_db_user:DCuCXej1y3XuspQQ@pdsc.ngajspc.mongodb.net/phishguard?appName=PDSC"
mongo = PyMongo(app)
users_collection = mongo.db.users

@app.route('/', methods=['GET'])
def home():
    return "PhishGuard Server is Running!", 200

# 👇 REGISTER ENDPOINT
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password') # In a real app, hash this!
    name = data.get('name', 'User')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 400
    
    new_user = {
        "email": email,
        "password": password,
        "name": name,
        "photo": "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        "joined_at": datetime.datetime.utcnow()
    }
    users_collection.insert_one(new_user)
    
    # Convert ObjectId to string for JSON response
    new_user['_id'] = str(new_user['_id'])
    
    return jsonify({"message": "User registered successfully", "user": new_user}), 201

# 👇 LOGIN ENDPOINT
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = users_collection.find_one({"email": email})

    if user and user['password'] == password:
        user['_id'] = str(user['_id'])
        return jsonify({
            "message": "Login successful", 
            "user": user
        }), 200
    
    return jsonify({"error": "Invalid email or password"}), 401

# 👇 UPDATE PROFILE
@app.route('/update-profile', methods=['POST'])
def update_profile():
    data = request.json
    email = data.get('email')
    new_name = data.get('name')
    new_photo = data.get('photo')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    update_fields = {}
    if new_name: update_fields["name"] = new_name
    if new_photo: update_fields["photo"] = new_photo

    if update_fields:
        users_collection.update_one(
            {"email": email},
            {"$set": update_fields}
        )
        return jsonify({"message": "Profile updated successfully"}), 200
    
    return jsonify({"message": "No changes made"}), 200

@app.route('/scan', methods=['POST'])
def scan_url():
    data = request.json
    url = data.get('url', '')

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    result, explanation = get_ai_explanation(url)
    confidence = "High" if result == "Phishing" else "Medium"

    return jsonify({
        "url": url,
        "result": result,
        "confidence": confidence,
        "explanation": explanation
    })

if __name__ == '__main__':
    # 👇 UPDATED FOR CLOUD DEPLOYMENT
    # This allows Render to set the port dynamically
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
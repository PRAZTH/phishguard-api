import os
import sys
# Import the Flask app from your api.py file
from api import app 

def fix_and_start():
    # 1. Get the current folder (src/backend)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ml_engine_dir = os.path.join(base_dir, 'ml_engine')

    # 2. Check if ml_engine exists
    if not os.path.exists(ml_engine_dir):
        print(f"❌ ERROR: Could not find folder: {ml_engine_dir}")
        print("Please make sure you created the 'ml_engine' folder inside 'backend'.")
        return

    # 3. Create __init__.py if it's missing
    init_file = os.path.join(ml_engine_dir, '__init__.py')
    if not os.path.exists(init_file):
        print("⚠️  '__init__.py' was missing. Creating it now...")
        with open(init_file, 'w') as f:
            f.write("") # Create empty file
        print("✅ Created __init__.py successfully.")
    else:
        print("✅ __init__.py already exists.")

    # 4. Start the Server (Using Flask)
    print("🚀 Starting Flask Server...")
    # This runs the app on your local network (0.0.0.0) so your phone can see it
    app.run(host="0.0.0.0", port=5000, debug=True)

if __name__ == "__main__":
    fix_and_start()
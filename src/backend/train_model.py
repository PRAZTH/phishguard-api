import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import joblib
import os
import kagglehub
from ml_engine.feature_extractor import FeatureExtractor

# --- CONFIGURATION ---
current_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(current_dir, 'models')

if not os.path.exists(models_dir):
    os.makedirs(models_dir)

# --- 1. DOWNLOAD & LOAD DATASET ---
print("[DOWNLOAD] Checking Kaggle dataset...")

try:
    # Download dataset
    path = kagglehub.dataset_download("chinmaykarpe/phishing-sites-excel-sheet")
    print(f"[OK] Dataset found at: {path}")

    files = os.listdir(path)
    data_file = None
    for f in files:
        if f.endswith('.xlsx') or f.endswith('.csv'):
            data_file = os.path.join(path, f)
            break
    
    if not data_file:
        raise Exception("No Excel or CSV file found.")

    print(f"[LOAD] Reading: {data_file}")
    if data_file.endswith('.xlsx'):
        df = pd.read_excel(data_file)
    else:
        df = pd.read_csv(data_file)

    # Standardize column names
    df.columns = [c.lower().strip() for c in df.columns]

    # --- INTELLIGENT COLUMN FINDING ---
    # Find URL column
    url_col = next((c for c in df.columns if 'url' in c), None)
    if not url_col: url_col = df.columns[0] # Fallback to first col

    # Find Label column
    label_col = next((c for c in df.columns if 'label' in c or 'class' in c or 'type' in c), None)
    if not label_col: label_col = df.columns[-1] # Fallback to last col

    print(f"[INFO] Using Columns -> URL: '{url_col}' | Label: '{label_col}'")

    # --- 2. DATA BALANCING (CRITICAL FIX) ---
    print("[PROCESS] Normalizing and Balancing Data...")
    
    # Clean labels to 0 (Safe) and 1 (Phishing)
    def clean_label(val):
        s = str(val).lower().strip()
        if s in ['1', 'bad', 'phishing', 'malicious', 'yes', 'unsafe']:
            return 1
        return 0

    df['clean_label'] = df[label_col].apply(clean_label)

    # Separate legitimate and phishing
    phishing_df = df[df['clean_label'] == 1]
    legit_df = df[df['clean_label'] == 0]

    print(f"   > Original Counts: Phishing={len(phishing_df)}, Safe={len(legit_df)}")

    # Balance them (Undersample the majority)
    min_len = min(len(phishing_df), len(legit_df))
    
    # Cap at 3000 each to keep extraction fast (Total 6000)
    sample_size = min(min_len, 3000) 

    df_phish_bal = phishing_df.sample(n=sample_size, random_state=42)
    df_legit_bal = legit_df.sample(n=sample_size, random_state=42)

    # Combine back
    data = pd.concat([df_phish_bal, df_legit_bal])
    data = data.sample(frac=1, random_state=42).reset_index(drop=True) # Shuffle

    print(f"[INFO] Balanced Training Set: {len(data)} total rows ({len(df_phish_bal)} Phishing, {len(df_legit_bal)} Safe)")

except Exception as e:
    print(f"[ERROR] Data prep failed: {e}")
    exit()

# --- 3. EXTRACT FEATURES ---
print("[PROCESS] Extracting features (approx 1-3 mins)...")
features = []
labels = []

count = 0
for index, row in data.iterrows():
    url = str(row[url_col])
    label = row['clean_label']
    
    try:
        # Use your existing extractor
        extractor = FeatureExtractor(url)
        feats = extractor.run()
        
        # basic check to ensure features are numbers
        if len(feats) > 0:
            features.append(feats)
            labels.append(label)
    except Exception as e:
        pass # Skip bad URLs

    count += 1
    if count % 500 == 0:
        print(f"   > Processed {count}/{len(data)} URLs...")

# --- 4. TRAIN MODEL ---
print("[TRAIN] Training Random Forest...")

# 'class_weight="balanced"' tells the model to pay EXTRA attention to phishing if they are rare
rf_model = RandomForestClassifier(
    n_estimators=300, 
    max_depth=15, 
    class_weight='balanced', 
    random_state=42
)

rf_model.fit(features, labels)

# --- 5. EVALUATE ---
preds = rf_model.predict(features)
acc = accuracy_score(labels, preds)
print(f"\n[RESULT] Accuracy: {acc*100:.2f}%")
print("\nConfusion Matrix (Rows=Actual, Cols=Predicted):")
print(confusion_matrix(labels, preds))
print("\nReport:")
print(classification_report(labels, preds, target_names=['Safe', 'Phishing']))

# --- 6. SAVE ---
save_path = os.path.join(models_dir, 'phishing_model.pkl')
joblib.dump(rf_model, save_path)
print(f"[SAVED] Model saved to {save_path}")
from transformers import pipeline
import sys
import json
import os
import tensorflow as tf

# Suppress TensorFlow oneDNN messages
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

# Suppress TensorFlow deprecation warnings
tf.get_logger().setLevel("ERROR")

# Your bias detection code here...

# Load model
model_name = "sameer35/distilbert-political-bias"
# Token should be loaded from environment variable for security
hf_token = os.getenv("HF_TOKEN")
classifier = pipeline("text-classification", model=model_name, token=hf_token)

def analyze_text(text):
    result = classifier(text)
    print(json.dumps(result))  # Print JSON output

if __name__ == "__main__":
    input_text = sys.stdin.read().strip()
    analyze_text(input_text)

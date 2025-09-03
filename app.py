from flask import Flask, request, jsonify, send_from_directory
from predictor import predict_yield
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # allow frontend on different port (3000) to call API

# Store session data temporarily (in-memory for now)
user_data = {}
tasks_done = {"irrigation": False, "fertilizer": False, "pest": False}

# Path to your public folder
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public")

# Serve rice.html if you open Flask directly (optional)
@app.route("/")
def home():
    return send_from_directory(PUBLIC_DIR, "rice.html")

# Start the game and predict yield
@app.route("/start_game", methods=["POST"])
def start_game():
    global user_data, tasks_done
    user_data = request.json
    tasks_done = {"irrigation": False, "fertilizer": False, "pest": False}

    predicted = predict_yield(user_data)
    user_data["predicted_yield"] = predicted

    return jsonify({"message": "Game started", "predicted_yield": predicted})

# Complete a task
@app.route("/complete_task", methods=["POST"])
def complete_task():
    global tasks_done
    task = request.json.get("task")
    if task in tasks_done:
        tasks_done[task] = True
        return jsonify({"message": f"Task {task} completed!"})
    return jsonify({"error": "Invalid task"}), 400

# Submit final yield and get score
@app.route("/final_score", methods=["POST"])
def final_score():
    global user_data, tasks_done
    actual_yield = float(request.json.get("actual_yield"))
    predicted = user_data.get("predicted_yield", 0)

    # Simple scoring: closer actual to predicted = higher score
    score = max(0, 100 - abs(predicted - actual_yield) * 10)

    return jsonify({
        "predicted": predicted,
        "actual": actual_yield,
        "score": round(score, 2),
        "tasks_done": tasks_done
    })

if __name__ == "__main__":
    # Run on port 5000
    app.run(debug=True, port=5000)

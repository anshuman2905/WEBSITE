document.addEventListener("DOMContentLoaded", () => {
  const chatWindow = document.getElementById("chat-window");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");

  if (!chatWindow || !chatInput || !chatSend) return;

  // ----- Chat session -----
  let sessionId = localStorage.getItem("chat_session_id");
  if (!sessionId) {
    sessionId = "sess-" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("chat_session_id", sessionId);
  }

  // ----- Append messages -----
  function appendMessage(sender, message) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message " + (sender === "You" ? "user" : "bot");
    msgDiv.textContent = message;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    if (sender === "Bot") speakHinglish(message); // Speak bot messages
  }

  // ----- Speech synthesis -----
  function getHinglishVoice() {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => v.lang.startsWith("hi")) || voices[0];
  }

  function speakHinglish(message) {
    if (!message) return;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.voice = getHinglishVoice();
    utterance.rate = 1.2; // slightly faster
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  // ----- Voice recognition -----
  let recognition;
  const voiceBtn = document.getElementById("voice-btn"); // add a button in HTML for mic
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Hinglish / Hindi
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.addEventListener('result', event => {
      const transcript = event.results[0][0].transcript;
      chatInput.value = transcript;
      sendMessage();
    });

    recognition.addEventListener('end', () => {
      if (voiceBtn) voiceBtn.disabled = false;
    });

    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        recognition.start();
        voiceBtn.disabled = true;
      });
    }
  } else {
    if (voiceBtn) {
      voiceBtn.disabled = true;
      voiceBtn.title = "Speech recognition not supported in this browser.";
    }
  }

  // ----- Send message -----
  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage("You", message);
    chatInput.value = "";
    chatSend.disabled = true;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id: sessionId })
      });

      if (!response.ok) {
        appendMessage("Bot", `Error: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();
      appendMessage("Bot", data.reply || "No response from server.");
    } catch (err) {
      appendMessage("Bot", "Error: Could not connect to chat server.");
      console.error(err);
    } finally {
      chatSend.disabled = false;
      chatInput.focus();
    }
  }

  // ----- Event listeners -----
  chatSend.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  // ----- Optional welcome message -----
  appendMessage("Bot", "Hello! I'm AgriBot. Ask me anything about farming.");
});

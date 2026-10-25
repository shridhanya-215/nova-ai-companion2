
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const micButton = document.getElementById("micButton");
const voiceToggle = document.getElementById("voiceToggle");
const motionToggle = document.getElementById("motionToggle");
const avatarMood = document.getElementById("avatarMood");
const inputStatus = document.getElementById("inputStatus");

let voiceOutputEnabled = false;
let recognition = null;
let isListening = false;

function addMessage(text, sender = "nova") {
  const message = document.createElement("div");
  message.className =
    `message ${sender === "user" ? "user-message" : "nova-message"}`;

  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.textContent = sender === "user" ? "●" : "✦";

  const content = document.createElement("div");
  const author = document.createElement("span");
  author.className = "message-author";
  author.textContent = sender === "user" ? "YOU" : "NOVA";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  content.append(author, paragraph);
  message.append(avatar, content);
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateDemoResponse(message) {
  const text = message.toLowerCase();

  if (/\b(hello|hi|hey|hii)\b/.test(text)) {
    return "Hey! ✨ I'm Nova, your browser-based companion demo. What would you like to explore?";
  }

  if (text.includes("what can you do") || text.includes("who are you")) {
    return "I can respond to messages in this demo, explain the Nova concept, and try browser speech input and output when supported. I'm not connected to a live AI model yet.";
  }

  if (text.includes("hologram") || text.includes("pepper")) {
    return "Pepper's Ghost is an optical reflection illusion. A carefully angled transparent surface reflects an image so it appears to float in space. It is not true wavefront-reconstructing holography. Nova would need a display, angled transparent sheet, controlled lighting and a stable enclosure.";
  }

  if (text.includes("gesture") || text.includes("face") || text.includes("camera")) {
    return "A future perception system could use camera frames, a vision model to estimate face or hand landmarks, and software to map gestures to actions. This prototype does not access your camera or perform face or gesture recognition.";
  }

  if (text.includes("voice") || text.includes("microphone") || text.includes("speech")) {
    return "The browser may support speech recognition and speech synthesis, depending on browser and permissions. Recognised speech is placed into the message box; switch on voice output to hear Nova's responses.";
  }

  if (text.includes("ai") || text.includes("api") || text.includes("model")) {
    return "The requestToAI() function is the integration point. A future version should send messages to your own backend, which calls the AI provider. Keep API keys on the server, never in browser JavaScript.";
  }

  if (text.includes("fun fact") || text.includes("fact")) {
    return "Fun fact: your brain combines visual, auditory and contextual clues to build a sense of presence. That's one reason a carefully designed reflection illusion can feel convincing.";
  }

  if (text.includes("thank")) {
    return "You're welcome! 🌙 This is a starting point. The exciting work is turning the concept into a reliable, tested system.";
  }

  if (text.includes("how are you")) {
    return "I'm running in demo mode! I don't have feelings, but I'm ready to help you explore Nova.";
  }

  return "That's an interesting thought. I'm currently using a small set of scripted responses, so I may not understand every question yet. A secure backend connection to a real AI model can be added later.";
}

/*
  Integration point for a real AI service.

  This demo intentionally uses local scripted responses.
  Never put a private API key in this browser-side file.
*/
async function requestToAI(message) {
  return generateDemoResponse(message);

  // Future backend example:
  //
  // const response = await fetch("/api/chat", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ message })
  // });
  //
  // if (!response.ok) throw new Error("AI request failed");
  // const data = await response.json();
  // return data.reply;
}

async function handleConversation(message) {
  const cleaned = message.trim();
  if (!cleaned) return;

  addMessage(cleaned, "user");
  userInput.value = "";
  avatarMood.textContent = "Thinking…";
  inputStatus.textContent = "Preparing response…";
  document.body.classList.add("speaking");

  try {
    const response = await requestToAI(cleaned);
    addMessage(response, "nova");
    avatarMood.textContent = "Ready to connect";
    inputStatus.textContent = "Demo mode · scripted responses";

    if (voiceOutputEnabled) speak(response);
  } catch (error) {
    addMessage("I couldn't complete that request. Please try again.");
    inputStatus.textContent = "Response failed";
    avatarMood.textContent = "Connection issue";
  } finally {
    document.body.classList.remove("speaking");
  }
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleConversation(userInput.value);
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    handleConversation(button.dataset.question || "");
  });
});

document.getElementById("clearChat").addEventListener("click", () => {
  chatMessages.replaceChildren();
  addMessage("Chat cleared. What would you like to explore next?");
  avatarMood.textContent = "Ready to connect";
});

voiceToggle.addEventListener("click", () => {
  voiceOutputEnabled = !voiceOutputEnabled;
  voiceToggle.setAttribute("aria-pressed", String(voiceOutputEnabled));
  voiceToggle.textContent = voiceOutputEnabled
    ? "◖ Voice output enabled"
    : "◖ Enable voice output";

  if (!voiceOutputEnabled && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});

function speak(text) {
  if (!("speechSynthesis" in window)) {
    inputStatus.textContent =
      "Speech synthesis is not supported in this browser";
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1.05;

  utterance.onstart = () => {
    avatarMood.textContent = "Speaking…";
    document.body.classList.add("speaking");
  };

  utterance.onend = () => {
    avatarMood.textContent = "Ready to connect";
    document.body.classList.remove("speaking");
  };

  window.speechSynthesis.speak(utterance);
}

motionToggle.addEventListener("click", () => {
  const paused = document.body.classList.toggle("paused");
  motionToggle.setAttribute("aria-pressed", String(paused));
  motionToggle.textContent = paused
    ? "✧ Resume animation"
    : "✧ Pause animation";
});

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = navigator.language || "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.addEventListener("start", () => {
    isListening = true;
    micButton.classList.add("listening");
    micButton.textContent = "●";
    avatarMood.textContent = "Listening…";
    inputStatus.textContent = "Listening — speak clearly";
  });

  recognition.addEventListener("result", (event) => {
    userInput.value = event.results[0][0].transcript;
    userInput.focus();
    inputStatus.textContent = "Speech recognised · press send";
  });

  recognition.addEventListener("error", (event) => {
    inputStatus.textContent =
      `Microphone issue: ${event.error}. You can type instead.`;
  });

  recognition.addEventListener("end", () => {
    isListening = false;
    micButton.classList.remove("listening");
    micButton.textContent = "⌁";
    avatarMood.textContent = "Ready to connect";
  });

  micButton.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch {
        inputStatus.textContent =
          "Microphone is busy. Please try again.";
      }
    }
  });
} else {
  micButton.addEventListener("click", () => {
    inputStatus.textContent =
      "Speech recognition isn't supported here. Try a supported browser or type instead.";
  });
}

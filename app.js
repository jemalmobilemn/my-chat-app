const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatBox = document.getElementById("chatBox");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");

function addMessage(text, type) {
  const message = document.createElement("div");

  message.className = `message ${type}`;
  message.textContent = text;

  chatBox.appendChild(message);

  chatBox.scrollTop = chatBox.scrollHeight;

  return message;
}

chatForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const message = messageInput.value.trim();

  if (!message) return;

  addMessage(message, "user");

  messageInput.value = "";

  sendBtn.disabled = true;

  const loading = addMessage("⏳ እየመለሰ ነው...", "bot");

  try {

    const response = await fetch("/api/chat", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: message
      })

    });

    const data = await response.json();

    loading.remove();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    addMessage(data.reply, "bot");

  } catch (error) {

    loading.textContent =
      "❌ ስህተት ተፈጥሯል። " + error.message;

  } finally {

    sendBtn.disabled = false;

    messageInput.focus();
  }
});

clearBtn.addEventListener("click", () => {

  chatBox.innerHTML = `
    <div class="message bot">
      👋 ሰላም! እንዴት ልርዳህ?
    </div>
  `;

});
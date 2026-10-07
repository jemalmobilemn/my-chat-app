// ==========================================
// FIREBASE CONFIG
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyCyosrarpVmlGQ-i7cQYNm_M15f2Vgu4CA",
  authDomain: "web-app-e909e.firebaseapp.com",
  projectId: "web-app-e909e",
  storageBucket: "web-app-e909e.firebasestorage.app",
  messagingSenderId: "305727313129",
  appId: "1:305727313129:web:10e682d5fac76c7fbf0c78"
};


// ==========================================
// FIREBASE INITIALIZE
// ==========================================

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();


// ==========================================
// HTML ELEMENTS
// ==========================================

const authPage = document.getElementById("authPage");
const chatPage = document.getElementById("chatPage");

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const authBtn = document.getElementById("authBtn");
const switchAuth = document.getElementById("switchAuth");

const authTitle = document.getElementById("authTitle");
const authError = document.getElementById("authError");

const currentUser = document.getElementById("currentUser");
const logoutBtn = document.getElementById("logoutBtn");

const usersList = document.getElementById("usersList");
const searchUser = document.getElementById("searchUser");

const chatUser = document.getElementById("chatUser");
const messages = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");


// ==========================================
// VARIABLES
// ==========================================

let registerMode = true;
let currentChatUser = null;
let unsubscribeMessages = null;


// ==========================================
// LOGIN / REGISTER SWITCH
// ==========================================

switchAuth.addEventListener("click", () => {

  registerMode = !registerMode;

  authError.textContent = "";

  if (registerMode) {

    authTitle.textContent = "Create your account";

    authBtn.textContent = "Create Account";

    usernameInput.style.display = "block";

    switchAuth.textContent =
      "Already have an account? Login";

  } else {

    authTitle.textContent = "Login";

    authBtn.textContent = "Login";

    usernameInput.style.display = "none";

    switchAuth.textContent =
      "Create a new account";
  }

});


// ==========================================
// CREATE ACCOUNT / LOGIN
// ==========================================

authBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const username = usernameInput.value.trim();

  authError.textContent = "";

  if (!email || !password) {

    authError.textContent =
      "Email and password are required.";

    return;
  }

  if (password.length < 6) {

    authError.textContent =
      "Password must be at least 6 characters.";

    return;
  }

  try {

    // ======================================
    // REGISTER
    // ======================================

    if (registerMode) {

      if (!username) {

        authError.textContent =
          "Username is required.";

        return;
      }

      const result =
        await auth.createUserWithEmailAndPassword(
          email,
          password
        );

      // Save user in Firestore

      await db
        .collection("users")
        .doc(result.user.uid)
        .set({

          uid: result.user.uid,

          username: username,

          email: email,

          online: true,

          createdAt:
            firebase.firestore.FieldValue.serverTimestamp()

        });

      console.log("Account created successfully");

    }

    // ======================================
    // LOGIN
    // ======================================

    else {

      await auth.signInWithEmailAndPassword(
        email,
        password
      );

      console.log("Login successful");
    }

  } catch (error) {

    console.error("AUTH ERROR:", error);

    if (error.code === "auth/email-already-in-use") {

      authError.textContent =
        "This email is already registered.";

    } else if (error.code === "auth/invalid-email") {

      authError.textContent =
        "Invalid email address.";

    } else if (error.code === "auth/weak-password") {

      authError.textContent =
        "Password is too weak.";

    } else if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {

      authError.textContent =
        "Email or password is incorrect.";

    } else {

      authError.textContent =
        error.message;
    }

  }

});


// ==========================================
// AUTH STATE
// ==========================================

auth.onAuthStateChanged(async (user) => {

  if (user) {

    authPage.classList.add("hidden");

    chatPage.classList.remove("hidden");

    try {

      const userDoc =
        await db
          .collection("users")
          .doc(user.uid)
          .get();

      if (userDoc.exists) {

        const data = userDoc.data();

        currentUser.textContent =
          "@" + data.username;
      }

      await db
        .collection("users")
        .doc(user.uid)
        .update({

          online: true

        });

      loadUsers();

    } catch (error) {

      console.error(
        "User loading error:",
        error
      );

    }

  } else {

    authPage.classList.remove("hidden");

    chatPage.classList.add("hidden");

  }

});


// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener("click", async () => {

  try {

    const user = auth.currentUser;

    if (user) {

      await db
        .collection("users")
        .doc(user.uid)
        .update({

          online: false

        });
    }

    await auth.signOut();

  } catch (error) {

    console.error(error);

  }

});


// ==========================================
// LOAD USERS
// ==========================================

async function loadUsers() {

  try {

    usersList.innerHTML = "";

    const snapshot =
      await db
        .collection("users")
        .get();

    snapshot.forEach((doc) => {

      const data = doc.data();

      if (
        auth.currentUser &&
        doc.id === auth.currentUser.uid
      ) {
        return;
      }

      createUserElement(
        doc.id,
        data.username,
        data.online
      );

    });

  } catch (error) {

    console.error(
      "Load users error:",
      error
    );

  }

}


// ==========================================
// USER ELEMENT
// ==========================================

function createUserElement(
  uid,
  username,
  online
) {

  const div =
    document.createElement("div");

  div.className = "user-item";

  div.innerHTML = `

    <strong>
      ${escapeHTML(username)}
    </strong>

    <br>

    <small>
      ${online ? "🟢 Online" : "⚫ Offline"}
    </small>

  `;

  div.addEventListener("click", () => {

    openChat(uid, username);

  });

  usersList.appendChild(div);

}


// ==========================================
// SEARCH USERS
// ==========================================

searchUser.addEventListener(
  "input",
  async () => {

    const text =
      searchUser.value
        .trim()
        .toLowerCase();

    try {

      const snapshot =
        await db
          .collection("users")
          .get();

      usersList.innerHTML = "";

      snapshot.forEach((doc) => {

        const data = doc.data();

        if (
          auth.currentUser &&
          doc.id !== auth.currentUser.uid &&
          data.username &&
          data.username
            .toLowerCase()
            .includes(text)
        ) {

          createUserElement(
            doc.id,
            data.username,
            data.online
          );

        }

      });

    } catch (error) {

      console.error(
        "Search error:",
        error
      );

    }

  }
);


// ==========================================
// CHAT ID
// ==========================================

function getChatId(uid1, uid2) {

  return [uid1, uid2]
    .sort()
    .join("_");

}


// ==========================================
// OPEN PRIVATE CHAT
// ==========================================

function openChat(uid, username) {

  currentChatUser = {

    uid: uid,

    username: username

  };

  chatUser.textContent =
    "💬 " + username;

  messages.innerHTML = "";

  if (unsubscribeMessages) {

    unsubscribeMessages();

  }

  const chatId =
    getChatId(
      auth.currentUser.uid,
      uid
    );

  unsubscribeMessages =
    db
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot(
        (snapshot) => {

          messages.innerHTML = "";

          snapshot.forEach((doc) => {

            showMessage(doc.data());

          });

          messages.scrollTop =
            messages.scrollHeight;

        },
        (error) => {

          console.error(
            "Chat listener error:",
            error
          );

        }
      );

}


// ==========================================
// SEND MESSAGE
// ==========================================

messageForm.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const text =
      messageInput.value.trim();

    if (!text) return;

    if (!currentChatUser) {

      alert(
        "Please select a user first."
      );

      return;

    }

    const user =
      auth.currentUser;

    const chatId =
      getChatId(
        user.uid,
        currentChatUser.uid
      );

    messageInput.value = "";

    try {

      await db
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .add({

          senderId:
            user.uid,

          receiverId:
            currentChatUser.uid,

          text:
            text,

          createdAt:
            firebase.firestore.FieldValue
              .serverTimestamp(),

          read: false

        });

      await db
        .collection("chats")
        .doc(chatId)
        .set({

          members: [
            user.uid,
            currentChatUser.uid
          ],

          lastMessage:
            text,

          updatedAt:
            firebase.firestore.FieldValue
              .serverTimestamp()

        }, {

          merge: true

        });

    } catch (error) {

      console.error(
        "Message error:",
        error
      );

      alert(
        "Message failed: " +
        error.message
      );

    }

  }
);


// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(data) {

  const div =
    document.createElement("div");

  const isMe =
    data.senderId ===
    auth.currentUser.uid;

  div.className =
    "message " +
    (isMe ? "me" : "other");

  let time = "";

  if (data.createdAt) {

    time =
      data.createdAt
        .toDate()
        .toLocaleTimeString([], {

          hour: "2-digit",

          minute: "2-digit"

        });

  }

  div.innerHTML = `

    <div>
      ${escapeHTML(data.text || "")}
    </div>

    <span class="message-time">
      ${time}
    </span>

  `;

  messages.appendChild(div);

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}
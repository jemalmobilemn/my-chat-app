// ==========================================
// FIREBASE CONFIG
// ==========================================

const firebaseConfig = {

  apiKey: "YOUR_API_KEY",

  authDomain:
    "YOUR_PROJECT_ID.firebaseapp.com",

  projectId:
    "YOUR_PROJECT_ID",

  storageBucket:
    "YOUR_PROJECT_ID.firebasestorage.app",

  messagingSenderId:
    "YOUR_SENDER_ID",

  appId:
    "YOUR_APP_ID"
};


// Firebase Initialize

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

const db = firebase.firestore();


// ==========================================
// HTML ELEMENTS
// ==========================================

const authPage =
  document.getElementById("authPage");

const chatPage =
  document.getElementById("chatPage");

const usernameInput =
  document.getElementById("username");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const authBtn =
  document.getElementById("authBtn");

const switchAuth =
  document.getElementById("switchAuth");

const authTitle =
  document.getElementById("authTitle");

const authError =
  document.getElementById("authError");

const currentUser =
  document.getElementById("currentUser");

const logoutBtn =
  document.getElementById("logoutBtn");

const usersList =
  document.getElementById("usersList");

const searchUser =
  document.getElementById("searchUser");

const chatUser =
  document.getElementById("chatUser");

const messages =
  document.getElementById("messages");

const messageForm =
  document.getElementById("messageForm");

const messageInput =
  document.getElementById("messageInput");


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

    authTitle.textContent =
      "Create your account";

    authBtn.textContent =
      "Create Account";

    usernameInput.style.display =
      "block";

    switchAuth.textContent =
      "Already have an account? Login";

  } else {

    authTitle.textContent =
      "Login";

    authBtn.textContent =
      "Login";

    usernameInput.style.display =
      "none";

    switchAuth.textContent =
      "Create a new account";

  }

});


// ==========================================
// AUTH
// ==========================================

authBtn.addEventListener("click", async () => {

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value.trim();

  const username =
    usernameInput.value.trim();


  if (!email || !password) {

    authError.textContent =
      "Email and password are required.";

    return;
  }


  try {

    if (registerMode) {

      if (!username) {

        authError.textContent =
          "Username is required.";

        return;
      }


      // Create account

      const result =
        await auth.createUserWithEmailAndPassword(
          email,
          password
        );


      // Save user

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


    } else {

      // Login

      await auth.signInWithEmailAndPassword(
        email,
        password
      );

    }

  } catch (error) {

    console.error(error);

    authError.textContent =
      error.message;

  }

});


// ==========================================
// AUTH STATE
// ==========================================

auth.onAuthStateChanged(async (user) => {

  if (user) {

    authPage.classList.add("hidden");

    chatPage.classList.remove("hidden");


    const userDoc =
      await db
        .collection("users")
        .doc(user.uid)
        .get();


    if (userDoc.exists) {

      const data =
        userDoc.data();

      currentUser.textContent =
        "@" + data.username;

    }


    // Online

    await db
      .collection("users")
      .doc(user.uid)
      .update({

        online: true

      });


    loadUsers();

  } else {

    authPage.classList.remove("hidden");

    chatPage.classList.add("hidden");

  }

});


// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener("click", async () => {

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

});


// ==========================================
// LOAD USERS
// ==========================================

async function loadUsers() {

  usersList.innerHTML = "";

  const snapshot =
    await db
      .collection("users")
      .get();


  snapshot.forEach((doc) => {

    const data =
      doc.data();


    if (doc.id === auth.currentUser.uid) {
      return;
    }


    createUserElement(
      doc.id,
      data.username,
      data.online
    );

  });

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

  div.className =
    "user-item";


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


    const snapshot =
      await db
        .collection("users")
        .get();


    usersList.innerHTML = "";


    snapshot.forEach((doc) => {

      const data =
        doc.data();


      if (
        doc.id !== auth.currentUser.uid &&
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

  }
);


// ==========================================
// CREATE CHAT ID
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
      .onSnapshot((snapshot) => {

        messages.innerHTML = "";


        snapshot.forEach((doc) => {

          const data =
            doc.data();


          showMessage(data);

        });


        messages.scrollTop =
          messages.scrollHeight;

      });

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

      alert("Please select a user first.");

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


      // Save chat information

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

      console.error(error);

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

async function showMessage(data) {

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
      ${escapeHTML(data.text)}
    </div>

    <span class="message-time">
      ${time}
    </span>

  `;


  messages.appendChild(div);

}


// ==========================================
// SECURITY: ESCAPE HTML
// ==========================================

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}

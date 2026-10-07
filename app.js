import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  get,
  push,
  onValue,
  update
} from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";


// =======================================
// FIREBASE CONFIG
// =======================================

const firebaseConfig = {

  apiKey: "PASTE_YOUR_API_KEY_HERE",

  authDomain:
    "web-app-e909e.firebaseapp.com",

  databaseURL:
    "https://web-app-e909e-default-rtdb.firebaseio.com",

  projectId:
    "web-app-e909e",

  storageBucket:
    "web-app-e909e.firebasestorage.app",

  messagingSenderId:
    "305727313129",

  appId:
    "PASTE_YOUR_APP_ID_HERE"
};


// =======================================
// FIREBASE START
// =======================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


// =======================================
// ELEMENTS
// =======================================

const authSection =
  document.getElementById("authSection");

const appSection =
  document.getElementById("appSection");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const usernameInput =
  document.getElementById("username");

const authMessage =
  document.getElementById("authMessage");

const userStatus =
  document.getElementById("userStatus");


// =======================================
// SIGN UP
// =======================================

document
  .getElementById("signupBtn")
  .addEventListener("click", async () => {

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;

    const username =
      usernameInput.value.trim();

    if (!email || !password || !username) {

      authMessage.textContent =
        "Please fill all fields.";

      return;
    }

    if (password.length < 6) {

      authMessage.textContent =
        "Password must be at least 6 characters.";

      return;
    }

    try {

      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user =
        result.user;

      await set(
        ref(db, "users/" + user.uid),
        {
          uid: user.uid,

          name: username,

          username: username.toLowerCase(),

          email: email,

          online: true,

          lastSeen: Date.now()
        }
      );

      authMessage.textContent =
        "Account created successfully.";

    } catch (error) {

      authMessage.textContent =
        error.message;

    }
  });


// =======================================
// LOGIN
// =======================================

document
  .getElementById("loginBtn")
  .addEventListener("click", async () => {

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;

    if (!email || !password) {

      authMessage.textContent =
        "Enter email and password.";

      return;
    }

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      authMessage.textContent =
        "Login successful.";

    } catch (error) {

      authMessage.textContent =
        error.message;

    }
  });


// =======================================
// AUTH STATE
// =======================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (user) {

      authSection.style.display =
        "none";

      appSection.style.display =
        "block";

      userStatus.textContent =
        "🟢 " +
        (user.email || "Online");

      await update(
        ref(db, "users/" + user.uid),
        {
          online: true,
          lastSeen: Date.now()
        }
      );

    } else {

      authSection.style.display =
        "block";

      appSection.style.display =
        "none";

      userStatus.textContent =
        "Not signed in";
    }
  }
);


// =======================================
// LOGOUT
// =======================================

document
  .getElementById("logoutBtn")
  .addEventListener("click", async () => {

    if (auth.currentUser) {

      await update(
        ref(
          db,
          "users/" +
          auth.currentUser.uid
        ),
        {
          online: false,
          lastSeen: Date.now()
        }
      );
    }

    await signOut(auth);
  });


// =======================================
// FIND PEOPLE
// =======================================

const searchInput =
  document.getElementById("searchUser");

const userResults =
  document.getElementById("userResults");

searchInput.addEventListener(
  "input",
  async () => {

    const search =
      searchInput.value
        .trim()
        .toLowerCase();

    userResults.innerHTML = "";

    if (!search) return;

    const snapshot =
      await get(ref(db, "users"));

    if (!snapshot.exists()) {

      userResults.innerHTML =
        "<p>No users found.</p>";

      return;
    }

    const users =
      snapshot.val();

    let found = false;

    Object.values(users).forEach(
      (user) => {

        if (
          user.uid ===
          auth.currentUser?.uid
        ) {
          return;
        }

        const name =
          (user.name || "")
            .toLowerCase();

        const username =
          (user.username || "")
            .toLowerCase();

        if (
          name.includes(search) ||
          username.includes(search)
        ) {

          found = true;

          const div =
            document.createElement("div");

          div.className =
            "userResult";

          const nameText =
            document.createElement("strong");

          nameText.textContent =
            "👤 " +
            (user.name || "Bon User");

          const usernameText =
            document.createElement("small");

          usernameText.textContent =
            "@" +
            (user.username || "");

          const button =
            document.createElement("button");

          button.textContent =
            "Message";

          button.onclick = () =>
            openChat(user);

          div.appendChild(nameText);

          div.appendChild(usernameText);

          div.appendChild(button);

          userResults.appendChild(div);
        }
      }
    );

    if (!found) {

      userResults.innerHTML =
        "<p>No user found.</p>";
    }
  }
);


// =======================================
// OPEN CHAT
// =======================================

let selectedUser = null;

function openChat(user) {

  selectedUser = user;

  document.getElementById(
    "findPeople"
  ).style.display = "none";

  document.getElementById(
    "chatBox"
  ).style.display = "block";

  document.getElementById(
    "chatTitle"
  ).textContent =
    "💬 " +
    (user.name || "Bon User");

  loadMessages(user.uid);
}


// =======================================
// BACK
// =======================================

document
  .getElementById("backToUsers")
  .addEventListener(
    "click",
    () => {

      document.getElementById(
        "chatBox"
      ).style.display = "none";

      document.getElementById(
        "findPeople"
      ).style.display = "block";
    }
  );


// =======================================
// CHAT ID
// =======================================

function makeChatId(
  uid1,
  uid2
) {

  return [uid1, uid2]
    .sort()
    .join("_");
}


// =======================================
// SEND MESSAGE
// =======================================

document
  .getElementById("sendMessage")
  .addEventListener(
    "click",
    sendMessage
  );

async function sendMessage() {

  const input =
    document.getElementById(
      "messageText"
    );

  const text =
    input.value.trim();

  if (
    !text ||
    !auth.currentUser ||
    !selectedUser
  ) {
    return;
  }

  const chatId =
    makeChatId(
      auth.currentUser.uid,
      selectedUser.uid
    );

  const messageRef =
    push(
      ref(
        db,
        "chats/" +
        chatId +
        "/messages"
      )
    );

  await set(
    messageRef,
    {
      senderId:
        auth.currentUser.uid,

      receiverId:
        selectedUser.uid,

      text: text,

      timestamp:
        Date.now()
    }
  );

  input.value = "";
}


// =======================================
// LOAD MESSAGES
// =======================================

function loadMessages(
  otherUserId
) {

  const chatId =
    makeChatId(
      auth.currentUser.uid,
      otherUserId
    );

  const messagesBox =
    document.getElementById(
      "messages"
    );

  onValue(
    ref(
      db,
      "chats/" +
      chatId +
      "/messages"
    ),
    (snapshot) => {

      messagesBox.innerHTML = "";

      if (!snapshot.exists()) {
        return;
      }

      const messages =
        snapshot.val();

      Object.values(messages)
        .sort(
          (a, b) =>
            a.timestamp -
            b.timestamp
        )
        .forEach(
          (message) => {

            const div =
              document.createElement(
                "div"
              );

            div.className =
              message.senderId ===
              auth.currentUser.uid
                ? "myMessage"
                : "theirMessage";

            div.textContent =
              message.text;

            messagesBox.appendChild(
              div
            );
          }
        );

      messagesBox.scrollTop =
        messagesBox.scrollHeight;
    }
  );
}
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


// ===============================
// FIREBASE
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyCyosrarpVmlGQ-i7cQYNm_M15f2Vgu4CA",
  authDomain: "web-app-e909e.firebaseapp.com",
  databaseURL: "https://web-app-e909e-default-rtdb.firebaseio.com",
  projectId: "web-app-e909e",
  storageBucket: "web-app-e909e.firebasestorage.app",
  messagingSenderId: "305727313129",
  appId: "1:305727313129:web:10e682d5fac76c7fbf0c78",
  measurementId: "G-KD0GFDTWVZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);


// ===============================
// ELEMENTS
// ===============================

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const usernameInput = document.getElementById("username");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authMessage = document.getElementById("authMessage");
const userStatus = document.getElementById("userStatus");

const searchUser = document.getElementById("searchUser");
const userResults = document.getElementById("userResults");

const findPeople = document.getElementById("findPeople");
const chatBox = document.getElementById("chatBox");

const backToUsers = document.getElementById("backToUsers");
const chatTitle = document.getElementById("chatTitle");

const messages = document.getElementById("messages");
const messageText = document.getElementById("messageText");
const sendMessage = document.getElementById("sendMessage");

console.log("Bon Chat app.js loaded");


// ===============================
// SIGN UP
// ===============================

signupBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const username = usernameInput.value.trim();

  if (!email || !password || !username) {
    authMessage.textContent =
      "Please fill Email, Password and Username.";
    return;
  }

  if (password.length < 6) {
    authMessage.textContent =
      "Password must be at least 6 characters.";
    return;
  }

  try {

    authMessage.textContent = "Creating account...";

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = result.user;

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

    console.error(error);

    authMessage.textContent =
      friendlyError(error);
  }

});


// ===============================
// LOGIN
// ===============================

loginBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {

    authMessage.textContent =
      "Enter your email and password.";

    return;
  }

  try {

    authMessage.textContent =
      "Logging in...";

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    authMessage.textContent =
      "Login successful!";

  } catch (error) {

    console.error("LOGIN ERROR:", error);

    authMessage.textContent =
      friendlyError(error);
  }

});


// ===============================
// AUTH STATE
// ===============================

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      authSection.style.display = "block";
      appSection.style.display = "none";

      userStatus.textContent =
        "Not signed in";

      return;
    }

    authSection.style.display = "none";
    appSection.style.display = "block";

    userStatus.textContent =
      "🟢 " + user.email;

    await createUserProfile(user);

    await showAllUsers();
  }
);


// ===============================
// USER PROFILE
// ===============================

async function createUserProfile(user) {

  try {

    const userRef =
      ref(db, "users/" + user.uid);

    const snapshot =
      await get(userRef);

    if (!snapshot.exists()) {

      const name =
        user.email
          ? user.email.split("@")[0]
          : "Bon User";

      await set(
        userRef,
        {
          uid: user.uid,
          name: name,
          username: name.toLowerCase(),
          email: user.email || "",
          online: true,
          lastSeen: Date.now()
        }
      );

    } else {

      await update(
        userRef,
        {
          online: true,
          lastSeen: Date.now()
        }
      );
    }

  } catch (error) {

    console.error(
      "Profile error:",
      error
    );
  }
}


// ===============================
// LOGOUT
// ===============================

logoutBtn.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

    } catch (error) {

      console.error(error);

    }
  }
);


// ===============================
// SHOW USERS
// ===============================

async function showAllUsers() {

  try {

    const snapshot =
      await get(
        ref(db, "users")
      );

    userResults.innerHTML = "";

    if (!snapshot.exists()) {

      userResults.innerHTML =
        "<p>No users found.</p>";

      return;
    }

    const users =
      snapshot.val();

    const currentUid =
      auth.currentUser?.uid;

    let count = 0;

    Object.values(users).forEach(user => {

      if (!user) {
        return;
      }

      // የ UID ጉዳይ ካለ ከFirebase key እንዲወስድ
      if (!user.uid) {
        return;
      }

      if (user.uid === currentUid) {
        return;
      }

      addUser(user);

      count++;
    });

    if (count === 0) {

      userResults.innerHTML =
        "<p>No other users found yet.</p>";
    }

  } catch (error) {

    console.error(error);

    userResults.innerHTML =
      "<p>Could not load users.</p>";
  }
}


// ===============================
// ADD USER
// ===============================

function addUser(user) {

  if (!user || !user.uid) {

    console.error(
      "Invalid user:",
      user
    );

    return;
  }

  const div =
    document.createElement("div");

  div.className =
    "userResult";

  const info =
    document.createElement("div");

  info.className =
    "userInfo";

  const name =
    document.createElement("strong");

  name.textContent =
    "👤 " + (user.name || "Bon User");

  const username =
    document.createElement("small");

  username.textContent =
    "@" + (user.username || "");

  const status =
    document.createElement("span");

  status.className =
    user.online
      ? "online"
      : "offline";

  status.textContent =
    user.online
      ? "● Online"
      : "● Offline";

  info.appendChild(name);
  info.appendChild(username);
  info.appendChild(status);

  const button =
    document.createElement("button");

  button.textContent =
    "Message";

  button.onclick = () => {

    console.log(
      "Opening chat with:",
      user
    );

    if (!user.uid) {

      alert(
        "This user does not have a UID."
      );

      return;
    }

    openChat(user);
  };

  div.appendChild(info);
  div.appendChild(button);

  userResults.appendChild(div);
}


// ===============================
// SEARCH USERS
// ===============================

searchUser.addEventListener(
  "input",
  async () => {

    const text =
      searchUser.value
        .trim()
        .toLowerCase();

    if (!text) {

      await showAllUsers();

      return;
    }

    try {

      const snapshot =
        await get(
          ref(db, "users")
        );

      userResults.innerHTML = "";

      if (!snapshot.exists()) {

        userResults.innerHTML =
          "<p>No user found.</p>";

        return;
      }

      const users =
        snapshot.val();

      const currentUid =
        auth.currentUser?.uid;

      let found = 0;

      Object.values(users).forEach(user => {

        if (!user || !user.uid) {
          return;
        }

        if (user.uid === currentUid) {
          return;
        }

        const name =
          (user.name || "")
            .toLowerCase();

        const username =
          (user.username || "")
            .toLowerCase();

        const email =
          (user.email || "")
            .toLowerCase();

        if (
          name.includes(text) ||
          username.includes(text) ||
          email.includes(text)
        ) {

          addUser(user);

          found++;
        }

      });

      if (found === 0) {

        userResults.innerHTML =
          "<p>No user found.</p>";
      }

    } catch (error) {

      console.error(error);

      userResults.innerHTML =
        "<p>Search failed.</p>";
    }

  }
);


// ===============================
// OPEN CHAT
// ===============================

let selectedUser = null;
let stopMessages = null;

function openChat(user) {

  if (!user || !user.uid) {

    alert(
      "Cannot open chat: user UID is missing."
    );

    return;
  }

  selectedUser = {
    uid: user.uid,
    name: user.name || "Bon User",
    username: user.username || "",
    email: user.email || ""
  };

  console.log(
    "Selected user:",
    selectedUser
  );

  findPeople.style.display = "none";
  chatBox.style.display = "block";

  chatTitle.textContent =
    "💬 " + selectedUser.name;

  loadMessages(
    selectedUser.uid
  );
}


// ===============================
// BACK
// ===============================

backToUsers.onclick =
  async () => {

    chatBox.style.display =
      "none";

    findPeople.style.display =
      "block";

    selectedUser =
      null;

    if (stopMessages) {

      stopMessages();

      stopMessages = null;
    }

    messages.innerHTML =
      "";

    await showAllUsers();
  };


// ===============================
// CHAT ID
// ===============================

function getChatId(uid1, uid2) {

  if (!uid1 || !uid2) {
    return null;
  }

  return [uid1, uid2]
    .sort()
    .join("_");
}


// ===============================
// SEND MESSAGE
// ===============================

sendMessage.onclick =
  sendNewMessage;

messageText.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      event.preventDefault();

      sendNewMessage();
    }
  }
);


async function sendNewMessage() {

  const text =
    messageText.value.trim();

  const currentUser =
    auth.currentUser;

  if (!text) {
    return;
  }

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;
  }

  if (!selectedUser) {

    alert(
      "Please select a user first."
    );

    return;
  }

  if (!selectedUser.uid) {

    console.error(
      "Selected user:",
      selectedUser
    );

    alert(
      "The selected user has no UID."
    );

    return;
  }

  const chatId =
    getChatId(
      currentUser.uid,
      selectedUser.uid
    );

  if (!chatId) {

    alert(
      "Could not create chat ID."
    );

    return;
  }

  try {

    const messageRef =
      push(
        ref(
          db,
          "chats/" +
          chatId +
          "/messages"
        )
      );

    const messageData = {
      senderId: currentUser.uid,
      receiverId: selectedUser.uid,
      text: text,
      timestamp: Date.now()
    };

    console.log(
      "Sending message:",
      messageData
    );

    await set(
      messageRef,
      messageData
    );

    messageText.value = "";

  } catch (error) {

    console.error(
      "SEND MESSAGE ERROR:",
      error
    );

    alert(
      friendlyError(error)
    );
  }
}


// ===============================
// LOAD MESSAGES
// ===============================

function loadMessages(otherUid) {

  const currentUser =
    auth.currentUser;

  if (!currentUser || !otherUid) {
    return;
  }

  if (stopMessages) {

    stopMessages();

    stopMessages = null;
  }

  const chatId =
    getChatId(
      currentUser.uid,
      otherUid
    );

  if (!chatId) {
    return;
  }

  messages.innerHTML =
    "<p class='emptyMessages'>Loading messages...</p>";

  stopMessages =
    onValue(
      ref(
        db,
        "chats/" +
        chatId +
        "/messages"
      ),

      snapshot => {

        messages.innerHTML = "";

        if (!snapshot.exists()) {

          messages.innerHTML =
            "<p class='emptyMessages'>No messages yet. Say hello 👋</p>";

          return;
        }

        const data =
          snapshot.val();

        const list =
          Object.values(data)
            .filter(message =>
              message &&
              message.senderId &&
              message.receiverId
            )
            .sort(
              (a, b) =>
                (a.timestamp || 0) -
                (b.timestamp || 0)
            );

        list.forEach(message => {

          const div =
            document.createElement(
              "div"
            );

          div.className =
            message.senderId ===
            currentUser.uid
              ? "myMessage"
              : "theirMessage";

          div.textContent =
            message.text || "";

          messages.appendChild(div);
        });

        messages.scrollTop =
          messages.scrollHeight;
      },

      error => {

        console.error(
          "Chat error:",
          error
        );

        messages.innerHTML =
          "<p class='emptyMessages'>Could not load messages.</p>";
      }
    );
}


// ===============================
// ERRORS
// ===============================

function friendlyError(error) {

  const code =
    error?.code || "";

  if (
    code ===
    "auth/email-already-in-use"
  ) {
    return "This email is already registered.";
  }

  if (
    code ===
    "auth/invalid-email"
  ) {
    return "Invalid email address.";
  }

  if (
    code ===
    "auth/weak-password"
  ) {
    return "Password must be at least 6 characters.";
  }

  if (
    code ===
    "auth/invalid-credential"
  ) {
    return "Incorrect email or password.";
  }

  if (
    code ===
    "auth/user-not-found"
  ) {
    return "User not found.";
  }

  if (
    code ===
    "auth/wrong-password"
  ) {
    return "Incorrect password.";
  }

  if (
    code ===
    "auth/too-many-requests"
  ) {
    return "Too many attempts. Try again later.";
  }

  if (
    code ===
    "auth/api-key-not-valid"
  ) {
    return "Firebase API key is not valid.";
  }

  if (
    code ===
    "PERMISSION_DENIED"
  ) {
    return "Database permission denied. Check Firebase Rules.";
  }

  return (
    error?.message ||
    "Something went wrong."
  );
}

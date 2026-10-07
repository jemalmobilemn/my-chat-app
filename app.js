alert("BON CHAT APP.JS IS WORKING!");

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";import { initializeApp } from
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
  update,
  remove
} from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";


// ======================================
// FIREBASE
// ======================================

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


// ======================================
// ELEMENTS
// ======================================

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const usernameInput = document.getElementById("username");
const phoneInput = document.getElementById("phone");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authMessage = document.getElementById("authMessage");
const userStatus = document.getElementById("userStatus");

const searchUser = document.getElementById("searchUser");
const searchBtn = document.getElementById("searchBtn");
const userResults = document.getElementById("userResults");

const friendRequests = document.getElementById("friendRequests");
const friendsList = document.getElementById("friendsList");

const findPeople = document.getElementById("findPeople");
const requestsSection = document.getElementById("requestsSection");
const friendsSection = document.getElementById("friendsSection");

const chatBox = document.getElementById("chatBox");
const backToUsers = document.getElementById("backToUsers");
const chatTitle = document.getElementById("chatTitle");

const messages = document.getElementById("messages");
const messageText = document.getElementById("messageText");
const sendMessage = document.getElementById("sendMessage");


// ======================================
// VARIABLES
// ======================================

let selectedUser = null;
let stopMessages = null;
let stopRequests = null;
let stopFriends = null;


// ======================================
// PHONE FORMAT
// ======================================

function normalizePhone(phone) {

  let value = String(phone || "").trim();

  value = value.replace(/\s+/g, "");

  if (value.startsWith("09")) {
    value = "+251" + value.substring(1);
  }

  if (value.startsWith("9") && !value.startsWith("+")) {
    value = "+251" + value;
  }

  return value;
}


// ======================================
// SIGN UP
// ======================================

signupBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const username = usernameInput.value.trim();
  const phone = normalizePhone(phoneInput.value);

  if (!email || !password || !username || !phone) {

    authMessage.textContent =
      "Please fill Email, Password, Username and Phone Number.";

    return;
  }

  if (!phone.startsWith("+251")) {

    authMessage.textContent =
      "Phone number must use +251 format.";

    return;
  }

  if (password.length < 6) {

    authMessage.textContent =
      "Password must be at least 6 characters.";

    return;
  }

  try {

    authMessage.textContent =
      "Creating account...";

    // Check phone number
    const phoneSnapshot =
      await get(ref(db, "phoneIndex/" + phone.replace("+", "")));

    if (phoneSnapshot.exists()) {

      authMessage.textContent =
        "This phone number is already registered.";

      return;
    }

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = result.user;

    // User profile
    await set(
      ref(db, "users/" + user.uid),
      {
        uid: user.uid,
        name: username,
        username: username.toLowerCase(),
        email: email,
        phone: phone,
        online: true,
        lastSeen: Date.now()
      }
    );

    // Phone → UID
    await set(
      ref(
        db,
        "phoneIndex/" + phone.replace("+", "")
      ),
      user.uid
    );

    authMessage.textContent =
      "Account created successfully.";

  } catch (error) {

    console.error(error);

    authMessage.textContent =
      friendlyError(error);
  }

});


// ======================================
// LOGIN
// ======================================

loginBtn.addEventListener("click", async () => {

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;

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

  } catch (error) {

    console.error(error);

    authMessage.textContent =
      friendlyError(error);
  }

});


// ======================================
// AUTH STATE
// ======================================

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

    listenFriendRequests();

    listenFriends();
  }
);


// ======================================
// CREATE / UPDATE PROFILE
// ======================================

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
          phone: "",
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


// ======================================
// LOGOUT
// ======================================

logoutBtn.addEventListener(
  "click",
  async () => {

    try {

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

    } catch (error) {

      console.error(error);
    }
  }
);


// ======================================
// FIND USER BY PHONE
// ======================================

searchBtn.addEventListener(
  "click",
  searchForUser
);

searchUser.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      event.preventDefault();

      searchForUser();
    }
  }
);


async function searchForUser() {

  const phone =
    normalizePhone(
      searchUser.value
    );

  if (!phone) {

    userResults.innerHTML =
      "<p>Enter a phone number.</p>";

    return;
  }

  userResults.innerHTML =
    "<p>Searching...</p>";

  try {

    const phoneKey =
      phone.replace("+", "");

    const phoneSnapshot =
      await get(
        ref(
          db,
          "phoneIndex/" + phoneKey
        )
      );

    if (!phoneSnapshot.exists()) {

      userResults.innerHTML =
        "<p>❌ No Bon Chat user found with this number.</p>";

      return;
    }

    const uid =
      phoneSnapshot.val();

    const currentUid =
      auth.currentUser?.uid;

    if (uid === currentUid) {

      userResults.innerHTML =
        "<p>This is your own account.</p>";

      return;
    }

    const userSnapshot =
      await get(
        ref(
          db,
          "users/" + uid
        )
      );

    if (!userSnapshot.exists()) {

      userResults.innerHTML =
        "<p>User profile not found.</p>";

      return;
    }

    const user =
      userSnapshot.val();

    showSearchResult(user);

  } catch (error) {

    console.error(error);

    userResults.innerHTML =
      "<p>Search failed.</p>";
  }
}


// ======================================
// SHOW SEARCH RESULT
// ======================================

async function showSearchResult(user) {

  userResults.innerHTML = "";

  const div =
    document.createElement("div");

  div.className =
    "userResult";

  const info =
    document.createElement("div");

  info.className =
    "userInfo";

  info.innerHTML =
    `
      <strong>👤 ${escapeHTML(user.name || "Bon User")}</strong>
      <small>${escapeHTML(user.phone || "")}</small>
    `;

  const button =
    document.createElement("button");

  button.textContent =
    "Checking...";

  div.appendChild(info);
  div.appendChild(button);

  userResults.appendChild(div);

  const currentUid =
    auth.currentUser.uid;

  const friendSnapshot =
    await get(
      ref(
        db,
        "friends/" +
        currentUid +
        "/" +
        user.uid
      )
    );

  const sentSnapshot =
    await get(
      ref(
        db,
        "friendRequests/" +
        user.uid +
        "/" +
        currentUid
      )
    );

  const receivedSnapshot =
    await get(
      ref(
        db,
        "friendRequests/" +
        currentUid +
        "/" +
        user.uid
      )
    );

  if (friendSnapshot.exists()) {

    button.textContent =
      "💬 Chat";

    button.onclick =
      () => openChat(user);

    return;
  }

  if (sentSnapshot.exists()) {

    button.textContent =
      "✓ Request Sent";

    button.disabled =
      true;

    return;
  }

  if (receivedSnapshot.exists()) {

    button.textContent =
      "🔔 Accept Request";

    button.onclick =
      () => acceptFriendRequest(user.uid);

    return;
  }

  button.textContent =
    "➕ Add Friend";

  button.onclick =
    () => sendFriendRequest(user);
}


// ======================================
// ADD FRIEND
// ======================================

async function sendFriendRequest(user) {

  const currentUser =
    auth.currentUser;

  if (!currentUser || !user?.uid) {
    return;
  }

  try {

    const requestRef =
      ref(
        db,
        "friendRequests/" +
        user.uid +
        "/" +
        currentUser.uid
      );

    await set(
      requestRef,
      {
        fromUid:
          currentUser.uid,

        fromEmail:
          currentUser.email || "",

        timestamp:
          Date.now(),

        status:
          "pending"
      }
    );

    alert(
      "Friend request sent successfully! ✅"
    );

    await showSearchResult(user);

  } catch (error) {

    console.error(error);

    alert(
      friendlyError(error)
    );
  }
}


// ======================================
// FRIEND REQUESTS
// ======================================

function listenFriendRequests() {

  const currentUser =
    auth.currentUser;

  if (!currentUser) {
    return;
  }

  if (stopRequests) {
    stopRequests();
  }

  stopRequests =
    onValue(
      ref(
        db,
        "friendRequests/" +
        currentUser.uid
      ),

      async snapshot => {

        friendRequests.innerHTML = "";

        if (!snapshot.exists()) {

          friendRequests.innerHTML =
            "<p>No friend requests.</p>";

          return;
        }

        const requests =
          snapshot.val();

        let count = 0;

        for (
          const requestUid in requests
        ) {

          const request =
            requests[requestUid];

          if (
            !request ||
            request.status !== "pending"
          ) {
            continue;
          }

          count++;

          const userSnapshot =
            await get(
              ref(
                db,
                "users/" +
                requestUid
              )
            );

          if (!userSnapshot.exists()) {
            continue;
          }

          const user =
            userSnapshot.val();

          addRequest(user);
        }

        if (count === 0) {

          friendRequests.innerHTML =
            "<p>No friend requests.</p>";
        }
      }
    );
}


// ======================================
// ADD REQUEST UI
// ======================================

function addRequest(user) {

  const div =
    document.createElement("div");

  div.className =
    "userResult";

  const info =
    document.createElement("div");

  info.className =
    "userInfo";

  info.innerHTML =
    `
      <strong>👤 ${escapeHTML(user.name || "Bon User")}</strong>
      <small>${escapeHTML(user.phone || "")}</small>
    `;

  const accept =
    document.createElement("button");

  accept.textContent =
    "Accept";

  accept.onclick =
    () => acceptFriendRequest(user.uid);

  const reject =
    document.createElement("button");

  reject.textContent =
    "Reject";

  reject.style.background =
    "#d32f2f";

  reject.onclick =
    () => rejectFriendRequest(user.uid);

  div.appendChild(info);
  div.appendChild(accept);
  div.appendChild(reject);

  friendRequests.appendChild(div);
}


// ======================================
// ACCEPT FRIEND
// ======================================

async function acceptFriendRequest(otherUid) {

  const currentUser =
    auth.currentUser;

  if (!currentUser || !otherUid) {
    return;
  }

  try {

    await set(
      ref(
        db,
        "friends/" +
        currentUser.uid +
        "/" +
        otherUid
      ),
      {
        uid: otherUid,
        since: Date.now()
      }
    );

    await set(
      ref(
        db,
        "friends/" +
        otherUid +
        "/" +
        currentUser.uid
      ),
      {
        uid: currentUser.uid,
        since: Date.now()
      }
    );

    await remove(
      ref(
        db,
        "friendRequests/" +
        currentUser.uid +
        "/" +
        otherUid
      )
    );

    alert(
      "Friend added successfully! 🎉"
    );

  } catch (error) {

    console.error(error);

    alert(
      friendlyError(error)
    );
  }
}


// ======================================
// REJECT REQUEST
// ======================================

async function rejectFriendRequest(otherUid) {

  const currentUser =
    auth.currentUser;

  if (!currentUser || !otherUid) {
    return;
  }

  try {

    await remove(
      ref(
        db,
        "friendRequests/" +
        currentUser.uid +
        "/" +
        otherUid
      )
    );

  } catch (error) {

    console.error(error);
  }
}


// ======================================
// FRIENDS
// ======================================

function listenFriends() {

  const currentUser =
    auth.currentUser;

  if (!currentUser) {
    return;
  }

  if (stopFriends) {
    stopFriends();
  }

  stopFriends =
    onValue(
      ref(
        db,
        "friends/" +
        currentUser.uid
      ),

      async snapshot => {

        friendsList.innerHTML = "";

        if (!snapshot.exists()) {

          friendsList.innerHTML =
            "<p>No friends yet.</p>";

          return;
        }

        const friends =
          snapshot.val();

        let count = 0;

        for (
          const friendUid in friends
        ) {

          const userSnapshot =
            await get(
              ref(
                db,
                "users/" +
                friendUid
              )
            );

          if (!userSnapshot.exists()) {
            continue;
          }

          const user =
            userSnapshot.val();

          addFriend(user);

          count++;
        }

        if (count === 0) {

          friendsList.innerHTML =
            "<p>No friends yet.</p>";
        }
      }
    );
}


// ======================================
// ADD FRIEND UI
// ======================================

function addFriend(user) {

  const div =
    document.createElement("div");

  div.className =
    "userResult";

  const info =
    document.createElement("div");

  info.className =
    "userInfo";

  info.innerHTML =
    `
      <strong>👤 ${escapeHTML(user.name || "Bon User")}</strong>
      <small>${escapeHTML(user.phone || "")}</small>
    `;

  const button =
    document.createElement("button");

  button.textContent =
    "💬 Chat";

  button.onclick =
    () => openChat(user);

  div.appendChild(info);
  div.appendChild(button);

  friendsList.appendChild(div);
}


// ======================================
// OPEN CHAT
// ======================================

function openChat(user) {

  if (!user || !user.uid) {

    alert(
      "Cannot open chat."
    );

    return;
  }

  selectedUser = {
    uid: user.uid,
    name: user.name || "Bon User",
    phone: user.phone || ""
  };

  findPeople.style.display =
    "none";

  requestsSection.style.display =
    "none";

  friendsSection.style.display =
    "none";

  chatBox.style.display =
    "block";

  chatTitle.textContent =
    "💬 " + selectedUser.name;

  loadMessages(
    selectedUser.uid
  );
}


// ======================================
// BACK TO FRIENDS
// ======================================

backToUsers.onclick =
  async () => {

    chatBox.style.display =
      "none";

    findPeople.style.display =
      "block";

    requestsSection.style.display =
      "block";

    friendsSection.style.display =
      "block";

    selectedUser =
      null;

    if (stopMessages) {

      stopMessages();

      stopMessages =
        null;
    }

    messages.innerHTML =
      "";
  };


// ======================================
// CHAT ID
// ======================================

function getChatId(uid1, uid2) {

  if (!uid1 || !uid2) {
    return null;
  }

  return [uid1, uid2]
    .sort()
    .join("_");
}


// ======================================
// SEND MESSAGE
// ======================================

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

  if (!text ||
      !currentUser ||
      !selectedUser ||
      !selectedUser.uid) {
    return;
  }

  try {

    const chatId =
      getChatId(
        currentUser.uid,
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
          currentUser.uid,

        receiverId:
          selectedUser.uid,

        text:
          text,

        timestamp:
          Date.now()
      }
    );

    messageText.value =
      "";

  } catch (error) {

    console.error(error);

    alert(
      friendlyError(error)
    );
  }
}


// ======================================
// LOAD MESSAGES
// ======================================

function loadMessages(otherUid) {

  const currentUser =
    auth.currentUser;

  if (!currentUser || !otherUid) {
    return;
  }

  if (stopMessages) {

    stopMessages();

    stopMessages =
      null;
  }

  const chatId =
    getChatId(
      currentUser.uid,
      otherUid
    );

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

        messages.innerHTML =
          "";

        if (!snapshot.exists()) {

          messages.innerHTML =
            "<p class='emptyMessages'>No messages yet. Say hello 👋</p>";

          return;
        }

        const data =
          snapshot.val();

        const list =
          Object.values(data)
            .filter(
              message =>
                message &&
                message.senderId &&
                message.receiverId
            )
            .sort(
              (a, b) =>
                (a.timestamp || 0) -
                (b.timestamp || 0)
            );

        list.forEach(
          message => {

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
          }
        );

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


// ======================================
// SHOW ALL USERS
// ======================================

async function showAllUsers() {

  // Find People now works through phone search.
  userResults.innerHTML =
    "<p>Search using a phone number.</p>";
}


// ======================================
// SECURITY
// ======================================

function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ======================================
// ERRORS
// ======================================

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
   

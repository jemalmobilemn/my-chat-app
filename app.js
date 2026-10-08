// ======================================
// BON CHAT - APP.JS (FIXED)
// ======================================

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
  update,
  remove
} from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";


// ======================================
// FIREBASE CONFIG
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


// ======================================
// INITIALIZE FIREBASE
// ======================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);


// ======================================
// HTML ELEMENTS
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
const importContactsBtn = document.getElementById("importContactsBtn");

const friendRequests = document.getElementById("friendRequests");
const friendsList = document.getElementById("friendsList");

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
// HELPER FUNCTIONS
// ======================================

function escapeHTML(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizePhone(phone) {
  let value = String(phone || "").trim();
  value = value.replace(/\s+/g, "");

  if (value.startsWith("09") || value.startsWith("07")) {
    value = "+251" + value.substring(1);
  } else if ((value.startsWith("9") || value.startsWith("7")) && !value.startsWith("+")) {
    value = "+251" + value;
  }

  return value;
}

function friendlyError(error) {
  const code = error?.code || "";

  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/user-not-found":
      return "User not found.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "PERMISSION_DENIED":
      return "Firebase Database permission denied.";
    default:
      return error?.message || "Something went wrong.";
  }
}


// ======================================
// SIGN UP (FIXED)
// ======================================

signupBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const username = usernameInput.value.trim();
  const rawPhone = phoneInput.value.trim();
  const phone = normalizePhone(rawPhone);

  if (!email || !password || !username || !rawPhone) {
    authMessage.textContent = "Please fill Email, Password, Username and Phone Number.";
    return;
  }

  if (!phone.startsWith("+251")) {
    authMessage.textContent = "Phone number must start with 09 or 07 (+251).";
    return;
  }

  if (phone.length !== 13) {
    authMessage.textContent = "Enter a valid Ethiopian phone number.";
    return;
  }

  if (password.length < 6) {
    authMessage.textContent = "Password must be at least 6 characters.";
    return;
  }

  try {
    authMessage.textContent = "Creating account...";
    const phoneKey = phone.replace("+", "");

    const phoneSnapshot = await get(ref(db, "phoneIndex/" + phoneKey));

    if (phoneSnapshot.exists()) {
      authMessage.textContent = "This phone number is already registered.";
      return;
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Save user profile with full details
    await set(ref(db, "users/" + user.uid), {
      uid: user.uid,
      name: username,
      username: username.toLowerCase(),
      email: email,
      phone: phone,
      online: true,
      lastSeen: Date.now()
    });

    await set(ref(db, "phoneIndex/" + phoneKey), user.uid);

    authMessage.textContent = "Account created successfully! ✅";

  } catch (error) {
    console.error("SIGN UP ERROR:", error);
    authMessage.textContent = friendlyError(error);
  }
});


// ======================================
// LOGIN
// ======================================

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    authMessage.textContent = "Enter your email and password.";
    return;
  }

  try {
    authMessage.textContent = "Logging in...";
    await signInWithEmailAndPassword(auth, email, password);
    authMessage.textContent = "Login successful! ✅";
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    authMessage.textContent = friendlyError(error);
  }
});


// ======================================
// AUTH STATE
// ======================================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    authSection.style.display = "block";
    appSection.style.display = "none";
    userStatus.textContent = "Not signed in";

    if (stopRequests) { stopRequests(); stopRequests = null; }
    if (stopFriends) { stopFriends(); stopFriends = null; }
    if (stopMessages) { stopMessages(); stopMessages = null; }

    return;
  }

  authSection.style.display = "none";
  appSection.style.display = "block";
  userStatus.textContent = "🟢 " + (user.email || "User");

  await createUserProfile(user);
  listenFriendRequests();
  listenFriends();
});


// ======================================
// CREATE / UPDATE PROFILE (FIXED)
// ======================================

async function createUserProfile(user) {
  try {
    const userRef = ref(db, "users/" + user.uid);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      const fallbackName = user.email ? user.email.split("@")[0] : "Bon User";
      await set(userRef, {
        uid: user.uid,
        name: fallbackName,
        username: fallbackName.toLowerCase(),
        email: user.email || "",
        phone: "",
        online: true,
        lastSeen: Date.now()
      });
    } else {
      await update(userRef, {
        online: true,
        lastSeen: Date.now()
      });
    }
  } catch (error) {
    console.error("PROFILE ERROR:", error);
  }
}


// ======================================
// LOGOUT
// ======================================

logoutBtn.addEventListener("click", async () => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await update(ref(db, "users/" + currentUser.uid), {
        online: false,
        lastSeen: Date.now()
      });
    }
    await signOut(auth);
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
  }
});


// ======================================
// SEARCH LISTENERS
// ======================================

searchBtn.addEventListener("click", searchForUser);

searchUser.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchForUser();
  }
});


// ======================================
// SEARCH USER BY NAME OR PHONE
// ======================================

async function searchForUser() {
  const query = searchUser.value.trim().toLowerCase();

  if (!query) {
    userResults.innerHTML = "<p>Enter a name or phone number.</p>";
    return;
  }

  userResults.innerHTML = "<p>🔍 Searching...</p>";

  try {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return;

    const usersSnapshot = await get(ref(db, "users"));
    
    if (!usersSnapshot.exists()) {
      userResults.innerHTML = "<p>❌ No users found in database.</p>";
      return;
    }

    const allUsers = usersSnapshot.val();
    const matchedUsers = [];

    Object.keys(allUsers).forEach((uid) => {
      if (uid === currentUid) return;

      const u = allUsers[uid];
      const name = (u.name || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      const phone = (u.phone || "");

      if (
        name.includes(query) ||
        username.includes(query) ||
        phone.includes(query)
      ) {
        matchedUsers.push(u);
      }
    });

    if (matchedUsers.length === 0) {
      userResults.innerHTML = "<p>❌ No Bon Chat user found.</p>";
      return;
    }

    userResults.innerHTML = "";
    matchedUsers.forEach((u) => {
      showSearchResult(u);
    });

  } catch (error) {
    console.error("SEARCH ERROR:", error);
    userResults.innerHTML = "<p>Search failed: " + escapeHTML(friendlyError(error)) + "</p>";
  }
}


// ======================================
// SEARCH RESULT WITH ADD FRIEND BUTTON
// ======================================

async function showSearchResult(user) {
  const div = document.createElement("div");
  div.className = "userResult";

  const info = document.createElement("div");
  info.className = "userInfo";
  info.innerHTML = `
    <strong>👤 ${escapeHTML(user.name || "Bon User")}</strong>
    <small>${escapeHTML(user.phone || "")}</small>
  `;

  const button = document.createElement("button");
  button.textContent = "Checking...";

  div.appendChild(info);
  div.appendChild(button);
  userResults.appendChild(div);

  const currentUid = auth.currentUser?.uid;
  if (!currentUid || !user.uid) return;

  const friendSnapshot = await get(ref(db, "friends/" + currentUid + "/" + user.uid));
  if (friendSnapshot.exists()) {
    button.textContent = "💬 Chat";
    button.onclick = () => openChat(user);
    return;
  }

  const sentSnapshot = await get(ref(db, "friendRequests/" + user.uid + "/" + currentUid));
  if (sentSnapshot.exists()) {
    button.textContent = "✓ Request Sent";
    button.disabled = true;
    return;
  }

  const receivedSnapshot = await get(ref(db, "friendRequests/" + currentUid + "/" + user.uid));
  if (receivedSnapshot.exists()) {
    button.textContent = "🔔 Accept Request";
    button.onclick = () => acceptFriendRequest(user.uid);
    return;
  }

  button.textContent = "➕ Add Friend";
  button.onclick = async () => {
    button.disabled = true;
    button.textContent = "Sending...";
    await sendFriendRequest(user);
  };
}


// ======================================
// SEND FRIEND REQUEST
// ======================================

async function sendFriendRequest(user) {
  const currentUser = auth.currentUser;

  if (!currentUser || !user || !user.uid) {
    alert("User information is missing.");
    return;
  }

  try {
    await set(ref(db, "friendRequests/" + user.uid + "/" + currentUser.uid), {
      fromUid: currentUser.uid,
      timestamp: Date.now(),
      status: "pending"
    });

    alert("Friend request sent successfully! ✅");
    userResults.innerHTML = "";
    await showSearchResult(user);

  } catch (error) {
    console.error("REQUEST ERROR:", error);
    alert(friendlyError(error));
  }
}


// ======================================
// LISTEN FRIEND REQUESTS
// ======================================

function listenFriendRequests() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  if (stopRequests) stopRequests();

  stopRequests = onValue(ref(db, "friendRequests/" + currentUser.uid), async (snapshot) => {
    friendRequests.innerHTML = "";

    if (!snapshot.exists()) {
      friendRequests.innerHTML = "<p>No friend requests.</p>";
      return;
    }

    const requests = snapshot.val();
    let count = 0;

    for (const requestUid in requests) {
      const request = requests[requestUid];
      if (!request || request.status !== "pending") continue;

      count++;
      const userSnapshot = await get(ref(db, "users/" + requestUid));
      
      const user = userSnapshot.exists() 
        ? userSnapshot.val() 
        : { uid: requestUid, name: "Bon User", phone: "" };

      addRequest(user);
    }

    if (count === 0) {
      friendRequests.innerHTML = "<p>No friend requests.</p>";
    }
  });
}


// ======================================
// REQUEST UI
// ======================================

function addRequest(user) {
  const div = document.createElement("div");
  div.className = "userResult";

  const info = document.createElement("div");
  info.className = "userInfo";
  info.innerHTML = `
    <strong>👤 ${escapeHTML(user.name || "Bon User")}</strong>
    <small>${escapeHTML(user.phone || "")}</small>
  `;

  const accept = document.createElement("button");
  accept.textContent = "Accept";
  accept.onclick = () => acceptFriendRequest(user.uid);

  const reject = document.createElement("button");
  reject.textContent = "Reject";
  reject.style.background = "#d32f2f";
  reject.onclick = () => rejectFriendRequest(user.uid);

  div.appendChild(info);
  div.appendChild(accept);
  div.appendChild(reject);

  friendRequests.appendChild(div);
}


// ======================================
// ACCEPT FRIEND REQUEST (FIXED)
// ======================================

async function acceptFriendRequest(requesterUid) {
  const currentUser = auth.currentUser;
  if (!currentUser || !requesterUid) return;

  try {
    // 1. Get Requester Info
    const requesterSnapshot = await get(ref(db, "users/" + requesterUid));
    const requester = requesterSnapshot.exists()
      ? requesterSnapshot.val()
      : { uid: requesterUid, name: "Bon User", phone: "" };

    // 2. Get My Info
    const mySnapshot = await get(ref(db, "users/" + currentUser.uid));
    const myProfile = mySnapshot.exists()
      ? mySnapshot.val()
      : { uid: currentUser.uid, name: currentUser.email ? currentUser.email.split("@")[0] : "Bon User", phone: "" };

    const friendshipDataForMe = {
      uid: requesterUid,
      name: requester.name || "Bon User",
      phone: requester.phone || "",
      email: requester.email || "",
      since: Date.now()
    };

    const friendshipDataForRequester = {
      uid: currentUser.uid,
      name: myProfile.name || "Bon User",
      phone: myProfile.phone || "",
      email: myProfile.email || "",
      since: Date.now()
    };

    // 3. Save Both Friendships
    await set(ref(db, "friends/" + currentUser.uid + "/" + requesterUid), friendshipDataForMe);
    await set(ref(db, "friends/" + requesterUid + "/" + currentUser.uid), friendshipDataForRequester);

    // 4. Remove Request
    await remove(ref(db, "friendRequests/" + currentUser.uid + "/" + requesterUid));

    alert("Friend request accepted! ✅");

  } catch (error) {
    console.error("ACCEPT ERROR:", error);
    alert(friendlyError(error));
  }
}


// ======================================
// REJECT FRIEND REQUEST
// ======================================

async function rejectFriendRequest(requesterUid) {
  const currentUser = auth.currentUser;
  if (!currentUser || !requesterUid) return;

  try {
    await remove(ref(db, "friendRequests/" + currentUser.uid + "/" + requesterUid));
    alert("Friend request rejected.");
  } catch (error) {
    console.error("REJECT ERROR:", error);
    alert(friendlyError(error));
  }
}


// ======================================
// LISTEN FRIENDS
// ======================================

function listenFriends() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  if (stopFriends) stopFriends();

  stopFriends = onValue(ref(db, "friends/" + currentUser.uid), (snapshot) => {
    friendsList.innerHTML = "";

    if (!snapshot.exists()) {
      friendsList.innerHTML = "<p>No friends yet.</p>";
      return;
    }

    const friends = snapshot.val();
    let count = 0;

    Object.keys(friends).forEach((friendUid) => {
      const friend = friends[friendUid];
      if (!friend) return;

      count++;
      addFriendToList(friend);
    });

    if (count === 0) {
      friendsList.innerHTML = "<p>No friends yet.</p>";
    }
  });
}


// ======================================
// FRIEND UI
// ======================================

function addFriendToList(friend) {
  const div = document.createElement("div");
  div.className = "userResult";

  const info = document.createElement("div");
  info.className = "userInfo";
  info.innerHTML = `
    <strong>👤 ${escapeHTML(friend.name || "Bon User")}</strong>
    <small>${escapeHTML(friend.phone || "")}</small>
  `;

  const button = document.createElement("button");
  button.textContent = "💬 Chat";
  button.onclick = () => openChat(friend);

  div.appendChild(info);
  div.appendChild(button);

  friendsList.appendChild(div);
}


// ======================================
// OPEN CHAT
// ======================================

function openChat(user) {
  if (!user || !user.uid) {
    alert("This user's information is incomplete.");
    return;
  }

  selectedUser = {
    uid: user.uid,
    name: user.name || "Bon User",
    phone: user.phone || "",
    email: user.email || ""
  };

  document.getElementById("findPeople").style.display = "none";
  document.getElementById("requestsSection").style.display = "none";
  document.getElementById("friendsSection").style.display = "none";

  chatBox.style.display = "block";
  chatTitle.textContent = "💬 Chat with " + selectedUser.name;

  loadMessages();
}


// ======================================
// BACK TO USERS
// ======================================

backToUsers.addEventListener("click", () => {
  if (stopMessages) {
    stopMessages();
    stopMessages = null;
  }

  selectedUser = null;
  chatBox.style.display = "none";

  document.getElementById("findPeople").style.display = "block";
  document.getElementById("requestsSection").style.display = "block";
  document.getElementById("friendsSection").style.display = "block";

  messages.innerHTML = "";
});


// ======================================
// CHAT ID GENERATOR
// ======================================

function getChatId(uid1, uid2) {
  if (!uid1 || !uid2) return null;
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}


// ======================================
// LOAD MESSAGES
// ======================================

function loadMessages() {
  const currentUser = auth.currentUser;
  if (!currentUser || !selectedUser) return;

  const chatId = getChatId(currentUser.uid, selectedUser.uid);
  if (!chatId) return;

  if (stopMessages) stopMessages();

  stopMessages = onValue(ref(db, "chats/" + chatId + "/messages"), (snapshot) => {
    messages.innerHTML = "";

    if (!snapshot.exists()) {
      messages.innerHTML = "<p class='no-msg'>No messages yet. Say hi 👋</p>";
      return;
    }

    const msgs = snapshot.val();
    Object.keys(msgs).forEach((key) => {
      const msg = msgs[key];
      displayMessage(msg);
    });

    messages.scrollTop = messages.scrollHeight;
  });
}


// ======================================
// DISPLAY MESSAGE
// ======================================

function displayMessage(msg) {
  const currentUser = auth.currentUser;
  const isMe = msg.senderId === currentUser.uid;

  const msgDiv = document.createElement("div");
  msgDiv.className = isMe ? "message sent" : "message received";

  const timeStr = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "";

  msgDiv.innerHTML = `
    <p>${escapeHTML(msg.text)}</p>
    <span class="time" style="font-size: 10px; opacity: 0.7; float: right;">${timeStr}</span>
  `;

  messages.appendChild(msgDiv);
}


// ======================================
// SEND MESSAGE
// ======================================

async function handleSendMessage() {
  const currentUser = auth.currentUser;
  const text = messageText.value.trim();

  if (!currentUser || !selectedUser || !text) return;

  const chatId = getChatId(currentUser.uid, selectedUser.uid);
  if (!chatId) return;

  try {
    const messagesRef = ref(db, "chats/" + chatId + "/messages");
    const newMsgRef = push(messagesRef);

    await set(newMsgRef, {
      senderId: currentUser.uid,
      receiverId: selectedUser.uid,
      text: text,
      timestamp: Date.now()
    });

    messageText.value = "";
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    alert(friendlyError(error));
  }
}

sendMessage.addEventListener("click", handleSendMessage);

messageText.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSendMessage();
  }
});

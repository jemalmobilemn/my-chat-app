// ======================================
// BON CHAT - APP.JS (PERMIT FIX)
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
      return "Permission denied by Database.";
    default:
      return error?.message || "Something went wrong.";
  }
}


// ======================================
// SIGN UP (FIXED PERMISSION ORDER)
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

    // 1. Create Auth user FIRST so user becomes authenticated
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    const phoneKey = phone.replace("+", "");

    // 2. Now authenticated, safe to write profile and phone index
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
// CREATE / UPDATE PROFILE
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

    if

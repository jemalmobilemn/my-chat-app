// ======================================
// BON CHAT - APP.JS
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
// JAVASCRIPT TEST
// ======================================

alert("BON CHAT APP.JS IS WORKING!");


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
// PHONE NORMALIZATION
// ======================================

function normalizePhone(phone) {

  let value = String(phone || "").trim();

  value = value.replace(/\s+/g, "");

  if (value.startsWith("09")) {
    value = "+251" + value.substring(1);
  }

  else if (
    value.startsWith("9") &&
    !value.startsWith("+")
  ) {
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

  if (
    !email ||
    !password ||
    !username ||
    !phone
  ) {

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

    const phoneKey =
      phone.replace("+", "");


    const phoneSnapshot =
      await get(
        ref(
          db,
          "phoneIndex/" + phoneKey
        )
      );


    if (phoneSnapshot.exists()) {

      authMessage.textContent =
        "This phone number is already registered.";

      return;
    }


    // Create Firebase account

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    const user = result.user;


    // Save user profile

    await set(
      ref(
        db,
        "users/" + user.uid
      ),
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
        "phoneIndex/" + phoneKey
      ),
      user.uid
    );


    authMessage.textContent =
      "Account created successfully! ✅";


  } catch (error) {

    console.error(
      "SIGN UP ERROR:",
      error
    );

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


    authMessage.textContent =
      "Login successful! ✅";


  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );

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

      authSection.style.display =
        "block";

      appSection.style.display =
        "none";

      userStatus.textContent =
        "Not signed in";

      return;
    }


    authSection.style.display =
      "none";

    appSection.style.display =
      "block";


    userStatus.textContent =
      "🟢 " + (user.email || "User");


    await createUserProfile(user);

    showAllUsers();

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
      ref(
        db,
        "users/" + user.uid
      );


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

    }

    else {

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
      "PROFILE ERROR:",
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

      const currentUser =
        auth.currentUser;


      if (currentUser) {

        await update(
          ref(
            db,
            "users/" +
            currentUser.uid
          ),
          {
            online: false,
            lastSeen: Date.now()
          }
        );

      }


      await signOut(auth);


    } catch (error) {

      console.error(
        "LOGOUT ERROR:",
        error
      );

    }

  }
);


// ======================================
// SEARCH BUTTON
// ======================================

searchBtn.addEventListener(
  "click",
  searchForUser
);


searchUser.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Enter") {

      event.preventDefault();

      searchForUser();

    }

  }
);


// ======================================
// SEARCH USER BY PHONE
// ======================================

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

    console.error(
      "SEARCH ERROR:",
      error
    );


    userResults.innerHTML =
      "<p>Search failed: " +
      escapeHTML(
        friendlyError(error)
      ) +
      "</p>";

  }

}


// ======================================
// SEARCH RESULT
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
      <strong>
        👤 ${escapeHTML(user.name || "Bon User")}
      </strong>

      <small>
        ${escapeHTML(user.phone || "")}
      </small>
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


  // Check friendship

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


  if (friendSnapshot.exists()) {

    button.textContent =
      "💬 Chat";

    button.onclick =
      () => openChat(user);

    return;
  }


  // Check sent request

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


  if (sentSnapshot.exists()) {

    button.textContent =
      "✓ Request Sent";

    button.disabled =
      true;

    return;
  }


  // Check received request

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


  if (receivedSnapshot.exists()) {

    button.textContent =
      "🔔 Accept Request";

    button.onclick =
      () =>
        acceptFriendRequest(
          user.uid
        );

    return;
  }


  // Add friend

  button.textContent =
    "➕ Add Friend";


  button.onclick =
    () =>
      sendFriendRequest(user);

}


// ======================================
// SEND FRIEND REQUEST
// ======================================

async function sendFriendRequest(user) {

  const currentUser =
    auth.currentUser;


  if (
    !currentUser ||
    !user ||
    !user.uid
  ) {

    return;
  }


  try {

    await set(
      ref(
        db,
        "friendRequests/" +
        user.uid +
        "/" +
        currentUser.uid
      ),
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

    console.error(
      "REQUEST ERROR:",
      error
    );


    alert(
      friendlyError(error)
    );

  }

}


// ======================================
// LISTEN FRIEND REQUESTS
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

      async (snapshot) => {

        friendRequests.innerHTML =
          "";


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


          if (
            !userSnapshot.exists()
          ) {

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
// REQUEST UI
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
      <strong>
        👤 ${escapeHTML(user.name || "Bon User")}
      </strong>

      <small>
        ${escapeHTML(user.phone || "")}
      </small>
    `;


  const accept =
    document.createElement("button");


  accept.textContent =
    "Accept";


  accept.onclick =
    () =>
      acceptFriendRequest(
        user.uid
      );


  const reject =
    document.createElement("button");


  reject.textContent =
    "Reject";


  reject.style.background =
    "#d32f2f";


  reject.onclick =
    () =>

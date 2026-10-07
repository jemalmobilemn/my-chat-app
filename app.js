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
// FIREBASE CONFIG
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


// ===============================
// INITIALIZE FIREBASE
// ===============================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


// ===============================
// HTML ELEMENTS
// ===============================

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

const signupBtn =
  document.getElementById("signupBtn");

const loginBtn =
  document.getElementById("loginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const searchInput =
  document.getElementById("searchUser");

const userResults =
  document.getElementById("userResults");

const chatBox =
  document.getElementById("chatBox");

const findPeople =
  document.getElementById("findPeople");

const messagesBox =
  document.getElementById("messages");

const messageText =
  document.getElementById("messageText");

const sendMessageBtn =
  document.getElementById("sendMessage");

const backToUsers =
  document.getElementById("backToUsers");

const chatTitle =
  document.getElementById("chatTitle");


// ===============================
// SELECTED USER
// ===============================

let selectedUser = null;

let messagesUnsubscribe = null;


// ===============================
// SIGN UP
// ===============================

signupBtn.addEventListener("click", async () => {

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

    authMessage.textContent =
      "Creating account...";


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
      "Account created successfully!";


  } catch (error) {

    console.error(error);

    authMessage.textContent =
      getFriendlyError(error);

  }

});


// ===============================
// LOGIN
// ===============================

loginBtn.addEventListener("click", async () => {

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

    console.error(error);

    authMessage.textContent =
      getFriendlyError(error);

  }

});


// ===============================
// AUTH STATE
// ===============================

onAuthStateChanged(auth, async (user) => {

  if (user) {

    authSection.style.display =
      "none";

    appSection.style.display =
      "block";


    userStatus.textContent =
      "🟢 " + (user.email || "Online");


    try {

      await update(
        ref(db, "users/" + user.uid),
        {
          online: true,
          lastSeen: Date.now()
        }
      );

    } catch (error) {

      console.error(
        "Could not update online status:",
        error
      );

    }

  } else {

    authSection.style.display =
      "block";

    appSection.style.display =
      "none";

    userStatus.textContent =
      "Not signed in";

  }

});


// ===============================
// LOGOUT
// ===============================

logoutBtn.addEventListener("click", async () => {

  try {

    const user =
      auth.currentUser;


    if (user) {

      await update(
        ref(db, "users/" + user.uid),
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

});


// ===============================
// FIND PEOPLE
// ===============================

searchInput.addEventListener(
  "input",
  async () => {

    const search =
      searchInput.value.trim().toLowerCase();


    userResults.innerHTML = "";


    if (!search) {
      return;
    }


    try {

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


      Object.values(users).forEach((user) => {

        if (
          user.uid ===
          auth.currentUser?.uid
        ) {

          return;
        }


        const name =
          (user.name || "").toLowerCase();

        const username =
          (user.username || "").toLowerCase();


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
            "👤 " + (user.name || "Bon User");


          const usernameText =
            document.createElement("small");

          usernameText.textContent =
            "@" + (user.username || "");


          const button =
            document.createElement("button");

          button.textContent =
            "Message";


          button.addEventListener(
            "click",
            () => openChat(user)
          );


          div.appendChild(nameText);

          div.appendChild(usernameText);

          div.appendChild(button);

          userResults.appendChild(div);

        }

      });


      if (!found) {

        userResults.innerHTML =
          "<p>No user found.</p>";

      }


    } catch (error) {

      console.error(error);

      userResults.innerHTML =
        "<p>Could not search users.</p>";

    }

  }
);


// ===============================
// OPEN CHAT
// ===============================

function openChat(user) {

  selectedUser = user;


  findPeople.style.display =
    "none";


  chatBox.style.display =
    "block";


  chatTitle.textContent =
    "💬 " + (user.name || "Bon User");


  loadMessages(user.uid);

}


// ===============================
// BACK TO USERS
// ===============================

backToUsers.addEventListener(
  "click",
  () => {

    chatBox.style.display =
      "none";

    findPeople.style.display =
      "block";


    selectedUser = null;


    if (messagesUnsubscribe) {

      messagesUnsubscribe();

      messagesUnsubscribe = null;

    }

  }
);


// ===============================
// CHAT ID
// ===============================

function makeChatId(uid1, uid2) {

  return [uid1, uid2]
    .sort()
    .join("_");

}


// ===============================
// SEND MESSAGE
// ===============================

sendMessageBtn.addEventListener(
  "click",
  sendMessage
);


messageText.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Enter") {

      sendMessage();

    }

  }
);


async function sendMessage() {

  const text =
    messageText.value.trim();


  if (
    !text ||
    !auth.currentUser ||
    !selectedUser
  ) {

    return;

  }


  try {

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

        text:
          text,

        timestamp:
          Date.now()
      }
    );


    messageText.value = "";


  } catch (error) {

    console.error(error);

    alert(
      getFriendlyError(error)
    );

  }

}


// ===============================
// LOAD MESSAGES
// ===============================

function loadMessages(otherUserId) {

  const currentUser =
    auth.currentUser;


  if (!currentUser) {
    return;
  }


  const chatId =
    makeChatId(
      currentUser.uid,
      otherUserId
    );


  if (messagesUnsubscribe) {

    messagesUnsubscribe();

  }


  messagesUnsubscribe =
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

          messagesBox.innerHTML =
            "<p>No messages yet.</p>";

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
          .forEach((message) => {

            const div =
              document.createElement("div");


            div.className =
              message.senderId ===
              currentUser.uid
                ? "myMessage"
                : "theirMessage";


            div.textContent =
              message.text;


            messagesBox.appendChild(div);

          });


        messagesBox.scrollTop =
          messagesBox.scrollHeight;

      },

      (error) => {

        console.error(
          "Message loading error:",
          error
        );

      }
    );

}


// ===============================
// FRIENDLY FIREBASE ERRORS
// ===============================

function getFriendlyError(error) {

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

    return "Please enter a valid email.";

  }


  if (
    code ===
    "auth/weak-password"
  ) {

    return "Password must be at least 6 characters.";

  }


  if (
    code ===
    "auth/invalid-credential" ||
    code ===
    "auth/wrong-password" ||
    code ===
    "auth/user-not-found"
  ) {

    return "Email or password is incorrect.";

  }


  if (
    code ===
    "auth/api-key-not-valid"
  ) {

    return "Firebase API Key is not valid. Check Firebase Config.";

  }


  if (
    code ===
    "PERMISSION_DENIED"
  ) {

    return "Firebase Database permission denied. Check Database Rules.";

  }


  return (
    error?.message ||
    "Something went wrong."
  );

}

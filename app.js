alert("BON CHAT JAVASCRIPT IS WORKING!");
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #eef2f5;
  color: #222;
}

.header {
  background: #075e54;
  color: white;
  padding: 16px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo {
  font-size: 22px;
  font-weight: bold;
}

#userStatus {
  font-size: 13px;
}

.card {
  width: min(650px, 94%);
  margin: 18px auto;
  background: white;
  padding: 18px;
  border-radius: 16px;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.08);
}

h2 {
  margin-top: 0;
}

input {
  width: 100%;
  padding: 13px;
  margin: 7px 0;
  border: 1px solid #ccc;
  border-radius: 10px;
  font-size: 16px;
  outline: none;
}

input:focus {
  border-color: #128c7e;
}

button {
  border: none;
  padding: 11px 15px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  background: #128c7e;
  color: white;
}

button:hover {
  opacity: 0.9;
}

button:active {
  transform: scale(0.98);
}

.buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.buttons button {
  flex: 1;
}

#authMessage {
  text-align: center;
  font-weight: bold;
  min-height: 20px;
}

/* =========================
   USERS
========================= */

#userResults {
  margin-top: 12px;
}

.userResult {
  margin-top: 10px;
  padding: 13px;
  background: #f4f6f7;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.userInfo {
  flex: 1;
  min-width: 0;
}

.userInfo strong {
  display: block;
  font-size: 16px;
}

.userInfo small {
  display: block;
  color: #777;
  margin-top: 3px;
}

.online {
  color: #159447;
  font-size: 12px;
}

.offline {
  color: #888;
  font-size: 12px;
}

.userResult button {
  flex-shrink: 0;
}

/* =========================
   CHAT
========================= */

.chatHeader {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chatHeader h2 {
  margin: 0;
  flex: 1;
}

#messages {
  height: 420px;
  overflow-y: auto;
  padding: 14px;
  background: #e9edef;
  border-radius: 14px;
  margin: 15px 0;
}

.emptyMessages {
  text-align: center;
  color: #777;
  padding: 30px 10px;
}

.myMessage {
  width: fit-content;
  max-width: 78%;
  margin: 8px 0 8px auto;
  padding: 10px 14px;
  background: #d9fdd3;
  border-radius: 15px 15px 4px 15px;
  word-break: break-word;
}

.theirMessage {
  width: fit-content;
  max-width: 78%;
  margin: 8px auto 8px 0;
  padding: 10px 14px;
  background: white;
  border-radius: 15px 15px 15px 4px;
  word-break: break-word;
}

.messageTime {
  display: block;
  font-size: 10px;
  color: #777;
  margin-top: 4px;
  text-align: right;
}

.messageInput {
  display: flex;
  gap: 8px;
  align-items: center;
}

.messageInput input {
  flex: 1;
  margin: 0;
}

.messageInput button {
  flex-shrink: 0;
}

/* =========================
   BUTTONS
========================= */

.logout {
  display: block;
  margin: 20px auto;
  background: #d32f2f;
}

#backToUsers {
  background: #555;
  margin-bottom: 10px;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 600px) {

  .header {
    padding: 13px;
  }

  .logo {
    font-size: 19px;
  }

  .card {
    width: 96%;
    margin-top: 12px;
    padding: 15px;
  }

  .buttons {
    flex-direction: column;
  }

  .userResult {
    padding: 12px;
  }

  .userResult button {
    padding: 9px 11px;
    font-size: 13px;
  }

  #messages {
    height: 55vh;
    min-height: 320px;
  }

  .myMessage,
  .theirMessage {
    max-width: 85%;
  }

  .messageInput input {
    font-size: 16px;
  }
}

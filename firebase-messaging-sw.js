
importScripts(
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyCyosrarpVmlGQ-i7cQYNm_M15f2Vgu4CA",
  authDomain: "web-app-e909e.firebaseapp.com",
  databaseURL:
    "https://web-app-e909e-default-rtdb.firebaseio.com",
  projectId: "web-app-e909e",
  storageBucket: "web-app-e909e.firebasestorage.app",
  messagingSenderId: "305727313129",
  appId: "1:305727313129:web:10e682d5fac76c7fbf0c78",
  measurementId: "G-KD0GFDTWVZ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title || "Bon Chat";

  const options = {
    body:
      payload.notification?.body ||
      "You have a new message.",
    icon: "/icon-192.png",
    data: {
      url: "/"
    }
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(
      event.notification.data?.url || "/"
    )
  );
});

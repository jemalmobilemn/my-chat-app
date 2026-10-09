
import admin from "firebase-admin";

function getFirebaseAdmin() {
  if (admin.apps.length) return admin;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured");
  }

  const serviceAccount = JSON.parse(raw);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://web-app-e909e-default-rtdb.firebaseio.com"
  });

  return admin;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const firebaseAdmin = getFirebaseAdmin();

    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    if (!idToken) {
      return res.status(401).json({ error: "Missing login token" });
    }

    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
    const { receiverId, message } = req.body || {};

    if (
      typeof receiverId !== "string" ||
      typeof message !== "string" ||
      !receiverId ||
      !message.trim() ||
      receiverId === decoded.uid
    ) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const db = firebaseAdmin.database();
    const tokenSnapshot = await db
      .ref(`users/${receiverId}/fcmTokens`)
      .get();

    if (!tokenSnapshot.exists()) {
      return res.status(200).json({
        sent: 0,
        message: "Receiver has no registered notification token"
      });
    }

    const tokens = Object.keys(tokenSnapshot.val());

    if (!tokens.length) {
      return res.status(200).json({ sent: 0 });
    }

    const result = await firebaseAdmin.messaging().sendEachForMulticast({
      tokens,
      data: {
        title: "New message on Bon Chat",
        body: message.trim().slice(0, 150),
        senderId: decoded.uid,
        url: "/"
      },
      webpush: {
        headers: { Urgency: "high" },
        fcmOptions: { link: "/" }
      }
    });

    const removals = {};

    result.responses.forEach((response, index) => {
      if (!response.success) {
        const code = response.error?.code || "";
        if (
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-registration-token")
        ) {
          removals[tokens[index]] = null;
        }
      }
    });

    if (Object.keys(removals).length) {
      await db.ref(`users/${receiverId}/fcmTokens`).update(removals);
    }

    return res.status(200).json({ sent: result.successCount });
  } catch (error) {
    console.error("Notification API error:", error);
    return res.status(500).json({ error: "Could not send notification" });
  }
}

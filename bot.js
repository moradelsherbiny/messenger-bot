// ============================================
// Facebook Messenger Bot - Node.js Server
// ============================================
// تثبيت المكتبات:
//   npm init -y
//   npm install express axios body-parser
// تشغيل:
//   node bot.js
// ============================================

const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = "PASTE_YOUR_PAGE_ACCESS_TOKEN_HERE";
const VERIFY_TOKEN = "MY_VERIFY_TOKEN_123";

// ✅ رسايل كل بوست — الرسالة الأولى دايمًا صورة
const POST_MESSAGES = {

};

// ✅ Webhook Verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ استقبال الرسايل
app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object !== "page") return res.sendStatus(404);

  for (const entry of body.entry) {
    const messaging = entry.messaging;
    if (!messaging) continue;

    for (const event of messaging) {
      if (!event.message || event.message.is_echo) continue;

      const senderId = event.sender.id;
      const refPostId = event.postback?.referral?.ref || event.referral?.ref || "";

      const messages = POST_MESSAGES[refPostId] || Object.values(POST_MESSAGES)[0] || [];

      for (const msg of messages) {
        await new Promise((r) => setTimeout(r, msg.delay * 1000));
        if (msg.type === "image") {
          await sendImage(senderId, msg.url);
        } else {
          await sendText(senderId, msg.text);
        }
      }
    }
  }

  res.status(200).send("EVENT_RECEIVED");
});

// ✅ إرسال نص
async function sendText(recipientId, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      { recipient: { id: recipientId }, message: { text } }
    );
    console.log(`✅ نص اتبعت: ${text.slice(0, 40)}`);
  } catch (err) {
    console.error("❌ خطأ نص:", err.response?.data || err.message);
  }
}

// ✅ إرسال صورة
async function sendImage(recipientId, imageUrl) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: "image",
            payload: { url: imageUrl, is_reusable: true },
          },
        },
      }
    );
    console.log(`✅ صورة اتبعتت: ${imageUrl.slice(0, 40)}`);
  } catch (err) {
    console.error("❌ خطأ صورة:", err.response?.data || err.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot شغال على port ${PORT}`));
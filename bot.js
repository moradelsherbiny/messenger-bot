const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = "EAAMGscNpjaYBRimKcGnLyjwf637ksnWIafM6OXZBR8MXqpMnwnRiqnnF3FF599ZBVR2ZCYCHCDIQvK3Q7JMpFMFWcGVE1P173wCLZCBAZBt39yvff8Rw42BMPeQPrJD2otXMlGzYmPGE9SNqPMqWuYKGdMTinh3FSLuZBI0iXqwtCiJtn9DhiDlRyZAx861xgE4p8B1PQZDZD";
const VERIFY_TOKEN = "MY_VERIFY_TOKEN_123";

// ✅ رسايل كل بوست
const POST_MESSAGES = {
  "1532567638441506": [
    { type: "image", url: "https://i.postimg.cc/BvXR38DR/597997373-993388776770788-4574657101586770709-n.jpg", delay: 0 },
    { type: "text", text: "New collection \n🔥 “الميني دريس في ثوبه الجديد 👒✨”\n= شيك البحر 2026 🖤🌊🔥\n\nمايوه Waterproof مستورد 💯🦋\n\nطقم 4 قطع:\n(تونيك + بنطلون + كيمونو+تربون) 👒\n\n📏 المقاسات: من S لحد 5xl\n✨ بيظبط الجسم بشكل خطير\n\n#اطلبي_قبل_نفاذ_الكمية\nمن S ل 5xl  \nب 999 ج بدلا من 1300 ج  \n", delay: 2 },
    { type: "text", text: "Small       40:50\nMedium  50 : 60 \nLarge       60 : 70 \nXl             70 : 80 \nXxl            80 : 90 \n3xl             90:100 \n4xl             100:110 \n5xl             110:120", delay: 3 },
    { type: "text", text: "لو تحبي اساعدك ف اختيار المقاس انا هكون مع حضرتك عيوني ليكي😍", delay: 4 }
  ]
};

// ✅ سجل العملاء لكل بوست (مرة واحدة لكل بوست)
const repliedUsers = {};

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

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

      // ✅ بس لو البوست موجود في الكونفيج
      if (!POST_MESSAGES[refPostId]) {
        console.log(`⛔ بوست مش موجود: ${refPostId}`);
        continue;
      }

      // ✅ مرة واحدة لكل بوست لكل عميل
      if (!repliedUsers[refPostId]) repliedUsers[refPostId] = new Set();
      if (repliedUsers[refPostId].has(senderId)) {
        console.log(`⛔ العميل ${senderId} اتبعتله من البوست ده قبل كده`);
        continue;
      }

      repliedUsers[refPostId].add(senderId);
      console.log(`✅ بيبعت لـ ${senderId} من البوست ${refPostId}`);

      for (const msg of POST_MESSAGES[refPostId]) {
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

async function sendText(recipientId, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      { recipient: { id: recipientId }, message: { text } }
    );
  } catch (err) {
    console.error("❌ خطأ نص:", err.response?.data || err.message);
  }
}

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
  } catch (err) {
    console.error("❌ خطأ صورة:", err.response?.data || err.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot شغال على port ${PORT}`));

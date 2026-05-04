const axios = require("axios");
const style = require('./style');
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");
const { chargeUser } = require("./_economy");

module.exports.config = {
  name: "sister",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Find your sister in the group.",
  commandCategory: "Family",
  usages: "[@mention optional]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");
const templateUrl = "https://i.ibb.co/HfCPmbJ8/056be56cbcd2.jpg"; 
const templatePath = path.join(cacheDir, "sister_template.png");

const SETTINGS = {
  AVATAR_1: {
    SIZE: 200,
    X: 20,
    Y: 160
  },
  AVATAR_2: {
    SIZE: 211,
    X: 264,
    Y: 152
  }
};

const sisterMessages = [
  "𝐁𝐞𝐡𝐞𝐧 𝐡𝐚𝐢 𝐭𝐨𝐡 𝐬𝐚𝐛 𝐤𝐮𝐜𝐡 𝐡𝐚𝐢 ❤️",
  "𝐌𝐲 𝐒𝐢𝐬𝐭𝐞𝐫, 𝐌𝐲 𝐁𝐞𝐬𝐭 𝐅𝐫𝐢𝐞𝐧𝐝! 🌟",
  "𝐁𝐞𝐡𝐞𝐧 𝐤𝐚 𝐩𝐲𝐚𝐚𝐫 𝐬𝐚𝐛𝐬𝐞 𝐩𝐚𝐲𝐚𝐫𝐚 🌸",
  "𝐃𝐮𝐧𝐢𝐲𝐚 𝐤𝐢 𝐬𝐚𝐛𝐬𝐞 𝐚𝐜𝐡𝐢 𝐛𝐞𝐡𝐞𝐧 👑",
  "𝐒𝐢𝐬𝐭𝐞𝐫𝐬 𝐅𝐨𝐫𝐞𝐯𝐞𝐫! 👭"
];

async function downloadTemplate() {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  if (!fs.existsSync(templatePath)) {
    try {
      const response = await axios.get(templateUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(templatePath, Buffer.from(response.data));
    } catch (e) {
      console.error("Template download error:", e);
    }
  }
}

async function getAvatar(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
}

async function makeCircularImage(buffer, size) {
  const image = await Jimp.read(buffer);
  image.resize({ w: size, h: size });
  const mask = new Jimp({ width: size, height: size, color: 0x00000000 });
  const center = size / 2;
  const radius = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      if (dist <= radius) {
        mask.setPixelColor(0xFFFFFFFF, x, y);
      }
    }
  }
  image.mask(mask, 0, 0);
  return image;
}

module.exports.run = async ({ api, event, Users, Currencies, args }) => {
  const { threadID, messageID, senderID } = event;
  const botID = api.getCurrentUserID();

  try {
    const COST = 10;
    const charge = await chargeUser(Currencies, senderID, COST);
    if (!charge.success) {
      return api.sendMessage(`❌ Aapke paas ${COST} coins nahi hain.\n💰 Required: ${COST} coins\n💵 Your Total: ${charge.total || 0} coins`, threadID, messageID);
    }
    await downloadTemplate();
    let one = senderID;
    let two;

    if (Object.keys(event.mentions).length > 0) {
      two = Object.keys(event.mentions)[Object.keys(event.mentions).length - 1];
    } else if (event.messageReply) {
      two = event.messageReply.senderID;
    } else if (args && args.length > 0 && args[0].match(/^\d+$/)) {
      two = args[0];
    } else {
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs.filter(m => m !== senderID && m !== botID);
      if (participantIDs.length === 0) {
        return api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐍𝐨 𝐦𝐞𝐦𝐛𝐞𝐫𝐬 𝐟𝐨𝐮𝐧𝐝!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
      }
      two = participantIDs[Math.floor(Math.random() * participantIDs.length)];
    }

    const [avatarOne, avatarTwo] = await Promise.all([getAvatar(one), getAvatar(two)]);
    const [circleOne, circleTwo] = await Promise.all([
      makeCircularImage(avatarOne, SETTINGS.AVATAR_1.SIZE),
      makeCircularImage(avatarTwo, SETTINGS.AVATAR_2.SIZE)
    ]);

    const template = await Jimp.read(templatePath);
    template.composite(circleOne, SETTINGS.AVATAR_1.X, SETTINGS.AVATAR_1.Y);
    template.composite(circleTwo, SETTINGS.AVATAR_2.X, SETTINGS.AVATAR_2.Y);

    const outputPath = path.join(cacheDir, `sis_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    let nameOne = await Users.getNameUser(one);
    let nameTwo = await Users.getNameUser(two);
    const randomMsg = sisterMessages[Math.floor(Math.random() * sisterMessages.length)];

    api.sendMessage({
      body: `◈━━━━━━━━━━━━◈\n\n   ${randomMsg}\n\n  💌 ${nameOne}\n  👭 𝐒𝐢𝐬𝐭𝐞𝐫𝐬 𝐁𝐨𝐧𝐝 👭\n  💌 ${nameTwo}\n\n◈━━━━━━━━━━━━◈\n\n💰 Remaining Coins: ${charge.remaining} (You can use ${Math.floor(charge.remaining / COST)} more paid commands)`,
      attachment: fs.createReadStream(outputPath),
      mentions: [
        { tag: nameOne, id: one },
        { tag: nameTwo, id: two }
      ]
    }, threadID, () => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);

  } catch (error) {
    console.error("Sister command error:", error);
    api.sendMessage("❌ Error creating edit!", threadID, messageID);
  }
};

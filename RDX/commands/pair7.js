const axios = require("axios");
const style = require('./style');
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");
const { chargeUser } = require("./_economy");

module.exports.config = {
  name: "pair7",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Create a romantic pair edit with profile pics (Costs 50$)",
  commandCategory: "Love",
  usages: "[@mention optional]",
  cooldowns: 5,
};

const COST = 50;
const cacheDir = path.join(__dirname, "cache", "canvas");
const templateUrl = "https://i.ibb.co/TxWjm1bP/0e465782e95a.jpg";
const templatePath = path.join(cacheDir, "pair7_template.png");

const SETTINGS = {
  AVATAR_1: {
    SIZE: 240,
    X: 45,
    Y: 118
  },
  AVATAR_2: {
    SIZE: 242,
    X: 433,
    Y: 116
  }
};

const maleNames = ["ali", "ahmed", "muhammad", "hassan", "hussain", "kashif", "sardar", "usman", "bilal", "hamza", "asad", "zain", "fahad", "faisal", "imran", "kamran", "adnan", "arslan", "waqas", "waseem", "irfan", "junaid", "khalid", "nadeem", "naveed", "omer", "qasim", "rizwan", "sajid", "salman", "shahid", "tariq", "umar", "yasir", "zahid"];
const femaleNames = ["fatima", "ayesha", "maria", "sana", "hira", "zara", "maryam", "khadija", "sara", "amina", "bushra", "farah", "iqra", "javeria", "kinza", "laiba", "maham", "nadia", "rabia", "saima", "tahira", "uzma", "zainab", "anam", "asma", "dua", "esha", "fiza", "huma", "iram"];

const romanticMessages = [
  "𝐓𝐮𝐦𝐡𝐚𝐫𝐢 𝐚𝐚𝐧𝐤𝐡𝐨𝐧 𝐦𝐞𝐢𝐧 𝐦𝐞𝐫𝐢 𝐝𝐮𝐧𝐢𝐲𝐚 𝐡𝐚𝐢 👀💖",
  "𝐇𝐚𝐫 𝐩𝐚𝐥 𝐭𝐮𝐦𝐡𝐚𝐫𝐢 𝐲𝐚𝐚𝐝 𝐚𝐚𝐭𝐢 𝐡𝐚𝐢 🥀",
  "𝐓𝐮𝐦 𝐦𝐞𝐫𝐞 𝐥𝐢𝐲𝐞 𝐬𝐚𝐛 𝐬𝐞 𝐤𝐡𝐚𝐚𝐬 𝐡𝐨 ✨",
  "𝐌𝐨𝐡𝐚𝐛𝐛𝐚𝐭 𝐤𝐚 𝐝𝐨𝐨𝐬𝐫𝐚 𝐧𝐚𝐚𝐦 𝐭𝐮𝐦 𝐡𝐨 ❤️",
  "𝐓𝐮𝐦𝐡𝐚𝐫𝐚 𝐩𝐲𝐚𝐚𝐫 𝐡𝐢 𝐦𝐞𝐫𝐢 𝐭𝐚𝐚𝐪𝐚𝐭 𝐡𝐚𝐢 💪💗"
];

async function downloadTemplate() {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  if (!fs.existsSync(templatePath)) {
    const response = await axios.get(templateUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(templatePath, Buffer.from(response.data));
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

function detectGender(name) {
  const lowerName = name ? name.toLowerCase() : "";
  if (femaleNames.some(n => lowerName.includes(n))) return "female";
  if (maleNames.some(n => lowerName.includes(n))) return "male";
  return "unknown";
}

module.exports.run = async ({ api, event, Users, Currencies, args }) => {
  const { threadID, messageID, senderID } = event;
  const botID = api.getCurrentUserID();

  try {
    const COST = 10;
    const charge = await chargeUser(Currencies, senderID, COST);
    if (!charge.success) return api.sendMessage(`❌ Aapka balance low hy.\n💰 Price: ${COST} coins\n💵 Your Total: ${charge.total || 0}`, threadID, messageID);

    await downloadTemplate();
    let one = senderID;
    let two;

    if (Object.keys(event.mentions).length > 0) {
      two = Object.keys(event.mentions)[0];
    } else if (event.messageReply) {
      two = event.messageReply.senderID;
    } else if (args && args.length > 0 && args[0].match(/^\d+$/)) {
      two = args[0];
    } else {
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs;
      const infoOne = await api.getUserInfo(one);
      const genderOne = infoOne[one].gender === 1 ? "female" : infoOne[one].gender === 2 ? "male" : detectGender(infoOne[one].name);
      const filteredMembers = participantIDs.filter(m => m !== senderID && m !== botID);
      if (filteredMembers.length === 0) {
        return api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐍𝐨 𝐦𝐞𝐦𝐛𝐞𝐫𝐬 𝐟𝐨𝐮𝐧𝐝 𝐭𝐨 𝐩𝐚𝐢𝐫!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
      }
      let oppositeGenderMembers = [];
      const batchInfo = await api.getUserInfo(filteredMembers);
      for (const uid of filteredMembers) {
        const info = batchInfo[uid];
        const memberGender = info.gender === 1 ? "female" : info.gender === 2 ? "male" : detectGender(info.name);
        if (genderOne === "male" && memberGender === "female") {
          oppositeGenderMembers.push(uid);
        } else if (genderOne === "female" && memberGender === "male") {
          oppositeGenderMembers.push(uid);
        } else if (genderOne === "unknown" || memberGender === "unknown") {
          oppositeGenderMembers.push(uid);
        }
      }
      if (oppositeGenderMembers.length === 0) oppositeGenderMembers = filteredMembers;
      two = oppositeGenderMembers[Math.floor(Math.random() * oppositeGenderMembers.length)];
    }

    if (two == one) return api.sendMessage("❌ Aap apne saath pairing nahi kar sakte!", threadID, messageID);

    const [avatarOne, avatarTwo] = await Promise.all([getAvatar(one), getAvatar(two)]);
    const [circleOne, circleTwo] = await Promise.all([
      makeCircularImage(avatarOne, SETTINGS.AVATAR_1.SIZE),
      makeCircularImage(avatarTwo, SETTINGS.AVATAR_2.SIZE)
    ]);

    const template = await Jimp.read(templatePath);
    template.composite(circleOne, SETTINGS.AVATAR_1.X, SETTINGS.AVATAR_1.Y);
    template.composite(circleTwo, SETTINGS.AVATAR_2.X, SETTINGS.AVATAR_2.Y);

    const outputPath = path.join(cacheDir, `pair7_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    let nameOne = await Users.getNameUser(one);
    let nameTwo = await Users.getNameUser(two);
    const randomMsg = romanticMessages[Math.floor(Math.random() * romanticMessages.length)];
    const loveRatio = Math.floor(Math.random() * 41) + 60;

    api.sendMessage({
      body: `┌──────────────┐\n\n   ${randomMsg}\n\n  👤 ${nameOne}\n  ⚡ 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝 ⚡\n  👤 ${nameTwo}\n\n  💗 𝐋𝐮𝐜𝐤: ${loveRatio}%\n\n└──────────────┘\n\n💰 Remaining Coins: ${charge.remaining} (You can use ${Math.floor(charge.remaining / COST)} more paid commands)`,
      attachment: fs.createReadStream(outputPath),
      mentions: [
        { tag: nameOne, id: one },
        { tag: nameTwo, id: two }
      ]
    }, threadID, () => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);

  } catch (error) {
    console.error("Pair7 command error:", error);
    api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐄𝐫𝐫𝐨𝐫 𝐜𝐫𝐞𝐚𝐭𝐢𝐧𝐠 𝐩𝐚𝐢𝐫!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
  }
};

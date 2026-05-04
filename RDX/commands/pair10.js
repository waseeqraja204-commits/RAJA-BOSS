const axios = require("axios");
const style = require('./style');
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");
const { chargeUser } = require("./_economy");

module.exports.config = {
  name: "pair10",
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
const templateUrl = "https://i.ibb.co/d4mS8MJC/44083411ce02.jpg";
const templatePath = path.join(cacheDir, "pair10_template.png");

const SETTINGS = {
  AVATAR_1: {
    SIZE: 210,
    X: 28,
    Y: 134
  },
  AVATAR_2: {
    SIZE: 210,
    X: 268,
    Y: 140
  }
};

const maleNames = ["ali", "ahmed", "muhammad", "hassan", "hussain", "kashif", "sardar", "usman", "bilal", "hamza", "asad", "zain", "fahad", "faisal", "imran", "kamran", "adnan", "arslan", "waqas", "waseem", "irfan", "junaid", "khalid", "nadeem", "naveed", "omer", "qasim", "rizwan", "sajid", "salman", "shahid", "tariq", "umar", "yasir", "zahid"];
const femaleNames = ["fatima", "ayesha", "maria", "sana", "hira", "zara", "maryam", "khadija", "sara", "amina", "bushra", "farah", "iqra", "javeria", "kinza", "laiba", "maham", "nadia", "rabia", "saima", "tahira", "uzma", "zainab", "anam", "asma", "dua", "esha", "fiza", "huma", "iram"];

const romanticMessages = [
  "𝐓𝐮𝐦 𝐡𝐨 𝐭𝐨 𝐦𝐚𝐢𝐧 𝐡𝐨𝐨𝐧 ❤️",
  "𝐌𝐞𝐫𝐢 𝐳𝐢𝐧𝐝𝐚𝐠𝐢 𝐤𝐚 𝐬𝐮𝐫𝐚𝐣 𝐡𝐨 𝐭𝐮𝐦 ☀️💖",
  "𝐓𝐮𝐦𝐡𝐚𝐫𝐢 𝐦𝐨𝐡𝐚𝐛𝐛𝐚𝐭 𝐡𝐢 𝐦𝐞𝐫𝐚 𝐬𝐚𝐫𝐦𝐚𝐲𝐚 𝐡𝐚𝐢 ✨",
  "𝐃𝐢𝐥 𝐤𝐢 𝐡𝐚𝐫 𝐤𝐡𝐮𝐬𝐡𝐢 𝐭𝐮𝐦𝐬𝐞 𝐡𝐚𝐢 💞",
  "𝐓𝐮𝐦 𝐦𝐢𝐥𝐞 𝐭𝐨 𝐦𝐮𝐤𝐚𝐦𝐦𝐚𝐥 𝐡𝐨 𝐠𝐚𝐲𝐚 𝐬𝐚𝐛 ✨"
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

async function makeHeartImage(buffer, size) {
  const image = await Jimp.read(buffer);
  image.resize({ w: size, h: size });
  const mask = new Jimp({ width: size, height: size, color: 0x00000000 });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size - 0.5) * 2.6; 
      const ny = (y / size - 0.4) * -3; 
      const x2 = nx * nx;
      const y2 = ny * ny;
      const res = Math.pow(x2 + y2 - 1, 3) - x2 * Math.pow(ny, 3);
      if (res <= 0) {
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
    const [heartOne, heartTwo] = await Promise.all([
      makeHeartImage(avatarOne, SETTINGS.AVATAR_1.SIZE),
      makeHeartImage(avatarTwo, SETTINGS.AVATAR_2.SIZE)
    ]);

    const template = await Jimp.read(templatePath);
    template.composite(heartOne, SETTINGS.AVATAR_1.X, SETTINGS.AVATAR_1.Y);
    template.composite(heartTwo, SETTINGS.AVATAR_2.X, SETTINGS.AVATAR_2.Y);

    const outputPath = path.join(cacheDir, `pair10_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    let nameOne = await Users.getNameUser(one);
    let nameTwo = await Users.getNameUser(two);
    const randomMsg = romanticMessages[Math.floor(Math.random() * romanticMessages.length)];
    const loveRatio = Math.floor(Math.random() * 41) + 60;

    api.sendMessage({
      body: `📜──────────────📜\n\n   ${randomMsg}\n\n  💍 ${nameOne}\n  🕯️ 𝐓𝐨𝐠𝐞𝐭𝐡𝐞𝐫 🕯️\n  💍 ${nameTwo}\n\n  ❤️ 𝐌𝐚𝐭𝐜𝐡: ${loveRatio}%\n\n📜──────────────📜\n\n💰 Remaining Coins: ${charge.remaining} (You can use ${Math.floor(charge.remaining / COST)} more paid commands)`,
      attachment: fs.createReadStream(outputPath),
      mentions: [
        { tag: nameOne, id: one },
        { tag: nameTwo, id: two }
      ]
    }, threadID, () => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);

  } catch (error) {
    console.error("Pair10 command error:", error);
    api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐄𝐫𝐫𝐨𝐫 𝐜𝐫𝐞𝐚𝐭𝐢𝐧𝐠 𝐩𝐚𝐢𝐫!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
  }
};

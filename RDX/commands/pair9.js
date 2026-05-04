const axios = require("axios");
const style = require('./style');
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");
const { chargeUser } = require("./_economy");

module.exports.config = {
  name: "pair9",
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
const templateUrl = "https://i.ibb.co/SwYRRP3B/4d9f6c32ac89.jpg";
const templatePath = path.join(cacheDir, "pair9_template.png");

const SETTINGS = {
  AVATAR_1: {
    SIZE: 110,
    X: 131,
    Y: 88
  },
  AVATAR_2: {
    SIZE: 110,
    X: 292,
    Y: 88
  }
};

const maleNames = ["ali", "ahmed", "muhammad", "hassan", "hussain", "kashif", "sardar", "usman", "bilal", "hamza", "asad", "zain", "fahad", "faisal", "imran", "kamran", "adnan", "arslan", "waqas", "waseem", "irfan", "junaid", "khalid", "nadeem", "naveed", "omer", "qasim", "rizwan", "sajid", "salman", "shahid", "tariq", "umar", "yasir", "zahid"];
const femaleNames = ["fatima", "ayesha", "maria", "sana", "hira", "zara", "maryam", "khadija", "sara", "amina", "bushra", "farah", "iqra", "javeria", "kinza", "laiba", "maham", "nadia", "rabia", "saima", "tahira", "uzma", "zainab", "anam", "asma", "dua", "esha", "fiza", "huma", "iram"];

const romanticMessages = [
  "𝐓𝐮𝐦 𝐦𝐞𝐫𝐢 𝐝𝐡𝐚𝐝𝐤𝐚𝐧 𝐤𝐢 𝐚𝐰𝐚𝐚𝐳 𝐡𝐨 💓",
  "𝐉𝐚𝐢𝐬𝐞 𝐜𝐡𝐚𝐧𝐝 𝐤𝐞 𝐛𝐢𝐧𝐚 𝐫𝐚𝐚𝐭 𝐚𝐝𝐡𝐨𝐨𝐫𝐢 ✨",
  "𝐓𝐮𝐦𝐡𝐚𝐫𝐚 𝐩𝐲𝐚𝐚𝐫 𝐦𝐞𝐫𝐢 𝐳𝐢𝐧𝐝𝐚𝐠𝐢 𝐡𝐚𝐢 ❤️",
  "𝐒𝐚𝐚𝐭𝐡 𝐭𝐞𝐫𝐚 𝐡ο 𝐭ο 𝐡𝐚𝐫 𝐠𝐡𝐚𝐦 𝐡𝐚𝐥𝐤𝐚 𝐡𝐚𝐢 ✨",
  "𝐌𝐞𝐫𝐢 𝐡𝐚𝐫 𝐬𝐚𝐚𝐧𝐬 𝐦𝐞𝐢𝐧 𝐭𝐮𝐦 𝐡ο 💖"
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

async function makeSquareImage(buffer, size) {
  const image = await Jimp.read(buffer);
  image.resize({ w: size, h: size });
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
    const [sqOne, sqTwo] = await Promise.all([
      makeSquareImage(avatarOne, SETTINGS.AVATAR_1.SIZE),
      makeSquareImage(avatarTwo, SETTINGS.AVATAR_2.SIZE)
    ]);

    const template = await Jimp.read(templatePath);
    template.composite(sqOne, SETTINGS.AVATAR_1.X, SETTINGS.AVATAR_1.Y);
    template.composite(sqTwo, SETTINGS.AVATAR_2.X, SETTINGS.AVATAR_2.Y);

    const outputPath = path.join(cacheDir, `pair9_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    let nameOne = await Users.getNameUser(one);
    let nameTwo = await Users.getNameUser(two);
    const randomMsg = romanticMessages[Math.floor(Math.random() * romanticMessages.length)];
    const loveRatio = Math.floor(Math.random() * 41) + 60;

    api.sendMessage({
      body: `【 ━━━━━━━━━━━━ 】\n\n   ${randomMsg}\n\n  ⭐ ${nameOne}\n  🌙 𝐒𝐨𝐮𝐥𝐦𝐚𝐭𝐞 🌙\n  ⭐ ${nameTwo}\n\n  🔮 𝐅𝐚𝐭𝐞: ${loveRatio}%\n\n【 ━━━━━━━━━━━━ 】\n\n💰 Remaining Coins: ${charge.remaining} (You can use ${Math.floor(charge.remaining / COST)} more paid commands)`,
      attachment: fs.createReadStream(outputPath),
      mentions: [
        { tag: nameOne, id: one },
        { tag: nameTwo, id: two }
      ]
    }, threadID, () => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, messageID);

  } catch (error) {
    console.error("Pair9 command error:", error);
    api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐄𝐫𝐫ο𝐫 𝐜𝐫𝐞𝐚𝐭𝐢𝐧𝐠 𝐩𝐚𝐢𝐫!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
  }
};

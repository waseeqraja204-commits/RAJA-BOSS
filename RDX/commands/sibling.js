const axios = require("axios");
const style = require('./style');
const fs = require("fs-extra");
const path = require("path");
const { Jimp } = require("jimp");

module.exports.config = {
  name: "sibling",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Find your sibling in the group.",
  commandCategory: "Family",
  usages: "[@mention optional]",
  cooldowns: 5,
};

const cacheDir = path.join(__dirname, "cache", "canvas");
const templateUrl = "https://i.ibb.co/0y2yrChH/2dceaa7401c6.jpg";
const templatePath = path.join(cacheDir, "brothersister_template.png");

const maleNames = ["ali", "ahmed", "muhammad", "hassan", "hussain", "kashif", "sardar", "usman", "bilal", "hamza", "asad", "zain", "fahad", "faisal", "imran", "kamran", "adnan", "arslan", "waqas", "waseem", "irfan", "junaid", "khalid", "nadeem", "naveed", "omer", "qasim", "rizwan", "sajid", "salman", "shahid", "tariq", "umar", "yasir", "zahid"];
const femaleNames = ["fatima", "ayesha", "maria", "sana", "hira", "zara", "maryam", "khadija", "sara", "amina", "bushra", "farah", "iqra", "javeria", "kinza", "laiba", "maham", "nadia", "rabia", "saima", "tahira", "uzma", "zainab", "anam", "asma", "dua", "esha", "fiza", "huma", "iram"];

const siblingMessages = [
  "𝐁𝐫𝐨𝐭𝐡𝐞𝐫 & 𝐒𝐢𝐬𝐭𝐞𝐫 𝐁𝐨𝐧𝐝 👫",
  "𝐒𝐢𝐛𝐥𝐢𝐧𝐠𝐬 𝐅𝐨𝐫𝐞𝐯𝐞𝐫 💕",
  "𝐖𝐨𝐫𝐥𝐝 𝐁𝐞𝐬𝐭 𝐑𝐞𝐥𝐚𝐭𝐢𝐨𝐧𝐬𝐡𝐢𝐩 🌟",
  "𝐁𝐞𝐬𝐭 𝐅𝐫𝐢𝐞𝐧𝐝𝐬 𝐅𝐨𝐫 𝐋𝐢𝐟𝐞 👊",
  "𝐔𝐧𝐛𝐫𝐞𝐚𝐤𝐚𝐛𝐥𝐞 𝐁𝐨𝐧𝐝 💪",
  "𝐌𝐲 𝐏𝐫𝐨𝐭𝐞𝐜𝐭𝐨𝐫, 𝐌𝐲 𝐁𝐞𝐬𝐭𝐢𝐞 🛡️",
  "𝐁𝐥𝐨𝐨𝐝 𝐢𝐬 𝐓𝐡𝐢𝐜𝐤𝐞𝐫 𝐓𝐡𝐚𝐧 𝐖𝐚𝐭𝐞𝐫 ❤️",
  "𝐒𝐢𝐛𝐥𝐢𝐧𝐠 𝐆𝐨𝐚𝐥𝐬 🎯"
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
  const lowerName = name.toLowerCase();
  if (femaleNames.some(n => lowerName.includes(n))) return "female";
  if (maleNames.some(n => lowerName.includes(n))) return "male";
  return "unknown";
}

async function getThreadMembers(api, threadID) {
  return new Promise((resolve) => {
    api.getThreadInfo(threadID, (err, info) => {
      if (err) return resolve([]);
      resolve(info.participantIDs || []);
    });
  });
}

async function getUserInfo(api, uid) {
  return new Promise((resolve) => {
    api.getUserInfo(uid, (err, info) => {
      if (err) return resolve({});
      resolve(info[uid] || {});
    });
  });
}

function isValidName(name) {
  if (!name || name.trim() === '') return false;
  const lower = name.toLowerCase();
  if (lower === 'facebook' || lower === 'facebook user' || lower.includes('facebook user')) return false;
  if (lower === 'unknown' || lower === 'user') return false;
  return true;
}

async function getProperName(api, uid, Users) {
  if (Users && Users.getNameUser) {
    return await Users.getNameUser(uid);
  }
  const info = await getUserInfo(api, uid);
  if (isValidName(info.name)) return info.name;
  if (isValidName(info.firstName)) return info.firstName;
  if (isValidName(info.alternateName)) return info.alternateName;
  return 'User';
}

module.exports.run = async ({ api, event, Users }) => {
  const { threadID, messageID, senderID } = event;
  const mention = Object.keys(event.mentions || {});

  try {
    await downloadTemplate();

    let one = senderID;
    let two;
    let senderInfo = await getUserInfo(api, senderID);
    let senderGender = senderInfo.gender === 1 ? "female" : senderInfo.gender === 2 ? "male" : detectGender(senderInfo.name || "");

    if (mention.length > 0 && mention[0] && mention[0] !== senderID) {
      two = mention[0];
    } else {
      const members = await getThreadMembers(api, threadID);
      const filteredMembers = members.filter(m => m !== senderID);

      if (filteredMembers.length === 0) {
        return api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐍𝐨 𝐦𝐞𝐦𝐛𝐞𝐫𝐬 𝐟𝐨𝐮𝐧𝐝!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
      }

      let oppositeGenderMembers = [];
      for (const uid of filteredMembers) {
        const info = await getUserInfo(api, uid);
        const memberGender = info.gender === 1 ? "female" : info.gender === 2 ? "male" : detectGender(info.name || "");
        
        if (senderGender === "male" && memberGender === "female") {
          oppositeGenderMembers.push(uid);
        } else if (senderGender === "female" && memberGender === "male") {
          oppositeGenderMembers.push(uid);
        } else if (senderGender === "unknown" || memberGender === "unknown") {
          oppositeGenderMembers.push(uid);
        }
      }

      if (oppositeGenderMembers.length === 0) {
        oppositeGenderMembers = filteredMembers;
      }

      two = oppositeGenderMembers[Math.floor(Math.random() * oppositeGenderMembers.length)];
    }

    let avatarOne, avatarTwo;
    try {
      avatarOne = await getAvatar(one);
    } catch (error) {
      console.error(`Failed to get avatar for ${one}:`, error.message);
      return api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐠𝐞𝐭 𝐲𝐨𝐮𝐫 𝐚𝐯𝐚𝐭𝐚𝐫!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
    }
    
    try {
      avatarTwo = await getAvatar(two);
    } catch (error) {
      console.error(`Failed to get avatar for ${two}:`, error.message);
      return api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐠𝐞𝐭 𝐩𝐚𝐫𝐭𝐧𝐞𝐫 𝐚𝐯𝐚𝐭𝐚𝐫!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
    }

    const circleOne = await makeCircularImage(avatarOne, 210);
    const circleTwo = await makeCircularImage(avatarTwo, 210);

    const template = await Jimp.read(templatePath);

    template.composite(circleOne, 85, 90);
    template.composite(circleTwo, 440, 100);

    const outputPath = path.join(cacheDir, `brothersister_${one}_${two}_${Date.now()}.png`);
    await template.write(outputPath);

    let nameOne = await getProperName(api, one, Users);
    let nameTwo = await getProperName(api, two, Users);
    
    const userOneInfo = await getUserInfo(api, one);
    const userTwoInfo = await getUserInfo(api, two);
    const oneGender = userOneInfo.gender === 1 ? "female" : userOneInfo.gender === 2 ? "male" : detectGender(nameOne);
    const twoGender = userTwoInfo.gender === 1 ? "female" : userTwoInfo.gender === 2 ? "male" : detectGender(nameTwo);
    
    let roleOne = oneGender === "male" ? "𝐁𝐑𝐎𝐓𝐇𝐄𝐑" : "𝐒𝐈𝐒𝐓𝐄𝐑";
    let roleTwo = twoGender === "male" ? "𝐁𝐑𝐎𝐓𝐇𝐄𝐑" : "𝐒𝐈𝐒𝐓𝐄𝐑";
    
    const randomMsg = siblingMessages[Math.floor(Math.random() * siblingMessages.length)];

    api.sendMessage(
      {
        body: `≿━━━━༺👫༻━━━━≾\n\n${randomMsg}\n\n👤 ${nameOne} (${roleOne})\n💕 𝐁𝐎𝐍𝐃𝐄𝐃 𝐖𝐈𝐓𝐇 💕\n👤 ${nameTwo} (${roleTwo})\n\n≿━━━━༺👫༻━━━━≾`,
        attachment: fs.createReadStream(outputPath),
        mentions: [
          { tag: nameOne, id: one },
          { tag: nameTwo, id: two }
        ]
      },
      threadID,
      () => fs.unlinkSync(outputPath),
      messageID
    );

  } catch (error) {
    console.error("BrotherSister command error:", error);
    api.sendMessage("≿━━━━༺❀༻━━━━≾\n❌ 𝐄𝐫𝐫𝐨𝐫 𝐜𝐫𝐞𝐚𝐭𝐢𝐧𝐠 𝐢𝐦𝐚𝐠𝐞!\n≿━━━━༺❀༻━━━━≾", threadID, messageID);
  }
};


const axios = require('axios');
const style = require('./style');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

const cacheDir = path.join(__dirname, "cache", "ccard");
const cardBgUrl = "https://i.ibb.co/QjpcW7d3/3727b7fc4f76.jpg";

module.exports = {
  config: { credits: "SARDAR RDX",
    name: "ccard",
    version: "1.0.0",
    author: "RDX AGENT",
    countDown: 5,
    role: 0,
    description: "Generate an RDX Bank credit card image",
    category: "fun",
    guide: "{pn}",
    prefix: true
  },

  run: async function({ api, event, Users, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const outputPath = path.join(cacheDir, `card_${senderID}_${Date.now()}.png`);
    const tempPath = path.join(cacheDir, "card_bg.jpg");

    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      if (!fs.existsSync(tempPath)) {
        const response = await axios.get(cardBgUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(tempPath, Buffer.from(response.data));
      }

      const db = require('../../Data/system/database/index.js');
      const bankData = db.prepare('SELECT * FROM bank_system WHERE userId = ?').get(senderID);

      if (!bankData || !bankData.account_number) {
        const regMsg = `╭─────────────╮\n       🏦 𝗥𝗗𝗫 𝗕𝗔𝗡𝗞 𝗟𝗧𝗗. 🏦\n╰─────────────╯\n\n❌ 𝗦𝗼𝗿𝗿𝘆! Aapka bank account nahi bana hua.\n\nℹ️ 𝗖𝗮𝗿𝗱 𝗵𝗮𝘀𝗶𝗹 𝗸𝗮𝗿𝗻𝗲 𝗸𝗲 𝗹𝗶𝘆𝗲:\n1. Pehle account open karein command se: \`.openaccount\`\n2. Details mukammal hone ke baad dubara \`.ccard\` likhein.\n\n━━━━━━━━━━━━━━━`;
        return api.sendMessage(regMsg, threadID, messageID);
      }

      const name = bankData.full_name || "N/A";
      const accountNumber = bankData.account_number;

      const image = await loadImage(tempPath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      // Style settings
      ctx.fillStyle = '#FFFFFF';

      // Card Holder Name
      ctx.font = 'bold 25px Arial';
      ctx.fillText(name.toUpperCase(), 65, 450);

      // Account Number
      ctx.font = 'bold 40px Courier New';
      ctx.fillText(accountNumber, 145, 310);

      // Dates
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const issueDate = `${day}/${month}/${year}`;

      const expiryDate = `${day}/${month}/${year + 5}`;

      ctx.font = 'bold 22px Arial';
      ctx.fillText(issueDate, 250, 345);
      ctx.fillText(expiryDate, 250, 380);

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);

      const msg = `╭─────────────╮\n       💳 𝗥𝗗𝗫 𝗕𝗔𝗡𝗞 𝗖𝗔𝗥𝗗 💳\n╰─────────────╯\n\n👤 𝗔𝗰𝗰𝗼𝘂𝗻𝘁 𝗛𝗼𝗹𝗱𝗲𝗿: ${name}\n🆔 𝗔𝗰𝗰𝗼𝘂𝗻𝘁 𝗡𝗼: ${accountNumber}\n📅 𝗜𝘀𝘀𝘂𝗲 𝗗𝗮𝘁𝗲: ${issueDate}\n⏳ 𝗘𝘅𝗽𝗶𝗿𝗲 𝗗𝗮𝘁𝗲: ${expiryDate}\n\n━━━━━━━━━━━━━━━`;

      return api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch(e) {}
      }, messageID);

    } catch (error) {
      console.error("Card Generation Error:", error);
      return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  }
};


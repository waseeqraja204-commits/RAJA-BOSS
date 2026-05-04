const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const style = require('./style');

const cacheDir = path.join(__dirname, "cache", "rankup");
const remoteBgUrl = "https://i.ibb.co/MkFZt3sH/594446bbfd2a.jpg";

module.exports = {
  config: { credits: "SARDAR RDX",
    name: "rankup",
    version: "2.1.3",
    author: "Sardar RDX",
    countDown: 5,
    role: 0,
    description: "Rankup every 15 messages with rewards",
    category: "system",
    guide: "{pn}",
    prefix: true
  },

  run: async function({ api, event, Users, Currencies }) {
    return this.handleRankup({ api, event, Users, Currencies });
  },

  handleRankup: async function({ api, event, Users, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const outputPath = path.join(cacheDir, `rankup_${threadID}_${senderID}_${Date.now()}.png`);
    const tempPath = path.join(cacheDir, "rankup_bg_hologram.jpg");

    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      if (!fs.existsSync(tempPath)) {
        const response = await axios.get(remoteBgUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(tempPath, Buffer.from(response.data));
      }

      const name = await Users.getNameUser(senderID);
      const userData = await Currencies.getData(senderID);
      const userExp = userData.exp || 0;

      const bankData = (await Currencies.getBank(senderID)) || 0;
      const updatedBankBalance = bankData;

      const hasBankAccount = bankData > 0 || userData.accountno !== undefined;

      const currentLevel = Math.floor(userExp / 15);

      const image = await loadImage(tempPath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      try {
        const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarRes = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const avatarImg = await loadImage(Buffer.from(avatarRes.data));

        ctx.save();
        const size = 120;
        const x = 307; 
        const y = 150; 
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);
        ctx.drawImage(avatarImg, x, y, size, size);
        ctx.restore();
      } catch (e) {}

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';

      ctx.font = "bold 35px Arial";
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ff66';
      ctx.fillText(name.toUpperCase(), 370, 370);

      ctx.font = "bold 38px Arial"; 
      ctx.shadowBlur = 0;
      ctx.fillText(`${currentLevel}`, 200, 450);

      ctx.font = "bold 22px Arial";
      ctx.fillText(`BANK: ${updatedBankBalance}`, 150, 200);

      const accountNo = `PK70RDX${senderID}`;
      ctx.font = "bold 15px Arial";
      ctx.fillStyle = "#ffffff";

      if (hasBankAccount) {
        ctx.fillText(`${accountNo}`, 580, 470);
      } else {
        ctx.fillStyle = "#ff6b6b";
        ctx.fillText(`NO ACCOUNT`, 580, 470);
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillText(` REWARD: 10 COINS`, 575, 200);

      ctx.fillStyle = '#00ff66';
      ctx.font = "bold 30px Arial";
      ctx.fillText("STATUS: ACTIVE", 370, 30);

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);

      const reward = 10;
      const currencyData = await Currencies.getData(senderID);
      await Currencies.setData(senderID, { bank: (currencyData.bank || 0) + reward });
      const updatedBankBalanceFinal = (await Currencies.getBank(senderID)) || 0;

      const content = 
        `  ✨ Congratulations! ✨\n` +
        `  👤 ${name}\n\n` +
        `  🏆 New Level: ${currentLevel}\n` +
        `  💰 Bank Reward: +${reward} Coins\n` +
        `  💳 New Balance: ${updatedBankBalanceFinal.toLocaleString()} Coins\n\n` +
        style.STYLES.dividerSmall + '\n' +
        `   Keep active to earn more!`;

      return api.sendMessage({
        body: style.createSuccess('LEVEL UP!', content),
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch(e) {}

        try {
          const files = fs.readdirSync(cacheDir);
          const userCachePattern = `rankup_${senderID}`;
          for (const file of files) {
            if (file.includes(userCachePattern)) {
              const filePath = path.join(cacheDir, file);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }
          }
        } catch(e) {}
      }); 

    } catch (error) {
      console.error("Rankup Error:", error);
    }
  }
};

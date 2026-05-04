const os = require("os");
const style = require('./style');
const moment = require("moment-timezone");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "upt",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "SARDAR RDX",
    description: "View bot uptime and system load.",
    commandCategory: "system",
    usages: "upt",
    cooldowns: 5,
    dependencies: {
      "axios": "",
      "fs-extra": ""
    }
  },

  run: async function ({ api, event, config }) {
    const { threadID, messageID } = event;
    const uptime = process.uptime();
    const days = Math.floor(uptime / (3600 * 24));
    const hours = Math.floor((uptime % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const time = moment().tz('Asia/Karachi').format('hh:mm:ss A');
    const date = moment().tz('Asia/Karachi').format('DD/MM/YYYY');
    
    const totalMemoryGB = os.totalmem() / 1024 ** 3;
    const freeMemoryGB = os.freemem() / 1024 ** 3;
    const usedMemoryGB = totalMemoryGB - freeMemoryGB;

    const uptMessage = `╭───〔 𝗨𝗣𝗧𝗜𝗠𝗘 〕───╮
│ 🤖 𝗕𝗼𝘁 𝗡𝗮𝗺𝗲: ${config.BOTNAME || 'SARDAR RDX'}
│ ⏳ 𝗨𝗽𝘁𝗶𝗺𝗲: ${days}d ${hours}h ${minutes}m ${seconds}s
├───〔 𝗦𝗬𝗦𝗧𝗘𝗠 〕───┤
│ 📅 𝗗𝗮𝘁𝗲: ${date}
│ ⏰ 𝗧𝗶𝗺𝗲: ${time}
│ 💾 𝗥𝗔𝗠: ${usedMemoryGB.toFixed(2)}GB / ${totalMemoryGB.toFixed(2)}GB
│ ⚡ 𝗦𝘁𝗮𝘁𝘂𝘀: Running Smoothly ✅
╰──────────────────╯`;

    const imgUrl = "https://i.ibb.co/TqwtBwF2/2c307b069cfd.gif";
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const imgPath = path.join(cacheDir, `upt_${Date.now()}.gif`);

    try {
      const response = await axios.get(imgUrl, { responseType: "arraybuffer" });
      await fs.outputFile(imgPath, Buffer.from(response.data));

      return api.sendMessage({
        body: uptMessage,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, messageID);
    } catch (e) {
      return api.sendMessage(uptMessage, threadID, messageID);
    }
  }
};

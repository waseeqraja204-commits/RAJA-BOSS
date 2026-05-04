const os = require("os");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const style = require('./style');

const startTime = new Date();

module.exports = {
  config: {
    name: "uptime",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "SARDAR RDX",
    description: "Check how long the bot has been running.",
    commandCategory: "box",
    usages: "test",
    dependencies: { "axios": "" },
    cooldowns: 5,
    category: 'Utility',
    prefix: true
  },

  run: async function ({ api, event, args }) {
    try {
      const uptimeInSeconds = (new Date() - startTime) / 1000;
      const seconds = uptimeInSeconds;
      const days = Math.floor(seconds / (3600 * 24));
      const hours = Math.floor((seconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secondsLeft = Math.floor(seconds % 60);
      const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${secondsLeft}s`;

      const cpuUsage = os.cpus().map((cpu) => cpu.times.user).reduce((acc, curr) => acc + curr) / os.cpus().length;
      const totalMemoryGB = os.totalmem() / 1024 ** 3;
      const freeMemoryGB = os.freemem() / 1024 ** 3;
      const usedMemoryGB = totalMemoryGB - freeMemoryGB;

      const currentDate = new Date();
      const date = currentDate.toLocaleDateString("en-US");
      const time = currentDate.toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour12: true });

      const timeStart = Date.now();
      await api.sendMessage(style.createInfo('CHECKING', '⚡ Checking system status, please wait...'), event.threadID);
      const ping = Date.now() - timeStart;

      let status = '🟢 Excellent';
      if (ping > 100) status = '🟡 Good';
      if (ping > 300) status = '🟠 Slow';
      if (ping > 500) status = '🔴 Very Slow';

      const content = 
        `  ⏳ Uptime   : ${uptimeFormatted}\n` +
        `  🖥️ OS       : ${os.type()} ${os.arch()}\n` +
        `  ⚙️ Node Ver : ${process.version}\n` +
        `  🧠 CPU     : ${os.cpus()[0].model}\n` +
        `  💾 RAM     : ${usedMemoryGB.toFixed(2)} GB / ${totalMemoryGB.toFixed(2)} GB\n` +
        `  📈 CPU Use : ${cpuUsage.toFixed(1)}%\n` +
        `  🧹 Heap    : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n\n` +
        style.STYLES.separatorSmall + '\n' +
        `  📅 Date    : ${date}\n` +
        `  ⏰ Time    : ${time}\n` +
        `  ⚡ Ping    : ${ping}ms\n` +
        `  ⭐ Status  : ${status}`;

      const imgPath = path.join(__dirname, "cache", "uptime.png");
      const imgUrl = "https://i.ibb.co/TqwtBwF2/2c307b069cfd.gif";

      try {
        const response = await axios.get(imgUrl, { responseType: "arraybuffer" });
        await fs.outputFile(imgPath, Buffer.from(response.data));

        api.sendMessage(
          { body: style.createBox('⚡ SYSTEM INFO', content), attachment: fs.createReadStream(imgPath) },
          event.threadID,
          () => { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); }
        );
      } catch (e) {
        api.sendMessage(style.createBox('⚡ SYSTEM INFO', content), event.threadID);
      }
    } catch (error) {
      console.error("Error retrieving system information:", error);
      api.sendMessage(style.createError('ERROR', 'Unable to retrieve system information.'), event.threadID, event.messageID);
    }
  },
};

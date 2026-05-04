const fs = require('fs-extra');
const style = require('./style');

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'filter',
    aliases: ['clean', 'dbfilter'],
    description: "Filter database and remove inactive groups.",
    usage: 'filter',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, Threads, send }) {
    const { threadID } = event;
    const moment = require("moment-timezone");

    try {
      await send.reply('🔍 𝗖𝗛𝗘𝗖𝗞𝗜𝗡𝗚 𝗔𝗟𝗟 𝗚𝗥𝗢𝗨𝗣𝗦...\nBot is verifying all active groups from Facebook. ⏳');

      const threadList = await api.getThreadList(500, null, ["INBOX"]);
      const activeGroups = threadList.filter(t => t.isGroup);
      const botID = api.getCurrentUserID();

      const db = require('../../Data/system/database/index');
      const allThreads = await Threads.getAll();
      const dbThreadIDs = allThreads.map(t => t.id);

      let cleanedCount = 0;
      let verifiedCount = 0;

      for (const id of dbThreadIDs) {
        if (!id) continue;

        // Find in active groups list
        const apiThread = activeGroups.find(t => t.threadID === id);

        // If not even in thread list, delete it
        if (!apiThread) {
          db.prepare('DELETE FROM threads WHERE id = ?').run(id);
          cleanedCount++;
          continue;
        }

        // Additional check: Verify bot is actually a participant
        // Sometimes thread list preserves threads where we are no longer members
        if (apiThread.participantIDs && !apiThread.participantIDs.includes(botID)) {
          db.prepare('DELETE FROM threads WHERE id = ?').run(id);
          cleanedCount++;
        } else {
          verifiedCount++;
        }
      }

      const time = moment().tz("Asia/Karachi").format("hh:mm:ss A");
      let msg = `╭───〔 🧹 𝗗𝗕 𝗖𝗟𝗘𝗔𝗡𝗘𝗥 〕───╮\n` +
        `│\n` +
        `│ ✅ Emoji Filter Completed!\n` +
        `│ 📊 Verified Active: ${verifiedCount}\n` +
        `│ 🗑️ Removed Inactive: ${cleanedCount}\n` +
        `│ ⚡ Speed: Normal (Optimized)\n` +
        `│\n` +
        `├───────────────────\n` +
        `│ ⏰ Time: ${time}\n` +
        `╰───────────────────╯`;

      return send.reply(msg);

    } catch (error) {
      console.error(error);
      return send.reply('❌ An error occurred while filtering the database.');
    }
  }
};


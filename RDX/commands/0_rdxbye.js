const style = require('./style');
module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'RDXbye',
    aliases: ['botleave', 'leavegroup'],
    description: "Farewell message and bot exit command.",
    usage: 'RDXbye [threadID]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, config }) {
    const { senderID } = event;

    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('❌ Only bot admins can use this command!');
    }

    const targetThreadID = args[0];

    if (!targetThreadID) {
      return send.reply('❌ Please provide Thread ID!\n\nUsage: rdxbye [threadID]');
    }

    if (!/^\d+$/.test(targetThreadID)) {
      return send.reply('❌ Invalid Thread ID! Only numbers allowed.');
    }

    try {
      const byeMessage = `𝐌𝐚𝐫𝐞 𝐎𝐰𝐧𝐞𝐫 𝐍𝐚 𝐌𝐮𝐣𝐡𝐚 𝐋𝐞𝐟𝐭 𝐇𝐨𝐧𝐞 𝐊𝐚 𝐎𝐫𝐝𝐞𝐫 𝐃𝐈𝐀 𝐓𝐨 𝐌𝐚 𝐋𝐞𝐟𝐭 𝐇𝐨 𝐑𝐡𝐚 𝐇𝐮 👋\n\n𝐁𝐲𝐞 𝐁𝐲𝐞 𝐄𝐯𝐞𝐫𝐲𝐨𝐧𝐞! 💔`;

      await api.sendMessage(byeMessage, targetThreadID);

      await new Promise(r => setTimeout(r, 2000));

      const botID = api.getCurrentUserID();
      
      await new Promise((resolve, reject) => {
        api.removeUserFromGroup(botID, targetThreadID, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return send.reply(`✅ Bot has left the group!\nThread ID: ${targetThreadID}`);

    } catch (error) {
      return send.reply(`❌ Failed to leave group: ${error.message || error.error || 'Unknown error'}`);
    }
  }
};


const style = require('./style');
module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'join',
    aliases: ['groups', 'joingroup'],
    description: 'Show groups where bot is added (excludes left groups), join by number',
    usage: 'join [number]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Threads, config }) {
    const { threadID, senderID, messageID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    await send.reply('🔍 𝗖𝗵𝗲𝗰𝗸𝗶𝗻𝗴 𝗔𝗹𝗹 𝗔𝗰𝘁𝗶𝘃𝗲 𝗚𝗿𝗼𝘂𝗽𝘀... 𝗣𝗹𝗲𝗮𝘀𝗲 𝘄𝗮𝗶𝘁.');
    
    let activeThreads = [];
    try {
      const threadList = await api.getThreadList(500, null, ["INBOX"]);
      activeThreads = threadList.filter(t => t.isGroup).map(t => ({
        id: t.threadID,
        name: t.threadName || 'Unnamed Group',
        participantIDs: t.participantIDs || []
      }));
    } catch (e) {
      console.error("Error fetching thread list:", e);
      return send.reply('❌ Failed to fetch group list from Facebook.');
    }
    
    if (activeThreads.length === 0) {
      return send.reply('❌ No active groups found where the bot is a member.');
    }
    
    if (!args[0]) {
      let msg = `✨ 𝗔𝗖𝗧𝗜𝗩𝗘 𝗚𝗿𝗼𝘂𝗽𝘀 𝗟𝗶𝘀𝘁 (${activeThreads.length}) ✨\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      for (let i = 0; i < activeThreads.length; i++) {
        const thread = activeThreads[i];
        const isOwnerIn = thread.participantIDs.includes(senderID);
        const emoji = isOwnerIn ? '✅' : '❌';
        
        msg += `[ ${i + 1} ] ${emoji} 👥 ${thread.name}\n`;
        msg += `🆔 𝗧𝗜𝗗: ${thread.id}\n`;
        msg += `───────────────────────\n`;
      }
      
      msg += `\n📝 𝗥𝗲𝗽𝗹𝘆 𝘄𝗶𝘁𝗵 𝘁𝗵𝗲 𝗻𝘂𝗺𝗯𝗲𝗿 (𝟭-${activeThreads.length}) 𝘁𝗼 𝗮𝗱𝗱 𝘆𝗼𝘂 𝘁𝗼 𝘁𝗵𝗮𝘁 𝗴𝗿𝗼𝘂𝗽.`;
      
      const sentMsg = await send.reply(msg);
      
      if (global.client && global.client.replies) {
        global.client.replies.set(sentMsg.messageID, {
          commandName: 'join',
          author: senderID,
          threads: activeThreads,
          type: 'select'
        });
      }
      return;
    }
    
    const input = args[0] ? args[0].split(',').map(n => parseInt(n.trim())) : [];
    
    if (input.length > 0) {
      let successCount = 0;
      let failCount = 0;
      let results = [];

      for (const num of input) {
        if (isNaN(num) || num < 1 || num > activeThreads.length) {
          results.push(`❌ Number ${num} is invalid.`);
          failCount++;
          continue;
        }

        const selectedThread = activeThreads[num - 1];
        try {
          await api.addUserToGroup(senderID, selectedThread.id);
          results.push(`✅ Added to: "${selectedThread.name}"`);
          successCount++;
        } catch (error) {
          results.push(`❌ Failed for "${selectedThread.name}": ${error.message}`);
          failCount++;
        }
      }
      
      return send.reply(`📊 **Join Results:**\n━━━━━━━━━━━━━━━━━━━━━━━\n${results.join('\n')}\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`);
    }
  },
  
  handleReply: async function ({ api, event, send, config, Threads }) {
    const { body, senderID, messageReply } = event;
    if (!global.client.replies.has(messageReply.messageID)) return;
    
    const replyData = global.client.replies.get(messageReply.messageID);
    if (replyData.commandName !== 'join' || replyData.author !== senderID) return;
    
    const inputs = body.split(',').map(n => parseInt(n.trim()));
    let successCount = 0;
    let failCount = 0;
    let results = [];

    for (const num of inputs) {
      if (isNaN(num) || num < 1 || num > replyData.threads.length) {
        results.push(`❌ Number ${num} is invalid.`);
        failCount++;
        continue;
      }

      const selectedThread = replyData.threads[num - 1];
      try {
        // Check if bot is admin first
        const threadInfo = await api.getThreadInfo(selectedThread.id);
        const botID = api.getCurrentUserID();
        const isAdmin = threadInfo.adminIDs.some(a => a.id === botID);

        if (threadInfo.approvalMode && !isAdmin) {
          results.push(`⚠️ Approval Required for: "${selectedThread.name}"`);
          try {
            const userName = (await api.getUserInfo(senderID))[senderID].name;
            const bodyMsg = `📢 **𝗔𝗱𝗺𝗶𝗻 𝗔𝘁𝘁𝗲𝗻𝘁𝗶𝗼𝗻!**\n\nBot Owner/Admin is group mein add hona chahte hain. Kindly approval check karein aur unhein add karein.\n\n👤 **Name:** ${userName}\n🆔 **UID:** ${senderID}`;
            await api.shareContact(bodyMsg, senderID, selectedThread.id);
          } catch (e) {}
          failCount++;
          continue;
        }

        await api.addUserToGroup(senderID, selectedThread.id);
        results.push(`✅ Added to: "${selectedThread.name}"`);
        successCount++;
      } catch (error) {
        results.push(`❌ Failed for "${selectedThread.name}": ${error.message}`);
        failCount++;
      }
    }

    await send.reply(`📊 **Join Results:**\n━━━━━━━━━━━━━━━━━━━━━━━\n${results.join('\n')}\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`);
    global.client.replies.delete(messageReply.messageID);
  }
};

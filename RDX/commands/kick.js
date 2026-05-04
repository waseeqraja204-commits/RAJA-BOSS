const style = require('./style');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'kick',
    aliases: ['remove'],
    description: "Kick a user from the group.",
    usage: 'kick @user/uid',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Users, config }) {
    const { threadID, senderID, mentions } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const botID = api.getCurrentUserID();
    
    if (!adminIDs.includes(botID)) {
      const content = `  ❌ Bot must be a group admin to kick members\n\n  💡 Make the bot admin first`;
      return send.reply(style.createError('PERMISSION DENIED', content));
    }
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      const content = `  ❌ Only group admins can use this command`;
      return send.reply(style.createError('PERMISSION DENIED', content));
    }
    
    let uid = '';
    
    if (mentions && Object.keys(mentions).length > 0) {
      const mentionIDs = Object.keys(mentions).filter(id => id && id !== "null");
      if (mentionIDs.length > 0) {
        uid = mentionIDs[0];
      }
    }
    
    if (!uid && args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
    } else if (!uid && event.messageReply) {
      uid = event.messageReply.senderID;
    }

    if (!uid) {
      const content = `  ❌ Please mention a user, reply to their message, or provide their UID\n\n  💡 Usage: ${config.PREFIX}kick @user`;
      return send.reply(style.createError('INVALID INPUT', content));
    }
    
    if (uid === botID) {
      const content = `  ❌ Cannot kick the bot itself`;
      return send.reply(style.createError('INVALID ACTION', content));
    }
    
    if (adminIDs.includes(uid) && !isBotAdmin) {
      const content = `  ❌ Cannot kick a group admin`;
      return send.reply(style.createError('PERMISSION DENIED', content));
    }
    
    try {
      await api.removeUserFromGroup(uid, threadID);
      
      let name = 'User';
      try {
        name = await Users.getValidName(uid, 'User');
      } catch {
        try {
          const info = await api.getUserInfo(uid);
          const rawName = info[uid]?.name;
          if (rawName && rawName.toLowerCase() !== 'facebook user' && rawName.toLowerCase() !== 'facebook') {
            name = rawName;
          }
        } catch {}
      }
      
      const content = 
        `  👤 User  : ${name}\n` +
        `  🆔 UID   : ${uid}\n\n` +
        style.STYLES.dividerSmall + '\n' +
        `   User has been removed from the group`;
      
      return send.reply(style.createBox('👢 USER KICKED', content));
    } catch (error) {
      const content = `  ❌ Failed to kick user: ${error.message}`;
      return send.reply(style.createError('ERROR', content));
    }
  }
};


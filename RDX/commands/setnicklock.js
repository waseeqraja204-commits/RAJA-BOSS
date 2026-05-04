const fs = require('fs-extra');
const path = require('path');

const nicklockPath = path.join(__dirname, './cache/data/nicklock.json');
const inboxNickPath = path.join(__dirname, './cache/data/inboxnick.json');

function getNicklockData() {
  try {
    fs.ensureDirSync(path.dirname(nicklockPath));
    if (!fs.existsSync(nicklockPath)) {
      fs.writeJsonSync(nicklockPath, { locks: {}, lockAll: null }, { spaces: 2 });
    }
    return fs.readJsonSync(nicklockPath);
  } catch {
    return { locks: {}, lockAll: null };
  }
}

function saveNicklockData(data) {
  try {
    fs.ensureDirSync(path.dirname(nicklockPath));
    fs.writeJsonSync(nicklockPath, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save nicklock data:', err);
  }
}

function getInboxNickData() {
  try {
    fs.ensureDirSync(path.dirname(inboxNickPath));
    if (!fs.existsSync(inboxNickPath)) {
      fs.writeJsonSync(inboxNickPath, {}, { spaces: 2 });
    }
    return fs.readJsonSync(inboxNickPath);
  } catch {
    return {};
  }
}

function saveInboxNickData(data) {
  try {
    fs.ensureDirSync(path.dirname(inboxNickPath));
    fs.writeJsonSync(inboxNickPath, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save inbox nick data:', err);
  }
}

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'setnick',
    aliases: ['locknickuser', 'setuserNick', 'nickname'],
    description: "Set custom nickname for user (works in inbox & group)",
    usage: 'setnick [name] or setnick @user [name] or setnick [uid] [name] or setnick off',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, config }) {
    const { mentions, isGroup, threadID, senderID } = event;
    const botID = api.getCurrentUserID();

    const isBotAdmin = config.ADMINBOT.includes(senderID);
    if (!isBotAdmin) {
      return send.reply('❌ Only bot admins can use this command.');
    }

    const data = getNicklockData();
    const inboxData = getInboxNickData();

    if (!args[0]) {
      // Show all nicknames for this chat
      let msg = '📝 Custom Nicknames\n─────────────────\n';

      if (isGroup) {
        const threadLocks = Object.entries(data.locks)
          .filter(([key]) => key.startsWith(threadID))
          .map(([key, value]) => ({ uid: key.split('_')[1], ...value }));

        if (threadLocks.length === 0) {
          msg = '📝 No custom nicknames set in this group.\n\nUsage:\n• setnick @user [name]\n• setnick [uid] [name]\n• setnick off [uid/@user]';
        } else {
          for (const lock of threadLocks) {
            let name = 'User';
            try {
              const info = await api.getUserInfo(lock.uid);
              name = info[lock.uid]?.name || info[lock.uid]?.firstName || 'User';
            } catch {}
            msg += `\n${name}\nNickname: ${lock.nickname}\n`;
          }
        }
      } else {
        const inboxNick = inboxData[threadID];
        if (inboxNick) {
          msg += `\nYour Nickname: ${inboxNick.nickname}\nSet by: ${inboxNick.setBy}`;
        } else {
          msg = '📝 No custom nickname set for this inbox.\n\nUsage:\n• setnick [name] - Set your nickname\n• setnick off - Remove nickname';
        }
      }

      return send.reply(msg);
    }

    // Check if removing
    if (args[0].toLowerCase() === 'off') {
      if (isGroup) {
        let targetID = null;
        if (Object.keys(mentions).length > 0) {
          targetID = Object.keys(mentions)[0];
        } else if (args[1]) {
          targetID = args[1].replace(/[^0-9]/g, '');
        }

        if (targetID) {
          const key = `${threadID}_${targetID}`;
          if (data.locks[key]) {
            delete data.locks[key];
            saveNicklockData(data);
            return send.reply('✅ Nickname removed.');
          }
        }
        return send.reply('❌ No nickname found to remove.');
      } else {
        // Inbox - remove own nickname
        if (inboxData[threadID]) {
          delete inboxData[threadID];
          saveInboxNickData(inboxData);
          return send.reply('✅ Nickname removed from this inbox.');
        }
        return send.reply('❌ No nickname set.');
      }
    }

    // Set nickname
    let targetID = null;
    let nickname = '';

    if (isGroup) {
      // Group: lock user nickname
      if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        nickname = args.slice(1).join(' ');
      } else if (args[0] && args[1]) {
        targetID = args[0].replace(/[^0-9]/g, '');
        nickname = args.slice(1).join(' ');
      }

      if (!targetID || !nickname) {
        return send.reply('❌ Usage: setnick @user [name] or setnick [uid] [name]');
      }

      const key = `${threadID}_${targetID}`;
      data.locks[key] = {
        nickname: nickname,
        lockedBy: senderID,
        lockedAt: Date.now()
      };
      saveNicklockData(data);

      // Also set actual nickname on Facebook
      try {
        await api.changeNickname(nickname, threadID, targetID);
      } catch (err) {}

      let name = 'User';
      try {
        const info = await api.getUserInfo(targetID);
        name = info[targetID]?.name || info[targetID]?.firstName || 'User';
      } catch {}

      return send.reply(`✅ Nickname Locked\nUser: ${name}\nNickname: ${nickname}`);
    } else {
      // Inbox: store custom nickname (not actual FB nickname due to E2E)
      nickname = args.join(' ');

      inboxData[threadID] = {
        nickname: nickname,
        setBy: senderID,
        setAt: Date.now()
      };
      saveInboxNickData(inboxData);

      return send.reply(`✅ Nickname Set\n\nThis nickname will be used when bot mentions you in messages.\n\nNickname: ${nickname}\n\nNote: Due to E2E encryption, actual FB nickname cannot be changed in inbox.`);
    }
  },

  getInboxNick: function(threadID) {
    const data = getInboxNickData();
    return data[threadID]?.nickname || null;
  }
};
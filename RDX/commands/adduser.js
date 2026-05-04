module.exports = {
    config: {
        credits: "SARDAR RDX",
        name: 'adduser',
        aliases: ['add', 'addmember'],
        description: "Add a user to the group by link or UID.",
        usage: 'adduser [link/uid]',
        category: 'Group',
        groupOnly: true,
        prefix: true
    },

    async run({ api, event, args, send, config }) {
        const { threadID, senderID } = event;

        const threadInfo = await api.getThreadInfo(threadID);
        const adminIDs = threadInfo.adminIDs.map(a => a.id);
        const botID = api.getCurrentUserID();

        // Check if bot is admin
        const isBotAdminInGroup = adminIDs.includes(botID);

        const isGroupAdmin = adminIDs.includes(senderID);
        const isBotAdmin = config.ADMINBOT.includes(senderID);

        if (!isGroupAdmin && !isBotAdmin) {
            return send.reply('❌ Only group admins can use this command.');
        }

        let uid = args[0];

        if (!uid) {
            return send.reply(`📝 Usage: adduser [link/uid]\n\nExample:\n• adduser 100009012838085\n• adduser https://facebook.com/user/100009012838085`);
        }

        // Extract UID from Facebook link
        const fbLinkPattern = /(?:facebook\.com\/|fb\.com\/)(?:user\/|profile\.php\?id=)?(\d+)/i;
        const match = uid.match(fbLinkPattern);
        if (match) {
            uid = match[1];
        }

        // Validate UID
        if (!/^\d+$/.test(uid)) {
            return send.reply('❌ Please provide a valid UID or Facebook link.');
        }

        if (threadInfo.participantIDs.includes(uid)) {
            return send.reply('⚠️ User is already in this group.');
        }

        try {
            // Try to add user
            await api.addUserToGroup(uid, threadID);

            // Get user info
            let name = 'Unknown';
            try {
                const info = await api.getUserInfo(uid);
                name = info[uid]?.name || 'Unknown';
            } catch { }

            // Success message with custom style
            const successMsg = `
╔═══════════════════════════╗
║   ✅ 𝗨𝗦𝗘𝗥 𝗔𝗗𝗗𝗘𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗟𝗬   ║
╠═══════════════════════════╣
║ 👤 ɴᴀᴍᴇ: ${name}
║ 🆔 ᴜɪᴅ: ${uid}
║ 💬 ɢʀᴏᴜᴘ: ${threadInfo.name}
╚═══════════════════════════╝
      `.trim();

            return send.reply(successMsg);

        } catch (error) {
            const errorMsg = error.errorDescription || error.message || "";

            // If bot is not admin, send notification to admins
            if (!isBotAdminInGroup) {
                try {
                    const info = await api.getUserInfo(uid);
                    const name = info[uid]?.name || 'Unknown';

                    const notifyMsg = `
╔═══════════════════════════╗
║   ⚠️ 𝗔𝗗𝗗 𝗥𝗘𝗤𝗨𝗘𝗦𝗧 𝗙𝗔𝗜𝗟𝗘𝗗   ║
╠═══════════════════════════╣
║ 👤 ᴜꜱᴇʀ: ${name}
║ 🆔 ᴜɪᴅ: ${uid}
║ ❌ ʀᴇᴀꜱᴏɴ: ʙᴏᴛ ɪꜱ ɴᴏᴛ ᴀᴅᴍɪɴ
║
║ 📌 ᴘʟᴇᴀꜱᴇ ᴍᴀɴᴜᴀʟʟʏ ᴀᴅᴅ 
║    ᴜꜱᴇʀ ᴏʀ ᴍᴀᴋᴇ ʙᴏᴛ ᴀᴅᴍɪɴ
╚═══════════════════════════╝
          `.trim();

                    await api.sendMessage(notifyMsg, threadID);
                    return send.reply(`⚠️ Bot admin nahi hai isliye direct add nahi kar saka. Group admins ko notification bhej diya gaya hai.`);
                } catch (err) {
                    return send.reply(`❌ Failed to add user and notify admins.`);
                }
            }

            return send.reply(`❌ Failed to add user: ${errorMsg || 'Privacy settings may be preventing this.'}`);
        }
    }
};

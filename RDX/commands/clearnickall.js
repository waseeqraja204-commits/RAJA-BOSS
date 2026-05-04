module.exports = {
    config: {
        credits: "SARDAR RDX",
        name: 'clearnickall',
        aliases: ['clearnickall', 'clearnicks', 'resetnickall', 'removenickall'],
        description: "Clear nickname for ALL group members (admin only).",
        usage: 'clearnickall',
        category: 'Group',
        groupOnly: true,
        prefix: true,
        adminOnly: true
    },

    async run({ api, event, args, send, config }) {
        const { threadID, senderID } = event;

        const threadInfo = await api.getThreadInfo(threadID);

        const isGroupAdmin = threadInfo.adminIDs.some(a => a.id === senderID);
        const isBotAdmin = config.ADMINBOT?.includes(senderID);

        // Only bot admins can use this command
        if (!isBotAdmin) {
            return; // Silently ignore
        }

        const participants = threadInfo.participantIDs;
        const botID = api.getCurrentUserID();

        // Filter out bot's own ID
        const membersToUpdate = participants.filter(id => id !== botID);

        let successCount = 0;
        let failCount = 0;

        // Send initial message
        await send.reply(`🔄 Clearing nickname for ${membersToUpdate.length} members...`);

        for (const uid of membersToUpdate) {
            try {
                // Set nickname to empty string to clear it
                await api.changeNickname("", threadID, uid);
                successCount++;

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                failCount++;
            }
        }

        return send.reply(`╔════════════════════════════╗
║   ✅ CLEAR NICKNAME COMPLETE   
╠════════════════════════════╣
║ 👥 Total Members: ${membersToUpdate.length}
║ ✅ Cleared: ${successCount}
║ ❌ Failed: ${failCount}
╠════════════════════════════╣
║ 📝 All nicknames cleared!
╚════════════════════════════╝`);
    }
};

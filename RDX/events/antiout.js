const logs = require('../../Data/utility/logs');

module.exports = {
    config: {
        credits: "SARDAR RDX",
        name: 'antiout',
        eventType: ['log:unsubscribe'],
        description: 'Auto add back members who leave (Anti-Out)'
    },

    async run({ api, event, Threads, logMessageData, logMessageType }) {
        const { threadID, author } = event;
        const leftParticipantFbId = logMessageData.leftParticipantFbId;
        const botID = api.getCurrentUserID();

        // Don't trigger if the bot left the group
        if (leftParticipantFbId === botID) {
            return;
        }

        // Get thread settings
        const settings = Threads.getSettings(threadID);

        // Check if antiout is enabled
        if (!settings || !settings.antiout) {
            return;
        }

        logs.info('ANTIOUT', `Member left: ${leftParticipantFbId} from thread ${threadID}, adding back...`);

        try {
            // Add the member back to the group
            await api.addUserToGroup(leftParticipantFbId, threadID);

            // Get user info for notification
            let userName = 'Unknown';
            try {
                const userInfo = await api.getUserInfo(leftParticipantFbId);
                userName = userInfo[leftParticipantFbId]?.name || 'Unknown';
            } catch (e) { }

            // Send notification to group
            api.sendMessage(`⚠️ Anti-Out Alert!\n\n👤 ${userName} tried to leave and has been added back to the group.`, threadID);

            logs.info('ANTIOUT', `Successfully added back user: ${leftParticipantFbId}`);
        } catch (error) {
            logs.error('ANTIOUT', `Failed to add back user: ${error.message}`);

            // Try to notify group about the failure
            try {
                api.sendMessage(`⚠️ Anti-Out Alert!\n\nFailed to add back the member. They may have strict privacy settings or the bot is not an admin.`, threadID);
            } catch (e) { }
        }
    }
};

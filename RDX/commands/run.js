module.exports = {
    config: {
        credits: "SARDAR RDX",
        name: "run",
        aliases: ["execute", "runcmd"],
        description: "Run a command in another group using bot's ID",
        usage: "run <group-id> <command> [args]",
        category: "Tools",
        prefix: false,
        adminOnly: true
    },

    async run({ api, event, args, send, config, client, Users, Threads, Currencies }) {
        const { senderID, threadID } = event;

        if (args.length < 2) {
            return send.reply(`❌ Usage: ${config.PREFIX}run <group-id> <command> [args]\n\nExample:\n${config.PREFIX}run 123456789 help\n${config.PREFIX}run 123456789 kick @user`);
        }

        const targetThreadID = args[0];
        const commandToRun = args[1].toLowerCase();
        const commandArgs = args.slice(2);

        if (!/^\d{6,}$/.test(targetThreadID)) {
            return send.reply("❌ Invalid Group ID. Enter a valid numeric thread ID.");
        }

        const command = client.commands.get(commandToRun);
        if (!command) {
            return send.reply(`❌ Command "${commandToRun}" not found in bot commands.`);
        }

        try {
            if (command.config.groupOnly) {
                const threadInfo = await api.getThreadInfo(targetThreadID);
                if (!threadInfo) {
                    return send.reply("❌ This command can only be used in groups.");
                }
            }
        } catch (e) {
            // Allow execution
        }

        const mockEvent = {
            threadID: targetThreadID,
            senderID: api.getCurrentUserID(),
            isGroup: true,
            messageID: "run_" + Date.now(),
            body: (config.PREFIX || '.') + commandToRun + (commandArgs.length > 0 ? ' ' + commandArgs.join(' ') : ''),
            attachments: [],
            mentions: {},
            type: 'message'
        };

        const mockSend = {
            reply: async (msg) => {
                try {
                    await api.sendMessage(msg, targetThreadID);
                    return { messageID: "sent_" + Date.now() };
                } catch (e) {
                    throw new Error("Failed to send to target group: " + e.message);
                }
            },
            async: async (msg) => {
                try {
                    await api.sendMessage(msg, targetThreadID);
                } catch (e) {
                    throw new Error("Failed to send to target group: " + e.message);
                }
            }
        };

        try {
            await command.run({
                api,
                event: mockEvent,
                args: commandArgs,
                send: mockSend,
                Users,
                Threads,
                Currencies,
                config,
                client,
                commandName: commandToRun,
                prefix: config.PREFIX
            });

            send.reply(`✅ Command "${commandToRun}" executed successfully in group ${targetThreadID}!`);
        } catch (error) {
            send.reply(`❌ Error running command: ${error.message}`);
        }
    }
};
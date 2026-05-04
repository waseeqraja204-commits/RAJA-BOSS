module.exports = {
  config: {
    name: 'mybank',
    aliases: ['mymb', 'managebank'],
    description: "Manage bank members and view all accounts.",
    credits: "SARDAR RDX",
    usage: 'mybank | mybank remove [UID/ACC]',
    category: 'Admin',
    prefix: true
  },

  async run({ api, event, args, send, Users, config, Currencies }) {
    const { senderID, threadID, messageID } = event;
    const db = require('../../Data/system/database/index.js');
const style = require('./style');
    const isOwner = config.ADMINBOT.includes(senderID);

    try {
      // Fetch data first to handle indices
      const accounts = db.prepare('SELECT * FROM bank_system WHERE account_number IS NOT NULL ORDER BY bank_balance DESC').all();

      // Handle Remove Functionality (Owner Only)
      if (args[0] === 'remove' || args[0] === 'delete') {
        if (!isOwner) {
          return send.reply("❌ Sirf Bot Owner hi members ko bank se remove kar sakte hain.");
        }

        if (accounts.length === 0) {
          return send.reply("⚠️ Bank database mein koi accounts nahi mile.");
        }

        const targets = args.slice(1);
        if (targets.length === 0) {
          return send.reply("⚠️ Please provide Numbers (e.g., 1,2,5) remove karne ke liye.\nUsage: mybank remove 1,2,3");
        }

        // Process input which could be "1,2,3" or "1 2 3"
        const input = targets.join(' ').replace(/,/g, ' ');
        const indices = input.split(/\s+/).map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n));
        
        if (indices.length === 0) {
          return send.reply("❌ Invalid numbers provided.");
        }

        let removedCount = 0;
        let removedDetails = "";

        const statusMsg = await send.reply(`⏳ Processing removal of ${removedCount} members... Please wait while I clear database records and reset progress.`);

        for (const index of indices) {
          if (accounts[index]) {
            const account = accounts[index];
            
            // Artificial delay for "tasali" and thoroughness
            await new Promise(resolve => setTimeout(resolve, 1500));

            db.prepare('DELETE FROM bank_system WHERE userId = ?').run(account.userId);
            
            // Clear user currency, data, and level (exp)
            if (typeof Currencies !== 'undefined' && Currencies.setData) {
              await Currencies.setData(account.userId, { 
                balance: 0,
                bank: 0,
                exp: 0 
              });
            }
            
            // Also ensure global user data/exp is cleared if the framework uses it
            try {
               db.prepare('UPDATE currencies SET exp = 0, balance = 0, bank = 0 WHERE id = ?').run(account.userId);
            } catch (e) {}

            removedDetails += `\n- ${account.full_name} (${account.userId})`;
          }
        }

        return api.editMessage(`✅ Successfully removed ${removedCount} members from bank!${removedDetails}\n\nNote: Database mukammal tor par clear ho chuka hai. Yeh users ab zero se start karein ge.`, statusMsg.messageID);
      }

      if (accounts.length === 0) {
        return send.reply("⚠️ Bank database mein koi accounts nahi mile.");
      }

      let msg = "🏦 ━━━━ 𝐑𝐃𝐗 𝐁𝐀𝐍𝐊 𝐌𝐄𝐌𝐁𝐄𝐑𝐒 ━━━━ 🏦\n\n";
      
      for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i];
        const name = acc.full_name || (await Users.getNameUser(acc.userId));
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "👤";
        
        msg += `${medal} ${i + 1}. ${name}\n`;
        msg += `   🆔 UID: ${acc.userId}\n`;
        msg += `   🏦 ACC: ${acc.account_number}\n`;
        msg += `   💰 BAL: ${acc.bank_balance.toLocaleString()} Coins\n`;
        msg += "───────────────────\n";
      }

      msg += `\n📊 Total Members: ${accounts.length}`;
      if (isOwner) {
        msg += `\n\n💡 Tip: Use "mybank remove [UID]" to delete a member.`;
      }

      return send.reply(msg);
    } catch (error) {
      console.error(error);
      return send.reply("❌ Bank details fetch karne mein masla hua.");
    }
  }
};


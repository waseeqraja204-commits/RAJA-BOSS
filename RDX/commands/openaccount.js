module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'openaccount',
    aliases: ['register', 'openacc'],
    description: "Open a new bank account or view statement.",
    usage: 'openaccount',
    category: 'Economy',
    prefix: true
  },

  async run({ api, event, send, Currencies }) {
    const { senderID, threadID } = event;
    const Currencies_Fix = Currencies;
    const bankData = await Currencies_Fix.getBankData(senderID);

    if (bankData && bankData.account_number && bankData.registration_step === 0) {
      const avatarURL = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const fs = require('fs-extra');
const style = require('./style');
      const axios = require('axios');
      const path = require('path');
      
      const cacheDir = path.join(__dirname, 'cache');
      await fs.ensureDir(cacheDir);
      const avatarPath = path.join(cacheDir, `avatar_${senderID}.png`);

      try {
        const response = await axios.get(avatarURL, { responseType: 'arraybuffer' });
        await fs.writeFile(avatarPath, Buffer.from(response.data));
      } catch (e) {}

      const statementMsg = `
╔═══════════════════╗
║    🏦 𝐑𝐃𝐗 𝐁𝐀𝐍𝐊 𝐋𝐓𝐃.    ║
╠═══════════════════╣
║     𝐁𝐀𝐍𝐊 𝐒𝐓𝐀𝐓𝐄𝐌𝐄𝐍𝐓      ║
╚═══════════════════╝

❌ Aapka account pehle se hi bana hua hai!

👤 **ACCOUNT INFORMATION**
─────────────────────
🆔 **Account No :** \`${bankData.account_number}\`
👤 **Full Name  :** ${bankData.full_name || "N/A"}
👴 **Father Name:** ${bankData.father_name || "N/A"}
💰 **Bank Balance:** ${bankData.bank_balance || 0} Coins
🎂 **Age        :** ${bankData.age || "N/A"}
🏙️ **Location   :** ${bankData.city || "N/A"}
─────────────────────

💳 *Aap mazeed transactions ke liye bank commands istemal kar sakte hain.*
      `.trim();

      const msgObj = { body: statementMsg };
      if (require('fs').existsSync(avatarPath)) {
        msgObj.attachment = require('fs').createReadStream(avatarPath);
      }

      await api.sendMessage(msgObj, threadID);
      try { if(require('fs').existsSync(avatarPath)) require('fs').unlinkSync(avatarPath); } catch(e) {}
      return;
    }

    // Start registration
    await Currencies_Fix.updateRegistrationStep(senderID, 1);
    const sentMsg = await send.reply("🏦 *Bank Account Registration*\n\nStep 1: Aapka poora naam kya hai?");
    
    if (sentMsg && global.client && global.client.replies) {
      global.client.replies.set(sentMsg.messageID, {
        commandName: 'openaccount',
        author: senderID,
        step: 1
      });
    }
  },

  handleReply: async function ({ api, event, send, Currencies, handleReply }) {
    const { body, senderID, messageReply } = event;
    if (!messageReply || !global.client.replies.has(messageReply.messageID)) return;

    const replyData = global.client.replies.get(messageReply.messageID);
    if (replyData.commandName !== 'openaccount' || replyData.author !== senderID) return;

    const Currencies_Fix = Currencies;
    const currentData = await Currencies_Fix.getBankData(senderID) || {};
    const step = replyData.step;
    let nextMsg = "";
    let nextStep = step + 1;
    const updateData = {};

    switch (step) {
      case 1: // Name received, ask for Father's Name
        updateData.full_name = body;
        nextMsg = `✅ Aapka Naam "${body}" note kar liya gaya hai.\n\nStep 2: Aapke Walid (Father) ka naam kya hai?`;
        break;
      case 2: // Father's Name received, ask for Age
        updateData.father_name = body;
        nextMsg = `✅ Walid ka Naam "${body}" note kar liya gaya hai.\n\nStep 3: Aapki Umar (Age) kitni hai?`;
        break;
      case 3: // Age received, ask for City
        if (isNaN(body)) return send.reply("❌ Umar sirf numbers mein honi chahiye. Dobara likhein:");
        updateData.age = parseInt(body);
        nextMsg = `✅ Umar "${body}" note kar li gayi hai.\n\nStep 4: Aap kis Shehar (City) se hain?`;
        break;
      case 4: // City received, finish registration
        updateData.city = body;
        updateData.bank_balance = 100; // Reward 100 coins
        const accNum = `PK70RDX${senderID}`;
        updateData.account_number = accNum;
        updateData.registration_step = 0; // Reset step as finished
        
        await Currencies_Fix.updateRegistrationStep(senderID, 0, updateData);
        
        const finalMsg = `
╔═══════════════════╗
║    🏦 𝐑𝐃𝐗 𝐁𝐀𝐍𝐊 𝐋𝐓𝐃.    ║
╠═══════════════════╣
║  𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐓𝐇𝐄 𝐅𝐀𝐌𝐈𝐋𝐘  ║
╚═══════════════════╝

✨ *MUBARAK HO!* ✨
Aapka account kamyabi se active kar diya gaya hai.
🎁 **Reward:** Aapko account kholne par **100 Coins** ka free bonus mila hai!

👤 **ACCOUNT HOLDER DETAILS**
─────────────────────
🆔 **Account No :** \`${accNum}\`
👤 **Full Name  :** ${currentData.full_name || updateData.full_name}
👴 **Father Name:** ${currentData.father_name || updateData.father_name}
💰 **Bank Balance:** 100 Coins
🎂 **User Age   :** ${currentData.age || updateData.age}
🏙️ **Location   :** ${body}
📅 **Reg. Date  :** ${new Date().toLocaleDateString()}
─────────────────────

💳 *Ab aap apne coins ko RDX Bank mein mehfooz kar sakte hain aur interest bhi hasil kar sakte hain!*

🙏 *Hamari khidmaat istemal karne ka shukria!*
      `.trim();
        
        api.unsendMessage(messageReply.messageID).catch(() => {});
        global.client.replies.delete(messageReply.messageID);
        
        await send.reply(finalMsg);

        const guideMsg = `
🏦 𝗥𝗗𝗫 𝗕𝗔𝗡𝗞 - 𝗨𝗦𝗘𝗥 𝗚𝗨𝗜𝗗𝗘
─────────────────────
Mubarak ho! Aapka account ban chuka hai. Ab aap ye commands istemal kar sakte hain:

💰 **EARN COINS:**
• \`daily\` - Rozana reward hasil karein (Direct Bank mein).
• \`work\` - Kaam karke coins kamayein (Direct Bank mein).

📊 **MANAGE ACCOUNT:**
• \`balance\` - Apna Wallet aur Bank balance check karein.
• \`withdraw [amount]\` - Bank se paise nikal kar wallet mein layein.
• \`deposit [amount]\` - Wallet se paise bank mein jama karein.

💳 **BANKING FEATURES:**
• \`openaccount\` - Apni detailed bank statement check karein.
• \`transfer [@user] [amount]\` - Dusre users ko coins bhejein.

💡 **TIP:** Bank mein paise rakhne par aapko hourly bonus bhi milta hai!
─────────────────────
*RDX Bank - Aapka Paisa, Hamari Zimmedari!*`.trim();

        return send.reply(guideMsg);
    }

    // Update DB and move to next step
    await Currencies_Fix.updateRegistrationStep(senderID, nextStep, updateData);
    
    const nextSentMsg = await send.reply(nextMsg);
    api.unsendMessage(messageReply.messageID).catch(() => {});
    global.client.replies.delete(messageReply.messageID);

    if (nextSentMsg && global.client && global.client.replies) {
      global.client.replies.set(nextSentMsg.messageID, {
        commandName: 'openaccount',
        author: senderID,
        step: nextStep
      });
    }
  }
};


const style = require('./style');
module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'flirt',
    aliases: ['rizz', 'pickup'],
    description: "Random flirt lines and pickup jokes.",
    usage: 'flirt @user',
    category: 'Fun',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, send, Users }) {
    const { threadID, messageID, senderID, mentions } = event;
    
    let targetID = senderID;
    
    if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (event.messageReply) {
      targetID = event.messageReply.senderID;
    } else {
      return send.reply('Please mention someone or reply to their message.\n\nUsage: flirt @user');
    }
    
    try {
      let senderName = 'Unknown';
      let targetName = 'Unknown';
      
      try {
        senderName = await Users.getNameUser(senderID);
        targetName = await Users.getNameUser(targetID);
      } catch {}
      
      const flirtMessages = [
        `${targetName}, are you a magician? Because whenever I look at you, everyone else disappears 💖`,
        `${targetName}, do you have a map? Because I just got lost in your eyes 😍`,
        `${targetName}, are you a camera? Because every time I look at you, I smile 📸💕`,
        `If beauty were time, ${targetName}, you'd be an eternity ⏰✨`,
        `${targetName}, did it hurt when you fell from heaven? 👼💝`,
        `${targetName}, your smile just lit up the whole room 🌟`,
        `Is your name Google? Because ${targetName}, you have everything I've been searching for 🔍💖`,
        `${targetName}, if you were a vegetable, you'd be a cute-cumber 🥒😘`,
        `${targetName}, do you believe in love at first sight, or should I walk by again? 💫`,
        `Are you a parking ticket, ${targetName}? Because you've got 'fine' written all over you 🎫💕`,
        `${targetName}, I must be a snowflake because I've fallen for you ❄️💝`,
        `Is there an airport nearby, ${targetName}? Because my heart just took off 🛫💖`,
        `${targetName}, you must be made of copper and tellurium because you're Cu-Te 💕🧪`,
        `Excuse me ${targetName}, but I think you dropped something: my jaw 😮💖`,
        `${targetName}, if kisses were snowflakes, I'd send you a blizzard 💋❄️`,
        `${targetName}, are you a dictionary? Because you add meaning to my life 📖💝`,
        `${targetName}, you're like a candle. You light up my world 🕯️✨`,
        `${targetName}, they say Disneyland is the happiest place on Earth. But clearly, they haven't stood next to you 🏰💕`,
        `${targetName}, my love for you is like pi - never ending 🥧💖`,
        `${targetName}, are you a bank loan? Because you've got my interest 💰😍`
      ];
      
      const randomMessage = flirtMessages[Math.floor(Math.random() * flirtMessages.length)];
      
      const msg = {
        body: `💕 FLIRT 💕
═══════════════════════

${senderName} says:

${randomMessage}

═══════════════════════
💝 From ${senderName} with love 💝`,
        mentions: [
          { id: senderID, tag: senderName },
          { id: targetID, tag: targetName }
        ]
      };
      
      return api.sendMessage(msg, threadID, messageID);
      
    } catch (error) {
      return send.reply('Failed to send flirt: ' + error.message);
    }
  }
};


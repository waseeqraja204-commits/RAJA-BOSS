const style = require('./style');

module.exports = {
  config: {
    name: 'daily',
    aliases: ['claim', 'reward'],
    description: "Claim your daily registration reward coins.",
    credits: "SARDAR RDX",
    usage: 'daily',
    category: 'Economy',
    prefix: true
  },
  
  async run({ api, event, send, Currencies, Users }) {
    const { senderID } = event;
    
    const result = Currencies.claimDaily(senderID);
    const name = await Users.getNameUser(senderID);
    
    if (!result.success) {
      if (result.reason === 'no_bank_account') {
        const content = 
          `  👤 Hello ${name}!\n\n` +
          `  ❌ You need a bank account first!\n\n` +
          `  💡 Open account: ${global.config?.PREFIX || '.'}openaccount\n\n` +
          style.STYLES.dividerSmall + '\n' +
          `   ✨ Keep Supporting RDX`;
        return send.reply(style.createError('ACCOUNT NEEDED', content));
      }
      if (result.reason === 'already_claimed') {
        const content = 
          `  👤 Hello ${name}!\n\n` +
          `  ⏰ You've already claimed today's reward.\n\n` +
          `  📅 Come back tomorrow for more!\n\n` +
          style.STYLES.dividerSmall + '\n' +
          `   ✨ Keep Supporting RDX`;
        return send.reply(style.createWarning('ALREADY CLAIMED', content));
      }
    }
    
    const balance = Currencies.getBank(senderID);
    
    const content = 
      `  👤 User   : ${name}\n` +
      `  💰 Reward : +${result.reward} Coins\n` +
      `  🔥 Streak : ${result.streak} Days\n` +
      style.STYLES.separatorSmall + '\n' +
      `  🏦 Bank Balance: ${balance.toLocaleString()} Coins\n\n` +
      `  💡 Claim daily to increase your streak!\n` +
      style.STYLES.dividerSmall + '\n' +
      `   ✨ RDX BOT ECONOMY`;
    
    return send.reply(style.createSuccess('DAILY REWARD CLAIMED', content));
  }
};


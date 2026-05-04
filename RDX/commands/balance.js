const style = require('./style');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'balance',
    aliases: ['bal', 'money', 'wallet'],
    description: "Check your wallet and bank balance.",
    usage: 'balance [@user]',
    category: 'Economy',
    prefix: true
  },
  
  async run({ api, event, args, send, Currencies, Users }) {
    const { senderID, mentions } = event;
    
    let uid = senderID;
    
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else if (args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
    } else if (event.messageReply) {
      uid = event.messageReply.senderID;
    }
    
    const name = await Users.getNameUser(uid);
    const wallet = Currencies.getBalance(uid);
    const bank = Currencies.getBank(uid);
    const total = Currencies.getTotal(uid);
    
    const content = 
      `  👤 User  : ${name}\n` +
      `  🆔 UID   : ${uid}\n` +
      style.STYLES.separatorSmall + '\n' +
      `  💰 Wallet : ${wallet.toLocaleString()} Coins\n` +
      `  🏦 Bank   : ${bank.toLocaleString()} Coins\n` +
      style.STYLES.separatorSmall + '\n' +
      `  💎 Total  : ${total.toLocaleString()} Coins\n\n` +
      style.STYLES.dividerSmall + '\n' +
      `   ✨ Use ${global.config?.PREFIX || '.'}help for more commands`;
    
    return send.reply(style.createBox('💰 BALANCE CHECK', content));
  }
};


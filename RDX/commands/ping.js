const style = require('./style');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'ping',
    aliases: ['p', 'latency'],
    description: "Check bot response speed and latency.",
    usage: 'ping',
    category: 'Utility',
    prefix: true
  },
  
  async run({ api, event, send }) {
    const start = Date.now();
    
    const info = await send.reply(style.createInfo('PING', 'Checking latency...'));
    
    const latency = Date.now() - start;
    
    let status = '🟢 Excellent';
    if (latency > 100) status = '🟡 Good';
    if (latency > 300) status = '🟠 Slow';
    if (latency > 500) status = '🔴 Very Slow';
    
    const content = 
      `  🏓 Status: Pong!\n` +
      `  ⏱️ Latency: ${latency}ms\n` +
      `  📊 Connection: ${status}\n\n` +
      style.STYLES.dividerSmall + '\n' +
      `   ✨ Bot is responding well`;
    
    api.editMessage(style.createBox('⚡ PING RESULT', content), info.messageID);
  }
};


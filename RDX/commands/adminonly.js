const style = require('./style');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'adminonly',
    aliases: ['onlyadmin', 'adminmode'],
    description: "Enable or disable Admin-Only mode.",
    usage: 'adminonly [on/off]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const fs = require('fs-extra');
    const path = require('path');
    const configPath = path.join(__dirname, '../../config.json');
    let envConfig = fs.readJsonSync(configPath);
    
    const action = args[0]?.toLowerCase();
    
    if (action === 'on' || action === 'true' || action === 'enable') {
      envConfig.ADMIN_ONLY_MODE = true;
      global.config = envConfig;
      fs.writeJsonSync(configPath, envConfig, { spaces: 2 });
      
      const content = 
        `  🔐 Mode    : ENABLED\n` +
        `  👑 Admins : Only bot admins can use commands\n\n` +
        style.STYLES.dividerSmall + '\n' +
        `   ✨ Use ${config.PREFIX}adminonly off to disable`;
      return send.reply(style.createSuccess('ADMIN ONLY MODE ON', content));
    }
    
    if (action === 'off' || action === 'false' || action === 'disable') {
      envConfig.ADMIN_ONLY_MODE = false;
      global.config = envConfig;
      fs.writeJsonSync(configPath, envConfig, { spaces: 2 });
      
      const content = 
        `  🔓 Mode    : DISABLED\n` +
        `  👥 Everyone: Can use commands now\n\n` +
        style.STYLES.dividerSmall + '\n' +
        `   ✨ Use ${config.PREFIX}adminonly on to enable`;
      return send.reply(style.createSuccess('ADMIN ONLY MODE OFF', content));
    }
    
    const status = envConfig.ADMIN_ONLY_MODE ? 'ENABLED' : 'DISABLED';
    const content = 
      `  📊 Current Status: ${status}\n\n` +
      `  💡 Usage: ${config.PREFIX}adminonly [on/off]`;
    return send.reply(style.createBox('🔐 ADMIN ONLY MODE', content));
  }
};


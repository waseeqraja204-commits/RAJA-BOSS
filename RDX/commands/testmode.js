const style = require('./style');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: "testmode",
    aliases: ["test", "adminonly"],
    description: "Toggle bot test mode for developers.",
    usage: "testmode on/off",
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, config }) {
    const { threadID, messageID } = event;
    const configPath = path.join(__dirname, '../../config.json');
    
    if (!args[0]) {
      const content = `  📊 Current: ${config.ADMIN_ONLY_MODE ? "ON" : "OFF"}\n\n  💡 Usage: ${config.PREFIX}testmode on/off`;
      return send.reply(style.createBox('🔧 TEST MODE', content));
    }

    const state = args[0].toLowerCase();
    let newState;

    if (state === "on") {
      newState = true;
    } else if (state === "off") {
      newState = false;
    } else {
      return send.reply(style.createError('INVALID', '  ❌ Please use on or off'));
    }

    try {
      const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      currentConfig.ADMIN_ONLY_MODE = newState;
      currentConfig.TEST_MODE = newState;
      
      fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
      
      config.ADMIN_ONLY_MODE = newState;
      config.TEST_MODE = newState;
      global.config = currentConfig;

      const content = 
        `  🔧 Mode    : ${newState ? "ON" : "OFF"}\n` +
        `  👑 ${newState ? "Only admins" : "Everyone"} can use commands\n\n` +
        style.STYLES.dividerSmall + '\n' +
        `   ✨ Test mode updated!`;
      return send.reply(style.createSuccess('TEST MODE ' + (newState ? 'ON' : 'OFF'), content));
    } catch (error) {
      const content = `  ❌ Error: ${error.message}`;
      return send.reply(style.createError('ERROR', content));
    }
  }
};

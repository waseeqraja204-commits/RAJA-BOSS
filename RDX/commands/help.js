const style = require('./style');

module.exports = {
  config: {
    name: 'help',
    aliases: ['h', 'menu', 'cmds'],
    description: "View all available commands and guides.",
    credits: "SARDAR RDX",
    usage: 'help [command] | help [page] | help all',
    category: 'Utility',
    prefix: true
  },

  async run({ api, event, args, send, client, config }) {
    const { threadID, senderID } = event;

    if (args[0]) {
      const input = args[0].toLowerCase();

      if (input === 'all') {
        return showFullHelp({ api, event, send, client, config });
      }

      if (!isNaN(input)) {
        const page = parseInt(input);
        return showPagedCommands({ api, event, send, client, config, page });
      }

      let command = client.commands.get(input);

      if (!command) {
        for (const [name, cmd] of client.commands) {
          if (cmd.config.aliases && cmd.config.aliases.includes(input)) {
            command = cmd;
            break;
          }
        }
      }

      if (!command) {
        return send.reply(style.createError('NOT FOUND', `Command "${input}" not found.`));
      }

      const cfg = command.config;
      const content = 
        `  📌 Name    : ${cfg.name.toUpperCase()}\n` +
        `  📝 Desc    : ${cfg.description || 'No description'}\n` +
        `  💡 Usage   : ${config.PREFIX}${cfg.usage || cfg.name}\n` +
        `  🔄 Aliases : ${cfg.aliases?.join(', ') || 'None'}\n` +
        `  📂 Category: ${cfg.category || 'Other'}\n` +
        `  🛡️ Admin   : ${cfg.adminOnly ? 'Yes' : 'No'}\n` +
        `  👥 Group   : ${cfg.groupOnly ? 'Yes' : 'No'}\n\n` +
        style.STYLES.dividerSmall + '\n' +
        `   ✨ Powered by ${config.BOTNAME}`;
      
      return send.reply(style.createBox('📖 COMMAND DETAILS', content));
    }

    return showDefaultHelp({ api, event, send, client, config });
  }
};

function showDefaultHelp({ api, event, send, client, config }) {
  const time = style.getTime();
  const date = style.getDate();

  const helpingCommands = [
    { name: 'help', desc: 'Sari commands ki list dekho' },
    { name: 'rdxai', desc: 'Bot assistant se help lo' },
    { name: 'rankup', desc: 'Apna level aur rank dekho' },
    { name: 'daily', desc: 'Daily free coins claim karo' },
    { name: 'balance', desc: 'Wallet/Bank balance check karo' },
    { name: 'pair', desc: 'Love pair bnaein kisi sath' },
    { name: 'marry', desc: 'Apne partner se shadi karein' },
    { name: 'openaccount', desc: 'Bank account register karein' },
    { name: 'tiktok', desc: 'No watermark video download' },
    { name: 'fbvideo', desc: 'Facebook video download karein' },
    { name: 'uptime', desc: 'Bot running time check karein' }
  ];

  let content = `  ⏰ Time  : ${time}\n  📅 Date  : ${date}\n  ⚙️ Prefix: ${config.PREFIX}\n`;
  content += style.STYLES.separator + '\n';
  
  helpingCommands.forEach((cmd, idx) => {
    content += `  ${String(idx + 1).padStart(2, '0')}. ${config.PREFIX}${cmd.name}\n  └─ ${cmd.desc}\n\n`;
  });

  content += style.STYLES.dividerSmall + '\n';
  content += `  💡 Use ${config.PREFIX}help all (Full List)\n  👤 Owner: SARDAR RDX`;
  
  return send.reply(style.createBox(`✨ ${config.BOTNAME.toUpperCase()} MENU ✨`, content));
}

function showPagedCommands({ api, event, send, client, config, page }) {
  const uniqueCommands = new Map();

  for (const [name, cmd] of client.commands) {
    if (!uniqueCommands.has(cmd.config.name)) {
      uniqueCommands.set(cmd.config.name, cmd.config);
    }
  }

  const commandsArray = Array.from(uniqueCommands.values());
  const commandsPerPage = 12;
  const totalPages = Math.ceil(commandsArray.length / commandsPerPage);

  if (page < 1 || page > totalPages) {
    return send.reply(style.createError('INVALID PAGE', `Page must be between 1 and ${totalPages}`));
  }

  const startIdx = (page - 1) * commandsPerPage;
  const endIdx = startIdx + commandsPerPage;
  const pageCommands = commandsArray.slice(startIdx, endIdx);

  let content = `  📖 Page: [${page}/${totalPages}]\n  📊 Total: ${commandsArray.length} Commands\n`;
  content += style.STYLES.separator + '\n';
  
  pageCommands.forEach((cmd, idx) => {
    const num = startIdx + idx + 1;
    content += `  ${String(num).padStart(2, '0')} ➤ ${config.PREFIX}${cmd.name}\n`;
  });

  content += '\n' + style.STYLES.dividerSmall + '\n';
  content += `  💡 ${config.PREFIX}help [page]\n  📖 ${config.PREFIX}help all`;
  
  return send.reply(style.createBox('📚 COMMAND LIST', content));
}

function showFullHelp({ api, event, send, client, config }) {
  const categories = {};
  const uniqueCommands = new Map();

  for (const [name, cmd] of client.commands) {
    if (!uniqueCommands.has(cmd.config.name)) {
      uniqueCommands.set(cmd.config.name, cmd.config);
    }
  }

  for (const [name, cfg] of uniqueCommands) {
    const cat = cfg.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cfg);
  }

  const time = style.getTime();
  const date = style.getDate();

  let content = `  ⏰ Time  : ${time}\n  📅 Date  : ${date}\n  📊 Total : ${uniqueCommands.size} Commands\n  ⚙️ Prefix: ${config.PREFIX}\n`;
  content += style.STYLES.separator + '\n';

  const categoryOrder = ['Admin', 'Group', 'Economy', 'Media', 'Fun', 'Social', 'Utility', 'Love', 'Friend', 'Other'];

  const categoryEmojis = {
    'Admin': '👑',
    'Group': '👥',
    'Friend': '🤝',
    'Economy': '💰',
    'Media': '🎬',
    'Fun': '🎮',
    'Social': '💬',
    'Utility': '🔧',
    'Love': '❤️',
    'Other': '📋'
  };

  const sortedCategories = Object.keys(categories).sort((a, b) => {
    const scoreA = categoryOrder.indexOf(a);
    const scoreB = categoryOrder.indexOf(b);
    if (scoreA !== -1 && scoreB !== -1) return scoreA - scoreB;
    if (scoreA !== -1) return -1;
    if (scoreB !== -1) return 1;
    return a.localeCompare(b);
  });

  for (const cat of sortedCategories) {
    const emoji = categoryEmojis[cat] || '📋';
    content += `  ┌─ ${emoji} ${cat.toUpperCase()} ─┐\n`;
    
    categories[cat].forEach(c => {
      content += `  │ ${c.name}\n`;
    });
    content += `  └──────────────────┘\n\n`;
  }

  content += style.STYLES.dividerSmall + '\n';
  content += `  💡 Use ${config.PREFIX}help [cmd]\n  👤 Owner: SARDAR RDX`;
  
  return send.reply(style.createBox(`✨ ${config.BOTNAME.toUpperCase()} COMMANDS ✨`, content));
}
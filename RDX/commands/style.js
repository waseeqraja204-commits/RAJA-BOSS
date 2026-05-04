const moment = require('moment-timezone');

const STYLES = {
  // Main frames
  header: '╔═══✿════════✿═══╗',
  headerSmall: '╔═══✿═══╗',
  headerMedium: '╔═══✿═══════✿═══╗',
  footer: '╚═══✿════════✿═══╝',
  footerSmall: '╚═══✿═══╝',
  footerMedium: '╚═══✿═══════✿═══╝',
  separator: '╠═══✿════════✿═══╣',
  separatorSmall: '╠═══✿═══╣',
  
  // Divider variations
  divider: '━━━━━❂❂━━━━━',
  dividerSmall: '━━━❂━━━',
  dividerAlt: '─── ✦ ✧ ✦ ───',
  dividerSparkle: '✦ ✧ ✦ ✧ ✦ ✧ ✦',
  dividerFlower: '✿ ❀ ✿ ❀ ✿ ❀ ✿',
  dividerStar: '★ ☆ ★ ☆ ★ ☆ ★',
  
  // Decorative corners
  cornerTopLeft: '┏',
  cornerTopRight: '┓',
  cornerBottomLeft: '┗',
  cornerBottomRight: '┛',
  barVertical: '┃',
  barHorizontal: '━',
  
  // Special frames
  fancyHeader: '┏━━━❂❂━━━━━━━❂❂━━━┓',
  fancyFooter: '┗━━━❂❂━━━━━━━❂❂━━━┛',
  fancySeparator: '┣━━━❂❂━━━━━━━❂❂━━━┫',
  
  simpleHeader: '┌───── ⋆⋅☆⋅⋆ ─────┐',
  simpleFooter: '└───── ⋆⋅☆⋅⋆ ─────┘',
  simpleSeparator: '├───── ⋆⋅☆⋅⋆ ─────┤',
  
  elegantHeader: '╭── ⋅ ── ✩ ── ⋅ ──╮',
  elegantFooter: '╰── ⋅ ── ✩ ── ⋅ ──╯',
  elegantSeparator: '├── ⋅ ── ✩ ── ⋅ ──┤',
};

function getTime() {
  return moment().tz('Asia/Karachi').format('hh:mm A');
}

function getDate() {
  return moment().tz('Asia/Karachi').format('DD/MM/YYYY');
}

function createBox(title, content, options = {}) {
  const { small = false, medium = false, fancy = false, elegant = false, simple = false } = options;
  
  let header, footer, separator;
  
  if (elegant) {
    header = STYLES.elegantHeader;
    footer = STYLES.elegantFooter;
    separator = STYLES.elegantSeparator;
  } else if (simple) {
    header = STYLES.simpleHeader;
    footer = STYLES.simpleFooter;
    separator = STYLES.simpleSeparator;
  } else if (fancy) {
    header = STYLES.fancyHeader;
    footer = STYLES.fancyFooter;
    separator = STYLES.fancySeparator;
  } else if (small) {
    header = STYLES.headerSmall;
    footer = STYLES.footerSmall;
    separator = STYLES.separatorSmall;
  } else if (medium) {
    header = STYLES.headerMedium;
    footer = STYLES.footerMedium;
  } else {
    header = STYLES.header;
    footer = STYLES.footer;
    separator = STYLES.separator;
  }
  
  let msg = header + '\n';
  
  if (title) {
    const padding = Math.max(0, 22 - title.length);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    msg += `│${' '.repeat(leftPad)} ${title} ${' '.repeat(rightPad)}│\n`;
    msg += separator + '\n';
  }
  
  msg += content + '\n';
  msg += footer;
  
  return msg;
}

function createSuccess(title, content) {
  return createBox(`✅ ${title}`, content, { elegant: true });
}

function createError(title, content) {
  return createBox(`❌ ${title}`, content, { elegant: true });
}

function createInfo(title, content) {
  return createBox(`ℹ️ ${title}`, content, { elegant: true });
}

function createWarning(title, content) {
  return createBox(`⚠️ ${title}`, content, { elegant: true });
}

function createSection(title, items, options = {}) {
  const { numbered = false, bullet = '➤' } = options;
  let content = '';
  
  if (numbered) {
    items.forEach((item, idx) => {
      content += `  ${String(idx + 1).padStart(2, '0')}. ${item}\n`;
    });
  } else {
    items.forEach(item => {
      content += `  ${bullet} ${item}\n`;
    });
  }
  
  return createBox(title, content, { simple: true });
}

function formatUserInfo(name, id, extra = {}) {
  let content = `  👤 Name: ${name}\n`;
  content += `  🆔 ID: ${id}\n`;
  
  if (extra.balance !== undefined) {
    content += `  💰 Balance: ${extra.balance.toLocaleString()} Coins\n`;
  }
  if (extra.bank !== undefined) {
    content += `  🏦 Bank: ${extra.bank.toLocaleString()} Coins\n`;
  }
  if (extra.level !== undefined) {
    content += `  ⬆️ Level: ${extra.level}\n`;
  }
  if (extra.rank !== undefined) {
    content += `  🏆 Rank: ${extra.rank}\n`;
  }
  
  return createBox('👤 User Info', content, { simple: true });
}

function formatCommandHelp(name, description, usage, aliases, category) {
  const content = `  📌 Command: ${name}\n` +
    `  📝 Description: ${description}\n` +
    `  💡 Usage: ${usage}\n` +
    `  🔄 Aliases: ${aliases || 'None'}\n` +
    `  📂 Category: ${category || 'Other'}`;
  
  return createBox('📖 Command Details', content, { simple: true });
}

function createMenu(botName, commands, options = {}) {
  const { time = getTime(), date = getDate(), prefix = '.', totalCmds = 0 } = options;
  
  let content = `  ⏰ Time: ${time}\n  📅 Date: ${date}\n  ⚙️ Prefix: ${prefix}\n`;
  
  if (totalCmds > 0) {
    content += `  📊 Total: ${totalCmds} Commands\n`;
  }
  
  content += STYLES.simpleSeparator + '\n';
  
  commands.forEach((cmd, idx) => {
    content += `  ${String(idx + 1).padStart(2, '0')}. ${cmd.name}\n  └─ ${cmd.desc}\n\n`;
  });
  
  return createBox(`✨ ${botName.toUpperCase()} MENU ✨`, content, { simple: true });
}

function createCategoryHelp(botName, categories, options = {}) {
  const { prefix = '.', total = 0 } = options;
  
  let content = `  📊 Total Commands: ${total}\n  ⚙️ Prefix: ${prefix}\n`;
  content += STYLES.simpleSeparator + '\n';
  
  for (const [category, commands] of Object.entries(categories)) {
    content += `  ╭─ ${category.toUpperCase()} ─╮\n`;
    commands.forEach(cmd => {
      content += `  │ ${cmd}\n`;
    });
    content += `  ╰─────────────────╯\n\n`;
  }
  
  return createBox(`📚 ${botName.toUpperCase()} COMMAND LIST`, content, { simple: true });
}

module.exports = {
  STYLES,
  getTime,
  getDate,
  createBox,
  createSuccess,
  createError,
  createInfo,
  createWarning,
  createSection,
  formatUserInfo,
  formatCommandHelp,
  createMenu,
  createCategoryHelp
};
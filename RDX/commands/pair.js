const style = require('./style');

module.exports.config = {
  name: "pair",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Find your perfect match in the group.",
  commandCategory: "Love",
  usages: "pair [@mention/reply]",
  cooldowns: 15,
  category: 'Love',
  prefix: true
};

module.exports.run = async function ({ api, event, Threads, Users, args }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");

  try {
    const threadData = await api.getThreadInfo(event.threadID);
    const participantIDs = threadData.participantIDs;
    const tle = Math.floor(Math.random() * 101);
    const botID = api.getCurrentUserID();

    let id;
    if (Object.keys(event.mentions).length > 0) {
      id = Object.keys(event.mentions)[Object.keys(event.mentions).length - 1];
    } else if (event.messageReply) {
      id = event.messageReply.senderID;
    } else if (args.join(" ").match(/\d+/g)) {
      const uids = args.join(" ").match(/\d+/g);
      id = uids[uids.length - 1];
    } else {
      const listUserID = participantIDs.filter(ID => ID != botID && ID != event.senderID);
      if (listUserID.length === 0) return api.sendMessage(style.createError('NO MEMBER', '  ❌ Group mein koi aur member nahi mila!'), event.threadID);
      id = listUserID[Math.floor(Math.random() * listUserID.length)];
    }

    if (!id) return api.sendMessage(style.createError('INVALID', '  ❌ Kisi member ko select karein!'), event.threadID);
    if (id == event.senderID) return api.sendMessage(style.createError('INVALID', '  ❌ Aap apne saath pairing nahi kar sakte!'), event.threadID);

    const senderInfo = await api.getUserInfo(event.senderID);
    const partnerInfo = await api.getUserInfo(id);

    const senderName = senderInfo[event.senderID]?.name || "Facebook User";
    const partnerName = partnerInfo[id]?.name || "Facebook User";

    const arraytag = [
      { id: event.senderID, tag: senderName },
      { id: id, tag: partnerName }
    ];

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const avtPath1 = path.join(cacheDir, `avt_${event.senderID}.png`);
    const avtPath2 = path.join(cacheDir, `avt_${id}.png`);
    const gifPath = path.join(cacheDir, "giflove.png");

    const [avatar1, avatar2, gifLove] = await Promise.all([
      axios.get(`https://graph.facebook.com/${event.senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
      axios.get(`https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
      axios.get(`https://i.ibb.co/wC2JJBb/trai-tim-lap-lanh.gif`, { responseType: "arraybuffer" })
    ]);

    fs.writeFileSync(avtPath1, Buffer.from(avatar1.data));
    fs.writeFileSync(avtPath2, Buffer.from(avatar2.data));
    fs.writeFileSync(gifPath, Buffer.from(gifLove.data));

    const imglove = [
      fs.createReadStream(avtPath1),
      fs.createReadStream(gifPath),
      fs.createReadStream(avtPath2)
    ];

    const msg = {
      body: `┏━•❃°•°❀°•°❃•━┓\n\n𝐎𝐰𝐧𝐞𝐫 ·˚ ༘₊·꒰➳: ̗̀➛    🍓  𝐒𝐀𝐑𝐃𝐀𝐑 𝐑𝐃𝐗 \n\n┗━•❃°•°❀°•°❃•━┛ \n\n ✦ ━━━━ ༺♡༻ ━━━━ ✦\n\n [❝ 𝑇𝑢𝑗ℎ𝑘𝑜 𝑑𝑒𝑘ℎ 𝑘𝑒 𝑏𝑎𝑠 𝑒𝑘 𝑘ℎ𝑦𝑎𝑎𝑙 𝑎𝑎𝑡𝑎 ℎ𝑎𝑖,\n𝐷𝑖𝑙 𝑘𝑎ℎ𝑡𝑎 ℎ𝑎𝑖 𝑘𝑎𝑠ℎ 𝑡𝑢 𝑠𝑎𝑎𝑡ℎ ℎ𝑜... ❞]\n\n✦ ━━━━ ༺♡༻ ━━━━ ✦\n\n[❝ 𝐸𝑘 𝑊𝑎𝑞𝑡 𝑎𝑎𝑦𝑒 𝑍𝑖𝑛𝑑𝑎𝑔𝑖 𝑚𝑒𝑖𝑛...\n\n 𝐽𝑎ℎ𝑎𝑎𝑛 𝑡𝑢 𝑣𝑖 𝑚𝑒𝑟𝑒 𝑝ÿ𝑎𝑟 𝑚𝑒𝑖𝑛 ℎ𝑜 ❞]\n\n✦ ━━━━ ༺♡༻ ━━━━ ✦\n\n┌──═━agnol──┐\n\n➻ 𝐍𝐀ɱɘ ✦  ${senderName} \n\n➻ 𝐍𝐀ɱɘ ✦  ${partnerName} \n\n└──═━agnol──┘\n\n✦ ━━━━ ༺♡༻ ━━━━ ✦\n\n🌸🍁𝐘𝐎𝐔𝐑 𝐋𝐎𝐕𝐄 𝐋𝐄𝐕𝐄𝐋💝 : ╰──➤ ${tle}%\n` + senderName + " " + "🌺" + " " + partnerName,
      mentions: arraytag,
      attachment: imglove
    };

    return api.sendMessage(msg, event.threadID, (err) => {
      if (err) console.error("Error sending message:", err);
      [avtPath1, avtPath2, gifPath].forEach(p => {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      });
    }, event.messageID);
  } catch (err) {
    console.error("Pair command error:", err);
    return api.sendMessage(style.createError('ERROR', `  ⚠️ Error: ${err.message}`), event.threadID);
  }
};

module.exports.run = async function ({ api, event, Threads, Users, args }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");

  try {
    const threadData = await api.getThreadInfo(event.threadID);
    const participantIDs = threadData.participantIDs;
    const tle = Math.floor(Math.random() * 101);
    const botID = api.getCurrentUserID();

    // Determine the partner ID
    let id;
    if (Object.keys(event.mentions).length > 0) {
      id = Object.keys(event.mentions)[Object.keys(event.mentions).length - 1];
    } else if (event.messageReply) {
      id = event.messageReply.senderID;
    } else if (args.join(" ").match(/\d+/g)) {
      const uids = args.join(" ").match(/\d+/g);
      id = uids[uids.length - 1];
    } else {
      const listUserID = participantIDs.filter(ID => ID != botID && ID != event.senderID);
      if (listUserID.length === 0) return api.sendMessage("❌ Group mein koi aur member nahi mila!", event.threadID);
      id = listUserID[Math.floor(Math.random() * listUserID.length)];
    }

    if (!id) return api.sendMessage("❌ Kisi member ko select karein!", event.threadID);
    if (id == event.senderID) return api.sendMessage("❌ Aap apne saath pairing nahi kar sakte!", event.threadID);

    // Getting user names safely
    const senderInfo = await api.getUserInfo(event.senderID);
    const partnerInfo = await api.getUserInfo(id);

    const senderName = senderInfo[event.senderID]?.name || "Facebook User";
    const partnerName = partnerInfo[id]?.name || "Facebook User";

    const arraytag = [
      { id: event.senderID, tag: senderName },
      { id: id, tag: partnerName }
    ];

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const avtPath1 = path.join(cacheDir, `avt_${event.senderID}.png`);
    const avtPath2 = path.join(cacheDir, `avt_${id}.png`);
    const gifPath = path.join(cacheDir, "giflove.png");

    const [avatar1, avatar2, gifLove] = await Promise.all([
      axios.get(`https://graph.facebook.com/${event.senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
      axios.get(`https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
      axios.get(`https://i.ibb.co/wC2JJBb/trai-tim-lap-lanh.gif`, { responseType: "arraybuffer" })
    ]);

    fs.writeFileSync(avtPath1, Buffer.from(avatar1.data));
    fs.writeFileSync(avtPath2, Buffer.from(avatar2.data));
    fs.writeFileSync(gifPath, Buffer.from(gifLove.data));

    const imglove = [
      fs.createReadStream(avtPath1),
      fs.createReadStream(gifPath),
      fs.createReadStream(avtPath2)
    ];

    const msg = {
      body: `┏━•❃°•°❀°•°❃•━┓\n\n𝐎𝐰𝐧𝐞𝐫 ·˚ ༘₊·꒰➳: ̗̀➛    🍓  𝐂𝐇𝐔𝐙𝐈 𝐊𝐀 𝐂𝐀𝐑𝐓𝐎𝐎𝐍 \n\n┗━•❃°•°❀°•°❃•━┛ \n\n ✦ ━━━━ ༺♡༻ ━━━━ ✦\n\n [❝ 𝑇𝑢𝑗ℎ𝑘𝑜 𝑑𝑒𝑘ℎ 𝑘𝑒 𝑏𝑎𝑠 𝑒𝑘 𝑘ℎ𝑦𝑎𝑎𝑙 𝑎𝑎𝑡𝑎 ℎ𝑎𝑖,\n𝐷𝑖𝑙 𝑘𝑎ℎ𝑡𝑎 ℎ𝑎𝑖 𝑘𝑎𝑠ℎ 𝑡𝑢 𝑠𝑎𝑎𝑡ℎ ℎ𝑜... ❞]\n\n✦ ━━━━ ༺♡༻ ━━━━ ✦\n\n[❝ 𝐸𝑘 𝑊𝑎𝑞𝑡 𝑎𝑎𝑦𝑒 𝑍𝑖𝑛𝑑𝑎𝑔𝑖 𝑚𝑒𝑖𝑛...\n\n 𝐽𝑎ℎ𝑎𝑎𝑛 𝑡𝑢 𝑣𝑖 𝑚𝑒𝑟𝑒 𝑝ÿ𝑎𝑟 𝑚𝑒𝑖𝑛 ℎ𝑜 ❞]\n\n✦ ━━━━ ༺♡༻ ━━━━ ✦\n\n┌──═━┈━═──┐\n\n➻ 𝐍𝐀ɱɘ ✦  ${senderName} \n\n➻ 𝐍𝐀ɱɘ ✦  ${partnerName} \n\n└──═━┈━═──┘\n\n✦ ━━━━ ༺♡༻ ━━━━ ✦\n\n🌸🍁𝐘𝐎𝐔𝐑 𝐋𝐎𝐕𝐄 𝐋𝐄𝐕𝐄𝐋💝 : ╰┈➤ ${tle}%\n` + senderName + " " + "🌺" + " " + partnerName,
      mentions: arraytag,
      attachment: imglove
    };

    return api.sendMessage(msg, event.threadID, (err) => {
      if (err) console.error("Error sending message:", err);
      [avtPath1, avtPath2, gifPath].forEach(p => {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      });
    }, event.messageID);
  } catch (err) {
    console.error("Pair command error:", err);
    return api.sendMessage(`⚠️ Error: ${err.message}`, event.threadID);
  }
};

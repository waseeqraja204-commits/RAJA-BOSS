const request = require("request");
const style = require('./style');
const fs = require("fs");

module.exports = {
  config: {
    name: 'biryani',
    aliases: ['biryaan', 'briyani', 'briyani', 'biryan', 'rice'],
    description: 'Send a biryani image',
    credits: "SARDAR RDX",
    usage: '.biryani',
    category: 'Fun',
    adminOnly: false,
    prefix: true
  },

  async run({ api, event, send }) {
    const images = [
      "https://i.ibb.co/n8L11FJ0/45561f6e3fbc.jpg",
      "https://i.ibb.co/PZHHpgZ2/4ca534cc31d8.jpg",
      "https://i.ibb.co/20gdynzC/41fdac1bbf8a.jpg",
      "https://i.ibb.co/20gdynzC/41fdac1bbf8a.jpg",
      "https://i.ibb.co/Fk2f0TPZ/513d4286a3cd.jpg",
      "https://i.ibb.co/mC7CWS3h/193d24795e73.jpg",
    ];

    const randomImg = images[Math.floor(Math.random() * images.length)];
    
    try {
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgPath = cacheDir + "/biryani_" + Date.now() + ".jpg";

      return request(encodeURI(randomImg))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage({
            body: `Ye lo biryani apka ly! 🍚`,
            attachment: fs.createReadStream(imgPath)
          }, event.threadID, () => {
            try { fs.unlinkSync(imgPath); } catch (e) {}
          });
        })
        .on("error", () => {
          send.reply('❌ Image نہیں بھیج سکا');
        });
    } catch (error) {
      return send.reply('❌ خرابی: ' + error.message);
    }
  }
};


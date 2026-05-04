const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const style = require('./style');

module.exports.config = {
    name: "tiktok",
    version: "1.0.0",
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "SARDAR RDX",
    description: "Download videos from TikTok without watermark.",
    commandCategory: "media",
    usages: ".tiktok [TikTok URL]",
    aliases: ["tt", "tik"],
    cooldowns: 5
};

const API_BASE = "https://yt-tt.onrender.com";

async function downloadTikTok(tiktokUrl) {
    try {
        const response = await axios.get(`${API_BASE}/api/tiktok/download`, {
            params: { url: tiktokUrl },
            timeout: 60000,
            responseType: 'arraybuffer'
        });
        
        if (response.data) {
            return { success: true, data: response.data };
        }
        return null;
    } catch (err) {
        console.log("TikTok download failed:", err.message);
        return null;
    }
}

module.exports.run = async function ({ api, event, args }) {
    const url = args[0];
    const prefix = global.config?.PREFIX || '.';
    
    if (!url) {
        const content = 
            `  ❌ Please provide a TikTok URL\n\n` +
            `  💡 Usage: ${prefix}tiktok [URL]\n\n` +
            `  📌 Example: ${prefix}tiktok https://vm.tiktok.com/...`;
        return api.sendMessage(style.createBox('🎵 TIKTOK DOWNLOADER', content), event.threadID, event.messageID);
    }

    const tiktokRegex = /(?:https?:\/\/)?(?:www\.|vm\.|vt\.)?(?:tiktok\.com)\/.+/i;
    
    if (!tiktokRegex.test(url)) {
        const content = `  ❌ Invalid TikTok URL\n\n  📌 Please provide a valid TikTok link`;
        return api.sendMessage(style.createError('INVALID URL', content), event.threadID, event.messageID);
    }

    const frames = [
        "🩵▰▱▱▱▱▱▱▱▱▱▱ 10%",
        "💙▰▰▱▱▱▱▱▱▱▱ 25%",
        "💜▰▰▰▰▱▱▱▱▱▱ 45%",
        "💖▰▰▰▰▰▰▱▱▱▱ 70%",
        "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
    ];

    const searchMsg = await api.sendMessage(style.createInfo('DOWNLOADING', `🎵 TikTok Downloader\n\n${frames[0]}`), event.threadID);

    try {
        await api.editMessage(style.createInfo('FETCHING', `🎵 Fetching video...\n\n${frames[1]}`), searchMsg.messageID, event.threadID);
        await api.editMessage(style.createInfo('DOWNLOADING', `🎵 Downloading...\n\n${frames[2]}`), searchMsg.messageID, event.threadID);

        const downloadResult = await downloadTikTok(url);
        
        if (!downloadResult || !downloadResult.success) {
            api.unsendMessage(searchMsg.messageID);
            const content = `  ❌ Download failed\n\n  📌 Please check the URL and try again`;
            return api.sendMessage(style.createError('FAILED', content), event.threadID, event.messageID);
        }

        await api.editMessage(style.createInfo('PROCESSING', `🎵 Processing...\n\n${frames[3]}`), searchMsg.messageID, event.threadID);

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);

        const videoPath = path.join(cacheDir, `${Date.now()}_tiktok.mp4`);
        fs.writeFileSync(videoPath, Buffer.from(downloadResult.data));

        await api.editMessage(style.createSuccess('COMPLETE', `🎵 Complete!\n\n${frames[4]}`), searchMsg.messageID, event.threadID);

        await api.sendMessage(
            {
                body: `🎵 TikTok Video Downloaded Successfully!`,
                attachment: fs.createReadStream(videoPath)
            },
            event.threadID
        );

        setTimeout(() => {
            try {
                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                api.unsendMessage(searchMsg.messageID);
            } catch (err) {
                console.log("Cleanup error:", err);
            }
        }, 15000);

    } catch (error) {
        console.error("TikTok command error:", error.message);
        try { api.unsendMessage(searchMsg.messageID); } catch(e) {}
        const content = `  ❌ An error occurred: ${error.message}\n\n  📌 Please try again later`;
        return api.sendMessage(style.createError('ERROR', content), event.threadID, event.messageID);
    }
};
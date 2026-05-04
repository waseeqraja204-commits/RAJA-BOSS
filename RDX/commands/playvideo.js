const axios = require('axios');
const style = require('./style');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "playvideo",
    version: "1.0.0",
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "SARDAR RDX",
    description: "Download video from YouTube",
    commandCategory: "media",
    usages: ".playvideo [video name]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const query = args.join(" ");

    if (!query) {
        return api.sendMessage("❌ Please provide a video name", event.threadID, event.messageID);
    }

    const frames = [
        "🩵▰▱▱▱▱▱▱▱▱▱▱ 10%",
        "💙▰▰▱▱▱▱▱▱▱▱▱ 25%",
        "💜▰▰▰▰▱▱▱▱▱▱ 45%",
        "💖▰▰▰▰▰▰▱▱▱▱ 70%",
        "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
    ];

    const searchMsg = await api.sendMessage(`🔍 Searching for: ${query}\n\n${frames[0]}`, event.threadID);

    try {
        // Try video API endpoint
        const apiUrl = `https://anabot.my.id/api/download/playvideo?query=${encodeURIComponent(query)}&apikey=freeApikey`;

        await api.editMessage(`🎬 Found! Processing...\n\n${frames[1]}`, searchMsg.messageID, event.threadID);

        let fetchRes;
        try {
            fetchRes = await axios.get(apiUrl, {
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 60000
            });
        } catch (fetchError) {
            // If video API fails, try with ytmp4
            const fallbackUrl = `https://anabot.my.id/api/download/ytmp4?query=${encodeURIComponent(query)}&apikey=freeApikey`;
            try {
                fetchRes = await axios.get(fallbackUrl, {
                    headers: {
                        'Accept': 'application/json'
                    },
                    timeout: 60000
                });
            } catch (fallbackError) {
                api.unsendMessage(searchMsg.messageID);
                return api.sendMessage(`❌ Failed to fetch: ${fetchError.message}\n\nPlease try again later.`, event.threadID, event.messageID);
            }
        }

        // Check API response
        if (!fetchRes.data || !fetchRes.data.success) {
            api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("❌ No results found or API error", event.threadID, event.messageID);
        }

        const result = fetchRes.data.data.result;

        if (!result || !result.urls) {
            api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("❌ Failed to get download URL", event.threadID, event.messageID);
        }

        const downloadUrl = result.urls;
        const metadata = result.metadata || {};
        const title = metadata.title || query;
        const thumbnail = metadata.thumbnail;
        const channel = metadata.channel || metadata.uploader || "Unknown";
        const duration = metadata.duration || 0;

        await api.editMessage(`🎬 Downloading video...\n\n${frames[2]}`, searchMsg.messageID, event.threadID);

        // Download the video file
        let videoRes;
        try {
            videoRes = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 300000 // 5 minutes for video
            });
        } catch (downloadError) {
            api.unsendMessage(searchMsg.messageID);
            return api.sendMessage(`❌ Download failed: ${downloadError.message}\n\nPlease try again later.`, event.threadID, event.messageID);
        }

        await api.editMessage(`🎬 Processing...\n\n${frames[3]}`, searchMsg.messageID, event.threadID);

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);

        // Save video file
        const videoPath = path.join(cacheDir, `${Date.now()}_video.mp4`);
        fs.writeFileSync(videoPath, Buffer.from(videoRes.data));

        setTimeout(() => {
            api.editMessage(`🎬 Complete!\n\n${frames[4]}`, searchMsg.messageID, event.threadID);
        }, 500);

        // Download thumbnail
        let thumbPath = null;
        if (thumbnail) {
            try {
                const thumbRes = await axios.get(thumbnail, { responseType: 'arraybuffer', timeout: 10000 });
                thumbPath = path.join(cacheDir, `${Date.now()}_thumb.jpg`);
                fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));
            } catch (thumbError) {
                console.log("Thumbnail download failed:", thumbError.message);
            }
        }

        // Send thumbnail with info
        if (thumbPath && fs.existsSync(thumbPath)) {
            const durationMins = Math.floor(duration / 60);
            const durationSecs = duration % 60;
            await api.sendMessage(
                {
                    body: `🎬 ${title}\n📺 ${channel}\n⏱️ ${durationMins}:${durationSecs.toString().padStart(2, '0')}`,
                    attachment: fs.createReadStream(thumbPath)
                },
                event.threadID
            );
        } else {
            await api.sendMessage(`🎬 ${title}\n📺 ${channel}`, event.threadID);
        }

        // Send video file
        await api.sendMessage(
            {
                body: `🎬 Video File`,
                attachment: fs.createReadStream(videoPath)
            },
            event.threadID
        );

        // Cleanup after 10 seconds
        setTimeout(() => {
            try {
                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                if (thumbPath && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
                api.unsendMessage(searchMsg.messageID);
            } catch (err) {
                console.log("Cleanup error:", err);
            }
        }, 10000);

    } catch (error) {
        console.error("Playvideo command error:", error.message);
        try { api.unsendMessage(searchMsg.messageID); } catch (e) { }
        return api.sendMessage("❌ An error occurred while processing your request", event.threadID, event.messageID);
    }
};

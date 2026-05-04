const axios = require('axios');
const style = require('./style');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "fbvideo",
    version: "1.0.0",
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "SARDAR RDX",
    description: "Download Facebook video/reel from link",
    commandCategory: "media",
    usages: ".fbvideo [facebook_link]",
    cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
    const fbUrl = args.join(" ");

    if (!fbUrl) {
        return api.sendMessage("❌ Please provide a Facebook video link\n\nUsage: .fbvideo [facebook_video_url]", event.threadID, event.messageID);
    }

    // Validate Facebook URL
    const fbRegex = /(?:https?:\/\/)?(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch)\/(?:[\w.-]+\/)?(?:share|reel|video|watch)\/[\w.-]+/gi;
    if (!fbRegex.test(fbUrl)) {
        return api.sendMessage("❌ Invalid Facebook link provided\n\nPlease provide a valid Facebook video/reel link", event.threadID, event.messageID);
    }

    const frames = [
        "🔍 Detecting FB video...",
        "📥 Fetching info...",
        "🎬 Downloading HD video...",
        "🎞️ Processing...",
        "✅ Ready!"
    ];

    let statusMsg;
    try {
        statusMsg = await api.sendMessage(`📽️ **FACEBOOK VIDEO**\n\n${frames[0]}`, event.threadID);
    } catch (e) {
        return;
    }

    try {
        // Step 1: Get Facebook video info from API
        const apiUrl = `https://anabot.my.id/api/download/facebook?url=${encodeURIComponent(fbUrl)}&apikey=freeApikey`;

        await api.editMessage(`📽️ **FACEBOOK VIDEO**\n\n${frames[1]}`, statusMsg.messageID, event.threadID);

        console.log('[FBVIDEO] Calling API:', apiUrl);

        const response = await axios.get(apiUrl, {
            timeout: 60000,
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('[FBVIDEO] API Response:', JSON.stringify(response.data).substring(0, 500));

        const result = response.data;

        if (!result.success) {
            throw new Error(result.message || "API returned unsuccessful response");
        }

        if (!result.data || !result.data.result) {
            throw new Error("Invalid response structure from API");
        }

        const data = result.data.result;
        const apiInfo = data.api || {};
        const mediaItems = data.mediaItems || [];

        console.log('[FBVIDEO] Media items count:', mediaItems.length);

        if (mediaItems.length === 0) {
            throw new Error("No video found in response");
        }

        // Get the best quality video (prefer 1080p, then 720p, etc.)
        const qualityOrder = ['1080p', '720p', '640p', '540p', '480p'];
        let bestVideo = null;

        for (const quality of qualityOrder) {
            bestVideo = mediaItems.find(m => m.type === 'Video' && m.mediaRes === quality);
            if (bestVideo) break;
        }

        // If no HD video found, get first available video
        if (!bestVideo) {
            bestVideo = mediaItems.find(m => m.type === 'Video');
        }

        if (!bestVideo || !bestVideo.mediaUrl) {
            throw new Error("No download URL found in media items");
        }

        const videoUrl = bestVideo.mediaUrl;
        const videoQuality = bestVideo.mediaRes || 'Unknown';
        const videoDuration = bestVideo.mediaDuration || 'N/A';
        const videoSize = bestVideo.mediaFileSize || 'Unknown';

        console.log('[FBVIDEO] Video URL:', videoUrl);
        console.log('[FBVIDEO] Quality:', videoQuality);

        // Step 2: Download the video
        await api.editMessage(`📽️ **FACEBOOK VIDEO**\n\n${frames[2]}`, statusMsg.messageID, event.threadID);

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);

        const fileName = `fb_video_${Date.now()}.mp4`;
        const filePath = path.join(cacheDir, fileName);

        console.log('[FBVIDEO] Downloading video to:', filePath);

        const fileRes = await axios({
            method: 'get',
            url: videoUrl,
            responseType: 'arraybuffer',
            timeout: 300000 // 5 minutes timeout
        });

        console.log('[FBVIDEO] Download complete, file size:', fileRes.data.length);

        await api.editMessage(`📽️ **FACEBOOK VIDEO**\n\n${frames[3]}`, statusMsg.messageID, event.threadID);
        fs.writeFileSync(filePath, Buffer.from(fileRes.data));

        // Check file size
        const stats = fs.statSync(filePath);
        console.log('[FBVIDEO] File stats:', stats.size, 'bytes');

        if (stats.size < 1000) {
            fs.unlinkSync(filePath);
            throw new Error("Downloaded file too small");
        }

        // Get video info
        const videoInfo = apiInfo;
        const title = videoInfo.title || 'Facebook Video';
        const userName = videoInfo.userInfo?.name || 'Unknown';
        const viewsCount = videoInfo.mediaStats?.viewsCount || 'N/A';
        const likesCount = videoInfo.mediaStats?.likesCount || 'N/A';
        const sharesCount = videoInfo.mediaStats?.sharesCount || 'N/A';

        await api.editMessage(`📽️ **FACEBOOK VIDEO**\n\n${frames[4]}`, statusMsg.messageID, event.threadID);

        // Send video with info
        const caption = `📽️ **Facebook Video**\n\n` +
            `🎬 **Title:** ${title}\n` +
            `👤 **User:** ${userName}\n` +
            `📊 **Quality:** ${videoQuality}\n` +
            `⏱️ **Duration:** ${videoDuration}\n` +
            `💾 **Size:** ${videoSize}\n` +
            `👁️ **Views:** ${viewsCount}\n` +
            `❤️ **Likes:** ${likesCount}\n` +
            `🔄 **Shares:** ${sharesCount}\n\n` +
            `👑 **SARDAR RDX**`;

        console.log('[FBVIDEO] Sending video to user');

        await api.sendMessage({
            body: caption,
            attachment: fs.createReadStream(filePath)
        }, event.threadID);

        console.log('[FBVIDEO] Video sent successfully');

        // Cleanup after 15 seconds
        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('[FBVIDEO] Cleanup: file deleted');
                }
                api.unsendMessage(statusMsg.messageID);
            } catch (e) {
                console.log('[FBVIDEO] Cleanup error:', e.message);
            }
        }, 15000);

    } catch (error) {
        console.error("FBVideo command error:", error.message);
        console.error("FBVideo stack:", error.stack);
        try {
            await api.editMessage(`❌ Download failed: ${error.message}`, statusMsg.messageID, event.threadID);
            setTimeout(() => {
                try { api.unsendMessage(statusMsg.messageID); } catch (e) { }
            }, 5000);
        } catch (e) { }
    }
};

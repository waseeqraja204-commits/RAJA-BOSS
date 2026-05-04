const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'autoFacebook',
        eventType: 'message',
        credits: 'SARDAR RDX',
        description: 'Auto detect and download Facebook videos/reels',
    },

    async run({ api, event }) {
        const { threadID, body, messageID, senderID } = event;

        console.log('[AUTO_FB] Received message:', body);

        if (!body || senderID === api.getCurrentUserID()) {
            console.log('[AUTO_FB] No body or message from bot, returning');
            return;
        }

        // Facebook video/reels link regex - more comprehensive
        const fbRegex = /(?:https?:\/\/)?(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch)\/(?:[\w.-]+\/)?(?:share|reel|video|watch)\/[\w.-]+/gi;
        const matches = body.match(fbRegex);

        console.log('[AUTO_FB] Matches found:', matches);

        if (!matches || matches.length === 0) return;

        const fbUrl = matches[0];
        console.log('[AUTO_FB] Processing URL:', fbUrl);

        const frames = [
            "🔍 Detecting FB video...",
            "📥 Fetching info...",
            "🎬 Downloading HD video...",
            "🎞️ Processing...",
            "✅ Ready to send!"
        ];

        let statusMsg;
        try {
            statusMsg = await api.sendMessage(`📽️ **FACEBOOK VIDEO DETECTED**\n\n${frames[0]}`, threadID);
        } catch (e) {
            console.log('[AUTO_FB] Failed to send status message:', e.message);
            return;
        }

        try {
            // Step 1: Get Facebook video info from API
            const apiUrl = `https://anabot.my.id/api/download/facebook?url=${encodeURIComponent(fbUrl)}&apikey=freeApikey`;
            console.log('[AUTO_FB] Calling API:', apiUrl);

            await api.editMessage(`📽️ **FACEBOOK VIDEO DETECTED**\n\n${frames[1]}`, statusMsg.messageID, threadID);

            const response = await axios.get(apiUrl, {
                timeout: 60000,
                headers: {
                    'Accept': 'application/json'
                }
            });

            console.log('[AUTO_FB] API Response:', JSON.stringify(response.data).substring(0, 500));

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

            console.log('[AUTO_FB] Media items count:', mediaItems.length);

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

            console.log('[AUTO_FB] Video URL:', videoUrl);
            console.log('[AUTO_FB] Quality:', videoQuality);

            // Step 2: Download the video
            await api.editMessage(`📽️ **FACEBOOK VIDEO DETECTED**\n\n${frames[2]}`, statusMsg.messageID, threadID);

            const cacheDir = path.join(__dirname, "../commands/cache");
            await fs.ensureDir(cacheDir);

            const fileName = `fb_video_${Date.now()}.mp4`;
            const filePath = path.join(cacheDir, fileName);

            console.log('[AUTO_FB] Downloading video to:', filePath);

            const fileRes = await axios({
                method: 'get',
                url: videoUrl,
                responseType: 'arraybuffer',
                timeout: 300000 // 5 minutes timeout
            });

            console.log('[AUTO_FB] Download complete, file size:', fileRes.data.length);

            await api.editMessage(`📽️ **FACEBOOK VIDEO DETECTED**\n\n${frames[3]}`, statusMsg.messageID, threadID);
            fs.writeFileSync(filePath, Buffer.from(fileRes.data));

            // Check file size
            const stats = fs.statSync(filePath);
            console.log('[AUTO_FB] File stats:', stats.size, 'bytes');

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

            await api.editMessage(`📽️ **FACEBOOK VIDEO DETECTED**\n\n${frames[4]}`, statusMsg.messageID, threadID);

            // Send video with info
            const caption = `📽️ **Facebook Video Downloaded**\n\n` +
                `🎬 **Title:** ${title}\n` +
                `👤 **User:** ${userName}\n` +
                `📊 **Quality:** ${videoQuality}\n` +
                `⏱️ **Duration:** ${videoDuration}\n` +
                `💾 **Size:** ${videoSize}\n` +
                `👁️ **Views:** ${viewsCount}\n` +
                `❤️ **Likes:** ${likesCount}\n\n` +
                `👑 **SARDAR RDX**`;

            console.log('[AUTO_FB] Sending video to user');

            await api.sendMessage({
                body: caption,
                attachment: fs.createReadStream(filePath)
            }, threadID);

            console.log('[AUTO_FB] Video sent successfully');

            // Cleanup after 15 seconds
            setTimeout(() => {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log('[AUTO_FB] Cleanup: file deleted');
                    }
                    api.unsendMessage(statusMsg.messageID);
                } catch (e) {
                    console.log('[AUTO_FB] Cleanup error:', e.message);
                }
            }, 15000);

        } catch (error) {
            console.error("[AUTO_FB] Error:", error.message);
            console.error("[AUTO_FB] Stack:", error.stack);
            try {
                await api.editMessage(`❌ Facebook download failed: ${error.message}`, statusMsg.messageID, threadID);
                setTimeout(() => {
                    try { api.unsendMessage(statusMsg.messageID); } catch (e) { }
                }, 5000);
            } catch (e) { }
        }
    }
};

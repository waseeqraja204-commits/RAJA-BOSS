const axios = require("axios");
const style = require('./style');
const fs = require("fs");
const path = require("path");

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';
const API_KEYS = ['csk-f4xm3rmpcyf4v58cntefr6jndtmretfcr54n8jj6efvp6hx9'];
const MODEL_NAME = "llama-3.1-8b";
const HISTORY_FILE = path.join(__dirname, "cache", "cato_history.json");

const SYSTEM_PROMPT = `Aap CATO hain - SARDAR RDX ka AI Assistant.

**PERSONALITY:**
- Aap ek smart, helpful AI assistant hain
- Hinglish mein reply karein
- Short aur direct answers (1-2 lines max)
- Emoji use karein
- Jo user poche, uska EXACT jawab do

**MOST IMPORTANT:**
- User jo poche, USI KA JAWAB DO
- Agar user ne koi message quote kiya hai, to US KA JAWAB DO
- Darraye nahi, seedha sawaal ka jawab do
- Har baat mein Sardar RDX ki baat nahi karni
- Simple aur helpful raho`;

function getRandomApiKey() {
  if (API_KEYS.length === 0) return null;
  return API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
}

function ensureHistoryFile() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify({}), 'utf8');
}

function getUserHistory(userID) {
  ensureHistoryFile();
  try {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    return Array.isArray(data[userID]) ? data[userID].slice(-10) : [];
  } catch { return []; }
}

function saveUserHistory(userID, messages) {
  try {
    ensureHistoryFile();
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    data[userID] = messages.slice(-12);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, 'utf8'));
  } catch (err) { }
}

async function getAIResponse(userID, prompt) {
  const history = getUserHistory(userID);
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: prompt }
  ];

  try {
    const apiKey = getRandomApiKey();
    if (!apiKey) throw new Error("API Key not found");

    const response = await axios.post(CEREBRAS_API_URL, {
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.7,
      max_completion_tokens: 300,
      top_p: 0.9
    }, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 15000
    });

    const botReply = response.data.choices[0].message.content;
    saveUserHistory(userID, [...history, { role: "user", content: prompt }, { role: "assistant", content: botReply }]);
    return botReply;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

module.exports = {
  config: {
    credits: "SARDAR RDX",
    name: 'cato',
    aliases: ['catoai', 'cat'],
    description: 'CATO AI - Smart Assistant',
    usage: 'cato [question]',
    category: 'AI',
    prefix: true
  },

  async run({ api, event, args, send, config }) {
    const { threadID, senderID, messageID, body } = event;
    let userMessage = (args && args.length > 0) ? args.join(" ").trim() : '';

    if (!userMessage) {
      return send.reply(`💙 **CATO AI**

Main aapki help ke liye hoon!

Koi bhi sawal poocho, main jawab doonga ✨

Reply bhi de sakte hain!`);
    }

    api.setMessageReaction('💭', messageID, () => {}, true);

    try {
      const aiResponse = await getAIResponse(senderID, userMessage);
      api.setMessageReaction('✅', messageID, () => {}, true);

      return api.sendMessage(aiResponse, threadID, (err, info) => {
        if (info && info.messageID) {
          global.client.replies.set(info.messageID, { 
            commandName: "cato", 
            messageID: info.messageID, 
            data: { author: senderID }
          });
        }
      }, messageID);
    } catch (error) {
      api.setMessageReaction('❌', messageID, () => {}, true);
      api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  },

  async handleReply({ api, event, data, Currencies, Users, Threads, config }) {
    const { threadID, messageID, senderID, body, messageReply } = event;
    
    if (!data || senderID !== data.author) return;

    let prompt = body.trim();
    
    if (!prompt) return;

    if (messageReply && messageReply.body) {
      prompt = `User ne previous message ko quote karke ye pocha: "${messageReply.body}"\n\nAb user ka naya sawal hai: ${prompt}\n\nIs sawal ka seedha aur clear jawab do, previous context ke hisab se.`;
    }

    api.setMessageReaction('💭', messageID, () => {}, true);

    try {
      const aiResponse = await getAIResponse(senderID, prompt);
      api.setMessageReaction('✅', messageID, () => {}, true);

      return api.sendMessage(aiResponse, threadID, (err, info) => {
        if (info && info.messageID) {
          global.client.replies.set(info.messageID, { 
            commandName: "cato", 
            messageID: info.messageID, 
            data: { author: senderID }
          });
        }
      }, messageID);
    } catch (error) {
      api.setMessageReaction('❌', messageID, () => {}, true);
      api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  }
};

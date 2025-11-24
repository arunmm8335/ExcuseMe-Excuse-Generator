/**
 * Get the chat format prompt based on platform
 * @param {string} platform - The chat platform (whatsapp, messenger, sms, etc.)
 * @param {string} meName - Name of the sender
 * @param {string} otherName - Name of the receiver
 * @returns {string} - The formatted prompt for the chat platform
 */
const getChatFormatPrompt = (platform, meName, otherName) => {
    const baseFormat = `Each line must be: Speaker: Message text. Make the conversation sound natural and realistic, as if two real people are chatting. Do not include timestamps or line numbers. Do not add any extra commentary.`;
    
    const platformFormats = {
        whatsapp: `Format as a WhatsApp chat between '${meName}' and '${otherName}'. ${baseFormat}`,
        messenger: `Format as a Messenger chat between '${meName}' and '${otherName}'. ${baseFormat}`,
        sms: `Format as an SMS between '${meName}' and '${otherName}'. ${baseFormat}`,
        telegram: `Format as a Telegram chat between '${meName}' and '${otherName}'. ${baseFormat}`,
        instagram: `Format as an Instagram DM chat between '${meName}' and '${otherName}'. ${baseFormat}`,
        default: `Format as a generic chat between '${meName}' and '${otherName}'. ${baseFormat}`
    };

    return platformFormats[platform] || platformFormats.default;
};

module.exports = {
    getChatFormatPrompt
};

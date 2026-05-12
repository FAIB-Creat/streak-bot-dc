require("dotenv").config();

const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  Events,
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

// GlobalFonts.registerFromPath("./fonts/sans-serif-Regular.ttf", "sans-serif");

// Canvas.registerFont("./fonts/sans-serif-Regular.ttf", {
//   family: "sans-serif",
// });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const DATA_FILE = "./data.json";

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "{}");
}

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function getToday() {
  return new Date().toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
  });
}

function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
  });
}

function pairKey(id1, id2) {
  return [id1, id2].sort().join("-");
}

async function fetchAvatarImage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "DiscordBot (https://github.com/your-bot, 1.0)",
        Accept: "image/png,image/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch avatar: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      return await loadImage(buffer);
    } catch (innerError) {
      console.warn(
        "loadImagee(buffer) failed, retrying with URL:",
        url,
        innerError,
      );
      return await loadImage(url);
    }
  } catch (error) {
    console.error("fetchAvatarImage error:", error, "url:", url);

    const placeholder = createCanvas(128, 128);
    const placeholderCtx = placeholder.getContext("2d");
    placeholderCtx.fillStyle = "#2f3136";
    placeholderCtx.fillRect(0, 0, 128, 128);
    placeholderCtx.fillStyle = "#ffffff";
    placeholderCtx.font = "bold 48px sans-serif";
    placeholderCtx.fillText("?", 40, 90);
    return placeholder;
  }
}

async function createStreakImage(user, partner, streakData) {
  const width = 900;
  const height = 440;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#101520");
  gradient.addColorStop(1, "#18233c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const panelX = 40;
  const panelY = 30;
  const panelW = width - 80;
  const panelH = height - 60;
  const panelRadius = 30;
  const panelStroke = 6;

  const drawRoundedRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  ctx.fillStyle = "rgba(22, 34, 70, 0.95)";
  drawRoundedRect(panelX, panelY, panelW, panelH, panelRadius);
  ctx.fill();

  ctx.strokeStyle = "rgba(104, 133, 255, 0.95)";
  ctx.lineWidth = panelStroke;
  ctx.lineJoin = "round";
  drawRoundedRect(
    panelX + panelStroke / 2,
    panelY + panelStroke / 2,
    panelW - panelStroke,
    panelH - panelStroke,
    panelRadius,
  );
  ctx.stroke();

  const centerX = width / 2;
  const avatarSize = 150;
  const avatarSpacing = 220;
  const leftAvatarX = centerX - avatarSize - avatarSpacing / 2;
  const rightAvatarX = centerX + avatarSpacing / 2;
  const avatarY = panelY + 80;

  const userAvatar = await fetchAvatarImage(
    user.displayAvatarURL({ extension: "png", size: 256 }),
  );
  const partnerAvatar = await fetchAvatarImage(
    partner.displayAvatarURL({ extension: "png", size: 256 }),
  );

  const drawCircleAvatar = (img, x, y, size) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 - 3, 0, Math.PI * 2);
    ctx.stroke();
  };

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.beginPath();
  ctx.arc(
    leftAvatarX + avatarSize / 2,
    avatarY + avatarSize / 2,
    avatarSize / 2 + 18,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    rightAvatarX + avatarSize / 2,
    avatarY + avatarSize / 2,
    avatarSize / 2 + 18,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  drawCircleAvatar(userAvatar, leftAvatarX, avatarY, avatarSize);
  drawCircleAvatar(partnerAvatar, rightAvatarX, avatarY, avatarSize);

  const nameY = avatarY + avatarSize + 18;
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px  sans-serif";
  ctx.textAlign = "center";
  const safeUsername1 = user.username.replace(/[^\x00-\x7F]/g, "");
  const safeUsername2 = partner.username.replace(/[^\x00-\x7F]/g, "");
  ctx.fillText(safeUsername1, leftAvatarX + avatarSize / 2, nameY);
  ctx.fillText(safeUsername2, rightAvatarX + avatarSize / 2, nameY);

  // Flame effect di antara avatar
  const flameX = centerX;
  const flameY = avatarY + avatarSize / 2;
  ctx.save();
  ctx.shadowColor = "rgba(255, 170, 65, 0.9)";
  ctx.shadowBlur = 25;
  ctx.fillStyle = "rgba(255, 185, 70, 0.15)";
  ctx.beginPath();
  ctx.arc(flameX, flameY, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.fillStyle = "#ff9900";
  ctx.arc(flameX, flameY, 30, 0, Math.PI * 2);
  ctx.fill();

  const titleY = panelY + 45;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("STREAK YOU", centerX, statsY);

  const pairText = `Pasangan: ${partner.username}`;
  const pairMaxWidth = panelW - 120;
  ctx.fillStyle = "#d9e1ff";
  ctx.font =
    ctx.measureText(pairText).width <= pairMaxWidth
      ? "20px sans-serif"
      : "18px sans-serif";
  const pairY = titleY + 30;
  ctx.fillText(pairText, centerX, pairY);

  const statsBlockW = panelW - 140;
  const statsBlockH = 150;
  const statsBlockX = centerX - statsBlockW / 2;
  const statsBlockY = avatarY + avatarSize + 20;
  const statsBlockRadius = 24;

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  drawRoundedRect(
    statsBlockX,
    statsBlockY,
    statsBlockW,
    statsBlockH,
    statsBlockRadius,
  );
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  drawRoundedRect(
    statsBlockX + 0.5,
    statsBlockY + 0.5,
    statsBlockW - 1,
    statsBlockH - 1,
    statsBlockRadius,
  );
  ctx.stroke();

  const statsY = statsBlockY + 32;
  ctx.font = "20px  sans-serif";
  ctx.fillStyle = "#d9e1ff";
  ctx.textAlign = "center";
  ctx.fillText(`Streak : ${streakData.streak} hari`, centerX, statsY);

  ctx.fillText(`Nyawa : ${streakData.lives}`, centerX, statsY + 28);

  ctx.fillText(
    `Status : ${streakData.dead ? "Mati" : "Aktif"}`,
    centerX,
    statsY + 56,
  );

  ctx.fillText(`Terakhir : ${streakData.lastDate}`, centerX, statsY + 82);

  ctx.fillStyle = "white";
  ctx.font = "40px sans-serif";
  ctx.fillText("HELLO WORLD", 50, 50);
  return canvas.toBuffer("image/png");
}

const commands = [
  new SlashCommandBuilder()
    .setName("pasangan")
    .setDescription("Buat pasangan streak 🔥")
    .addUserOption((option) =>
      option.setName("user").setDescription("Pilih pasangan").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("streak")
    .setDescription("Lihat streak kamu 🔥")
    .addUserOption((option) =>
      option.setName("user").setDescription("Pilih pasangan").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("pulihkan")
    .setDescription("Pulihkan streak yang mati ❤️")
    .addUserOption((option) =>
      option.setName("user").setDescription("Pilih pasangan").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("putusstreak")
    .setDescription("Putuskan pasangan streak 💔")
    .addUserOption((option) =>
      option.setName("user").setDescription("Pilih pasangan").setRequired(true),
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Deploying slash command...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID,
      ),
      { body: commands },
    );
    console.log("Slash command berhasil dibuat!");
  } catch (error) {
    console.error(error);
  }
})();

client.on("clientReady", () => {
  console.log(`${client.user.tag} online!`);
});

client.on("error", console.error);
client.on("shardError", console.error);

// BUTTON
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const data = loadData();

  // ======================
  // ACCEPT
  // ======================
  if (interaction.customId.startsWith("accept_")) {
    const parts = interaction.customId.split("_");

    const requesterId = parts[1];

    const targetId = parts[2];

    if (interaction.user.id !== targetId) {
      return interaction.reply({
        content: "❌ Hanya pasangan yang bisa menerima!",

        ephemeral: true,
      });
    }

    const key = pairKey(requesterId, targetId);

    if (data[key]) {
      return interaction.reply({
        content: "❌ Pasangan sudah ada",

        ephemeral: true,
      });
    }

    data[key] = {
      users: [requesterId, targetId],

      streak: 1,

      lives: 3,

      dead: false,

      lastDate: getToday(),

      pendingBy: null,
    };

    saveData(data);

    return interaction.update({
      content: "🔥 Pasangan streak berhasil dibuat!",

      components: [],
    });
  }

  // ======================
  // REJECT
  // ======================
  if (interaction.customId.startsWith("reject_")) {
    const parts = interaction.customId.split("_");

    const targetId = parts[2];

    if (interaction.user.id !== targetId) {
      return interaction.reply({
        content: "❌ Hanya pasangan yang bisa menolak!",

        ephemeral: true,
      });
    }

    return interaction.update({
      content: "❌ Permintaan pasangan ditolak",

      components: [],
    });
  }
});

// SLASH COMMAND
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const data = loadData();

  // =========================
  // /PASANGAN
  // =========================
  if (interaction.commandName === "pasangan") {
    const user = interaction.user;

    const partner = interaction.options.getUser("user");

    if (user.id === partner.id) {
      return interaction.reply({
        content: "❌ Tidak bisa dengan diri sendiri!",
        ephemeral: true,
      });
    }

    const key = pairKey(user.id, partner.id);

    if (data[key]) {
      return interaction.reply({
        content: "❌ Kalian sudah punya streak!",
        ephemeral: true,
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accept_${user.id}_${partner.id}`)
        .setLabel("Terima")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`reject_${user.id}_${partner.id}`)
        .setLabel("Tolak")
        .setStyle(ButtonStyle.Danger),
    );

    return interaction.reply({
      content: `❤️ ${partner}

.${user.username}
ingin menjadi pasangan streak kamu!`,

      components: [row],
    });
  }

  // =========================
  // /STREAK
  // =========================
  if (interaction.commandName === "streak") {
    const user = interaction.user;

    const partner = interaction.options.getUser("user");

    const key = pairKey(user.id, partner.id);

    const streakData = data[key];
    if (!streakData) {
      return interaction.reply({
        content: "❌ Kalian tidak punya streak",
        ephemeral: true,
      });
    }

    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply();
    }
    try {
      const buffer = await createStreakImage(user, partner, streakData);

      const attachment = new AttachmentBuilder(buffer, {
        name: "streak-card.png",
      });

      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("🔥 Streak Card")
        .setDescription(`❤️ ${user.username} + ${partner.username}`)
        .setImage("attachment://streak-card.png");

      return interaction.editReply({
        embeds: [embed],

        files: [attachment],
      });
    } catch (error) {
      console.error(error);

      return interaction.editReply({
        content: "❌ Gagal membuat streak card",
      });
    }
  }

  // =========================
  // /PULIHKAN
  // =========================
  if (interaction.commandName === "pulihkan") {
    const userId = interaction.user.id;

    let found = false;

    for (const key in data) {
      const streakData = data[key];

      if (!streakData.users.includes(userId)) continue;

      found = true;

      // STREAK TIDAK MATI
      if (!streakData.dead) {
        return interaction.reply("❌ Streak kalian tidak mati");
      }

      // NYAWA HABIS
      if (streakData.lives <= 0) {
        return interaction.reply("💀 Nyawa kalian habis");
      }

      // PULIHKAN
      streakData.lives -= 1;

      streakData.dead = false;

      streakData.lastDate = getToday();

      data[key] = streakData;

      saveData(data);

      return interaction.reply(
        `❤️ Streak berhasil dipulihkan!

🔥 Streak: ${streakData.streak}

❤️ Sisa nyawa: ${streakData.lives}`,
      );
    }

    // BELUM PUNYA PASANGAN
    if (!found) {
      return interaction.reply("❌ Kamu belum punya pasangan streak");
    }
  }
  // =========================
  // /PUTUSSTREAK
  // =========================
  if (interaction.commandName === "putusstreak") {
    const userId = interaction.user.id;

    const target = interaction.options.getUser("user");

    const key = pairKey(userId, target.id);

    if (!data[key]) {
      return interaction.reply("❌ Kalian tidak punya streak");
    }

    delete data[key];

    saveData(data);

    return interaction.reply(`💔 Kamu putus streak dengan ${target.username}`);
  }
});
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.channel.id !== "1502280800798900375") {
    return;
  }

  const data = loadData();

  let targetUser = null;

  // =========================
  // DETEKSI MENTION
  // =========================
  if (message.mentions.users.first()) {
    targetUser = message.mentions.users.first();
  }

  // =========================
  // DETEKSI REPLY
  // =========================
  else if (message.reference?.messageId) {
    try {
      const repliedMessage = await message.channel.messages.fetch(
        message.reference.messageId,
      );

      targetUser = repliedMessage.author;
    } catch {
      return;
    }
  }

  // TIDAK ADA TARGET
  if (!targetUser) return;

  // TIDAK BOLEH DIRI SENDIRI
  if (targetUser.id === message.author.id) return;

  const key = pairKey(message.author.id, targetUser.id);

  const streakData = data[key];

  // BELUM PASANGAN
  if (!streakData) return;

  const today = getToday();

  const yesterday = getYesterday();

  // SUDAH STREAK HARI INI
  if (streakData.lastDate === today) {
    return;
  }

  // =========================
  // ORANG PERTAMA MEMULAI
  // =========================
  if (streakData.pendingBy === null) {
    streakData.pendingBy = message.author.id;

    data[key] = streakData;

    saveData(data);

    return message.reply(`⏳ Menunggu balasan dari ${targetUser.username}...`);
  }

  // SPAM ORANG YANG SAMA
  if (streakData.pendingBy === message.author.id) {
    return;
  }

  // =========================
  // PASANGAN MEMBALAS
  // =========================
  if (streakData.pendingBy === targetUser.id) {
    // LANJUT STREAK
    if (streakData.lastDate === yesterday) {
      streakData.streak += 1;
    }

    streakData.lastDate = today;

    streakData.pendingBy = null;

    streakData.dead = false;

    data[key] = streakData;

    saveData(data);

    return message.reply(
      `🔥 Streak berhasil dijaga!

🔥 ${streakData.streak} Hari`,
    );
  }
});

client.login(process.env.TOKEN);

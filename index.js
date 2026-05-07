require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Data sementara (akan hilang jika bot restart)
const streaks = {};

function getPairKey(id1, id2) {
  return [id1, id2].sort().join("-");
}

client.once("ready", () => {
  console.log(`✅ Berhasil login sebagai ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const mentionedUser = message.mentions.users.first();
  const oneDay = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // 1. Logika Cek Streak (Tanpa harus update streak)
  if (message.content.startsWith("!cekstreak")) {
    if (!mentionedUser)
      return message.reply("Tag orangnya dong buat cek streak!");

    const key = getPairKey(message.author.id, mentionedUser.id);
    const data = streaks[key];

    if (!data)
      return message.reply("Kalian belum punya streak. Mulai chat yuk!");
    return message.reply(`🔥 Streak kalian saat ini: **${data.streak}** hari.`);
  }

  // 2. Logika Update Streak (Hanya jika ada mention di pesan biasa)
  if (
    mentionedUser &&
    !mentionedUser.bot &&
    mentionedUser.id !== message.author.id
  ) {
    const key = getPairKey(message.author.id, mentionedUser.id);

    if (!streaks[key]) {
      streaks[key] = { streak: 1, lastInteraction: now };
      message.reply(`🔥 Streak dimulai dengan **${mentionedUser.username}**!`);
    } else {
      const diff = now - streaks[key].lastInteraction;

      if (diff > oneDay * 2) {
        streaks[key].streak = 1;
        message.reply(
          `💀 Streak dengan ${mentionedUser.username} putus! Mulai lagi dari 1.`,
        );
      } else if (diff > oneDay) {
        streaks[key].streak += 1;
        message.reply(
          `🔥 Streak naik! Sekarang **${streaks[key].streak}** hari bersama ${mentionedUser.username}.`,
        );
      }

      // Update waktu interaksi terakhir
      streaks[key].lastInteraction = now;
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

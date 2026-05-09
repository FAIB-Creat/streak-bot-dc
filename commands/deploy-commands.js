require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("pasangan")
    .setDescription("Buat pasangan streak 🔥")
    .addUserOption((option) =>
      option.setName("user").setDescription("Pilih pasangan").setRequired(true),
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("streak")
    .setDescription("Lihat streak kamu 🔥")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("pulihkan")
    .setDescription("Pulihkan streak yang mati ❤️")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("putusstreak")
    .setDescription("Putuskan pasangan streak 💔")
    .addUserOption((option) =>
      option.setName("user").setDescription("Pilih pasangan").setRequired(true),
    )
    .toJSON(),
];

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

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("streak")
    .setDescription("Lihat streak kamu 🔥"),

  async execute(interaction) {
    await interaction.reply(`🔥 Streak kamu: 1 hari`);
  },
};

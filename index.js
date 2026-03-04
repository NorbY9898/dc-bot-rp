require("dotenv").config();
const { Client, GatewayIntentBits, AttachmentBuilder, Partials } = require("discord.js");

// ===== .ENV =====
const TOKEN = (process.env.DISCORD_TOKEN || "").trim();
const welcomeChannelId = (process.env.WELCOME_CHANNEL_ID || "").trim();
const goodbyeChannelId = (process.env.GOODBYE_CHANNEL_ID || "").trim();

// ===== KÖTELEZŐ ELLENŐRZÉSEK =====
function mustHave(name, value) {
  if (!value) {
    console.log(`❌ Hiányzik a .env-ből: ${name}`);
    process.exit(1);
  }
}

mustHave("DISCORD_TOKEN", TOKEN);
mustHave("WELCOME_CHANNEL_ID", welcomeChannelId);
mustHave("GOODBYE_CHANNEL_ID", goodbyeChannelId);

// ===== DEBUG (ne írd ki a tokent teljesen) =====
console.log("🧪 ENV OK:", {
  tokenPreview: TOKEN.slice(0, 8) + "..." + TOKEN.slice(-6),
  welcomeChannelId,
  goodbyeChannelId,
});

// ===== WELCOME BANNEREK – HELYI FÁJLOK (./welcome/) =====
const welcomeBanners = ["banner1.png", "banner2.png", "banner3.png", "banner4.png", "banner5.png"];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ===== RANDOM WELCOME SZÖVEGEK =====
const welcomeMessages = [
  (m) => `👋 Szia <@${m.id}>! Örülünk, hogy csatlakoztál!`,
  (m) => `✨ Üdv itt, <@${m.id}>! Érezd magad otthon!`,
  (m) => `🔥 Egy új tag érkezett: <@${m.id}>!`,
  (m) => `😎 Helló <@${m.id}>! Jó szórakozást a szerveren!`,
  (m) => `🎮 <@${m.id}> belépett! Jó játékot és jó dumát!`,
];

// ===== KLIENS =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // kell a join/leave-hez
  ],
  partials: [Partials.GuildMember],
});

// Hibák logolása
client.on("error", (err) => console.log("⚠️ Discord client error:", err?.message || err));
process.on("unhandledRejection", (err) => console.log("⚠️ Unhandled rejection:", err?.message || err));

client.once("ready", () => {
  console.log(`✅ Bejelentkezve mint ${client.user.tag}`);
});

// ===== WELCOME =====
client.on("guildMemberAdd", async (member) => {
  try {
    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) {
      console.log("❌ Welcome csatorna nem található (ID rossz vagy a bot nem látja):", welcomeChannelId);
      return;
    }

    const msgText = getRandomItem(welcomeMessages)(member);
    const bannerFileName = getRandomItem(welcomeBanners);
    const bannerPath = `./welcome/${bannerFileName}`;

    const bannerAttachment = new AttachmentBuilder(bannerPath, { name: bannerFileName });

    const welcomeEmbed = {
      color: 0x00ff99,
      title: "🎉 Üdv a szerveren!",
      description: msgText + "\n\n📌 Nézz szét a csatornák között és jó szórakozást!",
      thumbnail: { url: member.user.displayAvatarURL({ dynamic: true, size: 256 }) },
      image: { url: `attachment://${bannerFileName}` },
      footer: { text: `${member.guild.name} • ${new Date().toLocaleDateString("hu-HU")}` },
    };

    await channel.send({ embeds: [welcomeEmbed], files: [bannerAttachment] });

    // DM (opcionális)
    try {
      await member.send(
        `Szia ${member.user.username}! 👋\n\n` +
          `Köszi, hogy csatlakoztál a **${member.guild.name}** szerverhez!\n` +
          `Jó szórakozást! 😄`
      );
    } catch {
      // ha tiltva van a DM, nem gond
    }
  } catch (err) {
    console.log("⚠️ Hiba a welcome handlerben:", err?.message || err);
  }
});

// ===== GOODBYE =====
client.on("guildMemberRemove", async (member) => {
  try {
    const channel = member.guild.channels.cache.get(goodbyeChannelId);
    if (!channel) {
      console.log("❌ Goodbye csatorna nem található (ID rossz vagy a bot nem látja):", goodbyeChannelId);
      return;
    }

    await channel.send(`😢 <@${member.id}> elhagyta a szervert. Bye bye!`);
  } catch (err) {
    console.log("⚠️ Hiba a goodbye handlerben:", err?.message || err);
  }
});

// ===== LOGIN =====
client.login(TOKEN).catch((e) => {
  console.log("❌ Login hiba (token rossz vagy tiltva):", e?.message || e);
});
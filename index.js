require('dotenv').config();
const {Client, GatewayIntentBits, ActivityType, Partials} = require('discord.js');
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildPresences], 'partials': [Partials.Channel]});

// Express
const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log(`Serveur défini avec le port ${port}`);
});

// https
var https = require('https');

https.createServer(function (req, res) {
    res.write('Bot en ligne');
    res.end();
}).listen(8080);

// Discord
client.on('ready', (x) => {
    console.log(`✅ ${x.user.tag} en ligne !`);
    const serveur = client.guilds.cache.get('1130900688491253891');
    const membres = serveur.memberCount;
    const vip = serveur.members.cache.filter(member => member.roles.cache.has('1130958325991866549')).size;

    const activities = [
        {
            name: `${membres} members`,
            type: ActivityType.Watching,
        },
        {
            name: 'requests',
            type: ActivityType.Listening,
        },
        {
            name: `${vip} vip`,
            type: ActivityType.Watching,
        },
        {
            name: 'v1.2.0',
            type: ActivityType.Playing,
        },
        {
            name: 'your Custom Status',
            type: ActivityType.Watching,
        },
    ];

    let activityIndex = 0;
    setInterval(() => {
        if (activityIndex >= activities.length) {
            activityIndex = 0;
        }
        client.user.setActivity(activities[activityIndex]);
        activityIndex++;
    }, 20000);
});

const userCooldowns = new Map();
const roleCooldowns = {
  '1131265429613052025': 120000, // 2 minutes
  '1130958327648632943': 60000,  // 1 minute
  '1130958326847512646': 30000,  // 30 secondes
  '1130958325991866549': 10000   // 10 secondes
};

// Detect messages in the "nitrogen" channel
client.on('messageCreate', async (message) => {
  if (message.author.id !== client.user.id && message.channel.id === '1130945796989272175') {
    const authorId = message.author.id;
    const authorRoles = message.member ? message.member.roles.cache : null;

    if (authorRoles) {
      let userRole = '1131265429613052025';

      if (authorRoles.some(role => role.id === '1130958327648632943')) {
        userRole = '1130958327648632943';
      } else if (authorRoles.some(role => role.id === '1130958326847512646')) {
        userRole = '1130958326847512646';
      } else if (authorRoles.some(role => role.id === '1130958325991866549')) {
        userRole = '1130958325991866549';
      }

      const cooldown = roleCooldowns[userRole];

      if (userCooldowns.has(authorId) && userCooldowns.get(authorId) > Date.now()) {
        const remainingTime = Math.ceil((userCooldowns.get(authorId) - Date.now()) / 1000);
        const errorMessage = `You can receive a new code <t:${Math.floor(userCooldowns.get(authorId) / 1000)}:R>.`;

        const previousCooldownMessageId = userCooldowns.get(`${authorId}_messageId`);
        if (previousCooldownMessageId) {
          await message.channel.messages.delete(previousCooldownMessageId).catch(() => { });
        }

        const cooldownMessage = await message.channel.send(errorMessage);

        userCooldowns.set(`${authorId}_messageId`, cooldownMessage.id);

        setTimeout(async () => {
          await cooldownMessage.delete().catch(() => { });
          userCooldowns.delete(`${authorId}_messageId`);
        }, remainingTime * 1000);

        await message.delete().catch(() => { });
      } else {
        const cooldownTimestamp = Date.now() + cooldown;
        userCooldowns.set(authorId, cooldownTimestamp);

        const nitroCodes = generateMultipleNitroCodes(3, Math.floor(Math.random() * 24) + 8);
        const userMessage = await message.author.send(nitroCodes.join('\n')).catch(() => {
          message.channel.send("Couldn't send you the gift codes in a private message. Please enable your DMs.");
        });

        await message.delete().catch(() => { });

        setTimeout(async () => {
          if (userMessage) {
            await userMessage.delete().catch(() => { });
          }
        }, 10000);
      }
    }
  }
});

// Random code
function generateNitroCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// Multiple codes
function generateMultipleNitroCodes(numberOfCodes, length) {
  const codes = [];
  for (let i = 0; i < numberOfCodes; i++) {
    codes.push('**https://discord.gift/' + generateNitroCode(length) + '**');
  }
  return codes;
}


// Custom Status add VIP
client.on("presenceUpdate", async (oldPresence, newPresence) => {
    if (newPresence.member.user.bot) return;
    
    const memberId = newPresence.userId;
    const roleId = "1130946626287046796";
    const guild = await client.guilds.fetch('1130900688491253891');
    const member = await guild.members.fetch(memberId);

    if (!member.user.bot) {
        if (newPresence.activities.some(activity => activity.name === "Custom Status" && activity.state.includes("dsc.gg/nitrogen"))) {
            try {
                await member.roles.add(roleId);
            } catch (err) {
                console.error(`Erreur lors de l'ajout du rôle ${roleId} à ${memberId}:`, err);
            }
        } else {
            try {
                await member.roles.remove(roleId);
            } catch (err) {
                console.error(`Erreur lors de la suppression du rôle ${roleId} à ${memberId}:`, err);
            }
        }
    }
});

client.login(process.env.TOKEN);
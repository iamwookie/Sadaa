import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  UserContextMenuCommandInteraction,
  GuildMember, VoiceChannel
} from "discord.js";
import { getVoiceChannelFromHash, saveVoiceChannel } from "../utils/vc";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("kick")
    .setDefaultMemberPermissions('0')
    .setType(ApplicationCommandType.User),
  async execute(interaction: UserContextMenuCommandInteraction) {
    if (!interaction.guild) return;

    const member = interaction.member as GuildMember;
    const targetMember = interaction.targetMember as GuildMember;
    const guild = interaction.guild;

    getVoiceChannelFromHash(member.id)
      .then(channelId => {
        if (!channelId)
          return interaction.reply("You are not in a voice channel");

        const voiceChannel = guild?.channels.cache.get(channelId) as VoiceChannel;
        if (voiceChannel.members.has(targetMember.id)) 
          targetMember.voice.setChannel(null);

        voiceChannel.permissionOverwrites.edit(targetMember, {
          Connect: false,
        })
          .then(async () => {
            await saveVoiceChannel(voiceChannel.id);
            return interaction.reply(`Kicked ${targetMember.user.username} from the voice channel. \nThey can no longer join.`);
          });
      })
      .catch(error => console.log(error))
  }
}
import { DiscordAPIError } from "@discordjs/rest";
import { CategoryChannel, VoiceChannel, VoiceState } from "discord.js";


import {
  isVoiceChannelSaved,
  isVoiceChannelActive,
  deleteActiveVoiceChannel,
  removeVoiceChannelFromHashWithVcId
} from "../utils/vc";

import { idleCategoryId } from "../config.json";

async function removeFromSavedState(channelId: string) {
  await deleteActiveVoiceChannel(channelId);
  await removeVoiceChannelFromHashWithVcId(channelId);
}

async function moveToIdleCategory(voiceChannel: VoiceChannel) {
  await deleteActiveVoiceChannel(voiceChannel.id);
  
  await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, {
    VIEW_CHANNEL: false,
  })
  
  const category = voiceChannel.guild.channels.cache.get(idleCategoryId) as CategoryChannel;
  await voiceChannel.setParent(category, {
    lockPermissions: false,
  });
}

export default {
  name: "voiceStateUpdate",
  once: false,
  execute: async (oldState: VoiceState, newState: VoiceState) => {
    const channel = oldState.channel;
    if (channel?.members.size !== 0) 
      return
    
    if (!(await isVoiceChannelActive(oldState.channelId)))
      return;
    
    if (await isVoiceChannelSaved(channel.id)) {
      await moveToIdleCategory(channel as VoiceChannel);
      return;
    }

    channel.delete()
      .then(async () => {
        await removeFromSavedState(channel.id as string);
      })
      .catch((error: DiscordAPIError) => {
        if (error.message === "Unknown Channel")
          return;
      })

  }
}

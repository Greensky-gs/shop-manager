import { BaseInteraction, Guild, GuildMember, Message, User } from 'discord.js';
import { itemType } from './item';

export type guildResolvable = BaseInteraction | Guild | string | GuildMember | Message;
export type userResolvable = BaseInteraction | User | GuildMember | Message | string;
export type addOptions = {
    guild: guildResolvable;
    name: string;
    content: string;
    type: itemType;
    quantity?: number;
    price: number;
};

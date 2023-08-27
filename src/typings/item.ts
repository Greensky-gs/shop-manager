import { If } from 'discord.js';

export type itemType = 'string' | 'role';
export type item<Raw extends boolean = false> = {
    type: itemType;
    guild_id: string;
    name: string;
    content: string;
    price: If<Raw, string, number>;
    quantity: If<Raw, string, number>;
    remaining: If<Raw, string, number>;
    id: number;
};

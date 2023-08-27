import { If } from 'discord.js';

export type inventoryItem = {
    name: string;
    price: number;
    quantity: number;
    content: string;
    id: number;
};
export type inventory<Raw extends boolean = false> = {
    guild_id: string;
    user_id: string;
    items: If<Raw, string, inventoryItem[]>;
};

import { If } from 'discord.js';
import { itemType } from './item';

export type inventoryItem = {
    name: string;
    price: number;
    quantity: number;
    content: string;
    id: number;
    type: itemType
};
export type inventory<Raw extends boolean = false> = {
    guild_id: string;
    user_id: string;
    items: If<Raw, string, inventoryItem[]>;
};

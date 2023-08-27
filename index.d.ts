import { Collection } from "discord.js";
import { item, itemType } from './dist/typings/item'
import { addOptions, guildResolvable, userResolvable } from './dist/typings/shop'
import { inventory, inventoryItem } from './dist/typings/inventories'
import { QueryResult, DefaultQueryResult } from './dist/typings/database';
import { Connection } from "mysql";

export class ShopManager {
    private _items: Collection<number, item>;
    private _inventories: Collection<string, Collection<string, inventory>>
    private database: Connection;

    /**
     * Create a new Shop Manager
     * 
     * ```js
     * const { ShopManager } = require('shop-manager');
     * const { createConnection } = require('mysql'):
     * 
     * const database = createConnection({
     *     // Database credits
     * });
     * 
     * const manager = new ShopManager(database);
     * ```
     * 
     * @param database Connection to the MySQL database
     */
    public constructor(database: Connection);

    /**
     * Get the items cache
     * 
     * @returns {Collection<number, item>} the key is the id of the item
     */
    public get items(): Collection<number, item>;
    /**
     * Get the inventories cache
     * 
     * @returns {Collection<string, Collection<string, inventory>>}
     */
    public get inventories(): Collection<string, Collection<string, inventory>>;
    /**
     * Get all the items of a guild
     * 
     * @returns {Collection<number, item>} The collection of items, the key is the id of the item
     * @param guild `guildResolvable` anything that can give a guild
     */
    public guildItems(guild: guildResolvable): Collection<number, item>;
    /**
     * Add an item to a guild's shop
     * 
     * @returns {Promise<item | 'no reply from database'>}
     * @param options Item to add to the given guild
     */
    public addItem(options: addOptions): Promise<'no reply from database' | item>
    /**
     * Remove an item from the shops
     * One id is one single item, so no guild is required
     * 
     * @param id `number` the id of the item to remove
     */
    public removeItem(id: number): void
    /**
     * Add an item to an user's inventory in one particular guild
     * 
     * @param guild `guildResolvable` anything that can give a guild
     * @param user `userResolvable` anything that can give a user
     * @param item `item` item to add
     * @param quantity `number` Number of items to add
     * @returns {Promise<true>} once the request to the database is done
     */
    public addInventory(guild: guildResolvable, user: userResolvable, item: item, quantity?: number): Promise<true>;
    /**
     * Remove an item from an user's inventory in one particular guild
     * 
     * This method returns nothing if there is no item to remove
     * 
     * @param guild `guildResolvable` anything that can give a guild
     * @param user `userResolvable` anything that can give a user
     * @param item `item` item to remove
     * @param quantity `number` Number of items to remove
     * @returns {Promise<true>} once the request to the database is done
     */
    public removeInventory(guild: guildResolvable, user: userResolvable, item: item, quantity?: number): Promise<true>;
    /**
     * Removes an item from the shop and add it in the inventory of the user
     * 
     * @returns {Promise<'no item' | 'nothing buyable' | true>} Returns no item when no item is found. Returns 'nothing buyable' if there is no item remaining. Returns `true` when everything is done 
     * @param guild `guildResolvable` anything that can give a guild
     * @param user `userResolvable` anything that can give a user
     * @param itemId `number` id of the item to remove
     * @param quantity `number` Amount of items to buy
     */
    public buyItem(guild: guildResolvable, user: userResolvable, itemId: number, quantity?: number): Promise<'no item' | 'nothing buyable' | true>;
    /**
     * Modify the `quantity` field of an item
     * 
     * @returns {Promise<'no item' | 'item is infinite' | true>} Returns 'no item' if no item is found. Returns 'item is infinite' if item is infinite, so it can't be modified. Returns `true` when the request to the database is done
     * @param guild `guildResolvable` anything that can give a guild
     * @param itemId `number` id of the item to modify
     * @param quantity New quantity of the item
     */
    public updateQuantity(guild: guildResolvable, itemId: number, quantity: number): Promise<'no item' | 'item is infinite' | true>;
    /**
     * Modify the `remaining` field of an item
     * 
     * @returns {Promise<'no item' | 'item is infinite' | true>} Returns 'no item' if no item is found. Returns 'item is infinite' if item is infinite, so it can't be modified. Returns `true` when the request to the database is done
     * @param guild `guildResolvable` anything that can give a guild
     * @param itemId `number` id of the item to modify
     * @param quantity New quantity of the item
     */
    public updateRemaining(guild: guildResolvable, itemId: number, quantity: number): Promise<'no item' | 'item is infinite' | true>;
    /**
     * Make an item infinite or not
     * 
     * @param guild `guildResolvable` anything that can give a guild
     * @param itemId `number` id of the item to edit
     * @param infinite `boolean` define if the item is infinite or not
     * @param value `number` value of the quantity when switching to not infinite
     * @returns {Promise<'no item' | 'set as infinite, but no value' | true>} Returns 'no item' when no item is found. Returns 'set as not infinite, but no value' when switch to not infinite and no value is specified. Returns true once the request to the database is done
     */
    public setInfinite(guild: guildResolvable, itemId: number, infinite: boolean, value?: number): Promise<'no item' | 'set as not infinite, but no value' | true>
}

export { DefaultQueryResult, QueryResult, addOptions, inventory, item, inventoryItem, userResolvable, guildResolvable, itemType }
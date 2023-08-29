import { BaseInteraction, Collection, Guild, GuildMember, Message, User } from 'discord.js';
import { Connection } from 'mysql';
import { item } from '../typings/item';
import { DefaultQueryResult, QueryResult } from '../typings/database';
import { inventory } from '../typings/inventories';
import { addOptions, guildResolvable, userResolvable } from '../typings/shop';

export default class ShopManager {
    private database: Connection;
    private _items: Collection<number, item> = new Collection();
    private _inventories: Collection<string, Collection<string, inventory>> = new Collection();

    constructor(database: Connection) {
        this.database = database;

        this.start();
    }

    public get items() {
        return this._items;
    }
    public get inventories() {
        return this._inventories;
    }
    public guildItems(guild: guildResolvable) {
        return this._items.filter((x) => x.guild_id === this.getGuild(guild));
    }
    public async updateRemaining(guild: guildResolvable, itemId: number, quantity: number) {
        const item = this.guildItems(guild).find((x) => x.id === itemId);

        if (!item) return 'no item';
        if (item.quantity === 0) return 'item is infinite';

        item.remaining = quantity < 0 ? quantity * -1 : quantity;
        if ((quantity < 0 ? quantity * -1 : quantity) > item.quantity) {
            item.quantity = item.remaining;
        }

        this.items.set(item.id, item);
        await this.query(
            `UPDATE items SET remaining='${item.remaining}', quantity='${item.quantity}' WHERE id='${item.id}'`
        );
        return true;
    }
    public async updateQuantity(guild: guildResolvable, itemId: number, quantity: number) {
        const item = this.guildItems(guild).find((x) => x.id === itemId);

        if (!item) return 'no item';
        if (item.quantity === 0) return 'item is infinite';

        item.quantity = quantity < 0 ? quantity * -1 : quantity;
        item.remaining = Math.min(item.quantity, item.remaining);

        this.items.set(item.id, item);
        await this.query(
            `UPDATE items SET remaining='${item.remaining}', quantity='${item.quantity}' WHERE id='${item.id}'`
        );
        return true;
    }
    public async setInfinite(guild: guildResolvable, itemId: number, infinite: boolean, value?: number) {
        const item = this.guildItems(guild).find((x) => x.id === itemId);

        if (!item) return 'no item';
        if (!infinite && !value) return 'set as not infinite, but no value';

        item.quantity = infinite ? 0 : value;
        item.remaining = infinite ? 0 : Math.min(Math.max(item.remaining, value), item.quantity);

        this.items.set(item.id, item);
        await this.query(
            `UPDATE items SET remaining='${item.remaining}', quantity='${item.quantity}' WHERE id='${item.id}'`
        );
        return true;
    }
    public async addItem(options: addOptions): Promise<item | 'no reply from database'> {
        const { quantity = 0, guild, name, content, price, type } = options;
        const res = await this.query(
            `INSERT INTO items ( guild_id, type, name, content, price, quantity, remaining ) VALUES ( '${this.getGuild(
                guild
            )}', '${type}', "${this.sqlise(name)}", "${this.sqlise(
                content
            )}", "${price}", "${quantity}", "${quantity}" )`
        );

        if (!res) return 'no reply from database';

        const item = {
            guild_id: this.getGuild(guild),
            price,
            name,
            content,
            type,
            remaining: quantity,
            quantity,
            id: res.insertId
        };
        this._items.set(res.insertId, item);
        return item;
    }
    public removeItem(id: number) {
        this._items = this._items.filter((x) => x.id !== id);
        this.query(`DELETE FROM items WHERE id='${id}'`);
    }

    public async addInventory(guild: guildResolvable, user: userResolvable, item: item, quantity = 1) {
        const guild_id = this.getGuild(guild);
        const user_id = this.getUser(user);

        const inventory = this.getInventory(guild_id, user_id);
        const includedItem = inventory.items.find(
            (x) => x.name === item.name && x.content === item.content && x.price === item.price
        );

        if (includedItem) {
            inventory.items[inventory.items.indexOf(includedItem)].quantity += quantity;
        } else {
            inventory.items.push({
                name: item.name,
                content: item.content,
                price: item.price,
                quantity,
                id: item.id
            });
        }

        this.setInventory(guild_id, user_id, inventory);

        await this.query(
            `INSERT INTO inventories ( guild_id, user_id, items ) VALUES ( "${guild_id}", "${user_id}", "${this.sqlise(
                JSON.stringify(inventory.items)
            )}" ) ON DUPLICATE KEY UPDATE items="${this.sqlise(JSON.stringify(inventory.items))}"`
        );
        return true;
    }
    public async removeInventory(guild: guildResolvable, user: userResolvable, item: item, quantity = 1) {
        const guild_id = this.getGuild(guild);
        const user_id = this.getUser(user);

        const inventory = this.getInventory(guild_id, user_id);
        const includedItem = inventory.items.find(
            (x) => x.name === item.name && x.content === item.content && x.price === item.price
        );

        if (includedItem) {
            inventory.items[inventory.items.indexOf(includedItem)].quantity -= Math.min(
                quantity,
                includedItem.quantity
            );
        }

        this.setInventory(guild_id, user_id, inventory);

        await this.query(
            `INSERT INTO inventories ( guild_id, user_id, items ) VALUES ( "${guild_id}", "${user_id}", "${this.sqlise(
                JSON.stringify(inventory.items)
            )}" ) ON DUPLICATE KEY UPDATE items="${this.sqlise(JSON.stringify(inventory.items))}"`
        );
        return true;
    }
    public async buyItem(guild: guildResolvable, user: userResolvable, itemId: number, quantity = 1) {
        const item = this._items.get(itemId);

        if (!item) return 'no item';
        const buyable = item.quantity === 0 ? quantity : Math.min(item.remaining, quantity);
        if (buyable === 0) return 'nothing buyable';

        await this.addInventory(guild, user, item, buyable);
        const newRemaining = item.quantity === 0 ? 0 : item.remaining - buyable;

        this._items.set(item.id, {
            ...item,
            remaining: newRemaining
        });

        await this.query(`UPDATE items SET remaining='${newRemaining}' WHERE id='${item.id}'`);
        return true;
    }

    // Engine
    private getGuildInventories(guild_id: string): Collection<string, inventory> {
        if (!this._inventories.has(guild_id)) {
            this._inventories.set(guild_id, new Collection());
        }
        return this._inventories.get(guild_id);
    }
    private defaultInventoryData(guild_id: string, user_id: string): inventory {
        return {
            guild_id,
            user_id,
            items: []
        };
    }
    public getInventory(guild: guildResolvable, user: userResolvable) {
        const inventories = this.getGuildInventories(this.getGuild(guild));
        if (!inventories.has(this.getUser(user)))
            inventories.set(this.getUser(user), this.defaultInventoryData(this.getGuild(guild), this.getUser(user)));

        return inventories.get(this.getUser(user));
    }
    private setInventory(guild_id: string, user_id: string, value: inventory) {
        this.getInventory(guild_id, user_id);
        this._inventories.get(guild_id).set(user_id, value);

        return value;
    }
    private getGuild(guild: guildResolvable): string {
        return guild instanceof BaseInteraction || guild instanceof GuildMember || guild instanceof Message
            ? guild.guild.id
            : guild instanceof Guild
            ? guild.id
            : guild;
    }
    private getUser(user: userResolvable): string {
        return user instanceof BaseInteraction || user instanceof GuildMember
            ? user.user.id
            : user instanceof Message
            ? user.author.id
            : user instanceof User
            ? user.id
            : user;
    }
    private sqlise(str: string | unknown[] | Record<string, any>) {
        if (!str) return '';
        if (typeof str !== 'string') return JSON.stringify(str);
        return str.replace(/"/g, '\\"');
    }

    // Core
    private query<T = DefaultQueryResult>(query: string): Promise<QueryResult<T>> {
        return new Promise((resolve, reject) => {
            this.database.query(query, (error, request) => {
                if (error) return reject(error);
                return resolve(request);
            });
        });
    }
    private async fillCache() {
        const [items, inventories] = await Promise.all([
            this.query<item<true>>(`SELECT * FROM items`),
            this.query<inventory<true>>(`SELECT * FROM inventories`)
        ]);
        if (!items) {
            throw new Error('An error occured while getting items from database');
        }
        if (!inventories) {
            throw new Error('An error occured while getting inventories from database');
        }

        items.forEach((item) => {
            this._items.set(item.id, {
                ...item,
                quantity: parseInt(item.quantity),
                price: parseInt(item.price),
                remaining: parseInt(item.remaining)
            });
        });

        inventories.forEach((inventory) => {
            this.setInventory(inventory.guild_id, inventory.user_id, {
                ...inventory,
                items: JSON.parse(inventory.items)
            });
        });
    }

    private async checkDb() {
        await Promise.all([
            this.query(
                `CREATE TABLE IF NOT EXISTS items ( guild_id VARCHAR(255), name VARCHAR(255), content VARCHAR(255), type VARCHAR(255) NOT NULL DEFAULT 'string', price VARCHAR(255), quantity VARCHAR(255) NOT NULL DEFAULT '0', remaining VARCHAR(255), id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT)`
            ),
            this.query(
                `CREATE TABLE IF NOT EXISTS inventories ( guild_id VARCHAR(255) NOT NULL, user_id VARCHAR(255) NOT NULL, items LONGTEXT, UNIQUE INDEX idx_guild_user (guild_id, user_id) )`
            )
        ]);
        return true;
    }
    private async start() {
        await this.checkDb();
        await this.fillCache();
    }
}

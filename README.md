# Shop-manager

Shop manager to manage items in your project with MySQL

## Installation

To install it, run `npm install shop-manager`

## Documentation

| Content | Section |
|:-------:|:-------:|
|Initiation| [start](#initiation) |
| Propreties | [propreties list](#propreties) |
| All methods | [methods list](#methods) |
| Types | [types list](#types) |

### Initiation

Here is how to start the manager

```js
const { ShopManager } = require('shop-manager');
const { createConnection } = require('mysql')

const database = createConnection({
    // Database credits
})

const manager = new ShopManager(database);
```

### Propreties

Here are the propreties you can access

#### Items

You can get all the items cached

```js
manager.items
```

Is is a Collection of [items](#item) by their id

#### Inventories

You can get all the inventories

```js
manager.inventories
```

It is a Collection of Collection of [inventories](#inventory) by user id by guild id (the main collection is by guild id and the sub collections are users id)

### Methods

#### guildItems

Get all the items of a guild

```js
manager.guildItems(guild);
manager.guildItems(interaction);
manager.guildItems(member);
manager.guildItems('1234');
```

Parameter :

* guild : [guild resolvable](#guild-resolvable)

Returns a collection of [items](#item) by the id of the guild, containing only guild's items

#### addItem

Add an item to the guild's items

```js
manager.addItem({
    guild: '1234',
    type: 'string',
    name: "name of the item",
    content: "super string content to show",
    quantity: 0, // The item will be infinite
    price: 10000
});

manager.addItem({
    guild: message.guild,
    type: 'role',
    name: "Admin role",
    content: "141592653589713238",
    price: 10000,
    quantity: 2 // Only 2 will be available
});
```

Returns a promise, either string typed, with "no reply from database" as content, when the database didn't reply, and [the item](#item), when the request is done and the item is added to the list ( `Promise<'no reply from database' | item>` )

Parameter :

* options : [add options](#addoptions)

#### removeItem

Remove an item from the manager, using its ID

```js
manager.removeItem(17); // Remove the item with the ID 17
```

Returns nothing ( `void` )

Parameters :

* `id` : number, corresponding to an ID of the [items](#item)

#### addInventory

Add one or more items to a user's inventory

```js
const item = manager.items.first();

manager.addItem(message.guild, message.author, item, 3); // Add 3 items "item"
manager.addItem(message.guild, message.author, item); // Add 1 item "item"
```

Returns a true Promise ( `Promise<true>` )

Parameters :

* `guild` : [guild resolvable](#guild-resolvable)
* `user` : [user resolvable](#user-resolvable)
* `item` : [item](#item)
* `quantity` : number. This is optional

#### removeInventory

Remove one or more items from a user's inventory

```js
const item = manager.items.first();

manager.removeInventory(message.guild, message.author, item, 2); // Remove 2 items "item"
manager.removeInvetory(message.guild, message.author, item); // Remove 1 item "item"
```

Returns a true Promise ( `Promise<true>` )

Parameters :

* `guild` : [guild resolvable](#guild-resolvable)
* `user` : [user resolvable](#user-resolvable)
* `item` : [item](#item)
* `quantity` : number. This is optional

#### getInventory

Get the inventory of an user in a guild

```js
manager.getInventory(message.guild, message.author);
```

Return an [inventory object](#inventory)

Parameters :

* `guild` : [guild resolvable](#guild-resolvable)
* `user` : [user resolvable](#user-resolvable)

#### buyItem

Removes an item from the shop and add it in the inventory of the user

```js
manager.buyItem(message.guild, message.author, 16); // Buy the item with the id 16
manager.buyItem(message.guild, message.author, 18, 6); // Buy 6 items with ID 18
```

Returns a promise, returning either 'no item' if no item is found in the cache. Returns `nothing buyable` if there is no item remaining ( `remaining` proprety of [items](#item) equals 0). Returns `true` when everything is done

Parameters :

* `guild` : [guild resolvable](#guild-resolvable)
* `user` : [user resolvable](#user-resolvable)
* `itemId` : number
* `quantity` : number. This is optional

#### updateQuantity

Update the quantity of an item ( `quantity` proprety of [items](#item) )

```js
manager.updateQuantity(message.guild, 14, 8); // Set the quantity of item with 14 ID to 8
```

Returns a promise with `no item`, `item is infinite` or `true`

When no item is found with the ID, `no item` is the value of the promise

When the item to edit is infinite ( when its quantity is 0 ), the value is `item is infinite`

Returns `true` when everything is done

```ts
Promise<'no item' | 'item is infinite' | true>;
```

Parameters :

* `guild` : [guild resolvable](#guild-resolvable)
* `itemId` : number
* `quantity` : number

#### updateRemaining

Update the remaining quantity of an item ( `remaining` proprety of [items](#item) )

```js
manager.updateRemaining(message.guild, 9, 2); // Set the remaining quantity of item with 9 ID to 2
```

Returns a promise with `no item`, `item is infinite` or `true`

When no item is found with the ID, `no item` is the value of the promise

When the item to edit is infinite ( when its quantity is 0 ), the value is `item is infinite`

Returns `true` when everything is done

```ts
Promise<'no item' | 'item is infinite' | true>;
```

Parameters :

* `guild` : [guild resolvable](#guild-resolvable)
* `itemId` : number
* `quantity` : number

#### setInfinite

Make an item infinite or not

```js
manager.setInfinite(message.guild, 7, true); // Make item with ID 7 infinite
manager.setInfinite(message.guild, 4, false, 10); // Make item with ID 4 not infinite, with quantity 10
```

> When you set an item to not infinite, you have to specify `value` parameter

Returns a Promise with `no item`, `set as not infinite, but no value` or `true`

Returns `Promise<'no item'>` when no item is found with the id

Returns `Promise<'set as not infinite'>` when you set an item to not infinite, but you don't specify the `value` parameter

Returns `Promise<true>` when everything is done

Parameters :

* `guild` : [guild resolvable](#guild-resolvable)
* `itemId` : number, corredponding to an item ID
* `infinite` : boolean
* `value` : number. This is optional, but must be specified when `infinite` is `false`

### Types

Types of the manager

#### Item

```ts
type item<Raw extends boolean = false> = {
    guild_id: string;
    name: string;
    content: string;
    type: itemType; // 'role' | 'string'
    id: number;
    price: If<Raw, string, number>;
    remaining: If<Raw, string, number>;
    quantity: If<Raw, string, number>; // 0 if infinite
}
```

#### ItemType

Type of an item

```ts
type itemType = 'string' | 'role'
```

#### Inventory

```ts
type inventory<Raw extends boolean = false> = {
    guild_id: string;
    user_id: string;
    items: If<Raw, string, inventoryItem[]>; // { name: string; content: string; price: number; id: number; }[]
}
```

#### Inventory item

```ts
type inventoryItem = {
    name: string;
    content: string;
    quantity: number;
    price: number;
    id: number;
}
```

#### guild resolvable

Anything that contains a guild

```ts
import { Guild, BaseInteraction, GuildMember, Message } from 'discord.js';

type guildResolvable = Guild | BaseInteraction | GuildMember | Message | string;
```

#### addOptions

Options to provide when adding a new item

```ts
export type addOptions = {
    guild: guildResolvable; // Anything that can give a guild
    name: string; // Name of the item
    content: string; // Value of the item : string or role id
    type: itemType; // Type of the item
    quantity?: number; // Optional quantity (default 0, infinite)
    price: number; // Price of the item
};
```

> The content is either the ID of the role, in case of `#addOptions.type = 'role'`, or the content of the string item, when `#addOptions.type = 'string'`

Types :

* [itemType](#itemtype)
* [guild Resolvable](#guild-resolvable)

#### user resolvable

Any thing that contains a user

```ts
import { User, GuildMember, BaseInteraction, Message } from 'discord.js';

type userResolvable = User | GuildMember | BaseInteraction | Message | string;
```

#### DefaultQueryResult

Default result of a MySQL request

```ts
export type DefaultQueryResult = {
    fieldCount: number;
    affectedRows: number;
    insertId: number;
    serverStatus: number;
    warningCount: number;
    message: string;
    protocol41: boolean;
    changedRows: number;
};
```

#### QueryResult

Result of a MySQL query

```ts
export type QueryResult<T> = T extends DefaultQueryResult ? DefaultQueryResult : T[];
```

## Support

Get support on the [support server](https://discord.gg/fHyN5w84g6)

import Gun from "gun";
import SEA from "gun/sea.js";

let numberPorts = process.argv.slice(2).map(Number);

const minArgs = 1
if (args.length < 1) {
    throw new Error(`Incorrect number of arguments. Expected ${minArgs}, but got ${args.length}.`);
  }

const numberPortsShift = args.shift();

function createGun(number) {
    const list = [];
    for (let i = 0; i < number; i++) {
        list.push(`http://localhost:${3000 + i}/gun`);
    }
    return list;
}

const gun = Gun([
    createGun(numberPortsShift)
])

class Query {
    constructor(dbNode, gunInstance) {
        this.db = dbNode;
        this.user = gunInstance.get(this.db);
    }

    async add(key, data) {
        let hidden = await SEA.encrypt(data, this.db);
        this.user.get(key).put(hidden);
        console.log(`Added data to '${this.db}/${key}':`, data);
    }

    async update(key, data) {
        let hidden = await SEA.encrypt(data, this.db);
        this.user.get(key).put(hidden);
        console.log(`Updated data to '${this.db}/${key}':`, data);
    }

    delete(key) {
        this.update(key, null);
        console.log(`Deleted: `, key);
    }

    async read(key) {
        const encryptedObject = await this.user.get(key)
        if (encryptedObject == undefined) {
            return "Error: Not a well formed expression"
        }
        const decrypted = await SEA.decrypt(encryptedObject, this.db);
        return decrypted
    }

    async readAll() {
        let allData = [];
        this.user.map().once(async (encryptedObject, key) => {
            if (!encryptedObject) return;
            const decrypted = await SEA.decrypt(encryptedObject, this.db);
            allData.push({ key, data: decrypted });
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const liststr = allData.map(data => JSON.stringify(data))
        const output = `[${liststr.join(",")}]`

        return output
    }
}

async function queryLang(user, splitQuery) {
    const parts = splitQuery
        .match(/'[^']+'|\S+/g)
        .map((token) =>
        token.startsWith("'") && token.endsWith("'") ? token.slice(1, -1) : token
        );

    const result = parts;

    let func = result[0];
    let key = result[1];

    const db = new Query(user, gun);
    let returnString = "";

    func = func.toLowerCase();
    if (result.length == 3) {
        if (func == "add") {

            try {
                let value = JSON.parse(result[2]);
                await db.add(key, value);
            } catch (error) {
                let value = {};
                returnString = "Error: Not a well formed expression";
            }
        } else if (func == "update") {

            try {
                let value = JSON.parse(result[2]);
                await db.update(key, value);
            } catch (error) {
                let value = {};
                returnString = "Error: Not a well formed expression";
            }
        } else {
            returnString = "Error: Not a well formed expression";
        }
    } else if (result.length == 2) {
        if (func == "delete") {
            db.delete(key);

        } else if (func == "read") {
            if (key == "*") {
                returnString = await db.readAll();
            } else {
                returnString = await db.read(key);
            }
        } else {
            returnString = "Error: Not a well formed expression";
        }
    } else {
        returnString = "Error: Not a well formed expression";
    }

    console.log(returnString)

    return returnString;
}

export { queryLang };
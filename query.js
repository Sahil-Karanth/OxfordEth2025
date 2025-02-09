import Gun from "gun";
import SEA from "gun/sea.js";

const gun = Gun([
  "http://localhost:3001/gun",
  "http://localhost:3002/gun",
  "http://localhost:3003/gun",
]);

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
    console.log(`Deleted`);
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
        // const alreadyExists = await db.read(key);
        // if (alreadyExists == undefined) {
        //   await db.add(key, value);
        // } else {
        //   returnString = "Error: Not a well formed expression";
        // }
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

      // console.log(returnString);
    } else {
      returnString = "Error: Not a well formed expression";
    }
  } else {
    returnString = "Error: Not a well formed expression";
  }

  //qurey.close()

  console.log("ABOUT TO CHECK")
  console.log(returnString)

  return returnString;
}

export { queryLang };


const wallet =
  "829e268ae2d80f930ece00cc07786860021ee733baf5ebda83f0924e6022276b";
const val = queryLang(wallet, "update 'name' '{\"bench\": 45}'");
console.log("Returned:", val);

import Gun from 'gun';
import * as readline from 'readline';

const gun = Gun(['http://localhost:3001/gun', 'http://localhost:3002/gun', 'http://localhost:3003/gun']);

class Query {
    constructor(dbNode, gunInstance) {
        this.db = dbNode; 
        this.user = gunInstance.get(this.db);
    }

    add(key, data) {
        this.user.get(key).put(data)
        console.log(`Added data to '${this.db}/${key}':`, data);
    }

    update(key, data) {
        this.user.get(key).put(data)
        console.log(`Updated data to '${this.db}/${key}':`, data);
    }


    delete(key) {
        this.update(key, null)
        console.log(`Deleted`);
    }

    async read(key) {
        const val = await this.user.get(key)
        if (val == undefined) {
            return "Error: Not a well formed expression"
        }
        return val
    }

    async readAll() {
        const val = await this.user
        return val
    }
}

async function queryLang(user) {
    const query = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    query.question("Enter first string: ", async (splitQuery) => {
        const parts = splitQuery.match(/'[^']+'|\S+/g)
        .map(token =>
         
          token.startsWith("'") && token.endsWith("'")
            ? token.slice(1, -1)
            : token
        );
        
        const result = parts

        let func = result[0];
        let key = result[1]; 
        
        const db = new Query(user, gun);
        let returnstring = "";

        result[0] = result[0].toLowerCase()
        if (result.length == 3) {
            if (result[0] == 'add') {
                try {
                    let value = JSON.parse(result[2]);
                    const alreadyExists = await db.read(key)
                    if (alreadyExists == undefined) {
                        db.add(key, value)
                    } else {
                        returnstring = "Error: Not a well formed expression"
                    }
                }
                catch (error) {
                    let value = {}
                    returnstring = "Error: Not a well formed expression"
                }
                

            } else if (result[0] == 'update'){
                try {
                    let value = JSON.parse(result[2]);
                    db.update(key, value)
                }
                catch (error) {
                    let value = {}
                    returnstring = "Error: Not a well formed expression"
                }
            } else {
                returnstring = "Error: Not a well formed expression"
            }

        } else if (result.length == 2){
        
            if (result[0] == 'delete'){
                db.delete(key)
                    
            } else if (result[0] == 'read'){
                if (key == "*") {
                    returnstring = await db.readAll()
                } else {
                    returnstring = await db.read(key)
                }

                console.log(returnstring)
            } 
            else {
                returnstring = "Error: Not a well formed expression"
            }
        }
        else {
            returnstring = "Error: Not a well formed expression"
        }

        //qurey.close()

        return returnstring
        
           
        });
    }

const val = queryLang("newUser");
console.log("Returned:", val);


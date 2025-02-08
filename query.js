const Gun = require('gun');
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
        return val
    }
}


const readline = require('readline');

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

        console.log ('############################')
        console.log(result)
        func = result[0];
        key = result[1]; 
        
        const db = new Query(user, gun);
        let returnstring = "";

        if (result[0] == 'add') {
            value = JSON.parse(result[2]);
            db.add(key, value)

        } else if (result[0] == 'update'){
            value = JSON.parse(result[2]);
            db.update(key, value)
          
        } else if (result[0] == 'delete'){
            db.delete(key)
            
        } else if (result[0] == 'read'){
            returnstring = await db.read(key)
            console.log(returnstring)
           
        } 

        query.close()

        return returnstring
        
           
        });
    }

queryLang("newUser")

// 
// add 'myObj' '{"name": 25}'
// read 'myObj'
// update 'myObj' '{"name": 14}'
// delete 'myObj' 

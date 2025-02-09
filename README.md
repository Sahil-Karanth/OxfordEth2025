# Custom Query Language for GunDB

## Overview
This documentation describes a custom query language built on top of GunDB. The query language allows users to interact with a GunDB instance to perform CRUD (Create, Read, Update, Delete) operations on encrypted data.

The system leverages `gun/sea.js` for encryption and decryption, ensuring data security within the distributed database.

## Prerequisites
- **GunDB** installed (`gun` package)
- **SEA (Security Encryption Authorization)** (`gun/sea.js` package)
- Node.js environment

## Initialization
The system initializes GunDB with multiple instances running on different ports.

```javascript
import Gun from "gun";
import SEA from "gun/sea.js";

let numberPorts = process.argv.slice(2).map(Number);
const minArgs = 1;
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
]);
```

## Query Class
The `Query` class provides methods to interact with GunDB.

### Constructor
```javascript
constructor(dbNode, gunInstance)
```
- `dbNode`: The database node (string)
- `gunInstance`: Instance of GunDB

### Methods

#### `add(key, data)`
Encrypts and adds data to the database.
```javascript
async add(key, data)
```
- **key**: The key under which data is stored
- **data**: JSON object to store

#### `update(key, data)`
Encrypts and updates data under the specified key.
```javascript
async update(key, data)
```

#### `delete(key)`
Deletes data by setting the value to `null`.
```javascript
delete(key)
```

#### `read(key)`
Retrieves and decrypts data from the database.
```javascript
async read(key)
```
- If the key is not found, returns an error message.

#### `readAll()`
Retrieves and decrypts all stored data.
```javascript
async readAll()
```

## Query Language
The query language allows structured commands to interact with GunDB.

### Syntax
Queries follow this format:
```
<COMMAND> <KEY> [<VALUE>]
```

### Commands
| Command  | Arguments | Description |
|----------|----------|-------------|
| `add`    | `<key> <value>` | Adds data under the given key |
| `update` | `<key> <value>` | Updates data at the given key |
| `delete` | `<key>`         | Deletes data at the given key |
| `read`   | `<key>` or `*`  | Reads data for a key, or all data when `*` is used |

### Query Parsing
The query is split into parts and executed accordingly:
```javascript
async function queryLang(user, splitQuery) {
    const parts = splitQuery
        .match(/'[^']+'|\S+/g)
        .map((token) =>
            token.startsWith("'") && token.endsWith("'") ? token.slice(1, -1) : token
        );

    let func = parts[0].toLowerCase();
    let key = parts[1];
    const db = new Query(user, gun);
    let returnString = "";

    if (parts.length == 3) {
        try {
            let value = JSON.parse(parts[2]);
            if (func === "add") {
                await db.add(key, value);
            } else if (func === "update") {
                await db.update(key, value);
            } else {
                returnString = "Error: Not a well-formed expression";
            }
        } catch (error) {
            returnString = "Error: Not a well-formed expression";
        }
    } else if (parts.length == 2) {
        if (func === "delete") {
            db.delete(key);
        } else if (func === "read") {
            returnString = key === "*" ? await db.readAll() : await db.read(key);
        } else {
            returnString = "Error: Not a well-formed expression";
        }
    } else {
        returnString = "Error: Not a well-formed expression";
    }

    console.log(returnString);
    return returnString;
}
```

## Example Usage

### Adding Data
```
add 'user1' '{"name": "Alice", "age": 25}'
```

### Updating Data
```
update 'user1' '{"name": "Alice", "age": 26}'
```

### Reading Data
```
read 'user1'
```

### Reading All Data
```
read '*'
```

### Deleting Data
```
delete 'user1'
```

## Export
The `queryLang` function is exported for external usage.
```javascript
export { queryLang };
```

## Error Handling
- Incorrectly formatted queries return: `Error: Not a well-formed expression`.
- If a key does not exist, `read` returns an appropriate error message.

## Conclusion
This query language provides a simple way to interact with GunDB securely and efficiently. By supporting basic CRUD operations and encryption, it ensures safe and structured data storage.

# Express & GunDB Server Documentation

## Overview
This documentation describes the Express server that integrates GunDB for decentralized data storage. The server provides a REST API to interact with GunDB using a custom query language.

## Prerequisites
- **Node.js** installed
- **GunDB** (`gun` package)
- **Express** (`express` package)
- **CORS** (`cors` package)
- **Redis** for caching (optional but recommended)

## Installation
To set up and run the server, install the dependencies:
```sh
npm install express cors gun redis
```

## Server Initialization
The server initializes with multiple connected GunDB peers and uses Redis for storage.

```javascript
import express from 'express';
import cors from 'cors';
import Gun from 'gun';
import { decodeToken } from './middleware.js';
import { createServer } from 'http';    
import { queryLang } from './query.js';
```

## API Key Generation
The system generates API keys for authentication:
```javascript
const validApiKeys = new Map();

function generateApiKey(botId) {
    const apiKey = crypto.randomBytes(32).toString('hex');
    validApiKeys.set(apiKey, {
      botId: botId,
      createdAt: new Date(),
      permissions: ['read', 'write']
    });
    return apiKey;
}
```

## Command Line Arguments
The server expects at least two arguments:
- **PORT**: The port the server listens on
- **Other Ports**: Connected GunDB peer ports

```javascript
let args = process.argv.slice(2).map(Number);
const minArgs = 2;
if (args.length < minArgs) {
    throw new Error(`Incorrect number of arguments. Expected ${minArgs}, but got ${args.length}.`);
}
const PORT = args.shift();
const connectedPeers = args.map(port => `http://localhost:${port}/gun`);
```

## Express App Setup
The Express app is configured with middleware:
```javascript
const app = express();
app.use(express.json());
app.use(cors());
app.use('/', decodeToken);
```

## Test Endpoint
A test endpoint is available for health checks:
```javascript
app.get('/test', (req, res) => {
    console.log("TEST REQ RECEIVED");
    res.status(200).send('OK');
});
```

## GunDB Initialization
GunDB is initialized with Redis for caching:
```javascript
const nodeServer = createServer(app);
const REDIS_PORT = 6379;
const gun = Gun({
    peers: connectedPeers,
    file: 'data1.json',
    redis: { host: '127.0.0.1', port: REDIS_PORT },
    web: nodeServer
});
```

## Server Start
The server listens on the specified port:
```javascript
nodeServer.listen(PORT, () => {
    console.log(`Gun peer & Express running on http://localhost:${PORT}`);
});
```

## API Endpoints

### Root Endpoint
```http
GET /
```
Logs the request and responds with `OK`.

### Database Command Execution
```http
POST /
```
Executes a user command via the custom query language.
#### Request Body
```json
{
  "username": "user1",
  "inputData": "add 'key' '{\"value\": 123}'"
}
```
#### Response
- **200 OK**: Returns the output from `queryLang`.
- **400 Bad Request**: Missing database command.
- **500 Internal Server Error**: Failure in processing the request.

```javascript
app.post('/', async (req, res) => {
    try {
        console.log(req.body);
        const username = req.body.username;
        const commandString = req.body.inputData;
        if (!commandString) {
            return res.status(400).send('Request did not receive db command');
        }
        const databaseOutput = await queryLang(username, commandString);
        res.status(200).send(databaseOutput);
    } catch (e) {
        res.status(500).send('Internal server error in sending db command');
    }
});
```

## Conclusion
This Express server integrates GunDB with a REST API to facilitate decentralized storage and retrieval of data using a custom query language. The server supports authentication, command execution, and peer-to-peer networking.




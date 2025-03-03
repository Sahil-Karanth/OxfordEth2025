# Project Introduction
We have tackled the decentralised memory organ bounty for the Torus network at Eth Oxford 2025. Our p2p distributed database is fault tolerant without a single point of failure since client code can access any p2p node, moving failed nodes to the back of a queue and can easily be scaled horizontally by adding more peers on the network. Our system provides a decentralised peer-to-peer network, a custom query language with CRUD operations, a secure API to access the network, a tamper-proof design via encryption and an asymmetric encryption system to authenticate.

## Starting the Project
To start the project, follow these steps:

1. Install dependencies:
   ```sh
   cd backend
   npm install
   cd ../frontend
   npm install
   ```
2. Navigate to the backend folder and start the network creation:
   ```sh
   cd backend
   ./bash.sh n m
   ```
   - This command requires arguments:
     - **n**: Number of nodes in the P2P network.
     - **m**: Degree of each node (how many nodes it's connected to).
   - Example:
     ```sh
     ./bash.sh 10 3
     ```
3. Navigate to the frontend folder and start the frontend:
   ```sh
   cd frontend
   npm start b "[(p1,f1),(p2,f2),(p3,f3)...]"
   ```
   - This command requires one argument:
     - **b**: `'true'` or `'false'`
     - `'false'`: Runs in GUI mode.
     - `'true'`: Runs in bot mode.
     -  **[(p1,f1),(p2,f2),(p3,f3)...]** List of ports that the client can connect to and their respective chance of failure (percentage)
   - Example:
     ```javascript
     npm start false "[(3001,20),(3002,80),(3004,90),(3006,95)]"
     ```
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

## Frontend: Electron App with Bot Support and Fault-Tolerant Node Requests

The frontend detects whether the application is being run as a bot or a human user and authenticates accordingly. It also includes a fault-tolerant queueing mechanism to handle failed node connections.

### Dependencies
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const crypto = require('crypto');
const { multiNodeReqs } = require('./serverReqFuncs');
```

### Electron App for Human Users
Initializes an Electron window and sends the port-failure chance pairs and a timestamp to the renderer process.

```javascript
function makeElectronApp(portsAndFailures) {
  let win;

  function createWindow() {
    const { encodedPublicKey, encodedSignature, timestamp } = genAuthPair();
  
    console.log(`\nEXAMPLE ENCODED PUBLIC KEY\n${encodedPublicKey}\n\nEXAMPLE ENCODED SIGNATURE\n${encodedSignature}`);

    win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    win.loadFile("home.html");

    win.webContents.once("did-finish-load", () => {
      win.webContents.send("set-ports", portsAndFailures);
      win.webContents.send("time-stamp", timestamp);
    });
  }

  app.whenReady().then(() => {
    createWindow();

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") app.quit();
    });
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
```

### Bot Authentication Also with Digital Signatures
Bots authenticate using asymmetric cryptography and send requests to multiple nodes.

```javascript
async function handleBotConnection() {
  const { encodedPublicKey, encodedSignature, timestamp } = genAuthPair();

  console.log(encodedPublicKey);
  console.log(encodedSignature);

  const dbCommand = "read *";

  const reqObj = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-public-key": encodedPublicKey,
      "x-signature": encodedSignature,
      "x-timestamp": timestamp,
    },
    body: JSON.stringify({ inputData: dbCommand }),
  };

  const responseText = await multiNodeReqs(portFailChancePairs, reqObj);
  console.log(responseText);
}
```

### Argument Parsing and Validation
Parses command-line arguments to determine if the app runs as a bot or a human interface.

```javascript
const args = process.argv.slice(2);
let isBot = false;
let portFailChancePairs = [];

if (args.length < 2) {
  throw new Error("Usage: npm start <isBot> <[(port1,failChance1),(port2,failChance2),...]>");
}

const arg = args[0]?.toLowerCase();
if (arg === "true") {
  isBot = true;
} else if (arg === "false") {
  isBot = false;
} else {
  throw new Error(`Incorrect argument. Expected 'true' or 'false', but got ${arg}`);
}

const pairsInput = args[1];
if (!/^\[(\(\d+,\d+\))(,\(\d+,\d+\))*\]$/.test(pairsInput)) {
  throw new Error(`Invalid input format. Expected [(port1,failChance1),(port2,failChance2),...], but got ${pairsInput}`);
}

portFailChancePairs = pairsInput.slice(1, -1).split(/\),\(/).map((pair) => {
  const [port, failChance] = pair.replace(/[()]/g, "").split(",");
  const portNum = parseInt(port, 10);
  const failChanceNum = parseInt(failChance, 10);

  if (isNaN(portNum) || portNum < 0 || portNum > 65535) {
    throw new Error(`Invalid port number: ${port}`);
  }
  if (isNaN(failChanceNum) || failChanceNum < 0 || failChanceNum > 100) {
    throw new Error(`Invalid failure chance: ${failChance}`);
  }

  return { port: portNum, failChance: failChanceNum };
});

if (portFailChancePairs.length === 0) {
  throw new Error("No valid port-failure chance pairs provided.");
}

portFailChancePairs.forEach((portObj) => {
  console.log(`port ${portObj.port} (${portObj.failChance}% programmed failure chance)`);
});
```

### Key Generation for Authentication
Generates RSA key pairs and creates a timestamped digital signature.

```javascript
function genAuthPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 512,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  const timestamp = Date.now().toString();
  const signer = crypto.createSign("SHA256");
  signer.update(timestamp);

  const encodedSignature = signer.sign(privateKey, "base64");
  const encodedPublicKey = Buffer.from(publicKey).toString("base64");

  return { encodedPublicKey, encodedSignature, timestamp };
}
```

### Execution Logic
Determines whether to start the Electron app or run the bot authentication process based on the provided arguments.

```javascript
if (!isBot) {
  makeElectronApp(portFailChancePairs);
} else {
  handleBotConnection();
}
```


### Fault-Tolerant Node Requests
If a request to a node fails, the function will retry with the next available node in a round-robin fashion.

#### Sending a Request to a Node
```javascript
async function maybeSendNodeReq(port, reqObj) {
  try {
    const response = await fetch(`http://localhost:${port}`, reqObj);
    return response;
  } catch (err) {
    return null;
  }
}
```

#### Handling Failed Node Requests with a Queue
```javascript
async function multiNodeReqs(portArray, reqObj) {
  let responseText = "COULDN'T CONNECT TO ANY PEERS";
  let iterCount = 0;

  while (true) {
    const portToConnect = portArray[0];
    const response = await maybeSendNodeReq(portToConnect, reqObj);

    if (response != null) {
      console.log(`SUCCESS on port ${portToConnect}`);
      responseText = await response.text();
      break;
    } else {
      console.log(`Port ${portToConnect} failed to connect`);
      portArray.splice(0, 1);
      portArray.push(portToConnect);
    }

    if (iterCount === portArray.length) {
      break;
    }

    iterCount += 1;
  }
  return responseText;
}
```

### Executing the Correct Authentication Flow
```javascript
if (!isBot) {
  makeElectronApp(portArr);
} else {
  handleBotConnection();
}
```

## Summary
- **Auth** authenticate using digital signatures verified against trusted public keys.
- **Fault tolerance**: If a node fails, the request is retried with the next available node in a round-robin manner.
- **The frontend dynamically determines** whether the process is a bot or a human user.
- **Secure cryptographic signatures** prevent unauthorized bot access.





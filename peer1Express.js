import express from 'express';
import cors from 'cors';
import Gun from 'gun';
import parseFunction from './parseFunction.js';
import { decodeToken } from './middleware.js';
import { createServer } from 'http';


const validApiKeys = new Map();

function generateApiKey(botId) {
    const apiKey = crypto.randomBytes(32).toString('hex');
    validApiKeys.set(apiKey, {
      botId: botId,
      createdAt: new Date(),
      permissions: ['read', 'write'] // customize as needed
    });
    return apiKey;
  }


let args = process.argv.slice(2).map(Number);

const minArgs = 2
if (args.length < minArgs) {
    throw new Error(`Incorrect number of arguments. Expected ${minArgs}, but got ${args.length}.`);
  }

const PORT = args.shift();

const connectedPeers = args.map(port => `http://localhost:${port}/gun`)



const app = express()

// middleware
app.use(express.json())
app.use(cors())
app.use('/', decodeToken)


app.get('/test', (req, res) => {
    console.log("TEST REQ RECEIVED")
    res.status(200).send('OK')
})


const nodeServer = createServer(app)

const REDIS_PORT = 6379

const gun = Gun({
    peers: connectedPeers, // Other peers will connect to this
    file: 'data1.json', // Storage file
    redis: { host: '127.0.0.1', port: REDIS_PORT },
    web: nodeServer // Start server
});


nodeServer.listen(PORT, () => {
    console.log(`Gun peer & Express running on http://localhost:${PORT}`);
});


// endpoints

app.get('/', (req, res) => {
    console.log("REQUEST RECEIVED")
    res.status(200).send('OK')
})

// receives command from user
app.post('/', (req, res) => {

    console.log("REQUEST RECEIVED")
    console.log(gun.get("hi"))

    try {

        const { commandString } = req.body
    
        if (!commandString) {
            return res.status(400).send('Request did not receive db command');
        }

    } catch (e) {
        res.status(500).send('Internal server error in sending db command')
    }

    const databaseOutput = parseFunction(commandString)

    res.status(200).send(databaseOutput)
})


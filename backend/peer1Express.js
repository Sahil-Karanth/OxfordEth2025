import express from 'express';
import cors from 'cors';
import Gun from 'gun';
import { decodeToken } from './middleware.js';
import { createServer } from 'http';    
import { queryLang } from './query.js'

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
app.post('/', async (req, res) => {

    try {

        console.log(req.body)

        const username = req.body.username
        const commandString = req.body.inputData
    
        if (!commandString) {
            return res.status(400).send('Request did not receive db command');
        }

        const databaseOutput = await queryLang(username, commandString)
        res.status(200).send(databaseOutput)

    } catch (e) {
        res.status(500).send('Internal server error in sending db command')
    }
})


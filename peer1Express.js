const express = require('express');
const cors = require('cors');
const Gun = require('gun');
const parseFunction = require('./parseFunction'); 

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

app.get('/test', (req, res) => {
    res.status(200).send('OK')
})


const nodeServer = require('http').createServer(app)

const gun = Gun({
    peers: connectedPeers, // Other peers will connect to this
    file: 'data1.json', // Storage file
    web: nodeServer // Start server
});


nodeServer.listen(PORT, () => {
    console.log(`Gun peer & Express running on http://localhost:${PORT}`);
});


// endpoints

app.get('/test', (req, res) => {
    res.status(200).send('OK')
})

// receives command from user
app.post('/', (req, res) => {
    const commandString = req.body
    const databaseOutput = parseFunction(commandString)
    res.send(databaseOutput)
})


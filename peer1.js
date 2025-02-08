const Gun = require('gun');

const gun = Gun({
    peers: [], // Other peers will connect to this
    file: 'data1.json', // Storage file
    web: require('http').createServer().listen(3001) // Start server
});

console.log('Peer 1 running on port 3001');
const Gun = require('gun');

const gun = Gun({
    peers: [], // Other peers will connect to this
    file: 'data1.json', // Storage file
    redis: { host: '127.0.0.1', port: 6379 },
    web: require('http').createServer().listen(3001) // Start server
});

console.log('Peer 1 running on port 3001');
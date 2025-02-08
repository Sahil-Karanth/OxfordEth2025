const Gun = require('gun');

const gun = Gun({
    peers: ['http://localhost:3001/gun'], // Connect to Peer 1
    file: 'data2.json',
    web: require('http').createServer().listen(3002)
});

console.log('Peer 2 running on port 3002');
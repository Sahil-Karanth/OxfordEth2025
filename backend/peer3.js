const Gun = require('gun');

const gun = Gun({
    peers: ['http://localhost:3001/gun', 'http://localhost:3002/gun'], // Connect to Peer 1 and 2
    file: 'data3.json',
    redis: { host: '127.0.0.1', port: 6379 },
    web: require('http').createServer().listen(3003)
});

console.log('Peer 3 running on port 3003');


gun.get('shared-db').on(console.log);


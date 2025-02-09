const Gun = require('gun');

// Connect to any peer
const gun = Gun(['http://localhost:3001/gun', 'http://localhost:3002/gun', 'http://localhost:3003/gun']);

// Create a shared database reference
const db = gun.get('shared-db');

// Write data
db.put({ message: 'Hello from GunDB!', timestamp: Date.now() });

// Read data
db.on(data => {
    console.log('Shared Data:', data);
});
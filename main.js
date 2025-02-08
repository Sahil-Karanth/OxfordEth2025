import { Libp2pOptions } from './lib2Config.js';
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB } from '@orbitdb/core'
import { LevelBlockstore } from 'blockstore-level'



// Create an IPFS instance.
const blockstore = new LevelBlockstore('./ipfs/blocks')
const libp2p = await createLibp2p(Libp2pOptions)
const ipfs = await createHelia({ libp2p, blockstore })

const orbitdb = await createOrbitDB({ ipfs })

const db = await orbitdb.open('my-db', { type: 'documents' })

console.log('my-db address', db.address)

// Some cool db stuff
await db.put({ _id: "doc1", hello: "world 1", hits: 5 })
await db.put({ _id: "doc2", hello: "world 2", hits: 2 })
await db.put({ _id: "doc3", asdf: "world 2", frog: 2 })
await db.del("doc1")

console.log("now doing query")

const result = await db.get("doc2")

console.log(result)

// Print out the above records.
// console.log(await db.all())

// print number of peers
console.log(libp2p.getPeers())

// Close your db and stop OrbitDB and IPFS.

await db.close()
await orbitdb.stop()
await ipfs.stop()
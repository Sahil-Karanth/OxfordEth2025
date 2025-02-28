import crypto from 'crypto';

// set of base-64 encoded public keys that are recognised (in production would be in a secure store)
    // but the point is in reality this would be externally managed by the Torus Network

// add some generated public key you want to be recognised if you comment out the `TRUSTED_BOT_PUBLIC_KEYS.add(encodedPublicKey);` line
var TRUSTED_BOT_PUBLIC_KEYS = new Set([`LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZ3d0RRWUpLb1pJaHZjTkFRRUJCUUFEU3dBd1NBSkJBS1BCejYrQzkya3djZ1pnUXZZRlZSTVhhd3N2RForLwpoSUhSRjEyRVV1SURHQ01zVisrRGRMRVpjMUJHd3hZTUM0amM5anJBY052UnVCdVc1QXVpVUVVQ0F3RUFBUT09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQo=`]);


const decodeToken = async (req, res, next) => {
  try {

    const encodedPublicKey = req.headers['x-public-key'];
    const encodedSignature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    
    if (encodedPublicKey && encodedSignature && timestamp) {
      const publicKey = Buffer.from(encodedPublicKey, 'base64').toString('utf8');
      const signature = Buffer.from(encodedSignature, 'base64').toString('utf8');

      // FOR ILLUSTRATIVE PURPOSES ONLY - REMOVE TO TEST 'UNKNOWN BOT'
      TRUSTED_BOT_PUBLIC_KEYS.add(encodedPublicKey);
      
      // Verify timestamp is within last 5 minutes
      // Change this time to make a signature be valid for longer (e.g. useful for testing older key,signature pairs)
      const timestampNum = parseInt(timestamp); 
      if (Date.now() - timestampNum > 5 * 60 * 1000) {
          return res.status(401).json({ message: "Timestamp too old" });
        }
    

      if (!(TRUSTED_BOT_PUBLIC_KEYS.has(encodedPublicKey))) {
        return res.status(401).json({ message: "Unknown bot" });
      }

      // Verify signature
      const verifier = crypto.createVerify('SHA256');
      verifier.update(timestamp);
      const isValidSignature = verifier.verify(publicKey, encodedSignature, 'base64');

      if (isValidSignature) {
        req.isBot = true;
        return next();
      }

      return res.status(401).json({ message: "Invalid signature" });
    }

    return res.status(401).json({ message: "Missing headers in request" });
  } catch (error) {
    if (error.code === "ERR_OSSL_UNSUPPORTED") {
        return res.status(401).json({message: "OPENSSL error: malformed key/signature"})
    }
    return res.status(401).json({ message: error });
  }
};

export { decodeToken };

import crypto from 'crypto';
import { auth } from './firebaseConfig.js';


const TRUSTED_PUBLIC_KEYS = new Set([
  `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`
]);

const decodeToken = async (req, res, next) => {
  try {

    const publicKey = req.headers['x-public-key'];
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    
    if (publicKey && signature && timestamp) {
      if (!TRUSTED_PUBLIC_KEYS.has(publicKey)) {
        return res.status(401).json({ message: "Untrusted public key (unknown agent)" });
      }

      const verifier = crypto.createVerify('SHA256');
      verifier.update(timestamp);
      const isValidSignature = verifier.verify(publicKey, signature, 'base64');

      if (isValidSignature) {
        req.isBot = true;
        req.publicKey = publicKey;
        return next();
      }
      return res.status(401).json({ message: "Invalid signature" });
    }

    // Regular Firebase auth for humans
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await auth.verifyIdToken(token);

    if (decodedToken) {
      req.isBot = false;
      req.user = decodedToken;
      return next();
    }

    return res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export { decodeToken };
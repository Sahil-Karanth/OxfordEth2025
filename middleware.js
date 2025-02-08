import { auth } from './firebaseConfig.js';
import crypto from 'crypto';

// In production this would be in a secure database
const TRUSTED_BOT_PUBLIC_KEYS = new Map([
  ['bot-1', `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`],
  ['bot-2', `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`]
]);

const decodeToken = async (req, res, next) => {
  try {
    // Check for bot authentication
    const botId = req.headers['x-bot-id'];
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    
    if (botId && signature && timestamp) {
      // Verify timestamp is within last 5 minutes to prevent replay attacks
      const timestampNum = parseInt(timestamp);
      if (Date.now() - timestampNum > 5 * 60 * 1000) {
        return res.status(401).json({ message: "Timestamp too old" });
      }

      const publicKey = TRUSTED_BOT_PUBLIC_KEYS.get(botId);
      if (!publicKey) {
        return res.status(401).json({ message: "Unknown bot" });
      }

      // Verify signature of timestamp
      const verifier = crypto.createVerify('SHA256');
      verifier.update(timestamp);
      const isValidSignature = verifier.verify(publicKey, signature, 'base64');

      if (isValidSignature) {
        req.isBot = true;
        req.botId = botId;
        return next();
      }
      return res.status(401).json({ message: "Invalid signature" });
    }

    // Regular Firebase token auth for humans
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
import firebaseAdmin from 'firebase-admin';

const serviceAccount = {
    "type": "service_account",
    "project_id": "memoryorganauth",
    "private_key_id": "6d08f6c72e72432c0c33fea334a7bc3d7df1a905",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDWrxgiFBz3fvjx\nhYCIW9grpwk1lTxGdsuttXMNQnAEczGA7NXf6fSKxw3qtEag4xX+Q3/FQhAMuWx4\nb5xfZnsCgi3d64S3YEy8qUXexwhNO5uIxKAhh13wWshgBGDTbyBQ4+JHuimp4Z29\njfS6l+L9jiF5P50DAAVUS+IoSNWwZqYzQBQyWt5AwfIlfpcMfHEc3mtl893omgic\nm3SFYuKOcR1N2aCXtp8grQJbgFIc9tzDyEywdZnrpXjnNgJFIhveMH4KzXrv6UDe\nsj5si75COV2mKLzZ+KdDzKqQXxvFZe3nDMqunfsKZOiFm8NLDbEeY70O351jFw+M\nweBEq1PZAgMBAAECggEALu7H3JlfjMbEFw7bvtOvUjm51G47516sn9zhWlZ6JSrm\nuVvtVL5xgM5L71G6eA00/2lTuzS6TAHUYg7qVVvSzAVYECIfGTSzCfKKjQ2fdbzw\nf2mW5UWR5ov+Lql+XnK2kqCDFTGwTox9ftVUGV+/lrVWAYsD4QZF4/wT5MEpgB7G\nLlRjFVPLt5TZ5ndDXpUWbPVpRWZO/x0N0fKhExgkAeYEC1HrpZhlVcLM3cK5rK0/\nNjbHnPddf9ATJErijpZtfWjgLNtou5myVW0yKCYbFD4qA9sNT4v4H8GoUUVo8Ymf\nXEX8BMCGE3PUPVIUrVok99Jxre7NJ20pDAJ/6+p1NQKBgQDxccqQWfWYjmFXhxtF\nyO+Pm0H/CDdRDddp7F89JFftdORKhrIkY/9Jnjt972+R0hoZs5ozv0rq5k18qX/r\n0zDzhZ7SJIpwGMjOGUOqGGg3HqN3/WTs/eX7ZMOdCwKo30u1SIfQdm6mJRG7g/Ah\nbNHn0Sq34GQIq4WcKGkpvbdcBQKBgQDjoE7hoqRIe1+yj4lkiY26vsWVLPpIHhcx\n683Bcipc+HVCyWf/k5mMmlXGXPKKucwrRBGsJeZzX8gQPyh6JjeucIzj6DwbobT+\n2sHGqUjGM9h4Bma1H3Gh7ZfBMcLrEkMa5uxtntl3H1pkHQZxNcttI4wNk8k2Kgnm\nVYdT1sa0xQKBgQCL2ha0IHeCw04dDfQ9KtOgghTrLY4lE/hnsXPFDa0krSWjCXxc\nWdPAh7f8DVm5xFI7+u1h9fbmMzpE8EVZiv36wLYrEOFjZufBgZ7RAswyyTt0wEDa\niYLSaB5qc7s5qAXJXtbUaBVVhXlM/XJ1WfwH4/9zfLVU1E1TE5E+jVaNJQKBgQDc\n5gWnEp87d/822fULjDHuuJQmYK/CrPD1kVDsGk7iSnwBhFNYw3SP7navOiRmXEi2\n9CfyWBV8gcc1fRVa9Ru0PaV8xzMN3bA4YzMKB96H+mhokk26F/m+m0RaSGBQoDhf\nMxrehvmjkNm3rjNCSmJQV97ijjkGR2W0EexygEv1wQKBgElGOewyCxFr37uNfTxd\nCa1ZJOFSVaOf+e0ZBfAXBnAJN+bf+FXpjsj+3kzxzJ350UJkV6sEWwShdJ/12Yso\n1GnEGc63bLzC5hhldxWOxd2aiWD1jf5AqgGsP0HFUd0d2rjI7m4g+EbWl3pDiuEi\nOqm2ZVDt+AhL8CqmdEtu+rhE\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
    "client_email": "firebase-adminsdk-fbsvc@memoryorganauth.iam.gserviceaccount.com",
    "client_id": "105159554747307576012",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40memoryorganauth.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  }


firebaseAdmin.initializeApp({
credential: firebaseAdmin.credential.cert(serviceAccount), // Use credential.cert correctly
});

const auth = firebaseAdmin.auth(); // Access auth service

export { auth };
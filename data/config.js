const config = {
 discord: {
 	webhookURL: [{id: process.env.WEBHOOKID, token: process.env.WEBHOOKTOKEN }],

 },
    appId :3122252437876287,
    uri : "localhost:8080/auth",
    instagramAccounts: [{ userId:"" ,access_token:"",
    }]


};
module.exports = config;

// Take the ID and token out of the webhook URL and paste them in the fields here.



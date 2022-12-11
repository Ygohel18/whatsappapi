// Supports ES6
// import { create, Whatsapp } from 'venom-bot';
const venom = require('venom-bot');
const axios = require('axios');
var cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
var fs = require('fs');
const { url } = require('inspector');
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require("cookie-parser");
const { SenderLayer } = require('venom-bot/dist/api/layers/sender.layer');
require('dotenv').config();

const app = express()
const port = process.env.PORT || 5000

const webhook = process.env.WEBHOOK.split(",");

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())

startVenom();

function sendRequest(url, data, type) {
    var data = JSON.stringify({
        "token": process.env.TOKEN,
        "type": type,
        "data": data
    });

    var config = {
        method: 'post',
        url: url,
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };

    axios(config)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
        })
        .catch(function (error) {
            console.log(error);
        });
}

function sendWebhook(data, type) {
    for (var i = 0; i < webhook.length; i++) {
        sendRequest(webhook[i], data, type);
    }
}

function sendLinkPreview(client, no, link, message) {
    client.sendLinkPreview(
        no,
        link,
        message
    ).then((result) => {
        console.log('Result: ', result);
    })
        .catch((erro) => {
            console.error('Error when sending: ', erro); //return object error
        });
}

function sendFile(client, no, file) {
    client
        .sendFile(
            no,
            file,
            'Attachment',
            ''
        )
        .then((result) => {

            console.log('Result: ', result); //return object success
        })
        .catch((erro) => {
            console.error('Error when sending: ', erro); //return object error
        })
        .finally(() => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file)
            }

        });
}

function sendPersonaMessage(client, no, msg) {
    client
        .sendText(no, msg)
        .then((result) => {
            console.log('Result: ', result); //return object success
        })
        .catch((erro) => {
            console.error('Error when sending: ', erro); //return object error
        });
}

function sendAnimatedSticker(client, no, sticker) {
    client
        .sendImageAsStickerGif(no, sticker)
        .then((result) => {
            console.log('Result: ', result); //return object success
        })
        .catch((erro) => {
            console.error('Error when sending: ', erro); //return object error
        });
}

// Catch ctrl+C
process.on('SIGINT', function () {
    client.close();
});

// Try-catch close
try {
} catch (error) {
    client.close();
}

function startVenom() {
    venom
        .create('default', (base64Qr) => {
            var r = {
                "qr": base64Qr
            }
            res.send(r);
        })
        .then((client) => start(client))
        .catch((error) => console.log(error));
}

app.post('/api/login', (req, res) => {

    const { data, token } = req.body;

    try {
        if (token == process.env.TOKEN) {
            venom
                .create('default', (base64Qr) => {
                    var r = {
                        "qr": base64Qr
                    }
                    res.send(r);
                })
                .then((client) => start(client))
                .catch((error) => console.log(error));
        } else {
            res.send("Invalid API Token");
        }
    } catch (e) {
        console.log("API ERROR");
    }
})

function start(client) {

    client.onStateChange((state) => {
        sendWebhook(state, "onStateChange");
        console.log('State changed: ', state);
        // force whatsapp take over
        if ('CONFLICT'.includes(state)) client.useHere();
        // detect disconnect on whatsapp
        if ('UNPAIRED'.includes(state)) console.log('logout');
    });

    // function to detect incoming call
    client.onIncomingCall(async (call) => {
        sendWebhook(call, "onIncomingCall");
        client.sendText(call.peerJid, "Sorry, I still can't answer calls");
    });

    app.post('/api/send/message', (req, res) => {

        const { data, token } = req.body;

        try {
            if (token == process.env.TOKEN) {
                (async () => {
                    client
                        .sendText(data.receiver, data.message)
                        .then((result) => {
                            res.send(result);
                        })
                        .catch((erro) => {
                            res.send(erro);
                        });
                })();
            } else {
                res.send("Invalid API Token");
            }
        } catch (e) {
            console.log("API ERROR");
        }
    })

    app.post('/api/send/link', (req, res) => {

        const { data, token } = req.body;

        try {
            if (token == process.env.TOKEN) {
                (async () => {
                    client.sendLinkPreview(
                        data.receiver,
                        data.link,
                        data.message
                    ).then((result) => {
                        res.send(result);
                    }).catch((erro) => {
                        res.send(erro);
                    });
                })();
            } else {
                res.send("Invalid API Token");
            }
        } catch (e) {
            console.log("API ERROR");
        }
    })

    app.post('/api/send/file', (req, res) => {

        const { data, token } = req.body;

        try {
            if (token == process.env.TOKEN) {
                (async () => {
                    client
                        .sendFile(data.receiver, data.file, data.name, data.caption)
                        .then((result) => {
                            res.send(result);
                        })
                        .catch((erro) => {
                            res.send(erro);
                        })
                        .finally(() => {
                            if (fs.existsSync(data.file)) {
                                fs.unlinkSync(data.file)
                            }
                        });
                })();
            } else {
                res.send("Invalid API Token");
            }
        } catch (e) {
            console.log("API ERROR");
        }
    })

    app.post('/api/send/file/base64', (req, res) => {

        const { data, token } = req.body;

        try {
            if (token == process.env.TOKEN) {
                (async () => {
                    client.sendFileFromBase64(
                        data.receiver,
                        data.file,
                        data.name,
                        data.caption
                    )
                        .then((result) => {
                            res.send(result);
                        })
                        .catch((erro) => {
                            res.send(erro);
                        });
                })();
            } else {
                res.send("Invalid API Token");
            }
        } catch (e) {
            console.log("API ERROR");
        }
    })


    app.post('/api/send/sticker', (req, res) => {

        const { data, token } = req.body;

        try {
            if (token == process.env.TOKEN) {
                (async () => {
                    client
                        .sendImageAsSticker(data.receiver, data.file)
                        .then((result) => {
                            res.send(result);
                        })
                        .catch((erro) => {
                            res.send(erro);
                        });
                })();
            } else {
                res.send("Invalid API Token");
            }
        } catch (e) {
            console.log("API ERROR");
        }
    })


    app.post('/api/send/animatedsticker', (req, res) => {

        const { data, token } = req.body;

        try {
            if (token == process.env.TOKEN) {
                (async () => {
                    client
                        .sendImageAsSticker(data.receiver, data.file)
                        .then((result) => {
                            res.send(result);
                        })
                        .catch((erro) => {
                            res.send(erro);
                        });
                })();
            } else {
                res.send("Invalid API Token");
            }
        } catch (e) {
            console.log("API ERROR");
        }
    })

    app.post('/api/send/videoasgif', (req, res) => {

        const { data, token } = req.body;

        try {
            if (token == process.env.TOKEN) {
                (async () => {
                    client
                        .sendVideoAsGif(data.receiver, data.file)
                        .then((result) => {
                            res.send(result);
                        })
                        .catch((erro) => {
                            res.send(erro);
                        });
                })();
            } else {
                res.send("Invalid API Token");
            }
        } catch (e) {
            console.log("API ERROR");
        }
    })

    client.onMessage((message) => {
        sendWebhook(message, "onMessage");
    });
}

console.log(`Running on port ${port}`)

if (process.env.NODE_ENV == "production") {
    app.listen()
} else {
    app.listen(port, () => { })
}
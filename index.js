// Supports ES6
// import { create, Whatsapp } from 'venom-bot';
const venom = require("venom-bot");
const axios = require("axios");
var cron = require("node-cron");
const { v4: uuidv4 } = require("uuid");
var fs = require("fs");
const { url } = require("inspector");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 6000;
const appsession = process.env.SESSION || "default";

const webhook = process.env.WEBHOOK.split(",");

app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

; (async () => {
    fs.unlinkSync(`./tokens/${appsession}/SingletonLock`);
    await startVenom();
})();

function sendRequest(url, data, type) {
    var data = JSON.stringify({
        token: process.env.TOKEN,
        type: type,
        data: data,
    });

    var config = {
        method: "post",
        url: url,
        headers: {
            "Content-Type": "application/json",
        },
        data: data,
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

// Catch ctrl+C
process.on("SIGINT", function () {
    client.close();
});

// Try-catch close
try {
} catch (error) {
    client.close();
}

const checkToken = () => {
    return (req, res, next) => {
        if (
            req.headers["content-type"] !== "application/json" ||
            req.body.token !== process.env.TOKEN
        ) {
            res.status(400).send("Authentication failed");
        } else {
            next();
        }
    };
};

async function startVenom() {


    const options = {
        headless: 'new',
        disableWelcome: true,
        browserArgs: [
            '--user-agent',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    }

venom
.create('default', (base64Qr) => {
    var r = {
        "qr": base64Qr
    }
    sendWebhook(r, "qrcode");
})
.then((createdClient) => {
    client = createdClient; // Store the created client in the global variable
    client.onStateChange((state) => {
        sendWebhook(state, "onStateChange");
        console.log("State changed: ", state);
        // force whatsapp take over
        if ("CONFLICT".includes(state)) client.useHere();
        // detect disconnect on whatsapp
        if ("UNPAIRED".includes(state)) console.log("logout");
    });

    // function to detect incoming call
    client.onIncomingCall(async (call) => {
        sendWebhook(call, "onIncomingCall");
        client.sendText(call.peerJid, "Sorry, I still can't answer calls");
    });


    client.onMessage((message) => {
        sendWebhook(message, "onMessage");
    });
  })
.catch((error) => console.log(error));

app.post('/api/login', checkToken(), (req, res) => {

    try {
        venom
            .create('default', (base64Qr) => {
                var r = {
                    "qr": base64Qr
                }
                res.send(r);
            })
            .then((client) => start(client))
            .catch((error) => console.log(error));
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/logout', checkToken(), (req, res, next) => {
    try {
        client.logout()
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/kill', checkToken(), (req, res, next) => {
    try {
        client.killServiceWorker()
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/restart', checkToken(), (req, res, next) => {
    try {
        client.restartService()
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})


app.post('/api/state', checkToken(), (req, res, next) => {
    try {
        client.getConnectionState()
            .then((result) => {
                res.send({ "state": result });
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/send/message', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client
            .sendText(data.receiver, data.message)
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/chat/delete', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client
            .deleteChat(data.contact)
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/chat/clear', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client
            .clearChatMessages(data.contact)
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/chat/archive', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client
            .archiveChat(data.contact)
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/chat/unseen', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client
            .markUnseenMessage(data.contact)
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/chat/block', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client
            .blockContact(data.contact)
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/chat/unblock', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client
            .unblockContact(data.contact)
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/send/link', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client.sendLinkPreview(
            data.receiver,
            data.link,
            data.message
        ).then((result) => {
            res.send(result);
        }).catch((erro) => {
            res.send(erro);
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/send/file', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client
            .sendFile(data.receiver, data.file, data.name, data.caption)
            .then((result) => {
            })
            .catch((erro) => {
                res.send(erro);
            })
            .finally(() => {
                if (fs.existsSync(data.file)) {
                    fs.unlinkSync(data.file)
                }
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

    try {
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
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/send/audio/base64', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client.sendVoiceBase64(
            data.receiver,
            data.file
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

    try {
        client.sendVoice(
            data.receiver,
            data.file
        )
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/send/location', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client.sendLocation(
            data.receiver,
            data.latitude,
            data.longitude,
            data.name
        )
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/send/replay', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client.reply(
            data.receiver,
            data.message,
            data.id
        )
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})


app.post('/api/send/seen', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client.sendSeen(
            data.receiver
        )
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/action/seen', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client.sendSeen(
            data.receiver
        )
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

    try {
        client.startTyping(
            data.receiver
        )
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/action/stoptyping', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client.stopTyping(
            data.receiver
        )
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

    try {
        client.sendButtons(
            data.receiver,
            data.title,
            data.buttons,
            data.description
        )
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/send/list', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client.sendListMenu(
            data.receiver,
            data.title,
            data.description,
            data.text,
            data.list
        )
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

    try {
        client.sendContactVcard(
            data.receiver,
            data.contact,
            data.name
        )
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/send/contacts', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client.sendContactVcardList(
            data.receiver,
            data.contacts,
            data.name
        )
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/send/sticker', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client
            .sendImageAsSticker(data.receiver, data.file)
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})


app.post('/api/send/animatedsticker', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client
            .sendImageAsSticker(data.receiver, data.file)
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/send/videoasgif', checkToken(), (req, res, next) => {

    const { data } = req.body;

    try {
        client
            .sendVideoAsGif(data.receiver, data.file)
            .then((result) => {
                res.send(result);
            })
            .catch((erro) => {
                res.send(erro);
            });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/get/newmessage', checkToken(), (req, res, next) => {
    try {
        const chatsAllNew = client.getAllChatsNewMsg();
        res.send(chatsAllNew);
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/get/contacts', checkToken(), (req, res, next) => {
    try {
        const contacts = client.getAllChatsContacts();
        res.send(contacts);
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/get/chats', checkToken(), (req, res, next) => {
    try {

        client.getAllChats().then((result) => {
            res.send(result);
        });

    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/group/create', checkToken(), (req, res, next) => {
    try {
        const { data } = req.body;
        client.createGroup(data.name, data.participants).then((result) => {
            res.send(result);
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/group/invite', checkToken(), (req, res, next) => {
    try {
        const { data } = req.body;
        client.getGroupInviteLink(data.id).then((result) => {
            res.send({ "link": result });
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/group/leave', checkToken(), (req, res, next) => {
    try {
        const { data } = req.body;
        client.leaveGroup(data.id).then((result) => {
            res.send(result);
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/group/members', checkToken(), (req, res, next) => {
    try {
        const { data } = req.body;
        client.getGroupMembers(data.id).then((result) => {
            res.send(result);
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/group/membersid', checkToken(), (req, res, next) => {
    try {
        const { data } = req.body;
        client.getGroupMembersIds(data.id).then((result) => {
            res.send(result);
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/group/join', checkToken(), (req, res, next) => {
    try {
        const { data } = req.body;
        client.joinGroup(data.code).then((result) => {
            res.send(result);
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/group/info', checkToken(), (req, res, next) => {
    try {
        const { data } = req.body;
        client.getGroupInfoFromInviteLink(data.code).then((result) => {
            res.send({ "link": result });
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/group/setdescription', checkToken(), (req, res, next) => {
    try {
        const { data } = req.body;
        client.setGroupDescription(data.id, data.description).then((result) => {
            res.send({ "result": result });
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/group/add', checkToken(), (req, res, next) => {
    try {
        const { data } = req.body;
        client.addParticipant(data.id, data.participant).then((result) => {
            res.send(result);
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/group/remove', checkToken(), (req, res, next) => {
    try {
        const { data } = req.body;
        client.removeParticipant(data.id, data.participant).then((result) => {
            res.send(result);
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/group/promote', checkToken(), (req, res, next) => {
    try {
        const { data } = req.body;
        client.promoteParticipant(data.id, data.participant).then((result) => {
            res.send(result);
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/group/demote', checkToken(), (req, res, next) => {
    try {
        const { data } = req.body;
        client.demoteParticipant(data.id, data.participant).then((result) => {
            res.send(result);
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

app.post('/api/group/admins', checkToken(), (req, res, next) => {
    try {
        const { data } = req.body;
        client.getGroupAdmins(data.id).then((result) => {
            res.send(result);
        });
    } catch (e) {
        console.log("API ERROR");
    }
})

console.log(`Running on port ${port}`)

if (process.env.NODE_ENV == "production") {
    app.listen();
} else {
    app.listen(port, () => { });
}

const fs = require("fs");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require("body-parser");
const VoiceText = require("voicetext");
const request = require("request");
const { v4: uuidv4 } = require("uuid");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

app.use(express.json());
app.use(express.static("voices"));
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/voices", (req, res) => {
  const voice = new VoiceText(process.env.VOICE_TEXT_WEB_API_KEY);
  const uuid = uuidv4();
  voice.speaker(voice.SPEAKER.HIKARI).speak(req.body.text, (e, buf) => {
    if (e) {
      return res.send(e);
    }
    return fs.writeFile(`./voices/${uuid}.wav`, buf, "binary", (e) => {
      if (e) {
        return res.send(e);
      }
      const options = {
        token: process.env.SLACK_BOT_TOKEN,
        filename: req.body.text,
        file: fs.createReadStream(`./voices/${uuid}.wav`),
        channels: process.env.SLACK_CHANNEL,
      };
      request.post(
        { url: `${process.env.SLACK_API_URL}/files.upload`, formData: options },
        (e, r) => {
          if (e && r.statusCode !== 200) {
            r.send(`status code: ${r.statusCode}`);
          }
        }
      );
    });
  });
  res.status(200).send("");
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});

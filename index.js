const express = require('express')
const TGBot = require('node-telegram-bot-api')
const token = process.env.SUBA_TOKEN
const app = express()
const spawn = require('child_process').spawn
const port = process.env.PORT || 3000

//Initialize bot
var bot
if (process.env.NODE_ENV === 'production') {
	bot = new TGBot(token)
	//bot.setWebHook(PRODUCTION URL + token) //TODO: bot to production
} else {
	bot = new TGBot(token, {
		polling: true
	})
}

//Use opencv for queue length detection
var queueLength = 0;
const shell = spawn('python', ['peopledetect.py'])
shell.stdout.on('data', (data) => {
  queueLength = parseInt(data.toString().trim())
  console.log('queueLength: ' + queueLength)
})
shell.stderr.on('data', (data) => {
  console.log('error: ' + data.toString())
})
shell.on('close', (code) => {
  if (code != 0) console.log({err: code})
  else console.log({exit: code})
})

//TODO: filter mean of last n images or something to stabilize output
function getQueueLength() {
  return queueLength
}

//Initialize bot commands
bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id, 'Try /queue to see the queue length of Subway')
})
bot.onText(/\/(subway|queue)/, msg => {
  bot.sendMessage(msg.chat.id, 'Queue length: ' + getQueueLength() + ' people')
})

//Run express app
app
.get('/', (req, res) => {
	res.json({queueLength: queueLength})
})
.post('/' + bot.token, (req, res) => {
	bot.processUpdate(req.body)
	res.sendStatus(200)
})
.listen(port)
console.log('bot running on port ' + port)

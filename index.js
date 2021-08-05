const restify = require('restify');
const path = require('path');
const dotenv = require('dotenv');

const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');
const { BotActivityHandler } = require('./BotActivityHandler');

const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

const adapter = new BotFrameworkAdapter({
    appId: '',
    appPassword: ''
})

adapter.onTurnError = async (context, error) => {
    await context.sendActivity('Error encountered by Bot');
    console.log('Some error has been encountered by Bot', error);
}

const server = restify.createServer();

const memory = new MemoryStorage(); //MemoryStorage
let conversationState = new ConversationState(memory); //ConversationState
const userState = new UserState(memory);  //UserState
const mainBot = new BotActivityHandler(conversationState, userState);    //RRBOT

server.post('/api/messages', (req,res) => {
    adapter.processActivity(req, res, async(context) => {
        await mainBot.run(context);
    })
})

server.listen(3978, () => {
    console.log(`${server.name} is listining to url ${server.url}`);
})

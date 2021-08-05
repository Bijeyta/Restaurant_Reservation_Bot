const { ActivityHandler, MessageFactory } = require('botbuilder');
const { MakeReservationDialog } = require('./componentDialogs/makeReversationDialog');
const { CancelReservationDialog } = require('./componentDialogs/cancelReversationDialog');
const { LuisRecognizer, QnAMaker } = require('botbuilder-ai')

class BotActivityHandler extends ActivityHandler {
    constructor(conversationState, userState) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;

        this.dialogState = conversationState.createProperty('dialogState');

        this.makeReservationDialog = new MakeReservationDialog(this.conversationState, this.userState);
        this.cancelReservationDialog = new CancelReservationDialog(this.conversationState, this.userState);

        this.previousIntent = this.conversationState.createProperty('previousIntent');
        this.conversationData = this.conversationState.createProperty('conservationData');

        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${ process.env.LuisAPIHostName }.api.cognitive.microsoft.com`
        }, {
            includeAllIntents: true,
        }, true);

        const qnaMakre = new QnAMaker({
            knowledgeBaseId: process.env.QnAKnowledgebaseId,
            endpointKey: process.env.QnAEndpointKey,
            host: process.env.QnAEndpointHostName
        });

        this.qnaMaker = qnaMakre;

        this.onMessage(async (context, next) => {
            // await context.sendActivity('Welcome to Umaid Bhawan Palace, Jaipur');
            const luisResult = await dispatchRecognizer.recognize(context);
            const intent = LuisRecognizer.topIntent(luisResult);
            const entities = luisResult.entities;
            console.log(luisResult);
            await this.dispatchToIntentAsync(context, intent, entities);
            await next();
        });

        this.onDialog(async (context, next) => {
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        })

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context)
            await next();
        });
    }

    async sendWelcomeMessage(turnContext) {
        const { activity } = turnContext;
        for(const idx in activity.membersAdded) {
            if (activity.membersAdded[idx].id !== activity.recipient.id) {
                const welcomeMessage = `Welcome to Resturant Reservation Bot ${ activity.membersAdded[idx].name }. `;
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    async sendSuggestedActions(turnContext) {
        var reply = MessageFactory.suggestedActions(['Make Reservation', 'Cancel Reservation', 'Resturant Address'], 'What would you like to do today ?');
        await turnContext.sendActivity(reply);
    }

    // async run(context) {
    //     await super.run(context);
    //     await this.conversationState.saveChanges(context);
    // }

    async dispatchToIntentAsync(context, intent, entities) {
        var currentIntent = '';
        const previousIntent = await this.previousIntent.get(context, {});
        const conversationData = await this.conversationData.get(context, {});

        if (previousIntent.intentName && conversationData.endDialog === false) 
        {
            currentIntent = previousIntent.intentName;
        }
        else if (previousIntent.intentName && conversationData.endDialog === true)
        {
            currentIntent = intent;
        }
        else if (intent = "None" && !previousIntent.intentName)
        {
            var result = await this.qnaMaker.getAnswers(context);
            await context.sendActivity(`${ result[0].answer }`);
            await this.sendSuggestedActions(context);
        }
        else
        {
            currentIntent = intent;
            await this.previousIntent.set(context, {intentName: intent});
        }

        switch(currentIntent) 
        {
            case 'Make_Reservation':
                await this.conversationData.set(context, {endDialog: false});
                await this.makeReservationDialog.run(context, this.dialogState, entities);
                conversationData.endDialog = await this.makeReservationDialog.isDialogComplete();
                if(conversationData.endDialog) {
                    await this.previousIntent.set(context, {intentName: null});
                    await this.sendSuggestedActions(context);
                }
                break;
            case 'Cancel_Reservation':
                await this.conversationData.set(context, {endDialog: false});
                await this.cancelReservationDialog.run(context, this.dialogState);
                conversationData.endDialog = await this.cancelReservationDialog.isDialogComplete();
                if(conversationData.endDialog) {
                    await this.previousIntent.set(context, {intentName: null});
                    await this.sendSuggestedActions(context);
                }
                break;
            default:
                break;
        }
    }
}

module.exports.BotActivityHandler = BotActivityHandler;
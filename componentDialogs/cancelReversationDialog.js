const { WaterfallDialog, ComponentDialog, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

//Prompts
const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const { CardFactory } = require('botbuilder');
const RestaurantCard = require('../resources/adaptiveCards/Restaurantcard');

const CARDS = [
    RestaurantCard
];

const ChoicePromptDialog = 'ChoicePromptDialog';
const NumberPromptDialog = 'NumberPromptDialog';
const TextPromptDialog = 'TextPromptDialog';
const ConfirmPromptDialog = 'ConformPromptDialog';
const DateTimePromptDialog = 'DateTimePromptDialog';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = '';

class CancelReservationDialog extends ComponentDialog {

    constructor(conversationState, userState) {
        super('cancelReversationDialog');

        //all the prompts
        this.addDialog(new TextPrompt(TextPromptDialog));
        this.addDialog(new ChoicePrompt(ChoicePromptDialog));
        this.addDialog(new NumberPrompt(NumberPromptDialog));
        this.addDialog(new ConfirmPrompt(ConfirmPromptDialog));
        this.addDialog(new DateTimePrompt(DateTimePromptDialog));

        //Waterfall Dialogs
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this), //ask confirmation if user wants to make reversation
            this.confirmStep.bind(this),  //show summary of values entered by user and ask confirmation to make reversation
            this.summaryStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;

    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(turnContext);

        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }


    }

    async firstStep(step) {
        endDialog = false;
        
        await step.context.sendActivity({
            text: 'Enter reservation details for cancellation:',
            attachments: [CardFactory.adaptiveCard(CARDS[0])]
        });

        return await step.prompt(TextPromptDialog, '');
    }

    async confirmStep(step) {
        step.values.reservationNo = step.result;
        var msg = `You have entered the following values: \n Reservation Number: ${step.values.reservationNo}`;
        await step.context.sendActivity(msg);
        return await step.prompt(ConfirmPromptDialog, 'Are you sure you want to CANCEL reversation', ['Yes', 'No']);
    }

    async summaryStep(step) {
        if(step.result === true) 
        {
            //business logic
            await step.context.sendActivity('Reversation successfully cancelled. Your reversation id is : 12345678');
            endDialog = true;
            return await step.endDialog();
        }
    }
    
    async isDialogComplete() {
        return endDialog;
    }
}

module.exports.CancelReservationDialog = CancelReservationDialog;
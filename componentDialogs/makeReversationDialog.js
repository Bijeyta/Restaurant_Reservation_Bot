const { WaterfallDialog, ComponentDialog, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

//Prompts
const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const ChoicePromptDialog = 'ChoicePromptDialog';
const NumberPromptDialog = 'NumberPromptDialog';
const TextPromptDialog = 'TextPromptDialog';
const ConfirmPromptDialog = 'ConformPromptDialog';
const DateTimePromptDialog = 'DateTimePromptDialog';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
var endDialog = '';

class MakeReservationDialog extends ComponentDialog {

    constructor(conversationState, userState) {
        super('makeReversationDialog');

        //all the prompts
        this.addDialog(new TextPrompt(TextPromptDialog));
        this.addDialog(new ChoicePrompt(ChoicePromptDialog));
        this.addDialog(new NumberPrompt(NumberPromptDialog, this.noOfMembersValidator));
        this.addDialog(new ConfirmPrompt(ConfirmPromptDialog));
        this.addDialog(new DateTimePrompt(DateTimePromptDialog));

        //Waterfall Dialogs
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStep.bind(this), //ask confirmation if user wants to make reversation
            this.getName.bind(this),   //get name from user
            this.getNumberOfParticipants.bind(this),  //number of participants for reversaation
            this.getDate.bind(this),  //date of reversation
            this.getTime.bind(this),  //time of reversation
            this.confirmStep.bind(this),  //show summary of values entered by user and ask confirmation to make reversation
            this.summaryStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;

    }

    async run(turnContext, accessor, entities) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(turnContext);

        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id, entities);
        }


    }

    async firstStep(step) {
        step.values.noOfMembers = step._info.options.noOfMembers[0];
        endDialog = false;
        return await step.prompt(ConfirmPromptDialog, 'Would you like to make a reversation', ['Yes', 'No'])
    }

    async getName(step) {
        if (step.result === true)
        {
            return await step.prompt(TextPromptDialog, 'Please enter a name thorugh which you want to make reversation.');
        } 
        if (step.result === false)
        {
            await step.context.sendActivity('You had choosen not to go ahead with reversation');
            endDialog = true;
            return await step.endDialog();
        }
    }

    async getNumberOfParticipants(step) {

        step.values.name = step.result;

        if(!step.values.noOfMembers) {
            return await step.prompt(NumberPromptDialog, 'For how many members you want to book reversation (0 - 150) ?');
        } else {
            return await step.continueDialog()
        }
        
    }

    async getDate(step) {

        if(!step.values.noOfMembers)
        step.values.noOfMembers = step.result;
        return await step.prompt(DateTimePromptDialog, 'On which date you want to take reversation ?');
    }

    async getTime(step) {
        step.values.date = step.result;
        return await step.prompt(DateTimePromptDialog, 'At what time you want to for date?');
    }

    async confirmStep(step) {
        step.values.time = step.result;
        var msg = `You have entered the following values: \n Name: ${step.values.name}\n Members: ${step.values.noOfMembers}\n Date: ${JSON.stringify(step.values.date)}\n Time: ${JSON.stringify(step.values.time)}`;
        await step.context.sendActivity(msg);
        return await step.prompt(ConfirmPromptDialog, 'Are you sure you want to make reversation', ['Yes', 'No']);
    }

    async summaryStep(step) {
        if(step.result === true) 
        {
            //business logic
            await step.context.sendActivity('Reversation successfully made. Your reversation id is : 12345678');
            endDialog = true;
            return await step.endDialog();
        }
    }

    async noOfMembersValidator(promptContext) {
        // this condition is our validation rules. You can also change the value at this point.
        return promptContext.recognized.succeeded && promptContext.recognized.value > 1 && promptContext.recognized.value < 150;
    }
    
    async isDialogComplete() {
        return endDialog;
    }
}

module.exports.MakeReservationDialog = MakeReservationDialog;
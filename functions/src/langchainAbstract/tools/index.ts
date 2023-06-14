import {DynamicTool} from "langchain/tools";
import {addReminder} from "./reminderToolFunc";
// import {answerHuman} from "./answerHumanToolFunc";

/**
 * The tools to use.
 * @type {Tools}
 */
export class Tools {
  /**
   * Create the tool set to add a reminder.
   * @param {string} prompt The prompt to use.
   * @param {string} appId The id of the app.
   * @param {string} hour The hour of the daily reminder.
   * @param {string} docId The id of the document to save the reminder to.
   * @return {DynamicTool[]} Array with all the tools.
   */
  reminderTools(
    prompt: string,
    appId?: string,
    hour?: string,
    docId?: string
  ): DynamicTool[] {
    let input: string;
    if (appId && hour && docId) {
      input = `${appId},${hour},${docId}`;
    } else {
      input = `${appId},01:30,${docId}`;
    }

    return [
      new DynamicTool({
        name: "addReminder",
        description: `call this to set a reminder. input should be ${input}`,
        func: addReminder,
      }),
    ];
  }
}

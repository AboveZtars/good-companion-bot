import {DynamicTool, SerpAPI} from "langchain/tools";
import {addReminder} from "./reminderToolFunc";
import {defineString} from "firebase-functions/params";

const serpApiKey = defineString("SERPAPI_API_KEY");

/**
 * The tools to use.
 * @type {Tools}
 */
export class Tools {
  /**
   * Create default tool
   * @return {SerpAPI[]} Array with all the tools.
   */
  defaultTools(): SerpAPI[] {
    return [
      new SerpAPI(serpApiKey.value(), {
        location: "Caracas,Capital District,Venezuela",
        hl: "en",
        gl: "us",
      }),
    ];
  }

  /**
   * Create the tool set to add a reminder.
   * @param {string} prompt The prompt to use.
   * @param {string} appId The id of the app.
   * @param {string} hour The hour of the daily reminder.
   * @param {string} docId The id of the document to save the reminder to.
   * @param {string} chatId The id of the chat.
   * @return {DynamicTool[]} Array with all the tools.
   */
  reminderTools(
    prompt: string,
    appId?: string,
    hour?: string,
    docId?: string,
    chatId?: string
  ): DynamicTool[] {
    return [
      new DynamicTool({
        name: "addReminder",
        description:
          "Set a reminder when asked to do so for an specific hour in 24 hour notation.\n" +
          "Input should be the hour and the reminder in a string separated by a comma.\n" +
          "Example: '01:30, reminder'\n" +
          "Do not use this tool with the same input",
        func: async (input) => {
          if (appId && docId && chatId) {
            addReminder(appId, docId, input, chatId);
            return "";
          } else {
            return "Failed";
          }
        },
      }),
    ];
  }
}

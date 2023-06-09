import {ChatOpenAI} from "langchain/chat_models/openai";
import {initializeAgentExecutorWithOptions} from "langchain/agents";
import {Tools} from "../tools";
import {defineString} from "firebase-functions/params";
import {Memory} from "../memory";
/* import {PromptTemplate} from "langchain/prompts";
import {LLMChain} from "langchain/chains"; */

import {defaultMeiPrompt, meiPromptReminder} from "../prompts";

const openAIApiKey = defineString("OPENAI_API_KEY");

/**
 * The agent to use.
 * @type {Agent}
 */
export class Agent {
  /**
   * The tools to use.
   * @type {Tools}
   */
  tools: Tools = new Tools();
  memory: Memory = new Memory();
  model = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: openAIApiKey.value(),
    modelName: "gpt-3.5-turbo",
  });

  /**
   * Create the agent.
   * @param {string} prompt The prompt to use.
   * @param {string | undefined} chatId The id of the chat.
   * @return {Promise<string>} The output of the agent.
   */
  async runDefaultAgent(prompt: string, chatId: string): Promise<string> {
    const sessionId = "MEISTM"; // Mei short term memory
    const cacheName = chatId.toString();

    const executor = await initializeAgentExecutorWithOptions(
      this.tools.defaultTools(),
      this.model,
      {
        agentType: "chat-conversational-react-description",
        agentArgs: {
          systemMessage: defaultMeiPrompt,
        },
        memory: await this.memory.momentoMemory(cacheName, sessionId),
        verbose: true,
      }
    );

    const resp = await executor.call({input: prompt});

    /*    const translatePromptEnEs = PromptTemplate.fromTemplate(
      "Translate from english to spanish: {prompt}?"
    );
    const chain2 = new LLMChain({llm: this.model, prompt: translatePromptEnEs});

    const translateRes2 = await chain2.run(resp.output); */
    return resp.output;
  }

  /**
   * Create the reminder agent.
   * @param {string} prompt The prompt to use.
   * @param {string | undefined} chatId The id of the chat.
   * @param {string | undefined} appId The id of the app.
   * @param {string | undefined} hour The hour of the daily reminder.
   * @param {string | undefined} docId The id of the document to save the reminder to.
   * @return {Promise<string>} The output of the agent.
   */
  async runReminderAgent(
    prompt: string,
    chatId: string,
    appId?: string,
    hour?: string,
    docId?: string
  ): Promise<string> {
    const sessionId = "MEISTM"; // Mei short term memory
    const cacheName = chatId.toString();

    const executor = await initializeAgentExecutorWithOptions(
      this.tools.reminderTools(prompt, appId, hour, docId, cacheName),
      this.model,
      {
        agentType: "chat-conversational-react-description",
        agentArgs: {
          systemMessage: meiPromptReminder,
        },
        memory: await this.memory.momentoMemory(cacheName, sessionId),
        maxIterations: 1,
        verbose: true,
      }
    );

    const resp = await executor.call({input: prompt});
    return resp.output;
  }
}

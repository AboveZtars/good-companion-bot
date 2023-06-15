// import {OpenAI} from "langchain/llms/openai";
import {ChatOpenAI} from "langchain/chat_models/openai";
import {initializeAgentExecutorWithOptions} from "langchain/agents";
import {Tools} from "../tools";
import {defineString} from "firebase-functions/params";
import {BufferMemory} from "langchain/memory";
import {MomentoChatMessageHistory} from "langchain/stores/message/momento";
// momento cache
import {CacheClient, Configurations, CredentialProvider} from "@gomomento/sdk";

const openAIApiKey = defineString("OPENAI_API_KEY");
const momentoApiKey = defineString("MOMENTO_API_KEY");

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
  model = new ChatOpenAI({
    temperature: 0.9,
    openAIApiKey: openAIApiKey.value(),
    modelName: "gpt-3.5-turbo",
  });

  /**
   * Create the agent.
   * @param {string} prompt The prompt to use.
   * @param {string | undefined} chatId The id of the chat.
   * @param {string | undefined} appId The id of the app.
   * @param {string | undefined} hour The hour of the daily reminder.
   * @param {string | undefined} docId The id of the document to save the reminder to.
   * @return {Promise<string>} The output of the agent.
   */
  async runDefaultAgent(
    prompt: string,
    chatId: string,
    appId?: string,
    hour?: string,
    docId?: string
  ): Promise<string> {
    const sessionId = "MEISTM"; // Mei short term memory
    const cacheName = chatId.toString();

    const momentoClient = new CacheClient({
      configuration: Configurations.Laptop.v1(),
      credentialProvider: CredentialProvider.fromString({
        authToken: momentoApiKey.value(),
      }),
      defaultTtlSeconds: 60 * 60 * 24,
    });

    const memory = new BufferMemory({
      chatHistory: await MomentoChatMessageHistory.fromProps({
        client: momentoClient,
        cacheName,
        sessionId,
        sessionTtl: 300,
      }),
      returnMessages: true,
      memoryKey: "chat_history",
    });
    await memory.loadMemoryVariables({});

    const executor = await initializeAgentExecutorWithOptions(
      this.tools.reminderTools(prompt, appId, hour, docId),
      this.model,
      {
        agentType: "chat-conversational-react-description",
        agentArgs: {
          systemMessage: `You are MEI:
          Mindful Encouragement Interface: MEI is a companion bot 
          that's focused on promoting mindfulness and well-being, 
          it is also a very friendly bot who speaks both spanish and english. 
          Whether you're feeling stressed, anxious, or just 
          need some motivation, MEI can help you stay on track and achieve 
          your goals.
          You have multiple features:
          1. You can be ask to set a reminder in a specific hour of the day.
          The first time you talk with someone say your features and a friendly 
          message
          `,
        },
        memory: memory,
      }
    );

    const resp = await executor.call({input: prompt});
    return resp.output;
  }
}

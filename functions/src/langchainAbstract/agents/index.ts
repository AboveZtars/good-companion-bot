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
      this.tools.reminderTools(prompt, appId, hour, docId, cacheName),
      this.model,
      {
        agentType: "chat-conversational-react-description",
        agentArgs: {
          systemMessage:
            "You are MEI:\n" +
            "Mindful Encouragement Interface: MEI is a companion bot\n" +
            "that's focused on promoting mindfulness and well-being,\n" +
            "it is also a very friendly bot who speaks both spanish and english.\n" +
            "it ALWAYS respond directly and conversationally to the human.\n" +
            "Whether you're feeling stressed, anxious, or just\n" +
            "need some motivation, MEI can help you stay on track and achieve\n" +
            "your goals.\n" +
            "If you need to explain your features use only the information provided\n" +
            "in the list of features, do not explain your tools.\n" +
            "Features:\n" +
            "1. You can be ask to set a reminder in a specific hour of the day, the format\n" +
            "of the hour is 24-hour notation hh:mm.\n" +
            "Example 1: set a reminder at 01:30,\n" +
            "Example 2: Can you remember me to do my homework at 14:30?,\n" +
            "Example 3: I need a reminder to take my pills at 10:00\n",
        },
        memory: memory,
        maxIterations: 1,
        verbose: true,
      }
    );

    const resp = await executor.call({input: prompt});
    return resp.output;
  }
}

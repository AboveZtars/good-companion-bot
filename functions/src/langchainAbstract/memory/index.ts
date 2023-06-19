import {defineString} from "firebase-functions/params";
import {BufferMemory} from "langchain/memory";
import {MomentoChatMessageHistory} from "langchain/stores/message/momento";
// momento cache
import {CacheClient, Configurations, CredentialProvider} from "@gomomento/sdk";

const momentoApiKey = defineString("MOMENTO_API_KEY");

/**
 * Memory is a class that is used to store and retrieve data from a cache.
 */
export class Memory {
  /**
   * momentoMemory is a function that returns a momento memory object.
   * @param {string} cacheName is the name of the cache.
   * @param {string} sessionId is the id of the session.
   * @return {Promise<BufferMemory>} the momento memory object.
   */
  async momentoMemory(
    cacheName: string,
    sessionId: string
  ): Promise<BufferMemory> {
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
    return memory;
  }
}

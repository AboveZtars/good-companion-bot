import {defineString} from "firebase-functions/params";
import {BufferMemory} from "langchain/memory";
import {MomentoChatMessageHistory} from "langchain/stores/message/momento";
// momento cache
import {CacheClient, Configurations, CredentialProvider} from "@gomomento/sdk";

const momentoApiKey = defineString("MOMENTO_API_KEY");

export class Memory {
  async momentoMemory(cacheName: string, sessionId: string) {
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

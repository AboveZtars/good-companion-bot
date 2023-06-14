import * as logger from "firebase-functions/logger";

// Langchain
import {ChatOpenAI} from "langchain/chat_models/openai";
import {defineString} from "firebase-functions/params";

import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
} from "langchain/prompts";
import {LLMChain} from "langchain/chains";

const openAIApiKey = defineString("OPENAI_API_KEY");

export const answerHuman = async (input: string) => {
  const chat = new ChatOpenAI({
    temperature: 0.9,
    openAIApiKey: openAIApiKey.value(),
  });

  // Send message to OpenAI using chain
  const prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are MEI:
      Mindful Encouragement Interface: MEI is a companion bot 
      that's focused on promoting mindfulness and well-being, 
      it is also a very friendly bot. 
      Whether you're feeling stressed, anxious, or just 
      need some motivation, MEI can help you stay on track and achieve 
      your goals.`
    ),
    HumanMessagePromptTemplate.fromTemplate("{text}"),
  ]);

  const chain = new LLMChain({
    prompt,
    llm: chat,
  });
  logger.info(`What is this? ${input}`, {structuredData: true});
  console.log(input);
  const responseChatGPT = await chain.call({text: input});
  logger.info(`response ${responseChatGPT}`, {structuredData: true});

  return responseChatGPT.text;
};

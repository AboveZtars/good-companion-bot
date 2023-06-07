import {ChatOpenAI} from "langchain/chat_models/openai";
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
} from "langchain/prompts";
import {LLMChain} from "langchain/chains";

const newFuck = async () => {
  const chat = new ChatOpenAI({
    temperature: 0.9,
    openAIApiKey: "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",
  });

  // Send message to OpenAI using chain
  const userPrompt = ChatPromptTemplate.fromPromptMessages([
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
    prompt: userPrompt,
    llm: chat,
  });
  const responseChatGPT = await chain.run("Hello");
  console.log("response:", responseChatGPT);
};

newFuck();

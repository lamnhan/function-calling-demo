# Function calling with LLMs

## Introduction

Follow up on the previous RAG article at [Build a RAG system, an introduction guide for JS developers](https://github.com/lamnhan/rag-demo)

Let’s explore another common AI technique which is about expanding the capability of LLMs with external functionalities.

### What is it?

Function calling is a powerful capability that **enables Large Language Models (LLMs) to interact with your code and external systems** in a structured way. Instead of just generating text responses, LLMs can understand when to call specific functions and provide the necessary parameters to execute real-world actions.

At a glance, there are four steps with function calling:

1. **User**: specify tools and query
2. **Model**: generate function arguments if applicable
3. **User**: execute function to obtain tool results
4. **Model**: generate final answer

A diagram from https://docs.mistral.ai/capabilities/function_calling/

<img width="563" height="614" alt="functioncalling1" src="https://github.com/user-attachments/assets/20d94025-26ca-4925-a752-427dbe385666" />

### Use cases

Function calling has 3 primary use cases:

- **Augment Knowledge**: access information from external sources like databases, APIs, and knowledge bases.
- **Extend Capabilities**: use external tools to perform computations and extend the limitations of the model, such as using a calculator or creating charts.
- **Take Actions**: interact with external systems using APIs, such as scheduling appointments, creating invoices, sending emails, or controlling smart home devices.

### Function calling vs Tool calling

Function calling and tool calling are closely related concepts, often used interchangeably.

Function calling is **a specific type of tool calling** where the LLM invokes predefined functions with specific parameters to perform actions or retrieve data. Essentially, **tool calling is the broader concept**, and **function calling is a particular way of implementing it**.

| Feature | Tool calling | Function calling |
| --- | --- | --- |
| Scope | Broader, encompassing various types of tools | **More specific, often involving predefined functions** |
| Flexibility | Highly flexible, adapts to diverse tools | **Relies on predefined functions and their schemas** |
| Implementation | Can be more complex, involving various tools | **More structured, relies on defined functions** |
| Use Cases | Complex tasks, real-time decision-making | **Specific actions, structured data retrieval** |

### Models

Most frontier models from popular families support function calling:

- OpenAI **GPT-4o**, **o4-mini**, **GPT-4.1**, … these models are well-known for their function calling capabilities, which are integrated into their APIs.
- Gemini **2.0 Flash**, **2.5 Pro**, … accessible through Vertex AI and Google AI Studio.
- Claude **3.7 Sonnet**, **Sonnet 4**, … offers function-calling capabilities via its API, with support for structured outputs and external tool integration.
- Llama **3.3 70B**, **4 Scout**, … deployed via platforms like Together.ai or Ollama, suitable for local and customized setups.
- Mistral **Small**, **Large**, … offers several models with function calling capabilities.

See more about supported models:

- For OpenAI models, look for `Features > Function calling` at  https://platform.openai.com/docs/models
- Open source models on Cloudflare Workers AI at https://developers.cloudflare.com/workers-ai/models/?capabilities=Function+calling
- Others on https://huggingface.co/models?sort=likes&search=function+calling

## Demo

Provide a simple `get_weather` tool for getting the current weather of a certain location. Source code at https://github.com/lamnhan/function-calling-demo

### Stack overview

- **NodeJS**: is a cross-platform JavaScript runtime environment that executes JavaScript code outside of a web browser. Homepage: https://nodejs.org/en
- **Hono**: is a fast and lightweight Web application framework, built on Web Standards, support for any JavaScript runtime. Homepage: https://hono.dev/
- **OpenAI** [gpt-4o-mini](https://platform.openai.com/docs/models/gpt-4o-mini) is an affordable model which supports function calling. Homepage: https://platform.openai.com/docs/overview

### Project setup

- Install [NodeJS 22.x](https://nodejs.org/en) and [PNPM](https://pnpm.io/) if not already
- Clone the repo at https://github.com/lamnhan/function-calling-demo
- Install the dependencies by running `pnpm install`
- Rename `.env.sample` to `.env`, and provide [your OpenAI key](https://platform.openai.com/api-keys)

### Backend

For the BE, `pnpm dev` to run the server at `http://localhost:3000`, the server exposes REST endpoints for interacting with the system:

- **POST /message**: handles the query of the end users, returns either a `function_call` or a final `message`.
- And … other endpoints if needed.

The system has two main parts, **tool definitions** and **query handling**.

1. Define available tools, for example:
    
    ```tsx
    export const weatherTool: LLMTool = {
      type: 'function',
      name: 'get_weather',
      description:
        'Get the current weather information for the provided coordinates.',
      parameters: {
        type: 'object',
        properties: {
          latitude: { type: 'number' },
          longitude: { type: 'number' },
        },
        required: ['latitude', 'longitude'],
        additionalProperties: false,
      },
      strict: true,
      handler: getWeather,
    };
    
    async function getWeather({ latitude, longitude }) {
      return 'Retrieve and return the necessary information ...';
    }
    ```
    
    Source code at https://github.com/lamnhan/function-calling-demo/blob/main/src/tools/weather.ts
    
2. Handle the query from the users:
    
    ```tsx
    export async function handlePostMessage({ userMessage, withToolCall }) {
    
      // build the prompt for the LLM
      const prompt: LLMPrompt = !withToolCall
        ? {
            role: 'user',
            content: userMessage,
          }
        : {
            role: 'system',
            content: await handleToolCall(
              userMessage,
              withToolCall,
            ),
          };
    
      // request a response from the LLM
      const response = await openaiClient.responses.create({
        model: 'gpt-4o-mini',
        input: [prompt],
        tools: prompt.role === 'system' ? undefined : TOOLS,
      });
     
      // NOTE: for demo purpose, only use the first response from the LLM
      return response.output[0];
    }
    
    async function handleToolCall(userMessage, withToolCall) {
      const toolResult = await tool.handler(args);
      return `A system prompt with ${userMessage} and ${toolResult} ...`;
    }
    ```
    
    Source code at https://github.com/lamnhan/function-calling-demo/blob/main/src/routes/message.ts

### Frontend

Send **POST** requests to the endpoint `http://localhost:3000/message` with a payload, depend on the query, the API returns one of the two response types.

1. For example, an initial query from the user:
    
    ```json
    POST -> http://localhost:3000/message
    {
      "userMessage": "What's the weather like in Saigon today?"
    }
    ```
    
2. The LLM then asks for a `function_call` response:
    
    ```json
    {
      "type": "function_call",
      "arguments": "{\"latitude\":10.8231,\"longitude\":106.6297}",
      "name": "get_weather"
    }
    ```
    
3. The FE may ask the user to **confirm the action** or **automatically execute** the tool calling request:
    
    ```json
    POST -> http://localhost:3000/message
    {
      "userMessage": "What's the weather like in Saigon today?",
      "withToolCall": {
        "name": "get_weather",
        "arguments": "{\"latitude\":10.8231,\"longitude\":106.6297}"
      }
    }
    ```
    
4. The BE executes the tool calling and request the LLM for a final response:
    
    ```json
    {
      "current": {
        "temperature_2m": 32.8,
        "wind_speed_10m": 9.7,
        "precipitation": 0,
        "rain": 0
      }
    }
    ```
    
    ```json
    {
      "type": "message",
      "content": [{
        "text": "Today in Saigon, the weather is warm with a temperature of 32.8°C. There is no precipitation expected, meaning it's a dry day, and the wind is blowing at a speed of 9.7 km/h."
      }],
      "role": "assistant"
    }
    ```
    
5. Repeat the workflow for future queries.

## Links

- https://platform.openai.com/docs/guides/function-calling?api-mode=responses
- https://docs.mistral.ai/capabilities/function_calling/
- https://huggingface.co/docs/hugs/en/guides/function-calling
- https://developers.cloudflare.com/workers-ai/features/function-calling/
- https://ai.google.dev/gemini-api/docs/function-calling

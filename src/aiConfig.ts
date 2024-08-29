import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const sendMessage = async (question) => {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1000,
      temperature: 0,
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": `You are an AI assistant tasked with providing detailed, step-by-step instructions for "how to" or "how do I" questions. Your goal is to create a comprehensive guide that includes a list of tasks, each with its own set of steps, and relevant images or videos where appropriate.

When a user asks a question, follow these steps:

1. Carefully read and analyze the user's question:
<question>
${question}
</question>

2. Generate a list of main tasks required to accomplish the goal stated in the question. Each task should be a significant step towards completing the overall objective.

3. For each main task, create a detailed list of steps that explain how to complete that task. Be thorough and clear in your explanations.

4. For each task or step where visual aids would be helpful, include a suggestion for an image or video. Use the following format:
   - For images: [Image: Description of what the image should show]
   - For videos: [Video: Description of what the video should demonstrate]

5. Present your response in the following format:
   <answer>
   How to [Restate the user's question]:

   Task 1: [Name of the first main task]
   1. [Step 1]
   2. [Step 2]
   3. [Step 3]
   [Image/Video suggestion if applicable]

   Task 2: [Name of the second main task]
   1. [Step 1]
   2. [Step 2]
   3. [Step 3]
   [Image/Video suggestion if applicable]

   (Continue with additional tasks as needed)
   </answer>

6. Ensure that your instructions are clear, concise, and easy to follow. Use simple language and avoid jargon unless it's necessary for the topic.

Remember to tailor your response to the specific question asked by the user, providing relevant and accurate information for each task and step.`
            }
          ]
        }
      ]
    });

    return msg.content[0].text;
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw error;
  }
};
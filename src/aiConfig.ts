import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface Task {
  id: string;
  text: string;
  subtasks: Subtask[];
  media?: string;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

function parseAIResponse(response: string): Task[] {
  const tasks: Task[] = [];
  const cleanResponse = response.replace(/<answer>|<\/answer>/g, '').trim();
  const lines = cleanResponse.split('\n');
  let currentTask: Task | null = null;

  console.log('Parsing AI response:', cleanResponse);

  for (const line of lines) {
    const trimmedLine = line.trim();
    console.log('Processing line:', trimmedLine);

    if (trimmedLine.startsWith('Task')) {
      if (currentTask) {
        tasks.push(currentTask);
      }
      currentTask = {
        id: Date.now().toString() + Math.random(),
        text: trimmedLine,
        subtasks: []
      };
      console.log('New task created:', currentTask);
    } else if (currentTask) {
      const match = trimmedLine.match(/^(\d+)\.\s(.+)/);
      if (match) {
        const [, numberStr, subtaskText] = match;
        const number = parseInt(numberStr, 10);
        if (!isNaN(number)) {
          currentTask.subtasks.push({
            id: Date.now().toString() + Math.random(),
            text: subtaskText,
            completed: false
          });
          console.log('Subtask added:', subtaskText);
        }
      } else if (trimmedLine.startsWith('[Image:') || trimmedLine.startsWith('[Video:')) {
        currentTask.media = trimmedLine;
        console.log('Media added:', trimmedLine);
      }
    }
  }

  if (currentTask) {
    tasks.push(currentTask);
  }

  console.log('Parsed tasks:', JSON.stringify(tasks, null, 2));
  return tasks;
}

export const sendMessage = async (question: string): Promise<Task[]> => {
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

    const content = msg.content[0];
    if ('text' in content) {
      const tasks = parseAIResponse(content.text);
      console.log('Parsed tasks in sendMessage:', JSON.stringify(tasks, null, 2));
      if (tasks.length > 0) {
        return tasks;
      } else {
        console.log('No tasks parsed from AI response');
        return [];
      }
    } else {
      throw new Error('Unexpected content type in API response');
    }
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw error;
  }
};
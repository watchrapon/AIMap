import { GoogleGenAI } from "@google/genai"

// Initialize the Google Gemini AI client
export const initGemini = () => {
  return new GoogleGenAI({
    apiKey: "AIzaSyAP6LbH9j8cNgNIz1rktiC2VwtHTkV7APg",
  })
}

// Generate mind map data from a prompt
export async function generateMindMap(prompt: string): Promise<string> {
  const ai = initGemini()

  const config = {
    temperature: 0.85,
    responseMimeType: "text/plain",
  }

  const model = "gemini-2.5-flash-preview-04-17"

  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `Create a comprehensive, accessible mind map about "${prompt}" for users with attention difficulties.

IMPORTANT GUIDELINES:
1. Structure the mind map with a central topic and dynamic branches that vary in depth (2-4 levels).
2. Don't follow a fixed pattern - create a natural structure that fits the content.
3. Keep text concise and clear - use short phrases (3-5 words) for better readability.
4. Limit the number of main branches to 4-6 for reduced cognitive load.
5. Ensure final nodes (leaf nodes) contain specific, actionable information.
6. Vary the structure based on content importance - more important topics can have more sub-branches.

Format the response as a JSON object with this structure:
{
  "topic": "Main Topic",
  "children": [
    {
      "name": "Main Branch 1",
      "description": "Optional short description",
      "children": [
        { 
          "name": "Sub-topic 1.1", 
          "description": "Optional description",
          "isLeafNode": false,
          "children": [
            { 
              "name": "Detail 1.1.1", 
              "description": "Specific information",
              "isLeafNode": true,
              "children": [] 
            }
          ] 
        }
      ]
    }
  ]
}

IMPORTANT: Mark all final nodes with "isLeafNode": true and nodes with children as "isLeafNode": false.
Ensure the structure is varied and adapts to the content rather than following a rigid pattern.`,
        },
      ],
    },
  ]

  try {
    let fullResponse = ""
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    })

    for await (const chunk of response) {
      fullResponse += chunk.text || ""
    }

    // Extract JSON from the response
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
    return jsonMatch ? jsonMatch[0] : "{}"
  } catch (error) {
    console.error("Error generating mind map:", error)
    throw error
  }
}

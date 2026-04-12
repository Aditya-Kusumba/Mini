import axios from "axios";


export async function generateProblemWithLLM({ difficulty, topic }) {
  const difficultyLabel =
    difficulty < 0.3 ? "Easy" :
    difficulty < 0.6 ? "Medium" : "Hard";

  const prompt = `
You are a coding problem generator.

Topic: ${topic}
Difficulty: ${difficultyLabel}

IMPORTANT:
- Return ONLY valid JSON
- No explanation
- No markdown
- No extra text
- function_name MUST be provided
- must be valid python function name

FORMAT:

{
  "title": "",
  "description": "",
  "function_name": "",
  "test_cases": [
    {
      "input": {},
      "output": {}
    }
  ]
}
`;

  const res = await axios.post("http://localhost:11434/api/generate", {
    model: "qwen3:4b",
    prompt,
    stream: false
  });

  console.log(res)
  let text = res.data.response;

  text = text.trim();

  text = text.replace(/```json/g, "").replace(/```/g, "");

  // try to extract JSON substring
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1) {
    console.log("RAW LLM:", text);
    throw new Error("No JSON found in LLM response");
  }

  const jsonString = text.substring(start, end + 1);

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.log("PARSE ERROR:", jsonString);
    throw new Error("Invalid JSON from LLM");
  }
}
import requests
import json

def generate_problem(difficulty):

    prompt = f"""
Generate a coding problem.

Difficulty: {difficulty:.2f}

Rules:
- <0.3 → very easy
- 0.3–0.6 → medium
- >0.6 → harder

Return STRICT JSON:
{{
 "problem_statement":"",
 "constraints":"",
 "example_input":"",
 "example_output":""
}}
"""

    try:
        res = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "qwen3:4b",
                "prompt": prompt,
                "stream": False
            }
        )

        text = res.json()["response"]

        try:
            return json.loads(text)
        except:
            return {
                "problem_statement": text,
                "constraints": "",
                "example_input": "",
                "example_output": ""
            }

    except:
        return {
            "problem_statement": "Fallback problem",
            "constraints": "",
            "example_input": "",
            "example_output": ""
        }
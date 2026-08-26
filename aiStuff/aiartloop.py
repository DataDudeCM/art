import requests
import json
import os
import time

# Configuration
MODEL = "qwen2.5-coder:7b"
OUTPUT_DIR = "generated_art_qwen"
ITERATIONS = 1
OLLAMA_API_URL = "http://localhost:11434/api/generate"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

class ArtDirector:
    def __init__(self):
        self.history = []
        self.current_code = ""

    def query_llama(self, prompt, system_prompt=""):
        """Sends a request to the local Llama 3 instance."""
        print(f"Thinking... ({prompt[:50]}...)")
        
        full_prompt = f"{system_prompt}\n\n{prompt}"
        
        data = {
            "model": MODEL,
            "prompt": full_prompt,
            "stream": False
        }
        
        try:
            response = requests.post(OLLAMA_API_URL, json=data)
            response.raise_for_status()
            result = response.json()['response']
            return result
        except Exception as e:
            return f"Error connecting to Llama 3: {e}"

    def extract_code(self, response_text):
        """Extracts code blocks from the LLM response."""
        if "```javascript" in response_text:
            return response_text.split("```javascript")[1].split("```")[0]
        elif "```" in response_text:
            return response_text.split("```")[1].split("```")[0]
        return response_text

    def run_creative_cycle(self, concept_name, concept_description):
        print(f"--- Starting Creative Cycle for: {concept_name} ---")

        # --- STEP 1: GENESIS ---
        genesis_prompt = (
            f"You are a p5.js creative coding expert. Create a complete, single-file p5.js sketch "
            f"for an artwork titled '{concept_name}'.\n\n"
            f"Description: {concept_description}\n\n"
            f"Requirements:\n"
            f"- Use windowWidth and windowHeight.\n"
            f"- Implement a visually interesting 'draw' loop.\n"
            f"- ensure the code is bug-free and fully commented.\n"
            f"Output ONLY the code logic inside a markdown code block."
        )
        
        response = self.query_llama(genesis_prompt)
        self.current_code = self.extract_code(response)
        self.save_iteration(0, self.current_code)

        # --- STEP 2: ITERATION LOOP ---
        for i in range(1, ITERATIONS + 1):
            print(f"\n--- Iteration {i} of {ITERATIONS} ---")
            
            # Sub-step A: Critique
            critique_prompt = (
                f"Act as a harsh generative art critic. Review the following p5.js code:\n\n"
                f"{self.current_code}\n\n"
                f"Critique it on:\n"
                f"1. Code Efficiency (loops, variable usage)\n"
                f"2. Artistic Depth (color theory, motion dynamics)\n"
                f"3. Innovation (is it too standard?)\n"
                f"Provide 3 specific, actionable bullet points to improve the code to make it more interesting and artistically compelling."
            )
            critique = self.query_llama(critique_prompt)
            print(f"Critique Received:\n{critique[:300]}...\n")

            # Sub-step B: Refinement
            refine_prompt = (
                f"You are the Lead Developer. Rewrite the following p5.js code based on the critique below.\n\n"
                f"CRITIQUE:\n{critique}\n\n"
                f"CURRENT CODE:\n{self.current_code}\n\n"
                f"Output the FULLY REWRITTEN, improved code. Do not summarize. Output full code."
            )
            response = self.query_llama(refine_prompt)
            self.current_code = self.extract_code(response)
            self.save_iteration(i, self.current_code)

        print(f"\n--- Cycle Complete. Final piece saved as iteration_{ITERATIONS}.js ---")

    def save_iteration(self, index, code):
        filename = f"{OUTPUT_DIR}/iteration_{index}.js"
        with open(filename, "w") as f:
            f.write(code)
        print(f"Saved: {filename}")

# --- EXECUTION ---
if __name__ == "__main__":
    director = ArtDirector()
    
    # The Mashup Concept
    idea_title = "The Whispering Stained Glass"
    idea_desc = (
        "A p5.js sketch which draws circles along a sine wave which flows across the screen from left to right."
    )
    
    director.run_creative_cycle(idea_title, idea_desc)
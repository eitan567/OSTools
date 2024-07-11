import re

class Util:
    @staticmethod
    def clean_prompt(prompt):
        # List of all Midjourney parameters
        parameters = [
            r'--aspect', r'--ar', r'--chaos', r'--iw', r'--no', r'--quality', r'--q',
            r'--style', r'--seed', r'--sameseed', r'--stop', r'--stylize', r's',
            r'--tile', r'--video', r'--weird', r'--w', r'--niji', r'--version', r'--v',
            r'--fast', r'--relax', r'--turbo'
        ]
        
        # Create a regex pattern to match all parameters and their values
        pattern = r'\s+(?:' + '|'.join(parameters) + r')\s+(?:\S+)?'
        
        # Remove all parameters and their values from the prompt
        clean_prompt = re.sub(pattern, '', prompt)
        
        # Remove any remaining strings starting with '--'
        clean_prompt = re.sub(r'\s+--\S+(?:\s+\S+)?', '', clean_prompt)
        
        # Remove URLs
        clean_prompt = re.sub(r'https?://\S+', '', clean_prompt)
        
        # Remove prompt weights (::number)
        clean_prompt = re.sub(r'::\d+(?:\.\d+)?', '', clean_prompt)
        
        # Remove all '-' characters, whether they're surrounded by spaces or not
        clean_prompt = re.sub(r'-', ' ', clean_prompt)
        
        # Remove any extra whitespace
        clean_prompt = ' '.join(clean_prompt.split())
        
        return clean_prompt.strip()

        # Example usage:
        # if __name__ == "__main__":
        #     test_prompts = [
        #         "a beautiful landscape --ar 16:9 --chaos 50 --quality 1",
        #         "cyberpunk city --v 5 --style raw --seed 1234",
        #         "cute puppy --niji 5 --stylize 600 --no cats",
        #         "abstract art --w 500 --tile --video",
        #         "futuristic car --turbo --unknown-param value",
        #         "mountain scene - with snow --ar 3:2 - peaceful",
        #         "colorful - butterflies --stylize 200 - in - garden",
        #         "a beautiful sunset over- the ocean --ar 16:9 --chaos 25 --quality 1 --seed 1234 --v 5.2 --style raw --turbo",
        #         "http://imageURL1.png http://imageURL1.jpg description of what to imagine --parameter 1 --parameter 2",
        #         "space::2 ship traveling through the cosmos --ar 16:9",
        #         "vibrant::1.5 colorful::0.5 abstract painting of nature --quality 2",
        #         "a cat --sref https://url.com/CatSketch.png",
        #         "futuristic cityscape --sref https://example.com/future_city.jpg --ar 16:9 --quality 2"
        #     ]

        #     for prompt in test_prompts:
        #         print(f"Original: {prompt}")
        #         print(f"Cleaned : {MidjourneyPromptCleaner.clean_prompt(prompt)}\n")
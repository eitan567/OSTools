import re
import yake

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
        
        # Remove the job ID pattern from the prompt
        # Updated pattern to match Job IDs with spaces or hyphens
        clean_prompt = re.sub(r'\s*Job ID:\s*[a-f0-9]{8}[-\s]?[a-f0-9]{4}[-\s]?[a-f0-9]{4}[-\s]?[a-f0-9]{4}[-\s]?[a-f0-9]{12}\s*', '', clean_prompt)

        # Remove all '-' characters, whether they're surrounded by spaces or not
        clean_prompt = re.sub(r'-', ' ', clean_prompt)
        
        # Remove any extra whitespace
        clean_prompt = ' '.join(clean_prompt.split())
        
        return clean_prompt.strip()

    @staticmethod
    def getYakeKeywords(text):
        language = "en"
        max_ngram_size = 2
        deduplication_threshold = 0.9  # Lowered from 0.9
        deduplication_algo = 'seqm'
        windowSize = 1
        numOfKeywords = 10  # Increased from 10

        custom_kw_extractor = custom_kw_extractor = yake.KeywordExtractor(
            lan=language, 
            n=max_ngram_size, 
            dedupLim=deduplication_threshold, 
            dedupFunc=deduplication_algo, 
            windowsSize=windowSize, 
            top=numOfKeywords, 
            features=None
        )
        keywords = custom_kw_extractor.extract_keywords(text)

        # Extract only the keyword strings (first element of each tuple)
        keyword_list = [kw[0] for kw in keywords]

        # Sort keywords by the number of words they contain
        sorted_keywords = sorted(keyword_list, key=lambda x: len(x.split()))

        # Join the sorted keywords into a comma-separated string
        return sorted_keywords

    @staticmethod
    def mergeKeywordLists(yakeKeywords, keywords):
        # Create a set from the first list for fast lookup
        set1 = set(yakeKeywords)

        # Initialize the merged list with the first list
        merged_list = yakeKeywords.copy()

        # Add elements from the second list that are not in the first list
        for item in keywords:
            if item not in set1:
                merged_list.append(item)

        return merged_list
# Usage example
# Example usage:
# if __name__ == "__main__":
    # test_prompts = [
    #     "a beautiful landscape --ar 16:9 --chaos 50 --quality 1",
    #     "cyberpunk city --v 5 --style raw --seed 1234",
    #     "cute puppy --niji 5 --stylize 600 --no cats",
    #     "abstract art --w 500 --tile --video",
    #     "futuristic car --turbo --unknown-param value",
    #     "mountain scene - with snow --ar 3:2 - peaceful",
    #     "colorful - butterflies --stylize 200 - in - garden",
    #     "a beautiful sunset over- the ocean --ar 16:9 --chaos 25 --quality 1 --seed 1234 --v 5.2 --style raw --turbo",
    #     "http://imageURL1.png http://imageURL1.jpg description of what to imagine --parameter 1 --parameter 2",
    #     "space::2 ship traveling through the cosmos --ar 16:9",
    #     "vibrant::1.5 colorful::0.5 abstract painting of nature --quality 2",
    #     "a cat --sref https://url.com/CatSketch.png",
    #     "futuristic cityscape --sref https://example.com/future_city.jpg --ar 16:9 --quality 2",
    #     "3d animation style, in the midddle of the cloudy see, with a boat, a plane flying high Job ID: a899c03e 2b0d 4c37 a215 99ab94c5edce",
    #     " 3d animation style, in the midddle of the cloudy see, with a boat, a plane flying high Job ID: a899c03e-2b0d-4c37-a215-99ab94c5edce"
    # ]

    # for prompt in test_prompts:
    #     print(f"Original: {prompt}")
    #     print(f"Cleaned : {Util.clean_prompt(prompt)}\n")

    # text = "3d beautiful sunset over"
    # result = getYakeKeywords(text)
    # print(result)
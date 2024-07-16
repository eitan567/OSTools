import base64
import json
import re
from PIL import Image
import logging
# from util import Util
from functools import wraps
import asyncio
from openai import AsyncOpenAI
from ollama import AsyncClient
from util import Util


# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler('app.log'),
                        logging.StreamHandler()
                    ])

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds
retry_count = 0
unique_keywords = set()

# AsyncOpenAI(base_url="http://localhost:11434/v1", api_key="ignore-me")

def retry(max_retries=MAX_RETRIES, delay=RETRY_DELAY):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        logger.error(f"Function {func.__name__} failed after {max_retries} attempts. Error: {str(e)}")
                        raise
                    logger.warning(f"Attempt {attempt + 1} failed. Retrying in {delay} seconds...")
                    await asyncio.sleep(delay)
        return wrapper
    return decorator

def extract_json(text):
    """Extract JSON from text, even if it's not properly formatted."""
    try:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in extract_json: {str(e)}")
    return None

def get_image_title(file_path):
    try:
        with Image.open(file_path) as img:
            if img.format == 'JPEG':
                exif_data = img._getexif()
                if exif_data:
                    for tag_id, value in exif_data.items():
                        tag = Image.ExifTags.TAGS.get(tag_id, tag_id)
                        if tag == 'ImageDescription':
                            return value
            elif img.format == 'PNG':
                if 'Title' in img.info:
                    return img.info.get('Title')
                elif 'Description' in img.info:
                    return img.info.get('Description')
            return file_path.split('\\')[-1].split('.')[0]
    except Exception as e:
        logger.error(f"Error reading image metadata: {str(e)}")
        return file_path.split('\\')[-1].split('.')[0]

@retry()
async def get_title(client, file_path, original_title):
    title_prompt = f"""Analyze this stock image.
                       Using this original Title as context: '{original_title}', 
                       generate a professional, descriptive, and objective Title for this stock image,which is for sale in adobe stock.
                       The Title length should be between 100 and 200 characters long. 
                       Respond only using JSON. Response format: {{"Title": "..."}}"""
    response = await client.generate(
        model="llava:13b",
        format="json",
        prompt=title_prompt,
        images=[file_path],
        stream=False
    )
    
    logger.debug(f"Title response: {response['response']}")
    
    data = extract_json(response['response'])
    if data and 'Title' in data:
        return data['Title']
    else:
        raise ValueError("Failed to parse title from response")

@retry()
async def get_category(client, file_path, original_title):
    categories = {
        1: "People", 2: "Nature", 3: "Animals", 4: "Food & Drink", 5: "Architecture",
        6: "Travel", 7: "Technology", 8: "Business", 9: "Sports", 10: "Health & Wellness",
        11: "Education", 12: "Fashion", 13: "Art & Design", 14: "Music", 15: "Lifestyle",
        16: "Transportation", 17: "Science", 18: "Industry", 19: "Holidays & Celebrations",
        20: "Abstract", 21: "Other"
    }

    category_prompt = f"""Select for this context text: '{original_title}' the most accurate and appropriate category from the following list of category names:                            
                            1: "People", 2: "Nature", 3: "Animals", 4: "Food & Drink", 5: "Architecture",
                            6: "Travel", 7: "Technology", 8: "Business", 9: "Sports", 10: "Health & Wellness",
                            11: "Education", 12: "Fashion", 13: "Art & Design", 14: "Music", 15: "Lifestyle",
                            16: "Transportation", 17: "Science", 18: "Industry", 19: "Holidays & Celebrations",
                            20: "Abstract", 21: "Other".
                            Provide the category number. Respond using JSON.
                            Response format: {{"Category": 13}}"""

    response = await client.generate(
            model="gemma2",
            prompt=category_prompt,
            format="json",
            stream=False)

    logger.debug(f"Category response: {response['response']}")

    data = extract_json(response['response'])
    if data and 'Category' in data:
        return data['Category']
    else:
        raise ValueError("Failed to parse category from response")

@retry()
async def get_keywords(client, file_path, original_title):
    global retry_count, unique_keywords

    # keywords_prompt = f"""context text:'{original_title}'. 
    # Give me the best sortable keywords that you can extract from the following context text and generate single-word keywords related to this image. 
    # total keywords should be at least 30. Respond using JSON.
    # Response format: {{"Keywords": ["keyword1", "keyword2", ...]}}."""

    # keywords_prompt = f"Using the context '{original_title}', analyze this stock image and provide related keywords. Provide at least 49 unique words. Respond using JSON."
    # keywords_prompt = f"""Generate 80 ENGLISH ONLY unique single-word keywords related only to this text:'{original_title}'. 
    #                       For the first 10 words focused on the main subject of the sentence and then add additional words related to the main subject.
    #                       exclude words like "a","the","he","she","are", "for" and similar concept words.
    #                       sort the keywords from the most important and most subject focused.
    #                       IMPORTANT: Don't use conjunction words.
    #                       Respond using JSON."""
    keywords_prompt=f"""give me 49 most relevant and objective and subject focused keywords for the text "{original_title}" response using Json in the format of: {{Keywords:['keyword1','keyword2','keyword3','keyword4','keyword5'...]}}"""

    while len(unique_keywords) < 30 and retry_count < 5:
        response = await client.generate(
            model="gemma2",
            prompt=f"{keywords_prompt}\nResponse format: {{\"Keywords\": [\"keyword1\", \"keyword2\", ...]}}",
            # images=[file_path],
            format="json",
            stream=False
        )
        
        logger.debug(f"Keywords response for {file_path}: {response['response']}")
    
        data = extract_json(response['response'])
        if data and 'Keywords' in data:
            new_keywords = set(keyword.lower() for keyword in data['Keywords'] if len(keyword.split(" ")) < 3)
            unique_keywords.update(new_keywords)
            
            if len(unique_keywords) >= 30:
                return list(unique_keywords)[:49]
            else:
                retry_count = retry_count + 1
                logger.info(f"retry_count :{retry_count} unique_keywords: {unique_keywords}" )
        else:
            logger.error(f"Failed to parse keywords from: {response['response']}")
    
    return list(unique_keywords)  # Always return a list, even if it's empty

# async def sort_keywords(keywords):
#     sort_prompt = f"Sort the following keywords from the most relevant in the beginning of the list to the least relevant (focus on the main subject which will be the first keywords): {', '.join(keywords)}. Respond with a JSON array of sorted keywords."
#     response = await client.chat.completions.create(
#         model="llava:13b",
#         messages=[
#             {"role": "system", "content": "You are a helpful assistant."},
#             {"role": "user", "content": f"{sort_prompt}\nResponse format: {{\"SortedKeywords\": [\"keyword1\", \"keyword2\", ...]}}"}            
#         ],
#         stream=False
#     )
    
#     data = extract_json(response.choices[0].message.content)
#     if data and 'SortedKeywords' in data:
#         sorted_keywords = data['SortedKeywords']
#         sorted_keywords = [kw for kw in sorted_keywords if kw in keywords]
#         sorted_keywords.extend([kw for kw in keywords if kw not in sorted_keywords])
#         return sorted_keywords
#     else:
#         logger.error(f"Failed to sort keywords, using unsorted list")
#         return keywords

async def process_image(file_path, image_data, type):  
    global retry_count, unique_keywords
    
    client = AsyncClient()  # Create a single client instance
    original_title = image_data.get("original_title", "")

    try:
        with Image.open(file_path) as img:
            pass
    except Exception as e:
        logger.error(f"Invalid image file {file_path}: {str(e)}")
        raise ValueError(f"Invalid image file: {str(e)}")
    
    logger.info(f"Processing image: {file_path}")
    logger.info(f"Original title: {original_title}")
    
    # cleaned_original_title = Util.clean_prompt(original_title)
    # logger.info(f"Cleaned original title: {cleaned_original_title}")
    
    logger.info(f"Processed {file_path}:")
    
    match type:
        case "TITLE":
            title_task = get_title(client, file_path, original_title)    
            title = await asyncio.gather(title_task)
            
            logger.info(f"Title: {title}")
            
            return title[0]
        case "CATEGORY":
            category_task = get_category(client, file_path, original_title)
            category = await asyncio.gather(category_task)
            
            logger.info(f"Category: {category}")
            
            return category[0]
        case "KEYWORDS":
            retry_count=0
            unique_keywords.clear()
            
            keywords_task = get_keywords(client, file_path, original_title)
            keywords = await asyncio.gather(keywords_task)
            yakeKeywords = Util.getYakeKeywords(original_title)   
            mergedKeywords = Util.mergeKeywordLists(yakeKeywords,keywords[0])[:49]
            logger.info(f"Keywords: {mergedKeywords}")
            
            return ", ".join(mergedKeywords)
        case _:
            retry_count=0
            unique_keywords.clear()

            title_task = get_title(client, file_path, original_title)
            category_task = get_category(client, file_path, original_title)
            keywords_task = get_keywords(client, file_path, original_title)            
            
            title, category, keywords = await asyncio.gather(
                title_task, category_task, keywords_task
            )

            yakeKeywords = Util.getYakeKeywords(original_title)   
            mergedKeywords = Util.mergeKeywordLists(yakeKeywords,keywords)[:49]

            logger.info(f"Title: {title}")
            logger.info(f"Category: {category}")
            logger.info(f"Keywords: {', '.join(mergedKeywords) if isinstance(mergedKeywords, list) else mergedKeywords}")
            
            return title, ', '.join(keywords), category

# Usage example
# async def main():
#     try:
#         title, keywords, category = await process_image("path/to/your/image.jpg", "Original Image Title")
#         print(f"Title: {title}")
#         print(f"Keywords: {keywords}")
#         print(f"Category: {category}")
#     except Exception as e:
#         print(f"An error occurred: {str(e)}")

# if __name__ == "__main__":
#     asyncio.run(main())
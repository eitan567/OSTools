from motor.motor_asyncio import AsyncIOMotorClient
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = AsyncIOMotorClient("mongodb://localhost:27017")
database = client.stock_images

def get_database():
    return database

async def save_image_data(db, filename, title, keywords, category, type, image_data):
    db_title = image_data.get("title", "")
    db_keywords = image_data.get("keywords", [])
    db_category = image_data.get("category", "")
    original_title = image_data.get("original_title", "")
    thumbnail = image_data.get("thumbnail") if image_data else None
    # original_title = image_data["original_title"]
        
    logger.info(f"Saving data for {filename}: Type= {type}, Original Title={original_title}, Title={title}, Keywords={keywords}, Category={category}")


    match type:
        case "TITLE":
            isProcessed = db_keywords and db_category and title or False
            await db.images.update_one(
                {"filename": filename},
                {"$set": {                    
                    "title": title,                   
                    "status": (isProcessed and "processed") or "not processed",
                    "thumbnail": thumbnail,
                    "checkStatus": "not checked",
                    "checkReason": "no reason yet"
                }},
                upsert=True
            )    
        case "CATEGORY":
            isProcessed = db_keywords and db_title and category or False
            await db.images.update_one(
                {"filename": filename},
                {"$set": {                    
                    "category": category,
                    "status": (isProcessed and "processed") or "not processed",
                    "thumbnail": thumbnail,
                    "checkStatus": "not checked",
                    "checkReason": "no reason yet"
                }},
                upsert=True
            )    
        case "KEYWORDS":
            isProcessed = db_category and db_title and keywords or False
            await db.images.update_one(
                {"filename": filename},
                {"$set": {                    
                    "keywords": keywords,                    
                    "status": (isProcessed and "processed") or "not processed",
                    "thumbnail": thumbnail,
                    "checkStatus": "not checked",
                    "checkReason": "no reason yet"
                }},
                upsert=True
            )    
        case _:
            await db.images.update_one(
                {"filename": filename},
                {"$set": {
                    "original_title": original_title,
                    "title": title,
                    "keywords": keywords,
                    "category": category,
                    "status": "processed",
                    "thumbnail": thumbnail,
                    "checkStatus": "not checked",
                    "checkReason": "no reason yet"
                }},
                upsert=True
            )        
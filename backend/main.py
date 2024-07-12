import uvicorn
import os
import shutil
import asyncio
import json
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pydantic import BaseModel
from typing import List
import csv
from fastapi.responses import FileResponse, Response
from sse_starlette.sse import EventSourceResponse, ServerSentEvent
from image_processor import process_image, get_image_title
from database import get_database, save_image_data
import logging
from PIL import Image
import io
import base64
from logging.handlers import RotatingFileHandler
from openai import AsyncOpenAI
from ollama import AsyncClient

# Set up a rotating file handler
file_handler = RotatingFileHandler('app.log', maxBytes=5000000, backupCount=5)

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler('app.log'),
                        logging.StreamHandler()
                    ])

# Configure logging
logger = logging.getLogger(__name__)
 
app = FastAPI()

client = AsyncClient()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app's address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories to store uploaded images
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploaded_images")
ORIGINALS_DIR = os.path.join(UPLOAD_DIR, "originals")
RESIZED_DIR = os.path.join(UPLOAD_DIR, "resized")
THUMBNAIL_DIR = os.path.join(UPLOAD_DIR, "thumbnails")

# Global variable to store the SSE clients
CLIENTS = set()

@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient("mongodb://localhost:27017")
    app.database = app.mongodb_client.stock_images
    
    # Ensure directories exist
    for directory in [UPLOAD_DIR, ORIGINALS_DIR, RESIZED_DIR, THUMBNAIL_DIR]:
        os.makedirs(directory, exist_ok=True)
    
    # Mount the static files handler after ensuring the directories exist
    app.mount("/images", StaticFiles(directory=UPLOAD_DIR), name="images")

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()

class ProcessRequest(BaseModel):
    file_names: List[str]
    type: str

async def notify_clients(data: dict):
    event_data = json.dumps(data)
    logger.debug(f"Sending SSE data: {event_data}")
    for client in CLIENTS:
        await client.put(ServerSentEvent(data=event_data))

async def stream(request: Request):
    client_queue = asyncio.Queue()
    CLIENTS.add(client_queue)
    try:
        while True:
            if await request.is_disconnected():
                break
            try:
                message = await asyncio.wait_for(client_queue.get(), timeout=1.0)
                yield message
            except asyncio.TimeoutError:
                # Send a keep-alive message as JSON
                yield ServerSentEvent(data=json.dumps({"type": "keep-alive"}))
    finally:
        CLIENTS.remove(client_queue)

@app.get('/stream')
async def sse(request: Request):
    return EventSourceResponse(stream(request))

def resize_image(image, max_size=512):
    width, height = image.size
    if width > height:
        if width > max_size:
            ratio = max_size / width
            new_size = (max_size, int(height * ratio))
    else:
        if height > max_size:
            ratio = max_size / height
            new_size = (int(width * ratio), max_size)
    
    if 'new_size' in locals():
        image = image.resize(new_size, Image.LANCZOS)
    return image

def create_thumbnail(image, size=(100, 100)):
    image.thumbnail(size)
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

@app.post("/upload")
async def upload_images(files: list[UploadFile] = File(...)):
    if len(files) > 1000:
        raise HTTPException(status_code=400, detail="Maximum 1000 images allowed")
    
    # Clear the database and the upload directories
    db = get_database()
    await db.images.delete_many({})
    for directory in [ORIGINALS_DIR, RESIZED_DIR, THUMBNAIL_DIR]:
        if os.path.exists(directory):
            shutil.rmtree(directory)
        os.makedirs(directory)
    
    file_names = []
    for file in files:
        original_path = os.path.join(ORIGINALS_DIR, file.filename)
        resized_path = os.path.join(RESIZED_DIR, file.filename)
        
        # Save the original file
        content = await file.read()
        
        with open(original_path, "wb") as buffer:
            buffer.write(content)
        
        # Extract original title
        original_title = get_image_title(original_path)
        
        # Resize and save the image
        with Image.open(io.BytesIO(content)) as img:
            # Resize the image
            resized_img = resize_image(img)
            
            # Save the resized image without original metadata
            resized_img.save(resized_path)
            
            # Create thumbnail
            thumbnail = create_thumbnail(resized_img)
        
        file_names.append(file.filename)
        # Add entry to database with initial status, thumbnail, and original title
        await db.images.insert_one({
            "filename": file.filename, 
            "status": "not processed",
            "thumbnail": thumbnail,
            "original_title": original_title
        })
    
    return {"message": f"{len(files)} images uploaded successfully", "file_names": file_names}

@app.get("/thumbnail/{filename}")
async def get_thumbnail(filename: str):
    db = get_database()
    image = await db.images.find_one({"filename": filename})
    if image and "thumbnail" in image:
        return Response(content=base64.b64decode(image["thumbnail"]), media_type="image/png")
    raise HTTPException(status_code=404, detail="Thumbnail not found")

# async def process_image_and_update(file_name, db, type):
#     try:
#         title, keywords, category = None, None, None
#         await notify_clients({"filename": file_name, "status": "processing"})
        
#         # Get the original title from the database
#         image_data = await db.images.find_one({"filename": file_name})
#         # Retrieve a specific field value      

#         # Process resized image
#         file_path = os.path.join(RESIZED_DIR, file_name)
#         match type:
#             case "TITLE":
#                 title = await process_image(file_path, image_data, type)
#             case "CATEGORY":
#                 category = await process_image(file_path, image_data, type)
#             case "KEYWORDS":
#                 keywords = await process_image(file_path, image_data, type)
#             case "ALL":
#                 title, keywords, category = await process_image(file_path, image_data, type)
#             case _:
#                 raise ValueError("Invalid type")
                
#         # Save data to MongoDB instantly
#         # if type == "ALL":
#         await save_image_data(db, file_name, title, keywords, category, type, image_data)
#         # else:
#         #     await save_image_data(db, file_name, title and title[0] or "", keywords and keywords[0] or "", category and category[0] or "", type, {db_title, db_keywords, db_category})
        
#         # Retrieve a specific field value
#         image_data = await db.images.find_one({"filename": file_name})
#         updated_title = image_data.get("title", "")
#         updated_keywords = image_data.get("keywords", [])
#         updated_category = image_data.get("category", "")

#         isProcessed = updated_title and updated_keywords and updated_category or False   

#         await notify_clients({
#             "filename": file_name,
#             "status": (isProcessed and "processed") or "not processed",
#             "title": title,
#             "keywords": keywords,
#             "category": category
#         })
#     except Exception as e:
#         logger.exception(f"Error processing {file_name}: {str(e)}")
#         error_message = str(e)
#         await db.images.update_one(
#             {"filename": file_name},
#             {"$set": {"status": "error", "error": error_message}}
#         )
#         await notify_clients({
#             "filename": file_name,
#             "status": "error",
#             "error": error_message
#         })

async def process_image_and_update(file_name, db, type):
    try:
        title, keywords, category = None, None, None
        await notify_clients({"filename": file_name, "status": "processing"})

        # Get the original title from the database
        image_data = await db.images.find_one({"filename": file_name})

        # Process resized image
        file_path = os.path.join(RESIZED_DIR, file_name)
        match type:
            case "TITLE":
                title = await process_image(file_path, image_data, type)
            case "CATEGORY":
                category = await process_image(file_path, image_data, type)
            case "KEYWORDS":
                keywords = await process_image(file_path, image_data, type)
            case "ALL":
                title, keywords, category = await process_image(file_path, image_data, type)
            case _:
                raise ValueError("Invalid type")
                
        # Save data to MongoDB instantly
        await save_image_data(db, file_name, title, keywords, category, type, image_data)

        # Retrieve a specific field value
        image_data = await db.images.find_one({"filename": file_name})
        updated_title = image_data.get("title", "")
        updated_keywords = image_data.get("keywords", [])
        updated_category = image_data.get("category", "")

        isProcessed = updated_title and updated_keywords and updated_category or False   

        # await notify_clients({
        #     "filename": file_name,
        #     "status": (isProcessed and "processed") or "not processed",
        #     "title": title,
        #     "keywords": keywords,
        #     "category": category
        # })

        current_image_data = await db.images.find_one({"filename": file_name})

        await notify_clients({
            "filename": file_name,
            "status": (isProcessed and "processed") or "not processed",
            "title": current_image_data.get("title"),
            "keywords": current_image_data.get("keywords"),
            "category": current_image_data.get("category")
        })

    except Exception as e:
        logger.exception(f"Error processing {file_name}: {str(e)}")
        error_message = str(e)
        await db.images.update_one(
            {"filename": file_name},
            {"$set": {"status": "error", "error": error_message}}
        )
        await notify_clients({
            "filename": file_name,
            "status": "error",
            "error": error_message
        })


@app.post("/process")
async def process_images(request: ProcessRequest):
    db = get_database()
    for file_name in request.file_names:
        file_path = os.path.join(RESIZED_DIR, file_name)
        if not os.path.exists(file_path):
            await db.images.update_one(
                {"filename": file_name},
                {"$set": {"status": "error", "error": "File not found"}}
            )
            await notify_clients({
                "filename": file_name,
                "status": "error",
                "error": "File not found"
            })
            continue
        
        # Process images synchronously
        await process_image_and_update(file_name, db ,request.type)
    
    return {"message": f"Processing of {len(request.file_names)} images completed"}

@app.post("/process/{filename}")
async def process_single_image(filename: str):
    db = get_database()
    file_path = os.path.join(RESIZED_DIR, filename)

    # Check if the file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Update status to 'processing'
    await db.images.update_one(
        {"filename": filename},
        {"$set": {"status": "processing"}}
    )

    await notify_clients({"filename": filename, "status": "processing"})

    try:
        # Get the original title from the database
        image_data = await db.images.find_one({"filename": filename})
               
        # Process the image
        title, keywords, category = await process_image(file_path, image_data ,"ALL")
       
        # Save the processed data
        await save_image_data(db, filename, title, keywords, category, "ALL", image_data)

        await notify_clients({
            "filename": filename,
            "status": "processed",
            "title": title,
            "keywords": keywords,
            "category": category
        })

        return {"message": f"Image {filename} processed successfully", "status": "processed"}

    except Exception as e:
        logger.error(f"Error processing image {filename}: {str(e)}")
        
        # Update status to 'error' in case of failure
        error_message = str(e)
        await db.images.update_one(
            {"filename": filename},
            {"$set": {"status": "error", "error_message": error_message}}
        )
        
        await notify_clients({
            "filename": filename,
            "status": "error",
            "error": error_message
        })
        
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/images")
async def get_images():
    db = get_database()
    images = await db.images.find().to_list(1000)
    return [{"id": str(img["_id"]), **{k: v for k, v in img.items() if k != "_id" and k != "thumbnail"}} for img in images]

@app.get("/download-csv")
async def download_csv():
    db = get_database()
    images = await db.images.find({"status": "processed"}).to_list(1000)
    
    csv_file_path = os.path.join(UPLOAD_DIR, "output_data.csv")
    with open(csv_file_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['Filename', 'Original Title', 'Title', 'Keywords', 'Category']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for img in images:
            writer.writerow({
                'Filename': img['filename'],
                'Original Title': img.get('original_title', ''),
                'Title': img['title'],
                'Keywords': img['keywords'],
                'Category': img['category']
            })
    
    return FileResponse(csv_file_path, filename="output_data.csv")

@app.post("/regenerate/{field}/{filename}")
async def regenerate_field(field: str, filename: str):
    db = get_database()
    file_path = os.path.join(RESIZED_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Get the original title from the database
        title,keywords,category = None,None,None
        image_data = await db.images.find_one({"filename": filename})
        
        if field == "title":
            title = await process_image(file_path, image_data,type="TITLE")
            await db.images.update_one(
                {"filename": filename},
                {"$set": {
                    "title": title,
                    "status": "processed"
                }})
        elif field == "keywords":
            keywords = await process_image(file_path, image_data,type="KEYWORDS")
            await db.images.update_one(
                {"filename": filename},
                {"$set": {
                    "keywords": keywords,
                    "status": "processed"
                }})
        elif field == "category":
            category = await process_image(file_path, image_data,type="CATEGORY")
            await db.images.update_one(
                {"filename": filename},
                {"$set": {
                    "category": category,
                    "status": "processed"
                }})
        
        # Get the updated image data
        updated_image = await db.images.find_one({"filename": filename})
        
        await notify_clients({
            "filename": filename,
            "status": "processed",
            **{k: v for k, v in updated_image.items() if k != "_id" and k != "thumbnail"}
        })
        
        return {"message": f"{field} regenerated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":    
    response = client.generate(
        model="phi3",       
    )
    uvicorn.run(app, host="0.0.0.0", port=8000)
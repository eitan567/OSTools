import uvicorn
import os
import shutil
import asyncio
import json
from fastapi import FastAPI,APIRouter, UploadFile, File, HTTPException,Depends,Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from starlette.responses import JSONResponse
from dependencies import oauth
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pydantic import BaseModel
from typing import List
import csv
from fastapi.responses import FileResponse, Response
from starlette.middleware.sessions import SessionMiddleware
from sse_starlette.sse import EventSourceResponse, ServerSentEvent
from util import Util
from image_processor import process_image, get_image_title
from database import get_database, save_image_data
import logging
from PIL import Image
import io
import base64
from logging.handlers import RotatingFileHandler
from openai import AsyncOpenAI
from ollama import AsyncClient
from dotenv import load_dotenv
from starlette.config import Config
import subprocess
import auth

# Explicitly load the .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

# logging
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

# middleware
origins = [
    "http://localhost:3000",  # Your React app's URL
]

app.add_middleware(SessionMiddleware, secret_key="123456789")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    return response

# Directories to store uploaded images
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploaded_images")
UPSCALED_DIR = os.path.join(UPLOAD_DIR, "upscaled")
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

class UpscalingRequest(BaseModel):
    upscale_factor: float
    no_validation:bool

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
        with open(original_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract original title
        original_title = get_image_title(original_path)
        cleaned_original_title = Util.clean_prompt(original_title)
        
        # Resize and save the image
        with Image.open(original_path) as img:
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
            "original_title": cleaned_original_title
        })
    
    return {"message": f"{len(files)} images uploaded successfully", "file_names": file_names}

@app.get("/thumbnail/{filename}")
async def get_thumbnail(filename: str):
    db = get_database()
    image = await db.images.find_one({"filename": filename})
    if image and "thumbnail" in image:
        return Response(content=base64.b64decode(image["thumbnail"]), media_type="image/png")
    raise HTTPException(status_code=404, detail="Thumbnail not found")

async def process_image_and_update(file_name, db, type):
    try:
        # Notify that processing has started
        await notify_clients({"filename": file_name, "status": "processing"})

        image_data = await db.images.find_one({"filename": file_name})
        file_path = os.path.join(RESIZED_DIR, file_name)

        result = await process_image(file_path, image_data, type)

        update_data = {}
        if type == "TITLE":
            update_data["title"] = result
        elif type == "KEYWORDS":
            update_data["keywords"] = result
        elif type == "CATEGORY":
            update_data["category"] = result
        elif type == "ALL":
            title, keywords, category = result
            update_data = {"title": title, "keywords": keywords, "category": category}

        # Update the database with the new data
        await db.images.update_one({"filename": file_name}, {"$set": update_data})

        # Fetch the updated image data
        updated_image = await db.images.find_one({"filename": file_name})

        # Check if all fields are processed
        all_fields_present = all([
            updated_image.get('title'),
            updated_image.get('keywords'),
            updated_image.get('category')
        ])

        # Set status based on processed fields
        if all_fields_present:
            status = "processed"
        elif any([updated_image.get('title'), updated_image.get('keywords'), updated_image.get('category')]):
            status = "partially processed"
        else:
            status = "not processed"

        await db.images.update_one({"filename": file_name}, {"$set": {"status": status}})
        updated_image['status'] = status

        # Notify clients with the updated data
        await notify_clients({
            "filename": file_name,
            **{k: v for k, v in updated_image.items() if k != "_id" and k != "thumbnail"}
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
        await process_image_and_update(file_name, db, request.type)
    
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
        title, keywords, category = await process_image(file_path, image_data, "ALL")
       
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
        fieldnames = ['Filename', 'Title', 'Keywords', 'Category']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for img in images:
            writer.writerow({
                'Filename': img['filename'],
                'Title': img['title'],
                'Keywords': img['keywords'],
                'Category': img['category']
            })
    
    return FileResponse(csv_file_path, filename="output_data.csv")

@app.post("/update-metadata")
async def updateMetaData(request: ProcessRequest):    
    # Notify that processing has started
    db = get_database()
    for filename in request.file_names:
        file_path = os.path.join(ORIGINALS_DIR, filename)
        if not os.path.exists(file_path):           
            await notify_clients({
                "filename": filename,
                "status": "error",
                "error": "File not found"
            })
            continue
        
        await notify_clients({"filename": filename, "status": "processing"})

        image_data = await db.images.find_one({"filename": filename, "status": "processed"})  

        isUpscaled =  await isUpscaled()
        await updateSingleMetaData(filename,image_data,isUpscaled)    
       
    return {"message": f"Updating MetaData of {len(request.file_names)} images completed"}

async def updateSingleMetaData(filename,image_data,isUpscaled):
    try:        
        if isUpscaled:
            await Util.updateImageMetadata(image_data, UPSCALED_DIR)
        else:
            await Util.updateImageMetadata(image_data, ORIGINALS_DIR)

        # Notify clients with the updated data        
        await notify_clients({
            "filename": filename,
            "status": "processed"
        })

    except Exception as e:
        logger.exception(f"Error processing {filename}: {str(e)}")
        error_message = str(e)

        await notify_clients({
            "filename": filename,
            "status": "error",
            "error": error_message
        })


class UpdateImageRequest(BaseModel):
    imageId: str
    field: str
    value: str

@app.post("/update-image")
async def update_image(request: UpdateImageRequest):
    db = get_database()
    try:
        image = await db.images.find_one({"_id": ObjectId(request.imageId)})
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")

        update_data = {request.field: request.value}
        
        # Check if all fields are now processed
        if request.field in ['title', 'keywords', 'category']:
            image[request.field] = request.value
            all_fields_present = all([
                image.get('title'),
                image.get('keywords'),
                image.get('category')
            ])
            if all_fields_present:
                update_data['status'] = 'processed'
            elif any([image.get('title'), image.get('keywords'), image.get('category')]):
                update_data['status'] = 'partially processed'

        result = await db.images.update_one(
            {"_id": ObjectId(request.imageId)},
            {"$set": update_data}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Image update failed")

        # Notify clients about the update
        await notify_clients({
            "filename": image['filename'],
            "status": update_data.get('status', image['status']),
            request.field: request.value
        })

        return {"message": "Image updated successfully"}
    except Exception as e:
        logger.error(f"Error updating image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-to-adobe")
async def uploadToAdobe():        
    # Get the destination directory from .env file
    dest_base_dir = os.getenv('DESTINATION_DIR')
    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploaded_images")
    UPSCALED_DIR = os.path.join(UPLOAD_DIR, "upscaled")
    ORIGINALS_DIR = os.path.join(UPLOAD_DIR, "originals")

    request = UpscalingRequest(upscale_factor=4.0, no_validation=False)
    result = await upscale_by(request)
    
    # TODO - add notifications for upload process started

    Util.remove_all_directories(dest_base_dir)

    # TODO - add notifications for dividing files into folders
    
    if result["isOriginalsUpscaled"]:
        folderList = Util.divide_files_into_folders(4, "Account", ORIGINALS_DIR)
        filesCount = Util.count_files_in_folder(ORIGINALS_DIR)
    else:
        folderList = Util.divide_files_into_folders(4, "Account", UPSCALED_DIR)
        filesCount = Util.count_files_in_folder(UPSCALED_DIR)

    # TODO - add notifications for uploading files to sftp server
    Util.upload_files_sftp(folderList,filesCount) #change to the main,js file to add notifications properly 
    
    ORIGINALS_DIR = os.path.join(UPLOAD_DIR, "originals")
    
    return {"message": f"Upload To Adobe ended successfully"}

@app.post("/regenerate/{field}/{filename}")
async def regenerate_field(field: str, filename: str):
    db = get_database()
    file_path = os.path.join(RESIZED_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Get the original title from the database
        title, keywords, category = None, None, None
        image_data = await db.images.find_one({"filename": filename})
        
        if field == "title":
            title = await process_image(file_path, image_data, type="TITLE")
            await db.images.update_one(
                {"filename": filename},
                {"$set": {
                    "title": title,
                    "status": "processed"
                }})
        elif field == "keywords":
            keywords = await process_image(file_path, image_data, type="KEYWORDS")
            await db.images.update_one(
                {"filename": filename},
                {"$set": {
                    "keywords": keywords,
                    "status": "processed"
                }})
        elif field == "category":
            category = await process_image(file_path, image_data, type="CATEGORY")
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

def get_first_file(directory_path):
    # List all files in the directory
    files = [f for f in os.listdir(directory_path) if os.path.isfile(os.path.join(directory_path, f))]
    
    # Sort the files (this can be omitted if you just want the first file in the default order)
    files.sort()

    # Return the first file, if any
    return files[0] if files else None

async def isUpscaled():    
    file_path = os.path.join(ORIGINALS_DIR, get_first_file(ORIGINALS_DIR))

    command = ['exiftool']
    command.extend(['-s3'])
    command.extend(['-software'])
    # Add the file path at the end
    command.append(file_path)
    
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        # Ensure the stdout is a string before checking for substring
        stdout_content = result.stdout
        if "Topaz Photo AI" in stdout_content:
            return True
        else:
            return False
    except subprocess.CalledProcessError as e:
        print("Error updating metadata:")
        print(e.stderr)

    return False

@app.post("/upscale-all")
async def upscale_by(request: UpscalingRequest):          
    if not request.no_validation:
        if await isUpscaled():            
            return {"isOriginalsUpscaled":True,"message": "skipped upscaling - files are already upscaled by topaz photo AI !"}
    else:
        upscaling_by = 0
        if not request.upscale_factor:
            upscaling_by = os.getenv("UPSCALE_BY")
        else:
            upscaling_by = request.upscale_factor

        try:         
            await notify_clients({"status": "upscaling"})
            await asyncio.gather(*[
                asyncio.create_task(Util.upscale_image(ORIGINALS_DIR, UPSCALED_DIR, upscaling_by))               
            ])
        except Exception as e:
            logger.exception(f"Error Upscaling: {str(e)}")
            error_message = str(e)

            await notify_clients({            
                "status": "error",
                "error": error_message
            })

        return {"message": "Upscaling of all images completed"}

@app.post("/check-data-with-ai")
async def check_data_with_ai():
    db = get_database()
    images = await db.images.find({"status": "processed"}).to_list(1000)
    
    for image in images:
        try:
            prompt = f"""Given the title '{image['title']}', how well do the keywords '{image['keywords']}' describe the image? 
            be a stringent quality assurance inspector. 
            Response with one word only for the Answer: 'good', 'average' or 'bad' ,and a short reason for the score you gave.
            Response format: {{"Answer": "good","Reason":"this is a short reason for my answer..."}}"""
            
            response = await client.generate(
                model="llama3.1",
                prompt=prompt,
                stream=False
            )

            logger.debug(f"DataCheck response: {response['response']}")

            data = Util.extract_json(response['response'])
            if data and 'Answer' in data:
                check_status = data['Answer']
                check_reason = data['Reason']

                if check_status in ['very good', 'very bad']:
                    check_status = check_status.replace('very ','')
                
                if check_status not in ['good', 'average', 'bad']:
                    check_status = 'average'
                
                await db.images.update_one(
                    {"_id": image["_id"]},
                    {"$set": {"checkStatus": check_status,"checkReason":check_reason}}
                )
                
                await notify_clients({
                    "filename": image["filename"],
                    "checkStatus": check_status,
                    "checkReason": check_reason
                })
            else:
                raise ValueError("Failed to parse answer from response")
            
        except Exception as e:
            logger.error(f"Error checking data for image {image['filename']}: {str(e)}")
    
    return {"message": "Data check completed"}

app.include_router(auth.router)

if __name__ == "__main__":    
    response = client.generate(
        model="phi3",       
    )
    uvicorn.run(app, host="0.0.0.0", port=5000)
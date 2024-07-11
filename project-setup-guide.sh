# Step 1: Create project directory
mkdir stock-image-processor
cd stock-image-processor

# Step 2: Set up Python virtual environment
## Install virtualenv if you haven't already
pip install virtualenv

## Create a virtual environment
python -m venv venv

## Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS and Linux:
source venv/bin/activate

# Step 3: Install Python dependencies
## Create requirements.txt file
echo "fastapi==0.100.0
uvicorn==0.23.1
python-multipart==0.0.6
motor==3.2.0
ollama==0.1.0
Pillow==10.0.0
python-dotenv==1.0.0
httpx==0.24.1
colorama==0.4.6
pydantic==2.1.1" > requirements.txt

## Install the dependencies
pip install -r requirements.txt

# Step 4: Set up backend directory
mkdir backend
cd backend

## Create main Python files
touch main.py image_processor.py database.py

## Return to project root
cd ..

# Step 5: Set up React frontend
## Install Node.js and npm if you haven't already (https://nodejs.org/)

## Create React app
npx create-react-app frontend

## Navigate to frontend directory
cd frontend

## Install additional dependencies
npm install @mui/material @emotion/react @emotion/styled axios

## Return to project root
cd ..

# Step 6: Project structure should now look like this:
# stock-image-processor/
# ├── backend/
# │   ├── main.py
# │   ├── image_processor.py
# │   └── database.py
# ├── frontend/
# │   ├── public/
# │   ├── src/
# │   ├── package.json
# │   └── ...
# ├── venv/
# └── requirements.txt

# Step 7: Set up Git (optional but recommended)
git init
echo "venv/" > .gitignore
echo "node_modules/" >> .gitignore
git add .
git commit -m "Initial project setup"

# You're now ready to start developing!

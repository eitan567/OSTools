import re
# from watchfiles import awatch
import yake
import os
from PIL import Image
from PIL import PngImagePlugin
from PIL.PngImagePlugin import PngInfo
import piexif
import subprocess
import shutil
from collections import defaultdict
import warnings
warnings.filterwarnings("ignore", message=".*TripleDES.*")
import paramiko
from dotenv import load_dotenv
import json
from datetime import datetime
import socket
import time
import sys

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

        # Remove any existing numbers at the end of the given string
        clean_prompt = re.sub(r'\d+$', '', clean_prompt)
        
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
    
    @staticmethod
    async def updateImageMetadata(img,originalsDirectory):
        # try:
            filename = img.get("filename", "")
            title = img.get("title", "")
            keywords = img.get("keywords", "")
            category = img.get("category", "")
            directory = originalsDirectory + "\\"+  filename

            # subprocess.run(['exiftool', '-Keywords=' + keywords + "-overwrite_original", directory])
            Util.set_exif_metadata(directory, title, keywords, str(category))
        # except Exception as e:
        #     print(f"Failed to update Image Metadata: {str(e)}, filename:{filename}")
        #     return
        # extension = os.path.splitext(filename)[1]
        # match extension:
        #     case ".jpg" | ".jpeg":
        #         # Util.update_jpeg_data(title,keywords, directory)
        #         # Util.update_jpeg_exif(title,keywords,category, directory)
        #         Util.set_exif_metadata(directory, title, keywords, category)
        #     case ".png":
        #         Util.add_png_metadata(title,keywords,category, directory)
        #     case _:
        #         pass

    @staticmethod
    def update_jpeg_data(title, keywords, file_path):
        if not os.path.isfile(file_path):
            raise FileNotFoundError(f"No file found at {file_path}")

        with Image.open(file_path) as img:
            if img.format != 'JPEG':
                raise ValueError("Only JPEG files are supported")

            exif_data = img.info.get('exif', b'')
            
            metadata = PngImagePlugin.PngInfo()
            metadata.add_text("Title", title)
            metadata.add_text("Keywords", keywords)
            
            img.save(file_path, "JPEG", exif=exif_data, pnginfo=metadata)

            print(f"Metadata updated for {file_path}")

    @staticmethod
    def add_png_metadata(title, keywords,category, file_path):
        with Image.open(file_path) as img:
            if img.format != 'PNG':
                raise ValueError("This function is designed to work with PNG files only.")

            pnginfo = PngInfo()
            pnginfo.add_text("Title", title)
            pnginfo.add_text("Keywords", keywords)
            pnginfo.add_text("Subject", str(category))

            img.save(file_path, "PNG", pnginfo=pnginfo)

    @staticmethod
    def update_jpeg_exif(title, keywords,category, file_path):
        exif_dict = piexif.load(file_path)
        exif_dict['0th'][piexif.ImageIFD.ImageDescription] = title.encode('utf-8')
        exif_dict['0th'][piexif.ImageIFD.XPSubject] = (str(category)).encode('utf-16le')
        exif_dict['0th'][piexif.ImageIFD.XPKeywords] = keywords.encode('utf-16le')
        # Encode keywords as a single string, preserving commas
        # keywords_bytes = keywords.encode('utf-16le')
        
        # # Ensure the bytes are null-terminated
        # if len(keywords_bytes) % 2 != 0:
        #     keywords_bytes += b'\x00'
        
        # exif_dict['0th'][piexif.ImageIFD.XPKeywords] = keywords_bytes
        
        exif_bytes = piexif.dump(exif_dict)
        piexif.insert(exif_bytes, file_path)
        
        print(f"EXIF data updated for {file_path}")

    @staticmethod   
    def set_exif_metadata(file_path, title=None, keywords=None, subject=None):
        command = ['exiftool']
        
        if title is not None:
            command.extend(['-Title=' + title])
            command.extend(['-Description=' + title])
        
        if keywords is not None:
            # Ensure keywords are comma-separated
            if isinstance(keywords, list):
                keywords = ', '.join(keywords)
            command.extend(['-sep', ',', '-Keywords=' + keywords, '-XPKeywords=' + keywords])
        
        if subject is not None:
            command.extend(['-Subject=', '-XPSubject=' + subject])
        
        # Add these flags to ensure overwriting
        command.extend(['-P', '-overwrite_original'])
        
        # Add the file path at the end
        command.append(file_path)
        
        try:
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            print("Metadata updated successfully.")
            print(result.stdout)
        except subprocess.CalledProcessError as e:
            print("Error updating metadata:")
            print(e.stderr)

    @staticmethod
    def divide_files_into_folders(num_folders=4, folder_prefix="Account", source_dir="C:/AllPythonProjects/OSTools/uploaded_images/originals"):
        # Load environment variables
        load_dotenv()
        
        # Get the destination directory from .env file
        dest_base_dir = os.getenv('DESTINATION_DIR')
        if not dest_base_dir:
            raise ValueError("DESTINATION_DIR not set in .env file")

        # Create a dictionary to group files by their prefix
        files_by_prefix = defaultdict(list)
        
        # Get all files in the source directory
        for file_name in os.listdir(source_dir):
            if os.path.isfile(os.path.join(source_dir, file_name)):
                prefix = file_name.split('-')[0]
                files_by_prefix[prefix].append(file_name)
        
        # Create destination folders
        folders = [f"{folder_prefix}-{i}" for i in range(1, num_folders + 1)]
        for folder in folders:
            os.makedirs(os.path.join(dest_base_dir, folder), exist_ok=True)
        
        # Distribute files into folders
        folder_index = 0
        folders_with_files = set()
        for prefix, files in files_by_prefix.items():
            for file_name in files:
                dest_folder = folders[folder_index]
                source_path = os.path.join(source_dir, file_name)
                dest_path = os.path.join(dest_base_dir, dest_folder, file_name)
                shutil.copy2(source_path, dest_path)  # Use copy2 to preserve metadata
                folders_with_files.add(dest_folder)
                folder_index = (folder_index + 1) % num_folders
        
        # Return the full paths of folders that contain at least one file
        return [os.path.join(dest_base_dir, folder) for folder in folders if folder in folders_with_files]
    
    @staticmethod
    def upload_file_sftp(hostname, username, password, local_file, remote_file):
        # Create an SSH client
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        try:
            # Connect to the SFTP server
            ssh.connect(hostname, username=username, password=password)
            
            # Open an SFTP session
            sftp = ssh.open_sftp()
            
            # Upload the file
            sftp.put(local_file, remote_file)
            
            print(f"Successfully uploaded {local_file} to {remote_file}")
        
        finally:
            # Close the SFTP session and SSH connection
            if sftp:
                sftp.close()
            ssh.close()

    @staticmethod
    def upload_files_sftp(folderList):
        load_dotenv()  # Ensure environment variables are loaded
        adobe_stock_accounts = Util.get_adobe_stock_accounts()
        account_priority = Util.get_account_priority()
        final_dir = os.getenv('FINAL_DIR')
        test_mode = os.getenv('UPLOAD_SUCCESS_TEST_MODE', 'False').lower() == 'true'
        
        if not final_dir:
            raise ValueError("FINAL_DIR not set in .env file")
        
        # Create a timestamp for this upload session (Windows-compatible format)
        timestamp = datetime.now().strftime("%d-%m-%Y_%H-%M")
        unique_timestamp = str(int(time.time()))  # Unix timestamp for uniqueness
        upload_session_folder = f"uploaded-to-adobe-at-({timestamp})-({unique_timestamp})"
        upload_session_path = os.path.join(final_dir, upload_session_folder)
        
        try:
            os.makedirs(upload_session_path, exist_ok=True)
            print(f"Created upload session folder: {upload_session_path}")
        except Exception as e:
            print(f"Failed to create upload session folder: {str(e)}")
            return
        
        # Sort accounts by priority
        sorted_accounts = sorted(account_priority.items(), key=lambda x: x[1])
        
        for folder, (account_name, _) in zip(folderList, sorted_accounts):
            if account_name not in adobe_stock_accounts:
                print(f"Warning: Account {account_name} not found in Adobe Stock accounts. Skipping folder {folder}")
                continue
            
            credentials = adobe_stock_accounts[account_name]
            print(f"{'[TEST MODE] ' if test_mode else ''}Uploading images from folder: {folder}, into Account name: {account_name}")
            
            upload_successful = True
            
            if not test_mode:
                # Actual upload logic
                ssh = paramiko.SSHClient()
                ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                sftp = None
                
                try:
                    hostname = credentials['hostname'].replace('sftp://', '')
                    print(f"Attempting to connect to {hostname}")
                    ssh.connect(
                        hostname,
                        port=22,
                        username=credentials['username'],
                        password=credentials['password'],
                        timeout=30
                    )
                    
                    sftp = ssh.open_sftp()
                    
                    for filename in os.listdir(folder):
                        local_file = os.path.join(folder, filename)
                        if os.path.isfile(local_file):
                            remote_file = f"/{filename}"
                            try:
                                sftp.put(local_file, remote_file)
                                print(f"Successfully uploaded {local_file}")
                            except Exception as e:
                                print(f"Failed to upload {local_file}: {str(e)}")
                                upload_successful = False
                
                except paramiko.SSHException as ssh_ex:
                    print(f"SSH error occurred for {account_name}: {str(ssh_ex)}")
                    upload_successful = False
                except paramiko.AuthenticationException:
                    print(f"Authentication failed for {account_name}. Please check your credentials.")
                    upload_successful = False
                except socket.gaierror as sock_ex:
                    print(f"Network error occurred for {account_name}: {str(sock_ex)}")
                    print(f"Please check if the hostname '{hostname}' is correct and reachable.")
                    upload_successful = False
                except Exception as e:
                    print(f"An unexpected error occurred for {account_name}: {str(e)}")
                    upload_successful = False
                
                finally:
                    if sftp:
                        sftp.close()
                    ssh.close()
            else:
                print(f"[TEST MODE] Simulating successful upload for folder: {folder}")
            
            if upload_successful or test_mode:
                # Rename and move the folder
                new_folder_name = f"{os.path.basename(folder)}-uploaded-{account_name}-({timestamp})"
                new_folder_path = os.path.join(upload_session_path, new_folder_name)
                
                try:
                    shutil.move(folder, new_folder_path)
                    print(f"{'[TEST MODE] ' if test_mode else ''}Successfully moved and renamed folder to: {new_folder_path}")
                except Exception as e:
                    print(f"Failed to move and rename folder: {str(e)}")
            else:
                print(f"Not all files were uploaded successfully for folder: {folder}")
        
        # Check if the upload session folder is empty (no successful uploads)
        if not os.listdir(upload_session_path):
            try:
                os.rmdir(upload_session_path)
                print(f"Removed empty upload session folder: {upload_session_path}")
            except Exception as e:
                print(f"Failed to remove empty upload session folder: {str(e)}")

    @staticmethod
    def get_adobe_stock_accounts():
        load_dotenv()
        hostname = os.getenv('ADOBE_STOCK_HOSTNAME')
        if not hostname:
            print("Error: ADOBE_STOCK_HOSTNAME not found in .env file.")
            return {}

        accounts_json = os.getenv('ADOBE_STOCK_ACCOUNTS')
        if not accounts_json:
            print("Error: ADOBE_STOCK_ACCOUNTS not found in .env file.")
            return {}

        try:
            accounts = json.loads(accounts_json)
            for account in accounts.values():
                account['hostname'] = hostname
            return accounts
        except json.JSONDecodeError:
            print("Error: Unable to parse ADOBE_STOCK_ACCOUNTS as JSON.")
            return {}

    @staticmethod
    def get_account_priority():
        load_dotenv()
        priority_json = os.getenv('ACCOUNT_PRIORITY')
        if not priority_json:
            print("Error: ACCOUNT_PRIORITY not found in .env file.")
            return {}

        try:
            return json.loads(priority_json)
        except json.JSONDecodeError:
            print("Error: Unable to parse ACCOUNT_PRIORITY as JSON.")
            return {}
    
    @staticmethod
    def remove_all_directories(parent_directory, ignore_errors=False):
        removed_dirs = []
        for item in os.listdir(parent_directory):
            item_path = os.path.join(parent_directory, item)
            if os.path.isdir(item_path):
                try:
                    shutil.rmtree(item_path)
                    removed_dirs.append(item_path)
                    print(f"Removed directory: {item_path}")
                except Exception as e:
                    print(f'Failed to delete {item_path}. Reason: {e}')
                    if not ignore_errors:
                        raise
        return removed_dirs
    
    @staticmethod
    def upscale_image(input_folder, output_folder, scale_factor):
        photoai_cli_path = "C:/Program Files/Topaz Labs LLC/Topaz Photo AI/tpai.exe"        

        if not os.path.exists(photoai_cli_path):
            print("Topaz Photo AI CLI not found. Check the path.")
            sys.exit(1)

        try:
            upscaleCommand = f'{photoai_cli_path} {input_folder} --output {output_folder} --upscale scale={scale_factor} model="Low Resolution"'
            result = subprocess.run(upscaleCommand, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            print(result.stdout.decode("utf-8"))
        except subprocess.CalledProcessError as error:
            print(f"Upscaling failed with error: {error}")
            print(error.stderr.decode("utf-8"))        
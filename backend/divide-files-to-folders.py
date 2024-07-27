import os
import shutil
from collections import defaultdict

def divide_files_into_folders(num_folders=4, folder_prefix="Account-",source_dir="C:/AllPythonProjects/OSTools/uploaded_images/originals"):
    # Create a dictionary to group files by their prefix
    files_by_prefix = defaultdict(list)
    
    # Get all files in the source directory
    for file_name in os.listdir(source_dir):
        if os.path.isfile(os.path.join(source_dir, file_name)):
            prefix = file_name.split('-')[0]
            files_by_prefix[prefix].append(file_name)
    
    # Create destination folders
    for i in range(1, num_folders + 1):
        os.makedirs(os.path.join(source_dir, f"{folder_prefix}-{i}"), exist_ok=True)
    
    # Distribute files into folders
    folder_index = 1
    for prefix, files in files_by_prefix.items():
        for file_name in files:
            dest_folder = os.path.join(source_dir, f"{folder_prefix}-{folder_index}")
            shutil.move(os.path.join(source_dir, file_name), os.path.join(dest_folder, file_name))
            folder_index = folder_index % num_folders + 1

# Example usage
# source_directory = "path/to/source/directory"
# number_of_folders = 4
# folder_name_prefix = "Account"

# divide_files_into_folders(source_directory, number_of_folders, folder_name_prefix)

import paramiko
import os

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

def upload_files_sftp(hostname, username, password, local_dir):
    # Create an SSH client
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # Connect to the SFTP server
        ssh.connect(hostname, username=username, password=password)
        
        # Open an SFTP session
        sftp = ssh.open_sftp()
        
        # Upload all files in the directory
        for filename in os.listdir(local_dir):
            if os.path.isfile(os.path.join(local_dir, filename)):
                local_file = os.path.join(local_dir, filename)
                remote_file = filename  # Upload to root directory
                sftp.put(local_file, remote_file)
                print(f"Successfully uploaded {local_file}")
    
    finally:
        # Close the SFTP session and SSH connection
        if sftp:
            sftp.close()
        ssh.close()



# Example usage
if __name__ == "__main__":
    # Adobe Stock SFTP details
    hostname = "sftp://sftp.contributor.adobestock.com"
    username = "211259404"
    password = "C>{]t(3S.$>K`QUi"
    # # To upload a single file
    # local_file = "/path/to/your/file.jpg"
    # remote_file = "file.jpg"  # File will be uploaded to the root directory
    # upload_file_sftp(hostname, username, password, local_file, remote_file)
    
    # To upload all files from a directory
    local_dir = "/path/to/your/directory"
    upload_files_sftp(hostname, username, password, local_dir)
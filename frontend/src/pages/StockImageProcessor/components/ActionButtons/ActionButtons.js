import React from 'react';
import { Box } from '@mui/material';

function ActionButtons({
  isConnected,
  processingImages,
  images,
  handleProcessImages,
  isAllSelectedImagesProcessed,
  handleUpdateMetaDataImages,
  isAllImagesProcessed,
  handleUploadToAdobe,
  csvDownloadEnabled,
  handleDownloadCsv,
  handleFileUpload
}) {
  const disableProcessButtons = !isConnected || Object.keys(processingImages).length > 0 || images.filter(img => img.selected).length === 0;

  return (
    <Box display="flex" gap={2} marginBottom="1rem" width="100%" maxWidth="1400px" justifyContent="space-between">
      <label className="sign-up label-button" style={{cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.8rem', marginLeft:'0'}}>
        Upload Images
        <input type="file" hidden multiple onChange={handleFileUpload} />
      </label>
      <button onClick={() => handleProcessImages("ALL")} 
        disabled={disableProcessButtons}
        className="sign-up"
        style={{
          backgroundColor: disableProcessButtons ? '#ccc' : '#4a6cf7',
          padding: '0.3rem 0.6rem',
          fontSize: '0.8rem'
        }}
      >
        Process Images
      </button>
      <button onClick={() => handleProcessImages("TITLE")} 
        disabled={disableProcessButtons}
        className="sign-up"
        style={{
          backgroundColor: disableProcessButtons ? '#ccc' : '#4a6cf7',
          padding: '0.3rem 0.6rem',
          fontSize: '0.8rem'
        }}
      >
        Process Titles
      </button>
      <button onClick={() => handleProcessImages("KEYWORDS")} 
        disabled={disableProcessButtons}
        className="sign-up"
        style={{
          backgroundColor: disableProcessButtons ? '#ccc' : '#4a6cf7',
          padding: '0.3rem 0.6rem',
          fontSize: '0.8rem'
        }}
      >
        Process Keywords
      </button>
      <button onClick={() => handleProcessImages("CATEGORY")} 
        disabled={disableProcessButtons}
        className="sign-up"
        style={{
          backgroundColor: disableProcessButtons ? '#ccc' : '#4a6cf7',
          padding: '0.3rem 0.6rem',
          fontSize: '0.8rem'
        }}
      >
        Process Categories
      </button>
      <button onClick={handleUpdateMetaDataImages} 
        disabled={!isConnected || !isAllSelectedImagesProcessed}
        className="sign-up"
        style={{
          backgroundColor: (!isConnected || !isAllSelectedImagesProcessed) ? '#ccc' : '#36415d',
          padding: '0.3rem 0.6rem',
          fontSize: '0.8rem'
        }}
      >
        Update MetaData
      </button>              
      <button onClick={handleUploadToAdobe} 
        disabled={!isConnected || !isAllImagesProcessed}
        className="sign-up"
        style={{
          backgroundColor: (!isConnected || !isAllImagesProcessed) ? '#ccc' : '#36415d',
          padding: '0.3rem 0.6rem',
          fontSize: '0.8rem'
        }}
      >
        Upload To Adobe
      </button>
      <button 
        onClick={handleDownloadCsv} 
        disabled={!isConnected || !csvDownloadEnabled}
        className="sign-up"
        style={{
          backgroundColor: (!isConnected || !csvDownloadEnabled) ? '#ccc' : '#36415d',
          padding: '0.3rem 0.6rem',
          fontSize: '0.8rem',
          marginRight:'0'
        }}
      >
        Download CSV File
      </button>
    </Box>
  );
}

export default ActionButtons;
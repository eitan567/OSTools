import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Snackbar, Box, Paper } from '@mui/material';
import ImageTable from './ImageTable';
import Header from './Header';
import './LandingPage.css';
import './StockImageProcessor.css';

function StockImageProcessor() {
  const [images, setImages] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [csvDownloadEnabled, setCsvDownloadEnabled] = useState(false);
  const [isAllImagesProcessed, setIsAllImagesProcessed] = useState(false);  
  const [isAllSelectedImagesProcessed, setIsAllSelectedImagesProcessed] = useState(false);
  const [processingImages, setProcessingImages] = useState({});
  const [isConnected, setIsConnected] = useState(true);
  const [componentKey, setComponentKey] = useState(0);
  const retryCount = useRef(0);
  const maxRetries = 5;
  const retryInterval = 5000; // 5 seconds

  const updateImageStatus = useCallback((data) => {
    setImages(prevImages => prevImages.map(img => 
      img.filename === data.filename 
        ? { 
            ...img, 
            ...data,
            title: data.title !== undefined ? data.title : img.title,
            keywords: data.keywords !== undefined ? data.keywords : img.keywords,
            category: data.category !== undefined ? data.category : img.category,
            status: data.status || img.status 
          } 
        : img
    ));
    
    if (data.status === 'processed' || data.status === 'error') {
      setProcessingImages(prev => {
        const newProcessingImages = { ...prev };
        if (newProcessingImages[data.filename]) {
          delete newProcessingImages[data.filename];
        }
        return newProcessingImages;
      });
    }
  }, []);

  const fetchImages = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/images`);
      const data = await response.json();
      setImages(data.map(img => ({ ...img, selected: false })));
      const hasProcessedImages = data.some(img => img.status === 'processed');
      setCsvDownloadEnabled(hasProcessedImages);
      console.log("fetchImages");
      
      const allProcessed = data.every(img => img.status === 'processed');
      setIsAllImagesProcessed(allProcessed);
      console.log("allProcessed:",allProcessed)

    } catch (error) {
      console.error('Error fetching images:', error);
      setSnackbarMessage('Failed to fetch images');
      setSnackbarOpen(true);
    }
  }, []);

  const setupSSE = useCallback(() => {
    const eventSource = new EventSource(`${process.env.REACT_APP_API_URL}/stream`);
    
    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
      retryCount.current = 0;
      fetchImages();
      setComponentKey(prev => prev + 1); // Force re-render
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'keep-alive') return;
        updateImageStatus(data);
      } catch (error) {
        console.error('Error parsing SSE data:', error, event.data);
      }
    };
  
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      setIsConnected(false);

      if (retryCount.current < maxRetries) {
        retryCount.current += 1;
        console.log(`Attempting to reconnect in ${retryInterval / 1000} seconds (Attempt ${retryCount.current}/${maxRetries})`);
        setTimeout(setupSSE, retryInterval);
      } else {
        console.log('Max retry attempts reached. Please refresh the page manually.');
      }
    };
  
    return () => eventSource.close();
  }, [fetchImages, updateImageStatus]);

  useEffect(() => {
    const cleanup = setupSSE();
    return () => {
      cleanup();
    };
  }, [setupSSE]);

  const handleProcessImage = useCallback(async (filename) => {
    setProcessingImages(prev => ({ ...prev, [filename]: 'ALL' }));
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/process/${filename}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to process image');
      await fetchImages();
    } catch (error) {
      console.error('Error processing image:', error);
      setSnackbarMessage('Failed to process image');
      setSnackbarOpen(true);
    } finally {
      setProcessingImages(prev => {
        const newProcessingImages = { ...prev };
        delete newProcessingImages[filename];
        return newProcessingImages;
      });
    }
  }, [fetchImages]);

  const handleFileUpload = useCallback(async (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 1000) {
      setSnackbarMessage('Maximum 1000 images allowed');
      setSnackbarOpen(true);
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      await fetchImages();
      setSnackbarMessage(`${result.file_names.length} images uploaded successfully`);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error uploading files:', error);
      setSnackbarMessage('Failed to upload images');
      setSnackbarOpen(true);
    }
  }, [fetchImages]);

  const handleUpdateMetaDataImages = useCallback(async () => {
    const filesToProcess = images.filter(img => img.selected).map(img => img.filename);
    if (filesToProcess.length === 0) {
      setSnackbarMessage('No images selected for processing');
      setSnackbarOpen(true);
      return;
    }
  
    setProcessingImages(prev => {
      const newProcessingImages = { ...prev };
      filesToProcess.forEach(filename => {
        newProcessingImages[filename] = "ALL";
      });
      return newProcessingImages;
    });
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/update-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_names: filesToProcess, type: "ALL"}),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      setSnackbarMessage(result.message);
      await fetchImages();
    } catch (error) {
      console.error('Error processing images:', error);
      setSnackbarMessage(error.message || 'An error occurred while processing images');
    }
    setSnackbarOpen(true);
  }, [images, fetchImages]);

  const handleUploadToAdobe = useCallback(async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/upload-to-adobe`, {
        method: 'POST'
      });
      setSnackbarMessage(`Uploading successfully to Adobe`);
      setSnackbarOpen(true);
      await fetchImages();
    } catch (error) {
      console.error('Error Uploading to Adobe:', error);
      setSnackbarMessage('Failed to Upload to Adobe');
      setSnackbarOpen(true);
    }
  }, [fetchImages]);

  const handleProcessImages = useCallback(async (type) => {
    const filesToProcess = images.filter(img => img.selected).map(img => img.filename);
    if (filesToProcess.length === 0) {
      setSnackbarMessage('No images selected for processing');
      setSnackbarOpen(true);
      return;
    }
  
    setProcessingImages(prev => {
      const newProcessingImages = { ...prev };
      filesToProcess.forEach(filename => {
        newProcessingImages[filename] = type === "ALL" ? "ALL" : type;
      });
      return newProcessingImages;
    });
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_names: filesToProcess, type: type }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      setSnackbarMessage(result.message);
      await fetchImages();
    } catch (error) {
      console.error('Error processing images:', error);
      setSnackbarMessage(error.message || 'An error occurred while processing images');
    }
    setSnackbarOpen(true);
  }, [images, fetchImages]);

  const handleSnackbarClose = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  }, []);

  const handleDownloadCsv = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/download-csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'output_data.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      setSnackbarMessage('Failed to download CSV');
      setSnackbarOpen(true);
    }
  }, []);

  const handleRegenerateField = useCallback(async (field, filename) => {
    setProcessingImages(prev => ({ ...prev, [filename]: field.toUpperCase() }));
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/regenerate/${field}/${filename}`, {
        method: 'POST',
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      setSnackbarMessage(result.message);
      setSnackbarOpen(true);
      await fetchImages();
    } catch (error) {
      console.error(`Error regenerating ${field}:`, error);
      setSnackbarMessage(`Failed to regenerate ${field}`);
      setSnackbarOpen(true);
    } finally {
      setProcessingImages(prev => {
        const newProcessingImages = { ...prev };
        delete newProcessingImages[filename];
        return newProcessingImages;
      });
    }
  }, [fetchImages]);

  const handleSelectImage = useCallback((filename, isSelected) => {
    setImages(prevImages => {
      const newImages = prevImages.map(img => 
        img.filename === filename ? { ...img, selected: isSelected } : img
      );
      
      const allSelectedProcessed = newImages.filter(img => img.selected).every(img => img.status === 'processed');
      setIsAllSelectedImagesProcessed(allSelectedProcessed);
      console.log("handleSelectImage - allSelectedProcessed:",allSelectedProcessed)

      return newImages;
    });
  }, []);

  const handleSelectAll = useCallback((isSelected) => {
    setImages(prevImages => {
      const newImages = prevImages.map(img => ({ ...img, selected: isSelected }));
      const allSelectedProcessed = newImages.filter(img => img.selected).length>0 && newImages.filter(img => img.selected).every(img => img.status === 'processed');      
      setIsAllSelectedImagesProcessed(allSelectedProcessed);
      console.log("handleSelectAll - allSelectedProcessed:",allSelectedProcessed)      
      return newImages;
    });
  }, []);

  return (
    <div key={componentKey} className="landing-page">
      <Header />

      <main>
        <section className="hero processorTitle">
          <h1>Stock Image Processor</h1>
          <p>Process and manage your stock images with AI-powered tools.</p>
        </section>

        <section className="pricing processorTable" style={{ backgroundColor: '#fff' }}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Paper style={{ width: '100%', maxWidth: '1400px', marginBottom: '1rem', overflow: 'auto', border: '1px solid #e6e5e5' }}>
            <ImageTable 
              images={images}
              onRegenerateField={handleRegenerateField}
              onSelectImage={handleSelectImage}
              onSelectAll={handleSelectAll}
              onProcessImage={handleProcessImage}
              processingImages={processingImages}
            />
            </Paper>
            <Box display="flex" gap={2} marginBottom="1rem" width="100%" maxWidth="1400px" justifyContent="space-between">
              <label className="sign-up label-button" style={{cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.8rem'}}>
                Upload Images
                <input type="file" hidden multiple onChange={handleFileUpload} />
              </label>
              <button onClick={() => handleProcessImages("ALL")} 
                disabled={!isConnected || Object.keys(processingImages).length > 0 || images.filter(img => img.selected).length === 0}
                className="sign-up"
                style={{
                  backgroundColor: (!isConnected || Object.keys(processingImages).length > 0 || images.filter(img => img.selected).length === 0) ? '#ccc' : '#4a6cf7',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.8rem'
                }}
              >
                Process Images
              </button>
              <button onClick={() => handleProcessImages("TITLE")} 
                disabled={!isConnected || Object.keys(processingImages).length > 0 || images.filter(img => img.selected).length === 0}
                className="sign-up"
                style={{
                  backgroundColor: (!isConnected || Object.keys(processingImages).length > 0 || images.filter(img => img.selected).length === 0) ? '#ccc' : '#4a6cf7',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.8rem'
                }}
              >
                Process Titles
              </button>
              <button onClick={() => handleProcessImages("KEYWORDS")} 
                disabled={!isConnected || Object.keys(processingImages).length > 0 || images.filter(img => img.selected).length === 0}
                className="sign-up"
                style={{
                  backgroundColor: (!isConnected || Object.keys(processingImages).length > 0 || images.filter(img => img.selected).length === 0) ? '#ccc' : '#4a6cf7',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.8rem'
                }}
              >
                Process Keywords
              </button>
              <button onClick={() => handleProcessImages("CATEGORY")} 
                disabled={!isConnected || Object.keys(processingImages).length > 0 || images.filter(img => img.selected).length === 0}
                className="sign-up"
                style={{
                  backgroundColor: (!isConnected || Object.keys(processingImages).length > 0 || images.filter(img => img.selected).length === 0) ? '#ccc' : '#4a6cf7',
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
                  fontSize: '0.8rem'
                }}
              >
                Download CSV File
              </button>
            </Box>
          </Box>
        </section>
      </main>

      {!isConnected && (
        <div className="alert alert-warning" role="alert" style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000, 
          textAlign: 'center', 
          padding: '10px',
          backgroundColor: 'red',
          color:'white'
        }}>
          Connection to server lost. Attempting to reconnect...
        </div>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </div>
  );
}

export default StockImageProcessor;
import React, { useState, useEffect, useCallback } from 'react';
import { Snackbar, Box, Paper } from '@mui/material';
import ImageTable from './ImageTable';
import Header from './Header';
import './LandingPage.css';
import './StockImageProcessor.css';

function StockImageProcessor() {
  const [images, setImages] = useState([]);
  // const [isProcessing, setIsProcessing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [csvDownloadEnabled, setCsvDownloadEnabled] = useState(false);
  const [processingImages, setProcessingImages] = useState({});

  const updateImageStatus = useCallback((data) => {
    console.log("Received data for update:", data);
  
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
    
    console.log("Updated image:", data);
  
    if (data.status === 'processed' || data.status === 'error') {
      setProcessingImages(prev => {
        const newProcessingImages = { ...prev };
        if (newProcessingImages[data.filename]) {
          delete newProcessingImages[data.filename];
        }
        console.log("New processing images state after update:", newProcessingImages);
        return newProcessingImages;
      });
    }
  }, []);

  const handleProcessImage = async (filename) => {
    setProcessingImages(prev => ({ ...prev, [filename]: 'ALL' }));
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/process/${filename}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to process image');
      await fetchImages(); // Refresh the image list
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
  };
  

  const setupSSE = useCallback(() => {
    const eventSource = new EventSource(`${process.env.REACT_APP_API_URL}/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'keep-alive') {
          console.log('Received keep-alive');
          return;
        }
        console.log("Received SSE data:", data);
        updateImageStatus(data);
      } catch (error) {
        console.error('Error parsing SSE data:', error, event.data);
      }
    };
  
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      setTimeout(setupSSE, 5000); // Attempt to reconnect after 5 seconds
    };
  
    return () => {
      eventSource.close();
    };
  }, [updateImageStatus]);

  useEffect(() => {
    fetchImages();
    const cleanup = setupSSE();
    return cleanup;
  }, [setupSSE]);

  useEffect(() => {
    const hasProcessedImages = images.some(img => img.status === 'processed');
    setCsvDownloadEnabled(hasProcessedImages);
  }, [images]);

  const fetchImages = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/images`);
      const data = await response.json();
      setImages(data.map(img => ({ ...img, selected: false })));
    } catch (error) {
      console.error('Error fetching images:', error);
      setSnackbarMessage('Failed to fetch images');
      setSnackbarOpen(true);
    }
  };

  const handleFileUpload = async (event) => {
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
      await fetchImages(); // Fetch updated image list
      setSnackbarMessage(`${result.file_names.length} images uploaded successfully`);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error uploading files:', error);
      setSnackbarMessage('Failed to upload images');
      setSnackbarOpen(true);
    }
  };

  const handleProcessImages = async (type) => {
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
    } catch (error) {
      console.error('Error processing images:', error);
      setSnackbarMessage(error.message || 'An error occurred while processing images');
    }
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleDownloadCsv = async () => {
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
  };

  const handleRegenerateField = async (field, filename) => {
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
      await fetchImages(); // Refresh the image list
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
  };
  

  const handleSelectImage = (filename, isSelected) => {
    setImages(prevImages => prevImages.map(img => 
      img.filename === filename ? { ...img, selected: isSelected } : img
    ));
  };

  const handleSelectAll = (isSelected) => {
    setImages(prevImages => prevImages.map(img => ({ ...img, selected: isSelected })));
  };

  return (
    <div className="landing-page">
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
              processingImages={processingImages}  // Add this line
            />
            </Paper>
            <Box display="flex" gap={2} marginBottom="1rem" width="100%" maxWidth="1400px" justifyContent="space-between">
              <label className="sign-up label-button" style={{cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.8rem'}}>
                Upload Images
                <input type="file" hidden multiple onChange={handleFileUpload} />
              </label>
              <button onClick={() => handleProcessImages("ALL")} 
                disabled={Object.keys(processingImages).length > 0 || images.filter(img => img.selected).length === 0}
                className="sign-up"
                style={{
                  backgroundColor: Object.keys(processingImages).length > 0 ? '#ccc' : '#4a6cf7',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.8rem'
                }}
              >
                Process Images
              </button>
              <button onClick={() => handleProcessImages("TITLE")} 
                disabled={Object.keys(processingImages).length > 0 || images.filter(img => img.selected).length === 0}
                className="sign-up"
                style={{
                  backgroundColor: Object.keys(processingImages).length > 0 ? '#ccc' : '#4a6cf7',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.8rem'
                }}
              >
                Process Titles
              </button>
              <button onClick={() => handleProcessImages("KEYWORDS")} 
                disabled={Object.keys(processingImages).length > 0 || images.filter(img => img.selected).length === 0}
                className="sign-up"
                style={{
                  backgroundColor: Object.keys(processingImages).length > 0 ? '#ccc' : '#4a6cf7',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.8rem'
                }}
              >
                Process Keywords
              </button>
              <button onClick={()=> handleProcessImages("CATEGORY")} 
                disabled={Object.keys(processingImages).length > 0 || images.filter(img => img.selected).length === 0}
                className="sign-up"
                style={{
                  backgroundColor: Object.keys(processingImages).length > 0 ? '#ccc' : '#4a6cf7',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.8rem'
                }}
              >
                Process Categories
              </button>
              <button 
                onClick={handleDownloadCsv} 
                disabled={!csvDownloadEnabled}
                className="sign-up"
                style={{
                  backgroundColor: csvDownloadEnabled ? '#36415d' : '#ccc',
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
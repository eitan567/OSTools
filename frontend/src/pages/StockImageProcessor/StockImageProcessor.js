import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Snackbar, Box, Paper, FormGroup, FormControlLabel, Checkbox} from '@mui/material';
import PhotoSizeSelectSmallIcon from '@mui/icons-material/PhotoSizeSelectSmall';
import {Badge,Input,Checkbox as NCheckbox} from "@nextui-org/react";
import ImageTable from '../ImageTable';
import Header from '../../components/layout/Header';
// import '../LandingPage/LandingPage.css';
import './StockImageProcessor.css';

const StockImageProcessor=({user,setUser})=> {
  const [images, setImages] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [csvDownloadEnabled, setCsvDownloadEnabled] = useState(false);
  const [isAllImagesProcessed, setIsAllImagesProcessed] = useState(false);  
  const [isAllSelectedImagesProcessed, setIsAllSelectedImagesProcessed] = useState(false);
  const [processingImages, setProcessingImages] = useState({});
  const [isConnected, setIsConnected] = useState(true);
  const [isAllImagesUpscaled, setIsAllImagesUpscaled] = useState(false);  
  const [componentKey, setComponentKey] = useState(0);
  const retryCount = useRef(0);
  const maxRetries = 5;
  const retryInterval = 5000; // 5 seconds
  const [hasUnprocessedRows, setHasUnprocessedRows] = useState(false);
  const [unprocessedRowsCount, setUnprocessedRowsCount] = useState(false);
  const [partiallyProcessedCount, setPartiallyProcessedCount] = useState(false);
  const [hasPartiallyProcessedRows, setHasPartiallyProcessedRows] = useState(false);
  const [isCheckingData, setIsCheckingData] = useState(false);

  useEffect(() => {
    const unprocessedRowsCount = images.filter(img => img.status === 'not processed');
    // const unUpscaled = images.some(img => img.upscale_status === 'not upscaled');
    const partiallyProcessedCount = images.filter(img => img.status === 'partially processed');
    setIsAllImagesUpscaled(false)
    setUnprocessedRowsCount(unprocessedRowsCount)
    setPartiallyProcessedCount(partiallyProcessedCount)
    setHasUnprocessedRows(unprocessedRowsCount.length>0);
    setHasPartiallyProcessedRows(partiallyProcessedCount.length>0);
  }, [images]);



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
    
    if (data.status !== 'processing') {
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
      console.log("allProcessed:", allProcessed);
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
        console.log("eventSource.onmessage");
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

      const allSelectedProcessed = images.filter(img => img.selected).length > 0 && images.filter(img => img.selected).every(img => img.status === 'processed');
      setIsAllSelectedImagesProcessed(allSelectedProcessed);
      console.log("handleProcessImage - allSelectedProcessed:", allSelectedProcessed);
    }
  }, [images,fetchImages]);

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

  const handleDataCheckWithAI = useCallback(async () => {
    setIsCheckingData(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/check-data-with-ai`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to check data with AI');
      const result = await response.json();
      setSnackbarMessage(result.message);
      setSnackbarOpen(true);
      await fetchImages(); // Refresh images to get updated check status
    } catch (error) {
      console.error('Error checking data with AI:', error);
      setSnackbarMessage('Failed to check data with AI');
      setSnackbarOpen(true);
    } finally {
      setIsCheckingData(false);
    }
  }, [fetchImages]);
  
  const handleUpscalingImages = useCallback(async (upscale_factor,no_validation) => {
    try {
      console.log("upscale_factor",upscale_factor)
      console.log("no_validation",no_validation)
      const response = await fetch(`${process.env.REACT_APP_API_URL}/upscale-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({upscale_factor: upscale_factor,no_validation:no_validation}),
      });

      const result = await response.json();

      if(result.message.includes('skipped upscaling')){
        console.error(`result: ${result.message}`);
        setSnackbarMessage(result.message);
        setSnackbarOpen(true);
      }
      else
      {
        console.error(`result: ${result.error}`);
        setSnackbarMessage(`${result.message} images uploaded successfully`);
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error Upscaling:', error);
      setSnackbarMessage('Failed to Upscaling Images');
      setSnackbarOpen(true);
    }
  }, []);

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
      console.log("handleUpdateMetaDataImages- result: ", result)
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
        newProcessingImages[filename] = type;
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

    const allSelectedProcessed = images.filter(img => img.selected).length > 0 && images.filter(img => img.selected).every(img => img.status === 'processed');
    setIsAllSelectedImagesProcessed(allSelectedProcessed);
    console.log("handleProcessImages - allSelectedProcessed:", allSelectedProcessed);

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
    console.log("handleRegenerateField start");
    setProcessingImages(prev => ({ ...prev, [filename]: field.toUpperCase() }));
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/regenerate/${field}/${filename}`, {
        method: 'POST',
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("handleRegenerateField got result");
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
      
      const allSelectedProcessed = newImages.filter(img => img.selected).length > 0 && newImages.filter(img => img.selected).every(img => img.status === 'processed');
      setIsAllSelectedImagesProcessed(allSelectedProcessed);
      console.log("handleSelectImage - allSelectedProcessed:", allSelectedProcessed);

      return newImages;
    });
  }, []);

  const handleSelectAll = useCallback((isSelected) => {
    setImages(prevImages => {
      const newImages = prevImages.map(img => ({ ...img, selected: isSelected }));
      const allSelectedProcessed = newImages.filter(img => img.selected).length > 0 && newImages.filter(img => img.selected).every(img => img.status === 'processed');            
      setIsAllSelectedImagesProcessed(allSelectedProcessed);
      console.log("handleSelectAll - allSelectedProcessed:", allSelectedProcessed);      
      return newImages;
    });
  }, []);

  const handleSelectUnProcessedRows = useCallback((event) => {
    const isChecked = event.target.checked;
    setImages(currentImages => {
      const updatedImages = currentImages.map(img => ({
        ...img,
        selected: img.status === 'not processed' ? isChecked : img.selected
      }));

      const selectedImages = updatedImages.filter(img => img.selected);
      const allSelectedProcessed = selectedImages.length > 0 && selectedImages.every(img => img.status === 'processed');
      setIsAllSelectedImagesProcessed(allSelectedProcessed);

      return updatedImages;
    });
  }, []);

  const handleSelectPartialProcessedRows = useCallback((event) => {
    const isChecked = event.target.checked;
    setImages(currentImages => {
      const updatedImages = currentImages.map(img => ({
        ...img,
        selected: img.status === 'partially processed' ? isChecked : img.selected
      }));

      const selectedImages = updatedImages.filter(img => img.selected);
      const allSelectedProcessed = selectedImages.length > 0 && selectedImages.every(img => img.status === 'processed');
      setIsAllSelectedImagesProcessed(allSelectedProcessed);

      return updatedImages;
    });
  }, []);

  const handleUpdateImage = useCallback(async (imageId, field, value) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/update-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageId, field, value }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setImages(prevImages => 
        prevImages.map(img => 
          img.id === imageId ? { ...img, [field]: value } : img
        )
      );

      setSnackbarMessage(`Successfully updated ${field} for image`);
      setSnackbarOpen(true);

      // Refresh images to ensure all data is up to date
      await fetchImages();
    } catch (error) {
      console.error('Error updating image:', error);
      setSnackbarMessage(`Failed to update ${field} for image`);
      setSnackbarOpen(true);
    }
  }, [fetchImages]);
  const checkboxRef = useRef(null);
  const inputRef = useRef(null);
  return (
    <div key={componentKey} className="landing-page">
      <Header user={user} setUser={setUser}/>
      <main className='processor-main-content'>
        <section className="processorTitle">
          <h1>Stock Image Processor</h1>
          <p>Process and manage your stock images with AI-powered tools.</p>
        </section>
  
        <section className="processorTable" style={{ backgroundColor: '#fff' }}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Box display="flex" justifyContent="space-between" width="100%" maxWidth="1400px" marginBottom="0rem" alignItems="center">
              <FormGroup row style={{height:'38px',flex: "16"}} width="100%">
                <Badge content={unprocessedRowsCount.length} color="primary" size="sm" placement="top-left" style={{fontSize:"12px",left:"0px",top:"8px"}}>
                  <FormControlLabel 
                    control={<Checkbox 
                      onChange={handleSelectUnProcessedRows} 
                      disabled={!hasUnprocessedRows} size='small'
                    />} 
                    label="Select all Unprocessed rows" 
                    className='chkLabelCls'

                  />
                </Badge>
                <Badge content={partiallyProcessedCount.length} color="primary" size="sm" placement="top-left" style={{fontSize:"12px",left:"0px",top:"8px"}}>
                  <FormControlLabel 
                    control={<Checkbox 
                      onChange={handleSelectPartialProcessedRows} 
                      disabled={!hasPartiallyProcessedRows} size='small'
                    />} 
                    label="Select all Partial Processed rows" 
                    className='chkLabelCls'
                  />
                </Badge>                
              </FormGroup>              
              <button 
                onClick={handleDataCheckWithAI} 
                disabled={!isConnected || !isAllImagesProcessed}
                className="sign-up"
                style={{
                  backgroundColor: (!isConnected || !isAllImagesProcessed) ? '#ccc' : '#36415d',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.8rem',
                  flex:'3'
                }}
              >
                {isCheckingData ? 'Checking...' : 'Check Data With AI'}
              </button>      
              <NCheckbox defaultSelected size="sm" className="w-full mr-5" style={{flex:'3',marginRight:"5px"}} ref={checkboxRef} >Force Upscale</NCheckbox>  
              <Input
                className="w-28 flex-6 w-xs"
                color="default"
                variant="bordered"
                type="text"
                placeholder="UpScale By..."
                labelPlacement="outside"
                style={{flex:'6',width:"100px"}}
                width="50px"
                size="sm"
                ref={inputRef}
                startContent={
                  <PhotoSizeSelectSmallIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                }
              />
              <button onClick={()=>handleUpscalingImages(inputRef.current.value,checkboxRef.current.checked)} 
                disabled={!isConnected || isAllImagesUpscaled}
                className="sign-up"
                style={{
                  backgroundColor: (!isConnected || isAllImagesUpscaled) ? '#ccc' : '#36415d',
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.8rem',
                  flex:'2'
                }}
              >
                Upscale All
              </button>
            </Box>
            <Paper style={{ width: '100%', maxWidth: '1400px', overflow: 'auto', border: '1px solid #e6e5e5',marginBottom:'10px' }}>
              <ImageTable 
              images={images}
              onRegenerateField={handleRegenerateField}
              onSelectImage={handleSelectImage}
              onSelectAll={handleSelectAll}
              onProcessImage={handleProcessImage}
              processingImages={processingImages}
              onUpdateImage={handleUpdateImage}
            />
            </Paper>
            <Box display="flex" gap={2} marginBottom="1rem" width="100%" maxWidth="1400px" justifyContent="space-between">
              <label className="sign-up label-button" style={{cursor: 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.8rem',marginLeft:'0'}}>
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
                  fontSize: '0.8rem',
                  marginRight:'0'
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
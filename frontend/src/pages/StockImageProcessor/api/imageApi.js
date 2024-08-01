const API_URL = process.env.REACT_APP_API_URL;

export const fetchImages = async () => {
  const response = await fetch(`${API_URL}/images`);
  if (!response.ok) {
    throw new Error('Failed to fetch images');
  }
  return await response.json();
};

export const processImage = async (filename) => {
  const response = await fetch(`${API_URL}/process/${filename}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to process image');
  }
  return await response.json();
};

export const processImages = async (fileNames, type) => {
  const response = await fetch(`${API_URL}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file_names: fileNames, type: type }),
  });
  if (!response.ok) {
    throw new Error('Failed to process images');
  }
  return await response.json();
};

export const upscaleImages = async (upscaleFactor, noValidation) => {
  const response = await fetch(`${API_URL}/upscale-all`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ upscale_factor: upscaleFactor, no_validation: noValidation }),
  });
  if (!response.ok) {
    throw new Error('Failed to upscale images');
  }
  return await response.json();
};

export const updateMetadata = async (fileNames) => {
  const response = await fetch(`${API_URL}/update-metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file_names: fileNames, type: "ALL" }),
  });
  if (!response.ok) {
    throw new Error('Failed to update metadata');
  }
  return await response.json();
};

export const uploadToAdobe = async () => {
  const response = await fetch(`${API_URL}/upload-to-adobe`, {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error('Failed to upload to Adobe');
  }
  return await response.json();
};

export const downloadCsv = async () => {
  const response = await fetch(`${API_URL}/download-csv`);
  if (!response.ok) {
    throw new Error('Failed to download CSV');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'output_data.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const regenerateField = async (field, filename) => {
  const response = await fetch(`${API_URL}/regenerate/${field}/${filename}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to regenerate ${field}`);
  }
  return await response.json();
};

export const updateImage = async (imageId, field, value) => {
  const response = await fetch(`${API_URL}/update-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageId, field, value }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update ${field} for image`);
  }
  return await response.json();
};

export const checkDataWithAI = async () => {
    const response = await fetch(`${API_URL}/check-data-with-ai`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to check data with AI');
    }
    return await response.json();
  };
  
  export const setupSSE = (setIsConnected, setImages, setCsvDownloadEnabled, setIsAllImagesProcessed, retryCount, fetchImages, setComponentKey) => {
    const eventSource = new EventSource(`${API_URL}/stream`);
    
    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
      retryCount.current = 0;
      fetchImages();
      setComponentKey(prev => prev + 1);
    };
  
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'keep-alive') return;
        updateImageStatus(data, setImages);
      } catch (error) {
        console.error('Error parsing SSE data:', error, event.data);
      }
    };
  
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      setIsConnected(false);
  
      if (retryCount.current < 5) {
        retryCount.current += 1;
        console.log(`Attempting to reconnect in 5 seconds (Attempt ${retryCount.current}/5)`);
        setTimeout(() => setupSSE(setIsConnected, setImages, setCsvDownloadEnabled, setIsAllImagesProcessed, retryCount, fetchImages, setComponentKey), 5000);
      } else {
        console.log('Max retry attempts reached. Please refresh the page manually.');
      }
    };
  
    return () => eventSource.close();
  };
  
  const updateImageStatus = (data, setImages) => {
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
  };
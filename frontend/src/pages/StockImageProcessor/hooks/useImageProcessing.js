import { useCallback } from 'react';
import { processImage, processImages, upscaleImages, updateMetadata, uploadToAdobe, downloadCsv, regenerateField, updateImage, checkDataWithAI } from '../api/imageApi';

function useImageProcessing(images, setImages, setProcessingImages, showSnackbar, fetchImages) {
  const handleProcessImage = useCallback(async (filename) => {
    setProcessingImages(prev => ({ ...prev, [filename]: 'ALL' }));
    try {
      await processImage(filename);
      await fetchImages();
    } catch (error) {
      console.error('Error processing image:', error);
      showSnackbar('Failed to process image');
    } finally {
      setProcessingImages(prev => {
        const newProcessingImages = { ...prev };
        delete newProcessingImages[filename];
        return newProcessingImages;
      });
    }
  }, [fetchImages, setProcessingImages, showSnackbar]);

  const handleProcessImages = useCallback(async (type) => {
    const filesToProcess = images.filter(img => img.selected).map(img => img.filename);
    if (filesToProcess.length === 0) {
      showSnackbar('No images selected for processing');
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
      const result = await processImages(filesToProcess, type);
      showSnackbar(result.message);
      await fetchImages();
    } catch (error) {
      console.error('Error processing images:', error);
      showSnackbar(error.message || 'An error occurred while processing images');
    } finally {
      setProcessingImages({});
    }
  }, [images, fetchImages, setProcessingImages, showSnackbar]);

  const handleUpscalingImages = useCallback(async (upscaleFactor, noValidation) => {
    try {
      const result = await upscaleImages(upscaleFactor, noValidation);
      showSnackbar(result.message);
      await fetchImages();
    } catch (error) {
      console.error('Error Upscaling:', error);
      showSnackbar('Failed to Upscale Images');
    }
  }, [fetchImages, showSnackbar]);

  const handleUpdateMetaDataImages = useCallback(async () => {
    const filesToProcess = images.filter(img => img.selected).map(img => img.filename);
    if (filesToProcess.length === 0) {
      showSnackbar('No images selected for processing');
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
      const result = await updateMetadata(filesToProcess);
      showSnackbar(result.message);
      await fetchImages();
    } catch (error) {
      console.error('Error updating metadata:', error);
      showSnackbar(error.message || 'An error occurred while updating metadata');
    } finally {
      setProcessingImages({});
    }
  }, [images, fetchImages, setProcessingImages, showSnackbar]);

  const handleUploadToAdobe = useCallback(async () => {
    try {
      await uploadToAdobe();
      showSnackbar('Uploading successfully to Adobe');
      await fetchImages();
    } catch (error) {
      console.error('Error Uploading to Adobe:', error);
      showSnackbar('Failed to Upload to Adobe');
    }
  }, [fetchImages, showSnackbar]);

  const handleDownloadCsv = useCallback(async () => {
    try {
      await downloadCsv();
    } catch (error) {
      console.error('Error downloading CSV:', error);
      showSnackbar('Failed to download CSV');
    }
  }, [showSnackbar]);

  const handleRegenerateField = useCallback(async (field, filename) => {
    setProcessingImages(prev => ({ ...prev, [filename]: field.toUpperCase() }));
    try {
      const result = await regenerateField(field, filename);
      showSnackbar(result.message);
      await fetchImages();
    } catch (error) {
      console.error(`Error regenerating ${field}:`, error);
      showSnackbar(`Failed to regenerate ${field}`);
    } finally {
      setProcessingImages(prev => {
        const newProcessingImages = { ...prev };
        delete newProcessingImages[filename];
        return newProcessingImages;
      });
    }
  }, [fetchImages, setProcessingImages, showSnackbar]);

  const handleUpdateImage = useCallback(async (imageId, field, value) => {
    try {
      await updateImage(imageId, field, value);
      setImages(prevImages => 
        prevImages.map(img => 
          img.id === imageId ? { ...img, [field]: value } : img
        )
      );
      showSnackbar(`Successfully updated ${field} for image`);
      await fetchImages();
    } catch (error) {
      console.error('Error updating image:', error);
      showSnackbar(`Failed to update ${field} for image`);
    }
  }, [fetchImages, setImages, showSnackbar]);

  const handleDataCheckWithAI = useCallback(async () => {
    try {
      const result = await checkDataWithAI();
      showSnackbar(result.message);
      await fetchImages();
    } catch (error) {
      console.error('Error checking data with AI:', error);
      showSnackbar('Failed to check data with AI');
    }
  }, [fetchImages, showSnackbar]);

  return {
    handleProcessImage,
    handleProcessImages,
    handleUpscalingImages,
    handleUpdateMetaDataImages,
    handleUploadToAdobe,
    handleDownloadCsv,
    handleRegenerateField,
    handleUpdateImage,
    handleDataCheckWithAI
  };
}

export default useImageProcessing;
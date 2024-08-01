import { useState, useCallback } from 'react';

function useSnackbar() {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSnackbarClose = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  }, []);

  const showSnackbar = useCallback((message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  }, []);

  return {
    snackbarOpen,
    snackbarMessage,
    handleSnackbarClose,
    showSnackbar
  };
}

export default useSnackbar;
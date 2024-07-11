import React from 'react';
import { Button } from '@mui/material';

function ProcessButton({ onClick, disabled }) {
  return (
    <Button 
      variant="contained" 
      color="primary" 
      onClick={onClick} 
      disabled={disabled}
      style={{ marginLeft: '10px' }}
    >
      Process Images
    </Button>
  );
}

export default ProcessButton;
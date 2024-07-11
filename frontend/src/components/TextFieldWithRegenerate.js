import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const TextFieldWithRegenerate = ({ value, onRegenerate, tooltipTitle }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      minHeight: '20px',  // Ensures a minimum height for consistency
      padding: '0px 0',   // Adds some vertical padding
    }}>
      <Tooltip title={tooltipTitle || value} arrow>
        <span style={{
          marginRight: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,        // Allows the text to take up available space
          minWidth: 0,    // Allows text to shrink below its content size
        }}>
          {value}
        </span>
      </Tooltip>
      <Tooltip title="Regenerate" arrow>
        <IconButton onClick={onRegenerate} size="small" style={{ flexShrink: 0 }}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );
};

export default TextFieldWithRegenerate;
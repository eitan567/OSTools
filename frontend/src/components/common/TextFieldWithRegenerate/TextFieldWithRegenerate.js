import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import './TextFieldWithRegenerate.css'

const TextFieldWithRegenerate = React.memo(({ value, onRegenerate, tooltipTitle, onEdit }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      minHeight: '20px',
      padding: '0px 0',
    }}>
      <Tooltip title={tooltipTitle || value} arrow>
        <span style={{
          marginRight: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
        }}>
          {value}
        </span>
      </Tooltip>
      <Tooltip title="Edit" arrow>
        <IconButton onClick={onEdit} size="small" style={{ flexShrink: 0 }}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Regenerate" arrow>
        <IconButton onClick={onRegenerate} size="small" style={{ flexShrink: 0 }}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Tooltip>      
    </div>
  );
});

export default TextFieldWithRegenerate;

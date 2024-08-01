import React, { useRef } from 'react';
import { FormGroup, FormControlLabel, Checkbox,Box } from '@mui/material';
import { Badge, Input, Checkbox as NCheckbox } from "@nextui-org/react";
import PhotoSizeSelectSmallIcon from '@mui/icons-material/PhotoSizeSelectSmall';

function ControlPanel({
  unprocessedRowsCount,
  partiallyProcessedCount,
  hasUnprocessedRows,
  hasPartiallyProcessedRows,
  handleSelectUnProcessedRows,
  handleSelectPartialProcessedRows,
  handleDataCheckWithAI,
  isConnected,
  isAllImagesProcessed,
  isCheckingData,
  handleUpscalingImages,
  isAllImagesUpscaled
}) {
  const checkboxRef = useRef(null);
  const inputRef = useRef(null);

  return (
    <Box display="flex" justifyContent="space-between" width="100%" maxWidth="1400px" marginBottom="0rem" alignItems="center">
      <FormGroup row style={{height:'38px',flex: "16"}} width="100%">
        <Badge content={unprocessedRowsCount} color="primary" size="sm" placement="top-left" style={{fontSize:"12px",left:"0px",top:"8px"}}>
          <FormControlLabel 
            control={<Checkbox 
              onChange={(e) => handleSelectUnProcessedRows(e.target.checked)} 
              disabled={!hasUnprocessedRows} 
              size='small'
            />} 
            label="Select all Unprocessed rows" 
            className='chkLabelCls'
          />
        </Badge>
        <Badge content={partiallyProcessedCount} color="primary" size="sm" placement="top-left" style={{fontSize:"12px",left:"0px",top:"8px"}}>
          <FormControlLabel 
            control={<Checkbox 
              onChange={(e) => handleSelectPartialProcessedRows(e.target.checked)} 
              disabled={!hasPartiallyProcessedRows} 
              size='small'
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
      <NCheckbox defaultSelected size="sm" className="w-full mr-5" style={{flex:'3',marginRight:"5px"}} ref={checkboxRef}>Force Upscale</NCheckbox>  
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
      <button 
        onClick={() => handleUpscalingImages(inputRef.current.value, checkboxRef.current.checked)} 
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
  );
}

export default ControlPanel;
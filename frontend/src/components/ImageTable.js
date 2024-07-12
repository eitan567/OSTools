import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Checkbox, Tooltip, TableSortLabel, Button, CircularProgress, Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HelpIcon from '@mui/icons-material/Help';
import TextFieldWithRegenerate from './TextFieldWithRegenerate';

const getCategoryName = (categoryNumber) => {
  const categories = {
    1: "People", 2: "Nature", 3: "Animals", 4: "Food & Drink", 5: "Architecture",
    6: "Travel", 7: "Technology", 8: "Business", 9: "Sports", 10: "Health & Wellness",
    11: "Education", 12: "Fashion", 13: "Art & Design", 14: "Music", 15: "Lifestyle",
    16: "Transportation", 17: "Science", 18: "Industry", 19: "Holidays & Celebrations",
    20: "Abstract", 21: "Other"
  };
  return categories[categoryNumber] || "Unknown";
};

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'processed':
      return <Tooltip title="Processed"><CheckCircleIcon color="success" style={{ fontSize: '1rem' }} /></Tooltip>;
    case 'error':
      return <Tooltip title="Error"><ErrorIcon color="error" style={{ fontSize: '1rem' }} /></Tooltip>;
    case 'processing':
      return <Tooltip title="Processing"><HourglassEmptyIcon color="action" style={{ fontSize: '1rem' }} /></Tooltip>;
    case 'not processed':
      return <Tooltip title="Not Processed"><HelpIcon color="disabled" style={{ fontSize: '1rem' }} /></Tooltip>;
    default:
      return <Tooltip title={status}><HelpIcon color="disabled" style={{ fontSize: '1rem' }} /></Tooltip>;
  }
};

const ImageTable = ({ images, onRegenerateField, onSelectImage, onSelectAll, onProcessImage, processingImages }) => {  
  const [selectAll, setSelectAll] = useState(false);
  const [orderBy, setOrderBy] = useState(null);
  const [order, setOrder] = useState('asc');

  useEffect(() => {
    setSelectAll(images.length > 0 && images.every(img => img.selected));
  }, [images]);

  const handleSelectAllClick = (event) => {
    const newSelectAll = event.target.checked;
    setSelectAll(newSelectAll);
    onSelectAll(newSelectAll);
  };

  const handleRowClick = (event, filename) => {
    const isSelected = event.target.checked;
    onSelectImage(filename, isSelected);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const ThumbnailTooltip = ({ image }) => (
    <div>
      <strong>Title:</strong> {image.title || 'N/A'}<br/>
      <strong>Keywords:</strong> {image.keywords || 'N/A'}<br/>
      <strong>Category:</strong> {getCategoryName(image.category) || 'N/A'}<br/>
      <strong>Status:</strong> {image.status}
    </div>
  );

  const sortedImages = useMemo(() => {
    if (!orderBy) return images;
    return [...images].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (orderBy === 'category') {
        aValue = getCategoryName(a.category);
        bValue = getCategoryName(b.category);
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [images, orderBy, order]);
  
  const tableStyles = {
    container: {
      maxHeight: 'calc(100vh - 300px)',
      overflow: 'auto',
    },
    table: {
      tableLayout: 'fixed',
      width: '100%',
    },
    headerCell: {
      backgroundColor: '#e9eaed',
      position: 'sticky',
      top: 0,
      zIndex: 1,
      padding: '6px 8px',
      fontSize: '0.75rem',
    },
    cell: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: '2px 8px',
      fontSize: '0.75rem',
    },
    summaryRow: {
      position: 'sticky',
      bottom: -1,
      backgroundColor: '#e9eaed',
      fontWeight: 'bold',
    },
  };

  const columnWidths = {
    checkbox: '20px',
    thumbnail: '30px',
    filename: '150px',
    title: '300px',
    keywords: '280px',
    category: '90px',
    status: '30px',
    actions: '60px',
  };

  const totalRows = sortedImages.length;
  const totalProcessedRows = sortedImages.filter(img => img.status === 'processed').length;

  return (
    <TableContainer component={Paper} style={tableStyles.container}>
      <Table stickyHeader style={tableStyles.table} size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" style={{ ...tableStyles.headerCell, width: columnWidths.checkbox }}>
              <Checkbox
                checked={selectAll}
                onChange={handleSelectAllClick}
                inputProps={{ 'aria-label': 'select all images' }}
                size="small"
              />
            </TableCell>
            <TableCell style={{ ...tableStyles.headerCell, width: columnWidths.thumbnail }}>Image</TableCell>
            <TableCell style={{ ...tableStyles.headerCell, width: columnWidths.filename }}>
              <TableSortLabel
                active={orderBy === 'filename'}
                direction={orderBy === 'filename' ? order : 'asc'}
                onClick={() => handleRequestSort('filename')}
              >
                Filename
              </TableSortLabel>
            </TableCell>
            <TableCell style={{ ...tableStyles.headerCell, width: columnWidths.title }}>
              <TableSortLabel
                active={orderBy === 'title'}
                direction={orderBy === 'title' ? order : 'asc'}
                onClick={() => handleRequestSort('title')}
              >
                Title
              </TableSortLabel>
            </TableCell>
            <TableCell style={{ ...tableStyles.headerCell, width: columnWidths.keywords }}>Keywords</TableCell>
            <TableCell style={{ ...tableStyles.headerCell, width: columnWidths.category }}>
              <TableSortLabel
                active={orderBy === 'category'}
                direction={orderBy === 'category' ? order : 'asc'}
                onClick={() => handleRequestSort('category')}
              >
                Category
              </TableSortLabel>
            </TableCell>
            <TableCell style={{ ...tableStyles.headerCell, width: columnWidths.status }}>
              <TableSortLabel
                active={orderBy === 'status'}
                direction={orderBy === 'status' ? order : 'asc'}
                onClick={() => handleRequestSort('status')}
              >
                Status
              </TableSortLabel>
            </TableCell>
            <TableCell style={{ ...tableStyles.headerCell, width: columnWidths.actions }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedImages.map((image) => (
            <TableRow key={image.filename}>
              <TableCell padding="checkbox" style={tableStyles.cell}>
                <Checkbox
                  checked={image.selected}
                  onChange={(event) => handleRowClick(event, image.filename)}
                  size="small"
                />
              </TableCell>
              <TableCell style={tableStyles.cell}>
                <Tooltip title={<ThumbnailTooltip image={image} />} arrow>
                  <img 
                    src={`${process.env.REACT_APP_API_URL}/thumbnail/${image.filename}`} 
                    alt={image.filename} 
                    style={{ width: '30px', height: '30px', objectFit: 'contain' }} 
                  />
                </Tooltip>
              </TableCell>
              <TableCell style={tableStyles.cell}>
                <Tooltip title={image.filename} arrow>
                  <span>{image.filename}</span>
                </Tooltip>
              </TableCell>

              <TableCell style={tableStyles.cell}>
                {processingImages[image.filename] === 'ALL' || processingImages[image.filename] === 'TITLE' ? 'Processing...' : 
                (image.status === 'processed' ? (
                  <TextFieldWithRegenerate
                    value={image.title || ''}
                    onRegenerate={() => onRegenerateField('title', image.filename)}
                    tooltipTitle={image.title || ''}
                    compact={true}
                  />
                ) : image.title || '-')}
              </TableCell>

              <TableCell style={tableStyles.cell}>
                {processingImages[image.filename] === 'ALL' || processingImages[image.filename] === 'KEYWORDS' ? 'Processing...' : 
                (image.status === 'processed' ? (
                  <TextFieldWithRegenerate
                    value={image.keywords || ''}
                    onRegenerate={() => onRegenerateField('keywords', image.filename)}
                    tooltipTitle={image.keywords || ''}
                    compact={true}
                  />
                ) : image.keywords || '-')}
              </TableCell>

              <TableCell style={tableStyles.cell}>
                {processingImages[image.filename] === 'ALL' || processingImages[image.filename] === 'CATEGORY' ? 'Processing...' : 
                (image.status === 'processed' ? (
                  <TextFieldWithRegenerate
                    value={getCategoryName(image.category) || ''}
                    onRegenerate={() => onRegenerateField('category', image.filename)}
                    tooltipTitle={getCategoryName(image.category) || ''}
                    compact={true}
                  />
                ) : getCategoryName(image.category) || '-')}
              </TableCell>
              
              <TableCell style={tableStyles.cell}>
                <StatusIcon status={image.status} />
              </TableCell>
              <TableCell style={tableStyles.cell}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => onProcessImage(image.filename)}
                  disabled={image.status === 'processing'}
                  style={{ padding: '2px 4px', fontSize: '0.7rem' }}
                >
                  {image.status === 'processing' ? <CircularProgress size={16} /> : 'Process'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          <TableRow style={tableStyles.summaryRow}>
            <TableCell colSpan={8} align="right">
              Total Rows: {totalRows} | Processed Rows: {totalProcessedRows}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ImageTable;

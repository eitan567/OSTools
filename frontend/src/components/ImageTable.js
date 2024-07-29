import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Checkbox, Tooltip, TableSortLabel, CircularProgress, Paper,
  Grid, TextField, Select, MenuItem, Autocomplete, Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HelpIcon from '@mui/icons-material/Help';
import TextFieldWithRegenerate from './TextFieldWithRegenerate';
import './Dialog.css';
import './imageTable.css';
import SimpleModal from './Dialog';

const categories = {
  1: "Animals", 2: "Buildings and Architecture", 3: "Business", 4: "Drinks", 5: "The Environment",
  6: "States of Mind", 7: "Food", 8: "Graphic Resources", 9: "Hobbies and Leisure", 10: "Industry",
  11: "Landscapes", 12: "Lifestyle", 13: "People", 14: "Plants and Flowers", 15: "Culture and Religion",
  16: "Science", 17: "Social Issues", 18: "Sports", 19: "Technology", 20: "Transport", 21: "Travel"
};

const getCategoryName = (categoryNumber) => {
  return `${categoryNumber} - ${categories[categoryNumber]}` || "Unknown";
};

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'processed':
      return <Tooltip title="Processed"><CheckCircleIcon color="success" style={{ fontSize: '1rem' }} /></Tooltip>;
    case 'partially processed':
      return <Tooltip title="Partially Processed"><HourglassEmptyIcon color="warning" style={{ fontSize: '1rem' }} /></Tooltip>;
    case 'error':
      return <Tooltip title="Error"><ErrorIcon color="error" style={{ fontSize: '1rem' }} /></Tooltip>;
    case 'processing':
      return <Tooltip title="Processing"><CircularProgress size={16} /></Tooltip>;
    case 'not processed':
    default:
      return <Tooltip title="Not Processed"><HelpIcon color="disabled" style={{ fontSize: '1rem' }} /></Tooltip>;
  }
};

const CategoryContent = React.memo(({ image, onChangeCategory }) => {
  return (
    <Grid container>
      <Grid item xs={12}>
        <TextField fullWidth variant="outlined" value={image.title} disabled margin="none" />
        <Select
          fullWidth
          value={image.category || ""}
          onChange={(e) => onChangeCategory(e.target.value)}
          margin="none"
        >
          {Object.entries(categories).map(([key]) => (
            <MenuItem key={key} value={key}>{getCategoryName(key)}</MenuItem>
          ))}
        </Select>
      </Grid>
    </Grid>
  );
});

const TitleContent = React.memo(({ image, onChangeTitle }) => (
  <Grid container>
    <Grid item xs={12}>
      <TextField
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        value={image.title}
        onChange={(e) => onChangeTitle(e.target.value)}
        margin="none"
      />
    </Grid>
  </Grid>
));

const KeywordsContent = React.memo(({ image, onChangeKeywords }) => {
  const [keywords, setKeywords] = useState(image.keywords.split(', '));

  const handleChange = useCallback((event, newValue) => {
    setKeywords(newValue);
    onChangeKeywords(newValue.join(', '));
  }, [onChangeKeywords]);

  return (
    <Grid container>
      <Grid item xs={12}>
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={keywords}
          onChange={handleChange}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, onDelete, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  variant="outlined"
                  color="primary"
                  size="small"
                  label={option}
                  key={key}
                  onDelete={onDelete}
                  {...tagProps}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Keywords"
              placeholder="Add keywords"
              margin="none"
            />
          )}
        />
      </Grid>
    </Grid>
  );
});

const ImageTable = ({ images, onRegenerateField, onSelectImage, onSelectAll, onProcessImage, processingImages, onUpdateImage }) => {
  const [selectAll, setSelectAll] = useState(false);
  const [orderBy, setOrderBy] = useState(null);
  const [order, setOrder] = useState('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [editType, setEditType] = useState(null);

  useEffect(() => {
    setSelectAll(images.length > 0 && images.every(img => img.selected));
  }, [images]);

  const handleSelectAllClick = useCallback((event) => {
    const newSelectAll = event.target.checked;
    setSelectAll(newSelectAll);
    onSelectAll(newSelectAll);
  }, [onSelectAll]);

  const handleRowClick = useCallback((event, filename) => {
    const isSelected = event.target.checked;
    onSelectImage(filename, isSelected);
  }, [onSelectImage]);

  const handleRequestSort = useCallback((property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }, [orderBy, order]);

  const handleOpenModal = useCallback((image, type) => {
    setCurrentImage(image);
    setEditType(type);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentImage(null);
    setEditType(null);
  }, []);

  const handleSaveChanges = useCallback(() => {
    if (currentImage && editType) {
      onUpdateImage(currentImage.id, editType, currentImage[editType]);
    }
    handleCloseModal();
  }, [currentImage, editType, onUpdateImage, handleCloseModal]);

  const renderModalContent = useCallback(() => {
    if (!currentImage || !editType) return null;

    switch (editType) {
      case 'category':
        return (
          <CategoryContent
            image={currentImage}
            onChangeCategory={(value) => setCurrentImage({ ...currentImage, category: value })}
          />
        );
      case 'title':
        return (
          <TitleContent
            image={currentImage}
            onChangeTitle={(value) => setCurrentImage({ ...currentImage, title: value })}
          />
        );
      case 'keywords':
        return (
          <KeywordsContent
            image={currentImage}
            onChangeKeywords={(value) => setCurrentImage({ ...currentImage, keywords: value })}
          />
        );
      default:
        return null;
    }
  }, [currentImage, editType]);

  const ThumbnailTooltip = ({ image }) => (
    <div>
      <strong>Title:</strong> {image.title || 'N/A'}<br />
      <strong>Original Title:</strong> {image.original_title || 'N/A'}<br />
      <strong>Keywords:</strong> {image.keywords || 'N/A'}<br />
      <strong>Category:</strong> {getCategoryName(image.category) || 'N/A'}<br />
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
      width: '100%'
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
      padding: '0px 8px',
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
    filename: '140px',
    title: '280px',
    keywords: '260px',
    category: '140px',
    status: '45px',
    actions: '55px',
  };

  const totalRows = sortedImages.length;
  const totalProcessedRows = sortedImages.filter(img => img.status === 'processed').length;

  return (
    <>
      <TableContainer component={Paper} style={tableStyles.container}>
        <Table stickyHeader style={tableStyles.table} sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
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
                        onEdit={() => handleOpenModal(image, 'title')}
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
                        onEdit={() => handleOpenModal(image, 'keywords')}
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
                        onEdit={() => handleOpenModal(image, 'category')}
                      />
                    ) : getCategoryName(image.category) || '-')}
                </TableCell>
                <TableCell style={{ ...tableStyles.cell, textAlign: 'center' }}>
                  <StatusIcon status={image.status} />
                </TableCell>
                <TableCell style={tableStyles.cell}>
                  <button
                    onClick={() => onProcessImage(image.filename)}
                    disabled={image.status === 'processing'}
                    style={{
                      padding: '0px 0px',
                      fontSize: '0.6rem',
                      margin: '0',
                      minWidth: '48px',
                      height: '18px',
                      borderRadius: '5px'
                    }}
                  >
                    {image.status === 'processing' ? <CircularProgress size={16} /> : 'Process'}
                  </button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow style={tableStyles.summaryRow}>
              <TableCell colSpan={8} align="right" style={{ fontSize: '0.75rem' }}>
                Total Rows: {totalRows} | Processed Rows: {totalProcessedRows}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>      
      <SimpleModal 
        modalTitle={`Edit ${editType}`}
        modalContent={renderModalContent()}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveChanges}
      />
    </>
  );
};

export default ImageTable;

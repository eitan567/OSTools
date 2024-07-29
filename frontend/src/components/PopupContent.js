import React, { useState } from 'react';
import { Grid, TextField, Select, MenuItem, Autocomplete, Chip } from '@mui/material';

export const CategoryContent = ({ image, categories, onChangeCategory }) => (
  <Grid container spacing={2}>
    <Grid item xs={6}>
      <img src={image.url} alt={image.title} style={{ maxWidth: '100%' }} />
    </Grid>
    <Grid item xs={6}>
      <TextField
        fullWidth
        variant="outlined"
        value={image.title}
        disabled
        margin="normal"
      />
      <Select
        fullWidth
        value={image.category}
        onChange={(e) => onChangeCategory(e.target.value)}
        margin="normal"
      >
        {categories.map((category) => (
          <MenuItem key={category} value={category}>{category}</MenuItem>
        ))}
      </Select>
    </Grid>
  </Grid>
);

export const TitleContent = ({ image, onChangeTitle }) => (
  <Grid container spacing={2}>
    <Grid item xs={6}>
      <img src={image.url} alt={image.title} style={{ maxWidth: '100%' }} />
    </Grid>
    <Grid item xs={6}>
      <TextField
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        value={image.title}
        onChange={(e) => onChangeTitle(e.target.value)}
        margin="normal"
      />
    </Grid>
  </Grid>
);

export const KeywordsContent = ({ image, onChangeKeywords }) => {
  const [keywords, setKeywords] = useState(image.keywords);

  const handleChange = (event, newValue) => {
    setKeywords(newValue);
    onChangeKeywords(newValue);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <img src={image.url} alt={image.title} style={{ maxWidth: '100%' }} />
      </Grid>
      <Grid item xs={6}>
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={keywords}
          onChange={handleChange}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                color="primary"
                size="small"
                label={option}
                {...getTagProps({ index })}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Keywords"
              placeholder="Add keywords"
            />
          )}
        />
      </Grid>
    </Grid>
  );
};
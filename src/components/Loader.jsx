// src/components/Loader.jsx
import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function Loader() {
  return (
    <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'50vh' }}>
      <CircularProgress size={48} />
    </Box>
  );
}
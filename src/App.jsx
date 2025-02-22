import { useState } from 'react'
import './App.css'
import { createTheme, ThemeProvider } from '@mui/material';
import Map from './Components/Map';

function App() {

  const theme = createTheme({
    typography: {
     "fontFamily": `"Roboto", "Arial" ,"Helvetica", sans-serif`,
     "fontSize": 13,
     "fontWeightLight": 300,
     "fontWeightRegular": 400,
     "fontWeightMedium": 500
    }
 });

  return <ThemeProvider theme={theme}>
    <Map />
  </ThemeProvider>
}

export default App

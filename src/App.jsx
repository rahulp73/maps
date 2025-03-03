import './App.css'
import { createTheme, ThemeProvider } from '@mui/material';
import Map from './Components/Map';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Map />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
}

export default App

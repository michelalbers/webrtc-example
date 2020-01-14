import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import ConferenceHub from './components/ConferenceHub';

const theme = createMuiTheme({ palette: { type: 'dark' } });

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ConferenceHub />
    </ThemeProvider>
  );
}

export default App;

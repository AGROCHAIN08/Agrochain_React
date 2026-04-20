import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Provider } from 'react-redux'; // 👈 ADD THIS
import store from './redux/store'; // 👈 ADD THIS
import './index.css';

const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "262898642473-niisbi298nfo33a175rju6acmpkatrs4.apps.googleusercontent.com";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}> {/* 👈 WRAP WITH THIS */}
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </Provider> {/* 👈 CLOSE TAG */}
  </React.StrictMode>
);

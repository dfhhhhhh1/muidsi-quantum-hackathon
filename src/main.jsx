import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

/**
 * Deliberately NOT wrapped in <React.StrictMode>.
 *
 * StrictMode's dev-only double-mount runs effect cleanups between the two
 * passes while preserving useMemo results. The 3D stages allocate GPU
 * resources in useMemo and dispose them in effect cleanup, so under StrictMode
 * every procedural texture would be disposed and never recreated, giving a black
 * Earth and untextured hardware in dev only, which is a miserable thing to
 * debug. This is standard practice for React Three Fiber scenes that own
 * imperative GPU resources.
 */
ReactDOM.createRoot(document.getElementById('root')).render(<App />);

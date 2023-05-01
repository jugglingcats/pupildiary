import React from 'react';
import './index.css';
import App from './App';
import 'semantic-ui-css/semantic.min.css';
import {createRoot} from "react-dom/client";

const root = createRoot(document.getElementById("root")!)
root.render(<App />)


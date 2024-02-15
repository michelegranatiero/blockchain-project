import ReactDOM from "react-dom/client";
import "./index.css";
import "./style.css";

import App from "./App";

// MetaMask
import { MetaMaskContextProvider } from './hooks/useMetaMask';

ReactDOM.createRoot(document.getElementById("root")).render(
  <MetaMaskContextProvider>
    <App />
  </MetaMaskContextProvider>
);

import ReactDOM from "react-dom/client";
import "./index.css";
import "./style.css";

import App from "./App";

// MetaMask
import { MetaMaskContextProvider } from "@/hooks/useMetaMask";
import { Web3ContextProvider } from "@/hooks/useWeb3";

ReactDOM.createRoot(document.getElementById("root")).render(
  <MetaMaskContextProvider>
    <Web3ContextProvider>
      <App />
    </Web3ContextProvider>
  </MetaMaskContextProvider>,
);

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

import detectEthereumProvider from '@metamask/detect-provider';
import { formatBalance, formatChainAsNum } from '@/utils/formatWeb3';
import { Web3 } from 'web3';

const disconnectedState = { accounts: [], balance: '', chainId: '' };

const MetaMaskContext = createContext({});

export const MetaMaskContextProvider = ({ children }) => {
  const [hasProvider, setHasProvider] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const clearError = () => setErrorMessage('');

  const [wallet, setWallet] = useState(disconnectedState);

  const [web3, setWeb3] = useState(null); // State to hold web3 provider instance

  const _updateWallet = useCallback(async (providedAccounts, providedWeb3) => {

    const accounts = providedAccounts || (await providedWeb3.eth.getAccounts());    

    if (accounts.length === 0) {
      setWallet(disconnectedState);
      return;
    }

    const balance = formatBalance(await providedWeb3.eth.getBalance(accounts[0]));

    const chainId = formatChainAsNum(await providedWeb3.eth.getChainId());
    

    setWallet({ accounts, balance, chainId });
  }, []);

  const updateWalletAndAccounts = useCallback(
    (prov) => _updateWallet(null, prov),
    [_updateWallet]
  );
  const updateWallet = useCallback(
      (accounts, prov) => _updateWallet(accounts, prov),
      [_updateWallet]
  );

  useEffect(() => {
    const getProvider = async () => {
      const provider = await detectEthereumProvider({ silent: true });
      setHasProvider(Boolean(provider));
      
      if (provider) {
        const web3Instance = new Web3(provider);
        setWeb3(web3Instance);
        updateWalletAndAccounts(web3Instance);
        provider.on('accountsChanged', () => updateWallet(null, web3Instance));
        provider.on('chainChanged', () => updateWalletAndAccounts(web3Instance));
      }
    };

    getProvider(); //initialize web3

    return () => {
      if (web3) {
        web3.currentProvider.removeAllListeners('accountsChanged');
        web3.currentProvider.removeAllListeners('chainChanged');
      }
    };
  }, [updateWallet, updateWalletAndAccounts]);

  const connectMetaMask = async () => {
    if (!hasProvider) {
      console.log("no provider");
      
      alert("Please install MetaMask!");
      return;
    }
    /* if (!web3.currentProvider.connected){
      console.log("no connection to chain");
      
      alert("Your provider is not connected to the current chain");
      return;
    }     */

    setIsConnecting(true);

    try {
      const accounts = await web3.eth.requestAccounts();
      clearError();
      updateWallet(accounts, web3);
    } catch (err) {
      console.log(err.message);
      setErrorMessage(err.message);
      alert(`Error connecting MetaMask: ${err.message}`);
    }    

    setIsConnecting(false);
  };


  const disconnectMetaMask = async () => {
    try {
      await web3.eth.accounts.wallet.clear();
      clearError();
      updateWallet([], web3);
    } catch (err) {
      console.log(err.message);
      setErrorMessage(err.message);
      alert(`Error disconnecting MetaMask: ${err.message}`);
    }
  };

  return (
    <MetaMaskContext.Provider
      value={{
        web3,
        wallet,
        hasProvider,
        error: !!errorMessage,
        errorMessage,
        isConnecting,
        connectMetaMask,
        disconnectMetaMask,
        clearError,
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  );
};

export const useMetaMask = () => {
  const context = useContext(MetaMaskContext);
  if (context === undefined) {
    throw new Error('useMetaMask must be used within a "MetaMaskContextProvider"');
  }
  return context;
};

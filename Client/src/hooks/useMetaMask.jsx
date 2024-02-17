import { useState, useEffect, createContext, useContext, useCallback } from 'react';

import detectEthereumProvider from '@metamask/detect-provider';
import { formatBalance } from '../utils';
import { Web3 } from 'web3';

const disconnectedState = { accounts: [], balance: '', chainId: '' };

const MetaMaskContext = createContext({});

export const MetaMaskContextProvider = ({ children }) => {
  const [hasProvider, setHasProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const clearError = () => setErrorMessage('');

  const [wallet, setWallet] = useState(disconnectedState);

  const [web3, setWeb3] = useState(null); // State to hold web3 instance

  const updateWallet = useCallback(async (providedAccounts, providedWeb3) => {

    const accounts = providedAccounts || (await providedWeb3.eth.getAccounts());

    if (accounts.length === 0) {
      setWallet(disconnectedState);
      return;
    }

    const balance = formatBalance(await providedWeb3.eth.getBalance(accounts[0]));

    const chainId = await providedWeb3.eth.getChainId();

    setWallet({ accounts, balance, chainId });
  }, []);

  useEffect(() => {
    const getProvider = async () => {
      const provider = await detectEthereumProvider({ silent: true });

      if (provider) {
        try {
          await provider.request({ method: 'eth_requestAccounts' });
          const web3Instance = new Web3(provider);
          setWeb3(web3Instance);
          setHasProvider(true);
          updateWallet(null, web3Instance);
          provider.on('accountsChanged', (accounts) => updateWallet(accounts, web3Instance));
          provider.on('chainChanged', () => updateWallet(null, web3Instance));
        } catch (error) {
          setHasProvider(false); // Set hasProvider to false if there's an error
        }
      }else {
        setHasProvider(false); // Set hasProvider to false if no provider is detected
      }
    };

    getProvider(); //initialize web3

    return () => {
      if (web3) {
        web3.currentProvider.removeAllListeners('accountsChanged');
        web3.currentProvider.removeAllListeners('chainChanged');
      }
    };
  }, [updateWallet]);

  const connectMetaMask = async () => {
    if (!web3) return;
    setIsConnecting(true);

    try {
      await web3.eth.requestAccounts();
      clearError();
      updateWallet(null, web3);
    } catch (err) {
      setErrorMessage(err.message);
    }

    setIsConnecting(false);
  };


  const disconnectMetaMask = async () => {
    try {
      await web3.eth.accounts.wallet.clear();
      clearError();
      updateWallet([]);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <MetaMaskContext.Provider
      value={{
        wallet,
        web3,
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

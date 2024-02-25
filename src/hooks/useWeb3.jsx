import { createContext, useContext, useEffect, useState } from 'react';
import { useMetaMask } from './useMetaMask';
//import Web3 from 'web3';

import { contractAddress, contractAbi } from '@/utils/constants';

const Web3Context = createContext({})

export const Web3ContextProvider = ({children}) => {
  const { wallet, web3} = useMetaMask();
  const [contract, setContract] = useState(null);

  //const web3 = new Web3(window.ethereum);
  //const web3 = new Web3('http://127.0.0.1:8545');

  useEffect(() => {
    if (web3) {
      const contractInstance = new web3.eth.Contract(contractAbi, contractAddress);
      setContract(contractInstance);
    }
  }, [web3]);
  
  //const accounts = web3.eth.getAccounts();

  const register = async () => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }

    try {
      const receipt = await contract.methods.register().send({ from: wallet.accounts[0] });
      console.log("Transaction receipt:", receipt);
      alert("Registered successfully");
    } catch (error) {
      console.error("Error registering:", error);
      alert("Error registering");
           
      
    }
    
  }


  const getAllTasks = async () => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }

    try {
      const receipt = await contract.methods.getAllTasks().call();
      console.log("Transaction receipt:", receipt);
      
      
      //alert("Registered successfully");
    } catch (error) {
      console.error("Error registering:", error);
           
      
    }
    
  }



  return (
    <Web3Context.Provider
      value = {{
        register,
        getAllTasks,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3ContextProvider');
  }
  return context;


}
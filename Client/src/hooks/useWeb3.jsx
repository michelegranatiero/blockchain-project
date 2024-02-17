import { useEffect, useState } from 'react';
import { useMetaMask } from './useMetaMask';
//import Web3 from 'web3';

import EventsApp from "../../../Hardhat/artifacts/contracts/EventsApp.sol/EventsApp.json";


export const useWeb3 = () => {
  const { wallet, web3 } = useMetaMask();
  const [contract, setContract] = useState(null);

  const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

  //const web3 = new Web3('http://127.0.0.1:8545');
  //const contract = new web3.eth.Contract(EventsApp.abi, contractAddress);

  useEffect(() => {
    if (web3) {
      const contractInstance = new web3.eth.Contract(EventsApp.abi, contractAddress);
      setContract(contractInstance);
    }
  }, [web3]);
  
  //const accounts = web3.eth.getAccounts();

  const register = () => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    contract.methods.register().send({ from: wallet.accounts[0] })
      .on('receipt', (hash) => {console.log(hash)});
  }

  /* const register = async () => {
    try {
      const accounts = await web3.eth.getAccounts(); // Wait for getAccounts() to resolve
      await contract.methods.register().send({ from: accounts[0] }); // Call the contract method
    } catch (error) {
      console.error("Error registering:", error);
    }
  } */


  return {register};
}
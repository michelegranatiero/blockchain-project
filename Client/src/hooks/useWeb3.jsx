import { Contract } from 'web3-eth-contract';
import { useMetaMask } from './useMetaMask';

import EventsApp from "../../../Hardhat/artifacts/contracts/EventsApp.sol/EventsApp.json";


export const useWeb3 = () => {
  const { wallet } = useMetaMask();

  const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

  const contract = new Contract(EventsApp.abi, contractAddress, { provider: 'http://127.0.0.1:8545' }); 
  

  const register = () => {
    contract.methods.register().send({ from: wallet.accounts[0] })
      .on('transactionHash', (hash) => {console.log(hash)});
  }

  return {register};
}
// Set up a connection to the Hardhat network
//const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

// Log the current block number to the console
/* web3.eth
	.getBlockNumber()
	.then((result) => {
		console.log('Current block number: ' + result);
	})
	.catch((error) => {
		console.error(error);
	}); */
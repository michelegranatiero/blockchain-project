import { createContext, useContext, useEffect, useState } from 'react';
import { useMetaMask } from './useMetaMask';

import { contractAddress, contractAbi} from '@/utils/constants';
import { sendToIPFS, fetchFromIPFS } from '@/utils/ipfsFunctions';
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


  const createTask = async (title, descr, numRounds, workersPerRound) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return false;
    }
    try {
      const receipt = await contract.methods
        .deployTask(title, descr, numRounds, workersPerRound)
        .send({from: wallet.accounts[0]});
      console.log("Transaction receipt:", receipt);
      //console.log(receipt.events.Deployed.returnValues.taskAddress)
      return true;
    } catch (error) {
      console.error("Error registering:", error);
      return false;
    }
  }


  const getAllTasks = async () => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const tasks = await contract.methods.getAllTasks().call();
      //console.log(tasks);
      return tasks;
    } catch (error) {
      console.error("Error retriving tasks:", error);
    }
    
  }


  const getAllTasksInfo = async () => {
    const tasks = await contract.methods.getAllTasks().call();
    if (wallet.accounts.length > 0) {
      for (let i = 0; i < tasks.length; i++) {
        let roles = await getRoles(tasks[i].id);
        tasks[i].amFunder = roles.funder;
        tasks[i].amWorker = roles.worker;
        tasks[i].amAdmin = roles.admin;
      }
    }
    return tasks;
  }


  const getTask = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const task = await contract.methods.getTask(taskId).call();
      //console.log(task);
      return task
    } catch (error) {
      console.error("Error retriving task:", error);
    }
  }


  const getFunderList = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const funders = await contract.methods.getFunderList(taskId).call();
      //console.log(funders);
      return funders
    } catch (error) {
      console.error("Error retriving funders:", error);
    }
  }

  
  const getFunds = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const funds = await contract.methods.getFundsAmount(taskId).call();
      //console.log(funds);
      return funds
    } catch (error) {
      console.error("Error retriving funds:", error);
    }
  }
  
  
  // DA CONTROLLARE (SU SMART CONTRACT)
  const getSelWorkerList = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const selWorkers = await contract.methods.getSelectedWorkers(taskId).call();
      return selWorkers
    } catch (error) {
      console.error("Error retriving selected workers:", error);
    }
  }
  
  
  const getRoles = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const res = await contract.methods.getRoles(taskId).call({ from: wallet.accounts[0] });
      return res
    } catch (error) {
      console.error("Error getting roles:", error);
    }
  }
  
  
  const fund = async (taskId, weiAmount) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      //console.log(wallet.accounts[0]);
      const receipt = await contract.methods.fund(taskId).send({ from: wallet.accounts[0], value: weiAmount });
      console.log("Transaction receipt:", receipt);
      return true;
    } catch (error) {
      console.error("Error funding:", error);
    }
  }


  const stopFunding = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const receipt = await contract.methods.stopFunding(taskId).send({ from: wallet.accounts[0] });
      console.log("Transaction receipt:", receipt);
      return true;
    } catch (error) {
      console.error("Error stopping funding:", error);
    }
  }


  const register = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const receipt = await contract.methods.register(taskId).send({ from: wallet.accounts[0] });
      console.log("Transaction receipt:", receipt);
      return true;
    } catch (error) {
      console.error("Error registering:", error);
    }
  }


  // DA CONTROLLARE (SU SMART CONTRACT)
  const commitWork = async (taskId, work, votes) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const res = await contract.methods.getWork(taskId, work, votes).send({ from: wallet.accounts[0] });
      return res
    } catch (error) {
      console.error("Error committing work:", error);
    }
  }


  // DA CONTROLLARE (SU SMART CONTRACT)
  const getRanking = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const res = await contract.methods.getWork(taskId).call();
      return res
    } catch (error) {
      console.error("Error retriving ranking:", error);
    }
  }


  const getWork = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const res = await contract.methods.getWork(taskId).call({ from: wallet.accounts[0] });
      return res
    } catch (error) {
      console.error("Error retriving work:", error);
    }
  }


  // DA CONTROLLARE (SU SMART CONTRACT)
  const getWorkers = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const res = await contract.methods.getWork(taskId).call();
      return res
    } catch (error) {
      console.error("Error retriving workers:", error);
    }
  }


  const [filters, setFilters] = useState(["deployed"]); // global tasks filters

  return (
    <Web3Context.Provider
      value = {{
        wallet,
        web3,
        contract,
        globFilters: [filters, setFilters],
        sendToIPFS,
        fetchFromIPFS,
        createTask,
        getAllTasks,
        getAllTasksInfo,
        getTask,
        getFunderList,
        getFunds,
        getSelWorkerList,
        getRoles,
        fund,
        stopFunding,
        register,
        commitWork,
        getRanking,
        getWork,
        getWorkers,
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
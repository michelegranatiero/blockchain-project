import { createContext, useContext, useEffect, useState } from 'react';
import { useMetaMask } from './useMetaMask';

import { Buffer } from 'buffer';
import { Web3 } from 'web3';

import { contractAddress, contractAbi} from '@/utils/constants';
import { sendToIPFS, fetchFromIPFS, fileToBase64 } from '@/utils/ipfsFunctions';
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


  const createTask = async (title, descr, numRounds, workersPerRound, file) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return false;
    }
    try {

      const fileB64 = await fileToBase64(file);
      const fileObj = { name: file.name, content: fileB64, type: file.type }; //JSON.stringify ??
      const ipfsFileHash = await sendToIPFS(fileObj, file.name);
      if (!ipfsFileHash) {
        alert("Error uploading file to IPFS.");
        return;
      }      

      const mainObj = {title: title, description: descr, file: ipfsFileHash};
      const ipfsMainHash = await sendToIPFS(mainObj, title);
      if (!ipfsMainHash) {
        alert("Error uploading to IPFS.");
        return;
      }

      //encode to ascii
      const ascii = []
      for (let i = 0; i < ipfsMainHash.length; i++) {
        ascii.push(ipfsMainHash.charCodeAt(i));
      }
      //console.log("ascii encode" ,[...ascii]); //ascii
      

      //from ascii to base64
      const base64str = Buffer.from(ascii).toString('base64');
      console.log("base64 string", base64str.length, base64str);

      // split in 2 parts and convert to hex
      const part1 = Web3.utils.asciiToHex(base64str.slice(0, 32));
      const part2 = Web3.utils.asciiToHex(base64str.slice(32, 64));
      console.log(part1, part2);


      // deploy task
      const receipt = await contract.methods  // remove await if you want to use events below
        .deployTask(part1, part2, numRounds, workersPerRound)
        .send({from: wallet.accounts[0]});
      console.log("Transaction receipt:", receipt);

      /* receipt.on('transactionHash', (hash) => {console.log(hash)});
      receipt.on('receipt', (receipt) => {console.log(receipt)});
      receipt.on('confirmation', (confirmationNumber, receipt) => {console.log(confirmationNumber, receipt)});
      receipt.on('error', (error, receipt) => {console.log(error, receipt)}); */

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


        //decode bytes32 to ipfs hash
        let part1 = Web3.utils.hexToAscii(tasks[i].hashPart1);
        let part2 = Web3.utils.hexToAscii(tasks[i].hashPart2);
        let hash = part1 + part2;
        const ipfsHash = Buffer.from(hash, 'base64').toString('ascii');


        //fetch from ipfs
        const ipfsObj = await fetchFromIPFS(ipfsHash);
        console.log(ipfsObj);
        
        
        tasks[i].title = ipfsObj.title;
        tasks[i].description = ipfsObj.description;
        tasks[i].file = ipfsObj.file;
        
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
        /* sendToIPFS,
        fetchFromIPFS, */
        createTask,
        getAllTasks,
        getAllTasksInfo,
        getTask,
        getFunderList,
        getFunds,
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
import { createContext, useContext, useEffect, useState } from 'react';
import { useMetaMask } from './useMetaMask';

import { Web3 } from 'web3';

import { contractAddress, contractAbi} from '@/utils/constants';
import  { formatState } from '@/utils/formatWeb3'
import { sendToIPFS,fetchFromIPFS, fileToBase64, downloadFile, encodeCIDto2Bytes32, decode2Bytes32toCID } from '@/utils/ipfsFunctions';
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
  

  // EVENTS
  const setHomeEvents = (setUpdate) => {
    if (!contract) return;
  
    //console.log(contract.events);
    contract.events.Deployed().on('data', (eventData) => {
      console.log("Event data:", eventData);
      setUpdate((k) => k + 1);
    });

    /* contract.events.NewFunding().on('data', (eventData) => {
      console.log("Event data:", eventData);
      setUpdate((k) => k + 1);
    }); */

    contract.events.NeedRandomness().on('data', (eventData) => {
      console.log("Event data:", eventData);
      setUpdate((k) => k + 1);
    });
    
    contract.events.RoundStarted().on('data', (eventData) => {
      console.log("Event data:", eventData);
      setUpdate((k) => k + 1);
    });

    contract.events.TaskEnded().on('data', (eventData) => {
      console.log("Event data:", eventData);
      setUpdate((k) => k + 1);
    });

    return () => contract.events.allEvents().removeAllListeners();

    /* const event1 = contract.events.Deployed({
      filter: {
        filter: { val: 100 },
      },
      fromBlock: 0, // 'latest' is the default
    });
    
    event1.on('data', (eventData) => {
      console.log("Event data:", eventData);
    });
    event1.on('error', () => {
      console.error("Event error:", error);
    }); */
    
  };


  const setTaskEvents = (taskId, setUpdate) => {
    if (!contract) return;

    contract.events.NewFunding({ filter: { taskId: taskId } }).on('data', (eventData) => {
      console.log("Event data:", eventData);
      console.log("Values:", eventData.returnValues);
      
      setUpdate((k) => k + 1);
    });



    // TO BE REMOVED, just for debugging
    contract.events.NeedRandomness({ filter: { taskId: taskId } }).on('data', (eventData) => {
      console.log("Event data:", eventData);
      const data = eventData.returnValues;
      try {
        const randomness = contract.methods.setRandomness(data.taskId, 1234).send({ from: wallet.accounts[0] }); //seed 1234
        console.log("Randomness set:", randomness);
      } catch (error) {
        console.log("error setting randomness:", error);
      }
      


      setUpdate((k) => k + 1);
    });

    contract.events.RoundStarted({ filter: { taskId: taskId } }).on('data', (eventData) => {
      console.log("Event data:", eventData);
      setUpdate((k) => k + 1);
    });

    contract.events.TaskEnded({ filter: { taskId: taskId } }).on('data', (eventData) => {
      console.log("Event data:", eventData);
      setUpdate((k) => k + 1);
    });

    return () => contract.events.allEvents().removeAllListeners();
  
  }

  


  const createTask = async (title, descr, numRounds, workersPerRound, file) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return false;
    }
    try {
      const fileB64 = await fileToBase64(file);
      const fileObj = { name: file.name, content: fileB64, type: file.type };
      const ipfsFileHash = await sendToIPFS(fileObj, file.name);
      if (!ipfsFileHash) {
        alert("Error uploading file to IPFS.");
        return;
      }      

      const mainObj = {title: title, description: descr, file: ipfsFileHash}; // file format
      const ipfsCID = await sendToIPFS(mainObj, title);
      if (!ipfsCID) {
        alert("Error uploading to IPFS.");
        return;
      }

      // encode CID to 2 bytes32
      const [part1, part2] = encodeCIDto2Bytes32(ipfsCID);

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



  const getTask = async (taskId, details = false) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const task = await contract.methods.getTask(taskId).call();

      if (wallet.accounts.length > 0) {
        let roles = await getRoles(task.id);
        task.amFunder = roles.funder;
        task.amWorker = roles.worker;
        task.amAdmin = roles.admin;
        // check if task started
        if (formatState(task.state) == "started") {
          task.hasCommitted = task.rounds.length > 0 ? await hasCommitted(task.id, wallet.accounts[0]) : true;
          task.isWorkerSelected = task.rounds.length > 0 ? await isWorkerSelected(task.id, wallet.accounts[0]) : false;
        }
      }

      // task advanced details (to be used on SINGLE TASK page)
      if (details){
        task.funds = await getFunds(task.id);
        task.funders = await getFunderList(task.id);
      }

      //decode CID to ipfs CID
      const ipfsCID = decode2Bytes32toCID(task.hashPart1, task.hashPart2)

      //fetch from ipfs
      const ipfsObj = await fetchFromIPFS(ipfsCID);
      
      task.title = ipfsObj.title;
      task.description = ipfsObj.description;
      task.file = ipfsObj.file;

      //console.log(task);
      return task
    } catch (error) {
      console.error("Error retriving task:", error);
    }
  }


  const getAllTasks = async () => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return false;
    }
    try {
      //const tasksAll = await contract.methods.getAllTasks().call();
      const taskCounter = await contract.methods.taskCounter().call();
      const tasks = [];
      for (let i = 0; i <  taskCounter/* tasksAll.length */; i++) {
        const task = await getTask(i);
        tasks.push(task);
      }
      //console.log(tasks);
      return tasks;
    } catch (error) {
      console.error("Error retriving tasks:", error);
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


  const isWorkerSelected = async (taskId, address) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const res = await contract.methods.isWorkerSelected(taskId, address).call();
      return res
    } catch (error) {
      console.error("Error in 'isWorkerSelected' method:", error);
      return false; //default
    }
  }


  const hasCommitted = async (taskId, address) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const res = await contract.methods.hasCommitted(taskId, address).call();
      return res
    } catch (error) {
      console.error("Error in 'hasCommitted' method:", error);
    }
  }


  // DA CONTROLLARE (SU SMART CONTRACT)
  const commitWork = async (taskId, workFile, votes) => { /* VOTES SHOULD BE AN ARRAY, still to be defined */
    votes = [1,2]// TO BE CHANGED, just for debugging
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      // upload file to IPFS
      const fileB64 = await fileToBase64(workFile);
      const fileObj = { name: workFile.name, content: fileB64, type: workFile.type };
      const ipfsCID = await sendToIPFS(fileObj, workFile.name);
      if (!ipfsCID) {
        alert("Error uploading file to IPFS.");
        return;
      }

      // encode CID to 2 bytes32
      const [workPart1, workPart2] = encodeCIDto2Bytes32(ipfsCID);

      const res = await contract.methods.commitWork(taskId, workPart1, workPart2, votes).send({ from: wallet.accounts[0] });
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
      const res = await contract.methods.getRanking(taskId).call();
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


  const [filters, setFilters] = useState(["deployed", "started", "completed"]); // global tasks filters

  return (
    <Web3Context.Provider
      value = {{
        wallet,
        web3,
        contract,
        globFilters: [filters, setFilters],
        createTask,
        getTask,
        getAllTasks,
        getFunderList,
        getFunds,
        getRoles,
        fund,
        stopFunding,
        register,
        isWorkerSelected,
        hasCommitted,
        commitWork,
        getRanking,
        getWork,
        // ipfsFunctions
        fetchFromIPFS,
        downloadFile,
        // events
        setHomeEvents,
        setTaskEvents,
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
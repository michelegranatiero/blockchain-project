import { createContext, useContext, useEffect, useState } from 'react';
import { useMetaMask } from './useMetaMask';

import { Web3 } from 'web3';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import { contractAddress, contractAbi} from '@/utils/constants';
import { formatState } from '@/utils/formatWeb3'
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
  
    const deployedEmitter = contract.events.Deployed();
    deployedEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      setUpdate((k) => k + 1);
    });

    const registeredEmitter = contract.events.Registered();
    registeredEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      setUpdate((k) => k + 1);
    });

    const stopFundingEmitter = contract.events.StopFunding();
    stopFundingEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      setUpdate((k) => k + 1);
    });

    const needRandomnessEmitter = contract.events.NeedRandomness()
    needRandomnessEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      setUpdate((k) => k + 1);
    });
    
    const roundStartedEmitter = contract.events.RoundStarted();
    roundStartedEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      setUpdate((k) => k + 1);
    });

    const LastRoundCommittmentEndedEmitter = contract.events.LastRoundCommittmentEnded();
    LastRoundCommittmentEndedEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      setUpdate((k) => k + 1);
    });

    const taskEndedEmitter = contract.events.TaskEnded();
    taskEndedEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      setUpdate((k) => k + 1);
    });

    return () => {
      deployedEmitter.removeAllListeners();
      registeredEmitter.removeAllListeners();
      stopFundingEmitter.removeAllListeners();
      needRandomnessEmitter.removeAllListeners();
      roundStartedEmitter.removeAllListeners();
      LastRoundCommittmentEndedEmitter.removeAllListeners();
      taskEndedEmitter.removeAllListeners();
    }
    
  };



  const setTaskEvents = (taskId, setUpdate) => {
    if (!contract) return;

    const registeredEmitter = contract.events.Registered({ filter: { taskId: taskId } });
    registeredEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      setUpdate((k) => k + 1);
    });

    const newFundingEmitter = contract.events.NewFunding({ filter: { taskId: taskId } });
    newFundingEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      console.log("Values: ", eventData.returnValues);
      
      setUpdate((k) => k + 1);
    });

    const stopFundingEmitter = contract.events.StopFunding({ filter: { taskId: taskId } });
    stopFundingEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      setUpdate((k) => k + 1);
    });

    
    const needRandomnessEmitter = contract.events.NeedRandomness({ filter: { taskId: taskId } });
    needRandomnessEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      const data = eventData.returnValues;

      setUpdate((k) => k + 1);
    });

    const roundStartedEmitter = contract.events.RoundStarted({ filter: { taskId: taskId } });
    roundStartedEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      setUpdate((k) => k + 1);
    });

    const LastRoundCommittmentEndedEmitter = contract.events.LastRoundCommittmentEnded({ filter: { taskId: taskId } });
    LastRoundCommittmentEndedEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      setUpdate((k) => k + 1);
    });

    const taskEndedEmitter = contract.events.TaskEnded({ filter: { taskId: taskId } });
    taskEndedEmitter.on('data', (eventData) => {
      console.log("Event data: ", eventData);
      setUpdate((k) => k + 1);
    });

    return () => {
      registeredEmitter.removeAllListeners();
      newFundingEmitter.removeAllListeners();
      stopFundingEmitter.removeAllListeners();
      needRandomnessEmitter.removeAllListeners();
      roundStartedEmitter.removeAllListeners();
      LastRoundCommittmentEndedEmitter.removeAllListeners();
      taskEndedEmitter.removeAllListeners();
    }
  
  }

  


  const createTask = async (title, descr, numRounds, workersPerRound, entranceFee, file) => {
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
      const receipt = await contract.methods
        .deployTask(part1, part2, numRounds, workersPerRound, entranceFee)
        .send({from: wallet.accounts[0]});
      console.log("Transaction receipt: ", receipt);

      /* //estimate entrance fee based on current gas price
      const gasPrice = await web3.eth.getGasPrice();
      //gas estimation for register function
      const taskId = receipt.events.Deployed.returnValues.taskId;      
      const gasEstimate = await contract.methods.register(taskId).estimateGas({ from: wallet.accounts[0] });
      const entranceFeeEst = gasEstimate * gasPrice;
      //set entrance fee
      await contract.methods.setEntranceFee(taskId, entranceFeeEst).send({ from: wallet.accounts[0] }); */

      return true;
    } catch (error) {
      console.error("Error registering: ", error);
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
        task.amFunder = roles.isFunder;
        task.amWorker = roles.isWorker;
        task.amAdmin = roles.isAdmin;
        // check if task started
        
        if (formatState(task.state) == "started" || formatState(task.state) == "completed"){
          task.hasCommitted = task.rounds.length > 0 ? await hasCommitted(task.id, wallet.accounts[0]) : true;
          task.isWorkerSelected = task.rounds.length > 0 ? await isWorkerSelected(task.id, wallet.accounts[0], task.rounds.length-1) : false;
          // selected round for the user (worker)
          task.workerRound = task.amWorker ? Math.floor(task.registeredWorkers.findIndex(
            (elem)=> elem == wallet.accounts[0]) / Number(task.workersPerRound))+1 : false;
          
          if ( task.isWorkerSelected && task.rounds[Number(task.numberOfRounds)-1]?.committedWorks.length == task.workersPerRound){
            task.hasLRScore = await contract.methods.hasLRScore(task.id, wallet.accounts[0]).call();
          }
          if (task.amWorker && (task.workerRound == task.numberOfRounds && formatState(task.state) == "completed"
            || task.rounds[task.workerRound]?.committedWorks.length == task.workersPerRound)
          ){
            task.hasWithdrawn = await contract.methods.hasWithdrawn(task.id).call({ from: wallet.accounts[0] });
          }
        }

        

        
      }

      // task advanced details (to be used on SINGLE TASK page)
      if (details){
        task.funds = await getFunds(task.id);
        task.funders = await getFunderList(task.id);
      }

      //decode CID to ipfs CID
      const ipfsCID = decode2Bytes32toCID(task.model.hashPart1, task.model.hashPart2)

      //fetch from ipfs
      const ipfsObj = await fetchFromIPFS(ipfsCID);
      
      task.title = ipfsObj.title;
      task.description = ipfsObj.description;
      task.file = ipfsObj.file;

      //console.log(task);      
      return task
    } catch (error) {
      console.error("Error retriving task: ", error);
    }
  }


  const getAllTasks = async () => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return false;
    }
    try {
      const taskCounter = await contract.methods.taskCounter().call();
      const tasks = [];
      for (let i = 0; i <  taskCounter/* tasksAll.length */; i++) {
        const task = await getTask(i);
        tasks.push(task);
      }
      //console.log(tasks);
      return tasks;
    } catch (error) {
      console.error("Error retriving tasks: ", error);
    }
    
  }


  const getFunderList = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const funders = await contract.methods.getFunderList(taskId).call();
      return funders
    } catch (error) {
      console.error("Error retriving funders: ", error);
    }
  }

  
  const getFunds = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const funds = await contract.methods.getFundsAmount(taskId).call();
      return funds
    } catch (error) {
      console.error("Error retriving funds: ", error);
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
      console.error("Error getting roles: ", error);
    }
  }
  
  
  const fund = async (taskId, weiAmount) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const receipt = await contract.methods.fund(taskId).send({ from: wallet.accounts[0], value: weiAmount });
      console.log("Transaction receipt: ", receipt);
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
      console.error("Error stopping funding: ", error);
    }
  }


  const register = async (taskId, entranceFee) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const receipt = await contract.methods.register(taskId).send({ from: wallet.accounts[0], value: entranceFee});
      console.log("Transaction receipt:", receipt);
      return true;
    } catch (error) {
      console.error("Error registering: ", error);
    }
  }


  const isWorkerSelected = async (taskId, address, round) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const res = await contract.methods.isWorkerSelected(taskId, address, round).call();
      return res
    } catch (error) {
      console.error("Error in 'isWorkerSelected' method: ", error);
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
      console.error("Error in 'hasCommitted' method: ", error);
    }
  }

  const commitWork = async (task, workFile, votesFile) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return false;
    }
    try {
      if (task.rounds.length == 0) return false; // task not started yet

      let votes = [];
      if (task.rounds.length <= 1 /* || votesFile == null */){ // first round workers do not vote
        votes = Array(task.workersPerRound).fill(0) // just for 1st round
      }
      else{ // rounds > 1
        //handle json file
        const previousRoundWorkers = [];
        
        for (let i = 0; i < Number(task.workersPerRound); i++) {
          previousRoundWorkers.push(task.registeredWorkers[(Number(task.workersPerRound)*(task.rounds.length-2)) + i]);
        }

        const votesText = await votesFile.text();
        const votesObj = JSON.parse(votesText);
        

        //check if size of votes is the same as the size of previousRoundWorkers
        if (votesObj.length != previousRoundWorkers.length){
          console.log("size doesn't match");
          
          return false; // size doesn't match
        }

        for (let i = 0; i < previousRoundWorkers.length; i++) {
          // check if every address of previousRoundWorkers is in the votesFile
          let idx = votesObj.findIndex(elem => elem.address == previousRoundWorkers[i]);
          if (idx == -1){
            console.log("address not found");
            return false; // address not found
          }
          // check if vote is between 0 and 1000
          if (votesObj[idx].vote < 0 || votesObj[idx].vote > 1000){
            console.log("vote out of range");
            return false; // vote out of range
          }
          
          votes.push(votesObj[idx].vote);
        }
      }


      // upload workfile to IPFS
      console.log(workFile);
      const bytes32zero = "0x" + "0".repeat(64);
      let [workPart1, workPart2] = [bytes32zero, bytes32zero];// for last round workers (they do not commit work)

      if (task.rounds.length < task.numberOfRounds){ //if not last round workers (need to commit work)
        const fileB64 = await fileToBase64(workFile);
        const extension = workFile.name.split('.').pop();
        //const fileObj = { name: workFile.name, content: fileB64, type: workFile.type };
        const fileObj = { name: `${wallet.accounts[0]}.${extension}`, content: fileB64, type: workFile.type };
        const ipfsCID = await sendToIPFS(fileObj, workFile.name);
        if (!ipfsCID) {
          alert("Error uploading file to IPFS.");
          return;
        }
        // encode CID to 2 bytes32
        [workPart1, workPart2] = encodeCIDto2Bytes32(ipfsCID);
      }
      console.log(task.id, workPart1, workPart2, votes);
        
      const res = await contract.methods.commit(task.id, workPart1, workPart2, votes).send({ from: wallet.accounts[0] });
      
      return res
      
      
    } catch (error) {
      console.error("Error committing work: ", error);
      return false
    }
  }


  const getRoundWork = async (taskId, round) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const res = await contract.methods.getRoundWork(taskId, round).call(/* { from: wallet.accounts[0] } */);
      console.log(res);

      const workFiles = [];      
      for (let i = 0; i < res.length; i++) {

        //decode CID to ipfs CID        
        const ipfsCID = decode2Bytes32toCID(res[i].hashPart1, res[i].hashPart2)

        //fetch from ipfs
        const ipfsObj = await fetchFromIPFS(ipfsCID);

        workFiles.push(ipfsObj); //??
      }
      // add files to zip and return zip file with jszip
      const zip = new JSZip();
      //const folder = zip.folder("weightsFiles");
      for (let i = 0; i < workFiles.length; i++) {
        const file =  await fetch(workFiles[i].content).then(response => response.blob()).then(blob => {
          return new File([blob], workFiles[i].name, {type: workFiles[i].type});
        });
        console.log(file);
        
        zip.file(workFiles[i].name, file);
      }
      zip.generateAsync({ type: "blob" }).then(blob => {
        saveAs(blob, "weightsFiles.zip");
      });
      return true;


    } catch (error) {
      console.error("Error retriving work: ", error);
    }
  }


  const computeLastRoundScore = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {      
      const res = await contract.methods.computeLastRoundScore(taskId).send({ from: wallet.accounts[0] });
      return res
    } catch (error) {
      console.error("Error computing score: ", error);
    }
  }


  const withdrawReward = async (taskId) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const res = await contract.methods.withdrawReward(taskId).send({ from: wallet.accounts[0] });
      return res
    } catch (error) {
      console.error("Error withdrawing reward: ", error);
    }
  }

  const getContractBalance = async () => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const balance = await web3.eth.getBalance(contractAddress);      
      return Number(balance)
    } catch (error) {
      console.error("Error getting contract balance: ", error);
    }
  }

  const defaultFilters = ["deployed", "started", "completed"];
  const [filters, setFilters] = useState(defaultFilters); // global tasks filters
  function setDefaultFilters(){
    setFilters(defaultFilters);
  }

  return (
    <Web3Context.Provider
      value = {{
        wallet,
        web3,
        contract,
        globFilters: [filters, setFilters],
        setDefaultFilters,
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
        getRoundWork,
        computeLastRoundScore,
        withdrawReward,
        getContractBalance,
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
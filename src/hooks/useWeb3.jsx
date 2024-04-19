import { createContext, useContext, useEffect, useState } from 'react';
import { useMetaMask } from './useMetaMask';

import { Web3 } from 'web3';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
  const setEvents = (eventsList, setUpdate, filters={}) => {
    if (!contract) return;
  
    const emitters = [];
    for (let i = 0; i < eventsList.length; i++) {
      const emitter = contract.events[eventsList[i]]({ filter: filters  });
      emitter.on('data', (eventData) => {
        console.log(`${eventsList[i]} - Event data:`, eventData);

        ///////////// just for debugging        
        
        if (eventsList[i] == "NeedRandomness" && Object.keys(filters).length > 0) {
          const data = eventData.returnValues;
          try {
            const randomness = contract.methods.setRandomness(data.taskId, 1234).send({ from: wallet.accounts[0] }); //seed 1234
            console.log("Randomness set:", randomness);
          } catch (error) {
            console.log("error setting randomness:", error);
          }
        }
        //////////////

        setUpdate((k) => k + 1);
      });
      emitters.push(emitter);
    }

    return () => {
      emitters.forEach(emitter => emitter.removeAllListeners());
    }

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
        task.amFunder = roles.isFunder;
        task.amWorker = roles.isWorker;
        task.amAdmin = roles.isAdmin;
        
        if (formatState(task.state) == "started") {
          task.hasCommitted = task.rounds.length > 0 ? await hasCommitted(task.id, wallet.accounts[0]) : true;
          task.isWorkerSelected = task.rounds.length > 0 ? await isWorkerSelected(task.id, wallet.accounts[0]) : false;
        }

        if (["started", "completed"].includes(formatState(task.state))){
          // selected round for the user (worker)
          task.workerRound = task.amWorker ? Math.floor(task.registeredWorkers.findIndex(
            (elem)=> elem == wallet.accounts[0]) / Number(task.workersPerRound))+1 : false;

          task.workerRanking = task.rounds.length > task.workerRound ? await getRoundRanking(task, task.workerRound) : false;
        }
      }

      if (["started", "completed"].includes(formatState(task.state))) {
        //2 rounds before current round
        if (formatState(task.state) == "completed"){
          task.roundRanking = await getRoundRanking(task, task.rounds.length-1); // latest round ranking
        }else{
          task.roundRanking = task.rounds.length > 2 ? await getRoundRanking(task, task.rounds.length-2) : false;
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


  const commitWork = async (task, workFile, votesFile) => { /* VOTES SHOULD BE AN ARRAY, still to be defined */
    if (!contract) {
      console.error("Contract instance is not available.");
      return false;
    }
    try {
      if (task.rounds.length == 0) return false; // task not started yet

      const votes = [];
      if (task.rounds.length == 1){ // first round votes
        //push [0,0,...,0] as default
        for (let i = 0; i < task.workersPerRound; i++) {
          votes.push(0);
        }
      }
      else if (task.rounds.length > 1){ // not first round votes
        //handle json file
        const previousRoundWorkers = [];
        
        for (let i = 0; i < task.workersPerRound; i++) {
          previousRoundWorkers.push(task.registeredWorkers[(Number(task.workersPerRound)*(task.rounds.length-2)) + i]);
          //previousRoundWorkers.push(task.rounds[task.rounds.length - 1].committedWorks[i].committer);
        }

        const votesText = await votesFile.text();
        const votesObj = JSON.parse(votesText);
        

        if (votesObj.length != previousRoundWorkers.length){
          console.log("size doesn't match");
          
          return false; // size doesn't match
        }

        // Check if every address of previousRoundWorkers is in the votesFile
        for (let i = 0; i < previousRoundWorkers.length; i++) {
          let idx = votesObj.findIndex(elem => elem.address == previousRoundWorkers[i]);
          if (idx == -1){
            console.log("address not found");
            return false; // address not found
          }
          votes.push(votesObj[idx].vote);
        }
      }

      let [workPart1, workPart2] = [ //default for last round commit
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ];

      if (task.rounds.length < task.numberOfRounds) { // not last round commit
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
      
      const res = await contract.methods.commitWork(task.id, workPart1, workPart2, votes).send({ from: wallet.accounts[0] });
      
      return res
    } catch (error) {
      console.error("Error committing work:", error);
      return false
    }
  }


  const getRoundRanking = async (task, round) => {
    if (!contract) {
      console.error("Contract instance is not available.");
      return;
    }
    try {
      const scores = await contract.methods.getRoundRanking(task.id, round).call();

      const ranking = [];
      for (let i = 0; i < scores.length; i++) {
        ranking.push({
          address: task.registeredWorkers[Number(task.workersPerRound)*(round-1) + i],
          score: Number(scores[i])
        });
      }

      return ranking;
      
    } catch (error) {
      console.error("Error retriving ranking:", error);
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
        
        /* task.title = ipfsObj.title;
        task.description = ipfsObj.description;
        task.file = ipfsObj.file; */

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
        getRoundRanking,
        getRoundWork,
        // ipfsFunctions
        fetchFromIPFS,
        downloadFile,
        // events
        setEvents
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
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

import "hardhat/console.sol";

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/EnumerableSet.sol";
// import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/EnumerableMap.sol";
// import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

/* Note that in a string each character is a byte.
 So make string size multiple of 32 bytes (because of the 256 bit slot) if possible. Also in "require" statament.
 If a string is less thatn 32 characters (bytes) convert it in bytes32 type */

/* If a function is only used externally, mark it as External to save gas.
Because in public functions, Solidity immediately copies array arguments to memory, while external functions can read directly from calldata */

// compress input data taken from the user

// shortest function name -> less gas

// enable optimizer when deploying the contract for optimize future transactional cost (entails more cost on deploy)

//check if a modifier is better than a function for saving gas. A: it depends by the context there is no rule for that.
// Evaluate if deleting completed tasks in some way.

contract FedMLContract {

    using EnumerableMap for EnumerableMap.AddressToUintMap;

    event NewFunding(uint taskId, uint numFunders, uint updatedBalance, uint value);
    event NeedRandomness(uint taskId, uint16 numberOfSeeds, uint16 upperBound);
    event Selected(uint taskId, address[] workers, uint roundNumber);
    event RoundStarted(uint taskId, uint roundNumber);
    event TaskEnded(uint taskId);
    event Deployed(uint taskId);

    enum State {DEPLOYED, STARTED, COMPLETED} // willing can be removed and use implicit states

    //address oracle;

    struct Round {
        // and consider the fact that each round is made by the same number of workers, so we can select for each round workersPerRound directly from the array
        // we coudld transform all the following arrays into mappings index -> value
        //order this list in a proper way to save gas fee (evm memory slots are made by 256 bits)
        // uint16 commitCount;
        // The following three arrays are synchronized meaning that workers[i] hasstatetask. committed committedWorks[i] and is ranked ranking[i]
        address[] workers; // use the same reasoning of ranking, so store instead of an address an unit16 (?)
        uint256[] ranking; // a smaller uint (?). A: workersPerRound is uint16, so uint256[] can become uint16[] 
        // (or store a json file to the IPFS, which means keep 32 bytes for the address)
        string[] committedWorks; //this should be converted (to byte32)
    }

    struct Task {
        //order this list in a proper way to save gas fee
        // (evm memory slots are made by 256 bits)
        uint id; //32 bytes
        bytes32 title; //32 bytes
        bytes32 description; //32 bytes
        address admin; //20 bytes
        uint16 numberOfRounds; //2 bytes
        uint16 workersPerRound; //2 bytes 
        State state; //1 bytes
        bool fundingCompleted; // 1 bytes
        address[] registeredWorkers;
        Round[] rounds;
    }
 
    mapping (uint taskId => EnumerableMap.AddressToUintMap funderMap) taskFundersMap;

    Task[] private taskList;

    function deployTask(
        bytes32 _title,
        bytes32 _description,
        uint16 _numberOfRounds,
        uint16 _workersPerRound
        ) external {
        require(_workersPerRound > 1);
        require(_numberOfRounds > 1);        
        require(_title.length <= 32, "Title too long");
        require(_description.length <= 32, "Description too long");
        Task storage task = taskList.push();
        task.title = _title;
        task.description = _description;
        task.admin = msg.sender;
        task.numberOfRounds = _numberOfRounds;
        task.workersPerRound = _workersPerRound;
        task.fundingCompleted = false;
        task.state = State.DEPLOYED;

        emit Deployed(task.id);
    }

    modifier validTask(uint _taskId) {
        require(_taskId < taskList.length);
        _;
    }

    // ------------------------------------------- GETTERS -------------------------------------------

    function getAllTasks() external view returns (Task[] memory) {
        return taskList;
    }
    
    function getTask(uint _taskId) validTask(_taskId) external view returns (Task memory) {
        return taskList[_taskId];
    }

    function getFunderList(uint _taskId) validTask(_taskId) external view returns (address[] memory) {
        return taskFundersMap[_taskId].keys();
    }

    function getFundsAmount(uint _taskId) validTask(_taskId) external view returns (uint) {
        uint totalFunds = 0;
        EnumerableMap.AddressToUintMap storage funderMap = taskFundersMap[_taskId]; 
        for (uint i = 0; i < funderMap.length(); i++) {
            (, uint amount) = funderMap.at(i);
            totalFunds += amount;
        }
        return totalFunds;
    }

    // previously getSelectedWorkers
    function getRegisteredWorkers(uint _taskId) validTask(_taskId) external view returns (address[] memory) {
        Task storage task = taskList[_taskId];
        require(task.state != State.DEPLOYED, "Worker not selected yet!");
        return task.registeredWorkers;
        //return selectedWorkersMap[_taskId].values(); //check return type of .values() (should be bytes32[])
    }

    // Return the role of the sender within the specified task.
    // The returned value is a triple of bools, respectively indicating if it is a funder, a worker and an admin of the task. 
    function getRoles(uint _taskId) validTask(_taskId) external view returns (bool funder, bool worker, bool admin) {
        return(
            taskFundersMap[_taskId].contains(msg.sender),
            isAlreadyWorker(msg.sender, taskList[_taskId].registeredWorkers),
            taskList[_taskId].admin == msg.sender
        );
    }

    // ------------------------------------------- PROCESS -------------------------------------------
    
    function fund(uint _taskId) validTask(_taskId) external payable {
        //how to estimate gas fee? Also for the oracle balance to execute transactions
        require(msg.value > 0); // non-zero funding
        require(taskList[_taskId].fundingCompleted == false); // funding still open

        EnumerableMap.AddressToUintMap storage funderMap = taskFundersMap[_taskId]; // taskList[_taskId].funderMap;
        // if the user is already a funder (he has already funded in the past)
        if (funderMap.contains(msg.sender)){
            // then increase the funding amount 
            funderMap.set(msg.sender, funderMap.get(msg.sender) + msg.value); //check if this is correct
        }
        else{ // otherwise: New Funder
            funderMap.set(msg.sender, msg.value);
        }
        emit NewFunding(_taskId, funderMap.length(), msg.value, funderMap.get(msg.sender)); 
        // do we need all of these parameters for the event?
    }

    function stopFunding(uint _taskId) validTask(_taskId) external {
        Task storage task = taskList[_taskId];
        require(msg.sender == task.admin); // only the admin can stop the funding
        // or the oracle if we want to set a timer/funding treshold
        require(task.fundingCompleted == false); // the funding wasn't stopped yet
        task.fundingCompleted = true;
        //uint16 workersRequired = task.workersPerRound * task.numberOfRounds; // removed to save gas, added comment instead
        uint16 workersPerRound = task.workersPerRound; //caching
        uint16 numberOfRounds = task.numberOfRounds; //caching
        // if the registering is completed
        // i.e. the number of registered workers matches with the number of required workers (workersPerRound * numberOfRounds)
        if (task.registeredWorkers.length == workersPerRound*numberOfRounds){ // taskList[_taskId].registeringCompleted // taskList[_taskId].workersRequired
            emit NeedRandomness(_taskId, numberOfRounds, workersPerRound*10);
        }
    }

    //helper function
    function isAlreadyWorker(address worker, address[] memory regWorkers) internal pure returns(bool) {
        for (uint i=0; i<regWorkers.length; i++) {
            if (regWorkers[i] == worker) return true;
        }
        return false;
    }

    function register(uint _taskId) validTask(_taskId) external {
        Task storage task = taskList[_taskId];
        uint numRegWorkers = task.registeredWorkers.length; //caching
        uint16 workersPerRound = task.workersPerRound; //caching
        uint16 numberOfRounds = task.numberOfRounds; //caching
        uint16 workersRequired = workersPerRound*numberOfRounds;
        require(numRegWorkers < workersRequired, "Impossible to register!");
        //check if address is already registered
        require(!isAlreadyWorker(msg.sender, task.registeredWorkers));
        task.registeredWorkers.push();
        task.registeredWorkers[numRegWorkers] = msg.sender; // no need to decrease by 1 because refers to the value before the push
        if (numRegWorkers+1 == workersRequired) { // numRegWorkers refers to the value before the push, so the +1 it's because of the push above
            // task.registeringCompleted = true; // can be removed, is equivalent to perform the check task.registeredWorkers.length == task.workersRequired)
            if (task.fundingCompleted) {
                emit NeedRandomness(_taskId, numberOfRounds, workersPerRound*10);
            }
        }
    }

    function setRandomness(uint _taskId, uint16[] calldata _seeds) validTask(_taskId) external {
        //require(msg.sender == oracle); //only the oracle can set the seeds
        Task storage task = taskList[_taskId];
        uint numOfRegWorkers = task.registeredWorkers.length;
        uint workersRequired = task.workersPerRound*task.numberOfRounds;
        require(_seeds.length == workersRequired, "Seeds are not enough!");
        require(numOfRegWorkers == workersRequired); //Registering completed
        require(task.fundingCompleted); //The funding is stopped
        require(task.state == State.DEPLOYED); //the training wasn't started yet
        //require(task.seeds.length == 0); //seeds were not set yet
        //task.seeds = _seeds;
        shuffleWorkers(_taskId, _seeds);
        startRound(_taskId);
    }

    function shuffleWorkers(uint _taskId, uint16[] calldata _seeds) internal {
        // Shuffle the registeredWorkers array
        // Since we know the current round and the number of workers per round then
        // we can refer to the corresponding portion of the array registeredWorkers for the single round 
        Task storage task = taskList[_taskId];        
        uint numOfRegWorkers = task.registeredWorkers.length; //number of registered workers to the task _taskId
        for (uint i = 0; i < numOfRegWorkers; i++) {
            uint j = _seeds[i] % numOfRegWorkers;
            address worker = task.registeredWorkers[j];
            task.registeredWorkers[j] = task.registeredWorkers[i];
            task.registeredWorkers[i] = worker;
        }
    }
 
    function startRound(uint _taskId) internal {
        Task storage task = taskList[_taskId];
        task.state = State.STARTED;
        uint currentRound = task.rounds.length; //caching
        task.rounds.push(); //task.rounds.length increments by 1        
        // Starting round number currentRound (where 0 <= currentRound <= numberOfRounds-1)
        console.log("Starting round number %s", currentRound);
        //Start next round and give to the workers the work from the previous round
        if (currentRound > 0) {
            console.log("Sending previous works...");
                //uint16 workersPerRound = task.workersPerRound;
                // the loop maybe can be optimized (?)
                for (uint16 i = 0; i < task.workersPerRound; i++) {
                    console.log(task.rounds[currentRound-1].committedWorks[i]);
                }
        }
        emit RoundStarted(_taskId, currentRound); //task.rounds[task.currentRound-1].committedWorks
        //}
    }
    
    //function selectWorkers(uint _taskId, uint16 seed) internal {
        //console.log("Selecting workers...");
        //Task storage task = taskList[_taskId]; //caching
        //uint16 workersPerRound = task.workersPerRound; //caching?? A: No need, it is used just once in this function!
        //uint currentRound = task.rounds.length-1;
        // Shuffle the registeredWorkers array
        // Since we know the current round and the workers per round we refer to subarrays of the registeredWorkers array for the single round      
        //uint numOfRegWorkers = task.registeredWorkers.length; // number of registered workers to the task taskId

        //for (uint16 i=0; i < task.workersPerRound; i++) {

            //task.rounds[currentRound].ranking.push(); //task.currentRound // I moved it into commitWork()
            //task.rounds[currentRound].workers.push(); //task.currentRound
            //task.rounds[currentRound].committedWorks.push(); //added later
            
            //uint16 offset = 0;
            //uint numOfRegWorkers = task.registeredWorkers.length; // number of registered workers to the task taskId
            //address worker = task.registeredWorkers[(seed + i) % numOfRegWorkers]; // task.registeredWorkers.length
            //while (task.selectedWorkers.contains(worker)) {
            //while (selectedWorkersMap[_taskId].contains(worker)) { // Should cache selectedWorkersMap[_taskId] here, maybe
                //offset++;
                //worker = task.registeredWorkers[(seed + i + offset) % numOfRegWorkers]; // task.registeredWorkers.length
            //}

            //task.rounds[currentRound].workers[i] = worker; //task.currentRound
            //selectedWorkersMap[_taskId].add(worker);
            //console.log("Selected worker at address: %s", worker);
        //}
        //emit Selected(_taskId ,task.rounds[currentRound].workers, currentRound); //task.currentRound           
    //}

    function commitWork(uint _taskId, string calldata work, uint256[] calldata votes) validTask(_taskId) external {        
        Task storage task = taskList[_taskId];     

        require(task.state == State.STARTED); //task not completed yet

        uint currentRound = task.rounds.length-1;

        //check if the worker was selected, i.e. that it is in the proper portion of the array registeredWorkers after the shuffling
        bool isWorkerSelected = false;
        // the loop can be optimized, todo change it into a while loop
        for (uint i = currentRound*task.workersPerRound; i < currentRound*task.workersPerRound+task.workersPerRound; i++) {
            if(task.registeredWorkers[i] == msg.sender) {
                isWorkerSelected = true;
                break;
            }
        }
        require(isWorkerSelected);

        // check if the worker has already committed
        bool hasCommitted = false;
        for (uint i = 0; i < task.rounds[currentRound].workers.length; i++) {
            if(task.rounds[currentRound].workers[i] == msg.sender) {
                hasCommitted = true;
                break;
            }
        }
        require(!hasCommitted);

        uint commitCount = task.rounds[currentRound].committedWorks.length;

        task.rounds[currentRound].workers.push();
        task.rounds[currentRound].committedWorks.push();
        task.rounds[currentRound].ranking.push();
        task.rounds[currentRound].workers[commitCount] = msg.sender;
        task.rounds[currentRound].committedWorks[commitCount] = work;
        
        //replace task.rounds[currentRound].committedWorks[commitCount] with work (line below)
        console.log("Worker %s submitted %s", msg.sender, task.rounds[currentRound].committedWorks[commitCount]);
        commitCount++;
        //If it is not the first round then update the ranking of the previous round
        if (currentRound != 0) {
            // update previous round ranking
            //updatePreviousRoundRanking(_taskId, votes);
            //the i-th worker of the previous round receives votes[i] attestations (points?)
            for (uint16 i = 0; i < votes.length; i++) {
                task.rounds[currentRound-1].ranking[i] += votes[i];
            }
        }
        
        //If it was the last commitment for the current round, end the round
        if (commitCount == task.workersPerRound) {
            console.log("All workers submitted their work for round %s", currentRound);
            endRound(_taskId);
        }
    }

    // EMBEDDED INTO commitWork()
    // function updatePreviousRoundRanking(uint _taskId, uint256[] memory votes) internal {
    //function updatePreviousRoundRanking(uint _taskId, uint256[] calldata votes) internal {
    //    Task storage task = taskList[_taskId]; //caching
    //    uint currentRound = task.rounds.length-1;
        //the i-th worker of the previous round receives votes[i] attestations (points?)
    //    for (uint16 i = 0; i < votes.length; i++) {
    //        task.rounds[currentRound-1].ranking[i] += votes[i]; //task.currentRound
    //    }
    //}

    function endRound(uint _taskId) internal {
        Task storage task = taskList[_taskId]; //caching
        uint currentRound = task.rounds.length; // -1 (?)
        // if the current round is the last one then terminate the task
        if (currentRound == task.numberOfRounds) { 
            // END TASK
            //assign rewards
            taskList[_taskId].state = State.COMPLETED;
            emit TaskEnded(_taskId);
        }
        else {
            startRound(_taskId);
        }
    }

    // EMBEDDED INTO endRound()
    //function endTask(uint _taskId) internal {
        //assign rewards
    //    taskList[_taskId].state = State.COMPLETED;
    //    emit TaskEnded(_taskId);
    //}

    function getRanking(uint _taskId) validTask(_taskId) external view returns (uint256[][] memory) {
        Task storage task = taskList[_taskId];
        uint16 numOfRounds = task.numberOfRounds;
        uint256[][] memory ranking = new uint256[][](numOfRounds);
        for (uint16 i = 0; i < numOfRounds; i++) {
            ranking[i] = task.rounds[i].ranking;
            console.log("Round number: %s, ranking:\n", i);
            for (uint256 j = 0; j < ranking[i].length; j++) {
                console.log("%s",ranking[i][j]);
            }
        }
        return ranking;
    }

    function getWork(uint _taskId) validTask(_taskId) external view returns (string[][] memory) {
        Task storage task = taskList[_taskId];
        uint16 numOfRounds = task.numberOfRounds;
        string[][] memory work = new string[][](numOfRounds);
        for (uint16 i = 0; i < numOfRounds; i++) {
            work[i] = task.rounds[i].committedWorks;
        }
        return work;
    }

    function getWorkers(uint _taskId) validTask(_taskId) external view returns (address[][] memory) {
        Task storage task = taskList[_taskId];
        uint16 numOfRounds = task.numberOfRounds;
        address[][] memory workers = new address[][](numOfRounds);
        for (uint16 i = 0; i < numOfRounds; i++) {
            workers[i] = task.rounds[i].workers;
        }
        return workers;
    }

}
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

import "hardhat/console.sol";

//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

/* Note that in a string each character is a byte.
 So make string size multiple of 32 bytes (because of the 256 bit slot) if possible. Also in "require" statament.
 If a string is less thatn 32 characters (bytes) convert it in bytes32 type */

/* If a function is only used externally, mark it as External to save gas.
Because in public functions, Solidity immediately copies array arguments to memory, while external functions can read directly from calldata */

// compress input data taken from the user

// shortest function name -> less gas 

// enable optimizer when deploying the contract for optimize future transactional cost (entails more cost on deploy)

//check if a modifier is better than a function for saving gas.

// Evaluate if deleting completed tasks in some way.

contract FedMLContract {

    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    event Selected(uint taskId, address[] workers, uint16 roundNumber);
    event NeedRandomness(uint taskId, uint16 numberOfSeeds, uint16 upperBound);
    event RoundStarted(uint taskId, string[] previousWork, uint16 roundNumber);
    event TaskEnded(uint taskId);
    event NewFunding(uint taskId, uint numFunders, uint updatedBalance, uint value);

    event Deployed(uint taskId);

    enum State {DEPLOYED, STARTED, COMPLETED}

    struct Round {
        //order this list in a proper way to save gas fee (evm memory slots are made by 256 bits)
        uint16 commitCount;
        // The following three arrays are synchronized meaning that workers[i] hasstatetask. committed committedWorks[i] and is ranked ranking[i]
        address[] workers;
        string[] committedWorks; //this should be converted
        uint256[] ranking;
    }

    struct Task{

        //order this list in a proper way to save gas fee (evm memory slots are made by 256 bits)
        uint id;
        string title;// this should be converted to byte32
        string description; // this should be converted???
        address issuer;
        uint16 numberOfRounds;
        uint16 workersRequired;
        uint16 workersPerRound;

        State state;

        uint16[] seeds;

        bool fundingCompleted;
        bool registeringCompleted;

        address[] registeredWorkers;

        Round[] rounds; //check how many bits this occupy to order properly
        uint16 currentRound;
    }

    uint public idCounter = 0; // counter of tasks IDs

    //this is sent to the workers of the first round
    string[] firstRoundWork; // can this thing be optimized??? otherwise check the immutable keyword

    mapping (uint taskId => EnumerableMap.AddressToUintMap funderMap ) taskFundersMap;

    mapping (uint taskId => EnumerableSet.AddressSet selectedWorkers ) selectedWorkersMap;

    Task[] private taskList;

    function deployTask(
        string calldata _title,
        string calldata _description,
        uint16 _numberOfRounds,
        uint16 _workersRequired
        ) external {
        require(_workersRequired >= _numberOfRounds);
        Task storage task = taskList.push();

        task.id = idCounter;
        task.title = _title;
        task.description = _description;
        task.issuer = msg.sender;
        task.numberOfRounds = _numberOfRounds;
        task.workersRequired = _workersRequired;
        task.workersPerRound = _workersRequired/_numberOfRounds;
        task.fundingCompleted = false;
        task.registeringCompleted = false;
        task.state = State.DEPLOYED;

        //deployedTasks.add(task.id);
        //taskList.push(task);

        emit Deployed(task.id);

        idCounter++;
    }

    /* function getAllTasks() public view returns (bytes32[] memory) {
        //Task[] memory tasks;
        //return deployedTasks._inner._values;
        

        for (uint i = 0; i < idCounter; increment) 
        {
            
        };
    } */

    modifier taskExist(uint _taskId) {
        require(_taskId < idCounter);
        _;
    }

    // ------------------------------------------- GETTERS -------------------------------------------

    function getAllTasks() public view returns (Task[] memory) {
        return taskList;
    }
    
    function getTask(uint _taskId) taskExist(_taskId) public view returns ( Task memory ) {
        return taskList[_taskId];
    }

    function getFunderList(uint _taskId) taskExist(_taskId) public view returns (address[] memory) {
        return taskFundersMap[_taskId].keys();
    }

    function getFundsAmount(uint _taskId) taskExist(_taskId) public view returns (uint) {
        uint totalFunds = 0;
        EnumerableMap.AddressToUintMap storage funderMap = taskFundersMap[_taskId]; 
        
        for (uint i = 0; i < funderMap.length(); i++) {
            (, uint amount) = funderMap.at(i);
            totalFunds += amount;
        }
        
        return totalFunds;
    }

    function getSelectedWorkers(uint _taskId) taskExist(_taskId) public view returns (address[] memory) {
        return selectedWorkersMap[_taskId].values(); //check return type of .values() (should be bytes32[])
    }

    //return also funding amount?
    function amFunder(uint _taskId) taskExist(_taskId) public view returns (bool) {
        return taskFundersMap[_taskId].contains(msg.sender);
    }

    function amWorker(uint _taskId) taskExist(_taskId) public view returns (bool) {
        //return selectedWorkersMap[_taskId].contains(msg.sender);
        address[] memory regWorkers = taskList[_taskId].registeredWorkers;
        return isAlreadyWorker(msg.sender, regWorkers);
    }

    function amIssuer(uint _taskId) taskExist(_taskId) public view returns (bool) {
        return taskList[_taskId].issuer == msg.sender;
    }



    // ------------------------------------------- PROCESS -------------------------------------------
    
    function fund(uint _taskId) taskExist(_taskId) public payable {
        //how to estimate gas fee? Also for the oracle balance to execute transactions
        require(msg.value > 0);
        require(taskList[_taskId].fundingCompleted == false);

        EnumerableMap.AddressToUintMap storage funderMap = taskFundersMap[_taskId]; // taskList[_taskId].funderMap;

        if (funderMap.contains(msg.sender)){
            funderMap.set(msg.sender, funderMap.get(msg.sender) + msg.value); //check if this is correct
        }
        else{ // is New Funder
            funderMap.set(msg.sender, msg.value);
        }
        emit NewFunding(_taskId, funderMap.length(), msg.value, funderMap.get(msg.sender));
    }

    function stopFunding(uint _taskId) taskExist(_taskId) external {
        require(msg.sender == taskList[_taskId].issuer);

        taskList[_taskId].fundingCompleted = true;
        if (taskList[_taskId].registeringCompleted){
            emit NeedRandomness(_taskId, taskList[_taskId].numberOfRounds, taskList[_taskId].workersPerRound*10);
        }

    }

    //helper function
    function isAlreadyWorker(address worker, address[] memory regWorkers) internal pure returns(bool){
        for (uint i=0; i<regWorkers.length; i++) 
        {
            if (regWorkers[i] == worker) return true;
        }
        return false;
    }


    function register(uint _taskId) taskExist(_taskId) public {
        Task storage task = taskList[_taskId];
        //check if address is already registered
        require(task.registeredWorkers.length < task.workersRequired, "Impossible to register!");
        require(task.registeringCompleted == false);
        require(!isAlreadyWorker(msg.sender, task.registeredWorkers));
        task.registeredWorkers.push();
        task.registeredWorkers[task.registeredWorkers.length - 1] = msg.sender;

        if (task.registeredWorkers.length == task.workersRequired) {
            task.registeringCompleted = true;
            if (task.fundingCompleted){
                emit NeedRandomness(_taskId, task.numberOfRounds, task.workersPerRound*10);
            }
        }
    }

    function startRound(uint _taskId) taskExist(_taskId) internal {
        Task storage task = taskList[_taskId];
        task.state = State.STARTED;
        console.log("Starting round number %s", task.currentRound);
        task.rounds.push();
        selectWorkers(_taskId, task.seeds[task.currentRound]);
        if (task.currentRound == 0) {
            emit RoundStarted(_taskId, firstRoundWork, task.currentRound);
        } else {
            //Start next round and give to the workers the work from previous round
            console.log("Sending previous work");
            uint16 workersPerRound = task.workersPerRound; //caching?? Should i also cache task.currentRound?
            for (uint16 i = 0; i  < workersPerRound; i++) {
                console.log(task.rounds[task.currentRound - 1].committedWorks[i]);
            }
            emit RoundStarted(_taskId, task.rounds[task.currentRound - 1].committedWorks, task.currentRound);
        }
    }

    function setRandomness(uint _taskId, uint16[] memory _seeds) taskExist(_taskId) public {
        taskList[_taskId].seeds = _seeds;
        startRound(_taskId);
    }

    function selectWorkers(uint _taskId, uint16 seed) taskExist(_taskId) internal {
        console.log("Selecting workers...");
        Task storage task = taskList[_taskId];
        uint16 workersPerRound = task.workersPerRound; //caching??
        for (uint16 i = 0; i < workersPerRound; i ++) {
            task.rounds[task.currentRound].ranking.push();
            task.rounds[task.currentRound].workers.push();
            uint16 offset = 0;
            address worker = task.registeredWorkers[(seed + i) % task.registeredWorkers.length];
            //while (task.selectedWorkers.contains(worker)) {
            while (selectedWorkersMap[_taskId].contains(worker)){ // Should cache selectedWorkersMap[_taskId] here, maybe
                offset++;
                worker = task.registeredWorkers[(seed + i + offset) % task.registeredWorkers.length];
            }
            task.rounds[task.currentRound].workers[i] = worker;
            selectedWorkersMap[_taskId].add(worker);
            console.log("Selected worker at address: %s", worker);
        }
        emit Selected(_taskId ,task.rounds[task.currentRound].workers, task.currentRound);            
    }

    function commitWork(uint _taskId, string memory work, uint256[] memory votes) taskExist(_taskId) public {
        //TODO: Only selected workers can call this method 

        Task storage task = taskList[_taskId];
        //Save the work done
        task.rounds[task.currentRound].committedWorks.push();
        task.rounds[task.currentRound].workers[task.rounds[task.currentRound].commitCount] = msg.sender;
        task.rounds[task.currentRound].committedWorks[task.rounds[task.currentRound].commitCount] = work;
        

        console.log("Worker %s submitted %s", msg.sender, task.rounds[task.currentRound].committedWorks[task.rounds[task.currentRound].commitCount]);
        task.rounds[task.currentRound].commitCount++;
        //If it is not the first round, update the ranking of the previous round
        if (task.currentRound != 0) {
            updatePreviousRoundRanking(_taskId, votes);    
        }
        

        //If it was the last commitment for the current round, end the round
        if (task.rounds[task.currentRound].commitCount == task.workersPerRound) {
            console.log("All workers submitted their work for round %s", task.currentRound);
            endRound(_taskId);
        }
    }

    function updatePreviousRoundRanking(uint _taskId, uint256[] memory votes) taskExist(_taskId) internal {
        Task storage task = taskList[_taskId];
        //the i-th worker of the previous round receives votes[i] attestations (points?)
        for (uint16 i = 0; i < votes.length; i ++) {
            task.rounds[task.currentRound - 1].ranking[i] += votes[i]; 
        }
    }

    function endRound(uint _taskId) taskExist(_taskId) internal {
        Task storage task = taskList[_taskId];
        if (task.rounds.length == task.numberOfRounds) {
            endTask(_taskId);
        }
        else {
            task.currentRound++;
            startRound(_taskId);
        }
        
    }

    function endTask(uint _taskId) taskExist(_taskId) internal {
        //assign rewards
        taskList[_taskId].state = State.COMPLETED;
        emit TaskEnded(_taskId);
    }

    function getRanking(uint _taskId) taskExist(_taskId) public view returns (uint256[][] memory) {
        Task storage task = taskList[_taskId];
        uint256[][] memory ranking = new uint256[][](task.numberOfRounds);
        uint16 numOfRounds = task.numberOfRounds; // caching ??
        for (uint16 i = 0; i < numOfRounds; i++) {
            ranking[i] = task.rounds[i].ranking;
            console.log("Round number: %s, ranking:\n", i);
            for (uint256 j = 0; j < ranking[i].length; j++) {
                console.log("%s",ranking[i][j]);
            }
        }
        return ranking;
    }

    function getWork(uint _taskId) taskExist(_taskId) public view returns (string[][] memory) {
        Task storage task = taskList[_taskId];
        string[][] memory work = new string[][](task.numberOfRounds);
        uint16 numOfRounds = task.numberOfRounds; // caching ??
        for (uint16 i = 0; i < numOfRounds; i++) {
            work[i] = task.rounds[i].committedWorks;
        }
        return work;
    }

    function getWorkers(uint _taskId) taskExist(_taskId) public view returns (address[][] memory) {
        Task storage task = taskList[_taskId];
        address[][] memory workers = new address[][](task.numberOfRounds);
        uint16 numOfRounds = task.numberOfRounds; // caching ??
        for (uint16 i = 0; i < numOfRounds; i++) {
            workers[i] = task.rounds[i].workers;
        }
        return workers;
    }

}
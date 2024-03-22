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

    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    event Selected(uint taskId, address[] workers, uint roundNumber);
    event NeedRandomness(uint taskId, uint16 numberOfSeeds, uint16 upperBound);
    event RoundStarted(uint taskId, uint roundNumber);
    event TaskEnded(uint taskId);
    event NewFunding(uint taskId, uint numFunders, uint updatedBalance, uint value);

    event Deployed(uint taskId);

    enum State {DEPLOYED, STARTED, COMPLETED}

    struct Round {
        // we coudld transform all the following arrays into mappings index -> value
        //order this list in a proper way to save gas fee (evm memory slots are made by 256 bits)
        // uint16 commitCount;
        // couldn't the three following arrays be of fixed size? (we know the number of workersPerRound) alternative to the use of the mappings  
        // The following three arrays are synchronized meaning that workers[i] hasstatetask. committed committedWorks[i] and is ranked ranking[i]
        address[] workers;
        string[] committedWorks; //this should be converted (to byte32)
        uint256[] ranking; // a smaller uint (?) (or store a json file to the IPFS, which means keep 32 bytes for the address)
    }

    struct Task {

        //order this list in a proper way to save gas fee (evm memory slots are made by 256 bits)
        uint id;
        /* Maybe we can store both the tile and the description in a json file and upload it then on an IPFS,
        because at the end the title and the description are metadata of the task, not real data that we use within the SC
        (like for NFT metadata) in this way we can avoid one variable and so save gas. */
        bytes32 title;
        bytes32 description;
        address issuer;
        uint16 numberOfRounds;
        //uint16 workersRequired;
        uint16 workersPerRound;

        State state;

        uint16[] seeds;

        bool fundingCompleted;
        //bool registeringCompleted;

        address[] registeredWorkers;

        Round[] rounds; //check how many bits this occupy to order properly, couldn't  it be of fixed size? (we know the numberOfRound)
        //uint16 currentRound; // we can get rid of it because it is equivalent to calling rounds.length
    }
 
    /* uint public idCounter; // = 0; // counter of tasks IDs 
                           there is really no need to initialize the variable, it is 0 by default (saves gas) 
                           (why we need this variable? Couldn't we use the length method to check the length of the array "taskList"?)*/


    //this is sent to the workers of the first round
    //bytes32 firstRoundWork; // can this thing be optimized??? otherwise check the immutable keyword

    mapping (uint taskId => EnumerableMap.AddressToUintMap funderMap ) taskFundersMap;

    mapping (uint taskId => EnumerableSet.AddressSet selectedWorkers ) selectedWorkersMap;

    Task[] private taskList;

    // convert strings into bytes32
    function stringToBytes32(string memory str) internal pure returns (bytes32 result) {
        // assembly code helps us to save gas
        assembly {
            result := mload(add(str, 32))
            }
    }

    function deployTask(
        bytes32 _title,
        bytes32 _description, // IPFS (?)
        uint16 _numberOfRounds,
        uint16 _workersPerRound
        //uint16 _workersRequired
        ) external {
        //require(_workersRequired >= _numberOfRounds);
        require(_workersPerRound > 1);
        require(_numberOfRounds > 1);        
        require(_title.length <= 32, "Title too long");
        require(_description.length <= 32, "Description too long");
        Task storage task = taskList.push();
        //task.id = idCounter;//taskList.length;
        task.title = _title;
        task.description = _description;
        task.issuer = msg.sender;
        task.numberOfRounds = _numberOfRounds;
        //task.workersRequired = _workersRequired;
        task.workersPerRound = _workersPerRound; /*_workersRequired/_numberOfRounds; /* the integer division rounds down the to the nearest integer 
        if the nuber of rounds is not a multiple of workersRequired we'll have a number of workers per rounds which sum will give
        us a number that is lower than the workersRequred, throwing away one workers (wrong behaviour!) */
        task.fundingCompleted = false;
        //task.registeringCompleted = false;
        task.state = State.DEPLOYED;

        //deployedTasks.add(task.id);
        //taskList.push(task);

        emit Deployed(task.id);

        /*++idCounter; // increment first and then return is more efficient than first return and then increment
                        because in that case we have a value more in the stack to preserve (compiler level optimization) */
    }

    /* function getAllTasks() public view returns (bytes32[] memory) {
        //Task[] memory tasks;
        //return deployedTasks._inner._values;
        

        for (uint i = 0; i < idCounter; increment) 
        {
            
        };
    } */

    modifier validTask(uint _taskId) {
        require(_taskId < taskList.length); // idCounter == taskList.length
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

    function getSelectedWorkers(uint _taskId) validTask(_taskId) external view returns (address[] memory) {
        return selectedWorkersMap[_taskId].values(); //check return type of .values() (should be bytes32[])
    }

    // What about merging all the "am"-functions into one function that gives us all the roles? e.g. getRoles()

    function getRoles(uint _taskId) validTask(_taskId) external view returns (bool, bool, bool) {
        return(
            taskFundersMap[_taskId].contains(msg.sender),
            isAlreadyWorker(msg.sender, taskList[_taskId].registeredWorkers),
            taskList[_taskId].issuer == msg.sender
        );
    }

    //return also funding amount?
    //function amFunder(uint _taskId) validTask(_taskId) public view returns (bool) {
    //    return taskFundersMap[_taskId].contains(msg.sender);
    //maybe return only the amount if it is >0 it is a founder, if it is =0 it is not 
    //}

    //function amWorker(uint _taskId) validTask(_taskId) public view returns (bool) {
        //return selectedWorkersMap[_taskId].contains(msg.sender);
        //address[] memory regWorkers = taskList[_taskId].registeredWorkers; 
        // temporary variable regWorkers not needed, we can directly insert the code below to save gas
        //return isAlreadyWorker(msg.sender, taskList[_taskId].registeredWorkers);
    //}

    //function amIssuer(uint _taskId) validTask(_taskId) public view returns (bool) {
        //return taskList[_taskId].issuer == msg.sender;
    //}



    // ------------------------------------------- PROCESS -------------------------------------------
    
    function fund(uint _taskId) validTask(_taskId) external payable {
        //how to estimate gas fee? Also for the oracle balance to execute transactions
        require(msg.value > 0); // non-zero funding
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

    function stopFunding(uint _taskId) validTask(_taskId) external {
        Task storage task = taskList[_taskId];
        require(msg.sender == task.issuer);
        require(task.fundingCompleted == false);
        task.fundingCompleted = true;
        uint16 workersRequired = task.workersPerRound * task.numberOfRounds;
        if (task.registeredWorkers.length == workersRequired){ // taskList[_taskId].registeringCompleted // taskList[_taskId].workersRequired
            emit NeedRandomness(_taskId, task.numberOfRounds, task.workersPerRound*10);
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

    function register(uint _taskId) validTask(_taskId) external {
        Task storage task = taskList[_taskId];
        //check if address is already registered
        uint16 workersRequired = task.workersPerRound*task.numberOfRounds;
        uint numRegWorkers = task.registeredWorkers.length;
        require(numRegWorkers < workersRequired, "Impossible to register!");
        require(!isAlreadyWorker(msg.sender, task.registeredWorkers));
        task.registeredWorkers.push();
        task.registeredWorkers[numRegWorkers - 1] = msg.sender;

        if (task.registeredWorkers.length == workersRequired) {
            // task.registeringCompleted = true; // can be removed, is equivalent to perform the check task.registeredWorkers.length == task.workersRequired)
            if (task.fundingCompleted) {
                emit NeedRandomness(_taskId, task.numberOfRounds, task.workersPerRound*10);
            }
        }
    }

    function setRandomness(uint _taskId, uint16[] memory _seeds) validTask(_taskId) external {
        taskList[_taskId].seeds = _seeds;
        startRound(_taskId);
    }

    function startRound(uint _taskId) internal {
        Task storage task = taskList[_taskId];
        uint16 workersRequired = task.workersPerRound*task.numberOfRounds;
        require(task.fundingCompleted == true);
        require(task.registeredWorkers.length == workersRequired); //taskList[_taskId].registeringCompleted = true
        task.state = State.STARTED;
        task.rounds.push(); //task.rounds.length increments by 1        
        uint currentRound = task.rounds.length-1; // caching
        // Starting round number i, where i is from 0 to numberOfRounds-1
        console.log("Starting round number %s", currentRound); //task.currentRound
        selectWorkers(_taskId, task.seeds[currentRound]); //task.currentRound
        //if (currentRound == 0) { //task.currentRound == 0
        //    emit RoundStarted(_taskId, currentRound); //task.currentRound
        //} else {
        //Start next round and give to the workers the work from previous round
        console.log("Sending previous work...");
            //uint16 workersPerRound = task.workersPerRound;
            // the loop maybe can be optimized (?)
            //for (uint16 i = 0; i < task.workersPerRound; i++) { //workersPerRound
            //    console.log(task.rounds[currentRound-1].committedWorks[i]); //task.currentRound-1
            //}
        emit RoundStarted(_taskId, currentRound); //task.rounds[task.currentRound-1].committedWorks
        //}
    }

    function selectWorkers(uint _taskId, uint16 seed) internal {
        console.log("Selecting workers...");
        Task storage task = taskList[_taskId];
        //uint16 workersPerRound = task.workersPerRound; //caching?? A: No need, it is used just once in this function!
        uint currentRound = task.rounds.length-1;
        // the loop maybe can be optimized (?)
        for (uint16 i = 0; i < task.workersPerRound; i ++) {
            task.rounds[currentRound].ranking.push(); //task.currentRound
            task.rounds[currentRound].workers.push(); //task.currentRound
            uint16 offset = 0;
            uint numOfRegWorkers = task.registeredWorkers.length; // number of registered workers to the task taskId
            address worker = task.registeredWorkers[(seed + i) % numOfRegWorkers]; // task.registeredWorkers.length
            //while (task.selectedWorkers.contains(worker)) {
            while (selectedWorkersMap[_taskId].contains(worker)){ // Should cache selectedWorkersMap[_taskId] here, maybe
                offset++;
                worker = task.registeredWorkers[(seed + i + offset) % numOfRegWorkers]; // task.registeredWorkers.length
            }
            task.rounds[currentRound].workers[i] = worker; //task.currentRound
            selectedWorkersMap[_taskId].add(worker);
            console.log("Selected worker at address: %s", worker);
        }
        emit Selected(_taskId ,task.rounds[currentRound].workers, currentRound); //task.currentRound           
    }

    function commitWork(uint _taskId, string memory work, uint256[] memory votes) validTask(_taskId) external {
        //TODO: Only selected workers can call this method 

        Task storage task = taskList[_taskId];
        uint currentRound = task.rounds.length-1;
        //Save the work done
        uint commitCount = task.rounds[currentRound].committedWorks.length;
        task.rounds[currentRound].committedWorks.push(); //task.currentRound
        task.rounds[currentRound].workers[commitCount] = msg.sender; //task.currentRound
        task.rounds[currentRound].committedWorks[commitCount] = work; //task.currentRound
        

        console.log("Worker %s submitted %s", msg.sender, task.rounds[currentRound].committedWorks[commitCount]); //task.currentRound
        commitCount++; //task.currentRound
        //If it is not the first round, update the ranking of the previous round
        if (currentRound != 0) { //task.currentRound
            updatePreviousRoundRanking(_taskId, votes);    
        }
        

        //If it was the last commitment for the current round, end the round
        if (commitCount == task.workersPerRound) { //task.currentRound
            console.log("All workers submitted their work for round %s", currentRound); //task.currentRound
            endRound(_taskId);
        }
    }

    function updatePreviousRoundRanking(uint _taskId, uint256[] memory votes) internal {
        Task storage task = taskList[_taskId];
        uint currentRound = task.rounds.length-1;
        //the i-th worker of the previous round receives votes[i] attestations (points?)
        for (uint16 i = 0; i < votes.length; i++) {
            task.rounds[currentRound-1].ranking[i] += votes[i]; //task.currentRound
        }
    }

    function endRound(uint _taskId) internal {
        Task storage task = taskList[_taskId];
        uint currentRound = task.rounds.length-1;
        if (currentRound == task.numberOfRounds) {
            endTask(_taskId);
        }
        else {
            //task.currentRound++; //task.rounds.length increments by 1
            startRound(_taskId);
        }
        
    }

    function endTask(uint _taskId) internal {
        //assign rewards
        taskList[_taskId].state = State.COMPLETED;
        emit TaskEnded(_taskId);
    }

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
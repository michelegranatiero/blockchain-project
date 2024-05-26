// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

// compress input data taken from the user

// enable optimizer when deploying the contract for optimize future transactional cost (entails more cost on deploy)

//check if a modifier is better than a function for saving gas. A: it depends by the context there is no rule for that.

contract FedMLContract {

    using EnumerableMap for EnumerableMap.AddressToUintMap;

    event Deployed(uint taskId);
    event Registered(uint taskId, address worker);
    event NewFunding(uint taskId, uint numFunders, uint updatedBalance, uint value);
    event StopFunding(uint taskId);
    event NeedRandomness(uint taskId, uint upperBound);
    event RoundStarted(uint taskId, uint roundNumber);
    event TaskEnded(uint taskId);


    enum State {DEPLOYED, STARTED, COMPLETED, ABORTED}

    //address oracle;
    //address owner;

    struct Commit {
        address committer;
        bytes32 hashPart1;
        bytes32 hashPart2;
    }

    struct Round {
        //address[] workers; // use the same reasoning of ranking, so store instead of an address an unit16 (?)
        uint[] ranking; // a smaller uint (?). A: workersPerRound is uint16, so uint256[] can become uint16[], A: surprisingly increases gas 
        Commit[] committedWorks;
        uint totalScore;
    }

    struct Task {
        uint id; //32 bytes
        uint numberOfRounds;
        uint workersPerRound;
        //added entranceFee for computing rewards
        uint entranceFee;
        Commit model; //initial weights
        address admin; //20 bytes //the admin of the task is stored inside the struct of the model
        State state; //1 bytes
        bool fundingCompleted; // 1 bytes
        //the following two arrays are synchronized
        address[] registeredWorkers;
        bool[] hasPendingReward;
        Round[] rounds;
    }
 
    mapping (uint taskId => EnumerableMap.AddressToUintMap funderMap) taskFundersMap;

    uint public taskCounter = 0;
    mapping (uint taskId => Task task) taskList;
    mapping (address => uint) pendingRewards; //rewards assigned to workers



    function deployTask(
        bytes32 _hashPart1,
        bytes32 _hashPart2,
        uint _numberOfRounds,
        uint _workersPerRound
        ) external {
        require(_workersPerRound > 1);
        require(_numberOfRounds > 1);
        Task storage task = taskList[taskCounter];
        task.id = taskCounter++;
        task.admin = msg.sender; //the admin of the task is stored inside the struct of the model
        task.model = Commit(msg.sender, _hashPart1, _hashPart2);
        task.numberOfRounds = _numberOfRounds;
        task.workersPerRound = _workersPerRound;
        //task.entranceFee = _entranceFee; this needs to be computed after the task is deployed
        task.fundingCompleted; //by default initialized to false (saves gas)
        task.state = State.DEPLOYED;
        emit Deployed(task.id); //this event needs to be catched by the oracle
    }

    modifier validTask(uint _taskId) {
        //require(_taskId < taskList.length);
        require(_taskId < taskCounter);
        _;
    }

    // ------------------------------------------- GETTERS -------------------------------------------
    
    function getTask(uint _taskId) validTask(_taskId) external view returns (Task memory) {
        return taskList[_taskId];
    }

    function getFunderList(uint _taskId) validTask(_taskId) external view returns (address[] memory) {
        return taskFundersMap[_taskId].keys();
    }

    function getFundsAmount(uint _taskId) validTask(_taskId) public view returns (uint) {
        uint totalFunds = 0;
        EnumerableMap.AddressToUintMap storage funderMap = taskFundersMap[_taskId]; 
        for (uint i = 0; i < funderMap.length(); i++) {
            (, uint amount) = funderMap.at(i);
            totalFunds += amount;
        }
        return totalFunds;
    }


    // Return the role of the sender within the specified task.
    // The returned value is a triple of bools, respectively indicating if it is a funder, a worker and an admin of the task. 
    function getRoles(uint _taskId) validTask(_taskId) external view returns (bool isFunder, bool isWorker, bool isAdmin) {
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
        require(!taskList[_taskId].fundingCompleted); //funding still open
        EnumerableMap.AddressToUintMap storage funderMap = taskFundersMap[_taskId]; //taskList[_taskId].funderMap;
        // if the user is already a funder (he has already funded in the past)
        if (funderMap.contains(msg.sender)) {
            // then increase the funding amount 
            funderMap.set(msg.sender, funderMap.get(msg.sender) + msg.value); //check if this is correct
        }
        else { //otherwise: New Funder
            funderMap.set(msg.sender, msg.value);
        }
        console.log("User %s funded %d", msg.sender, msg.value);
        emit NewFunding(_taskId, funderMap.length(), msg.value, funderMap.get(msg.sender)); 
        //Do we need all of these parameters for the event?
    }

    function stopFunding(uint _taskId) validTask(_taskId) external {
        Task storage task = taskList[_taskId];
        require(msg.sender == task.admin); // only the admin can stop the funding
        // or the oracle if we want to set a timer/funding treshold
        require(!task.fundingCompleted); // the funding wasn't stopped yet
        task.fundingCompleted = true;
        //uint16 workersRequired = task.workersPerRound * task.numberOfRounds; // removed to save gas, added comment instead
        uint workersPerRound = task.workersPerRound; //caching
        uint numberOfRounds = task.numberOfRounds; //caching
        // if the registering is completed
        // i.e. the number of registered workers matches with the number of required workers (workersPerRound * numberOfRounds)
        if (task.registeredWorkers.length == workersPerRound*numberOfRounds) { // taskList[_taskId].registeringCompleted // taskList[_taskId].workersRequired
            emit NeedRandomness(_taskId, workersPerRound*10); //workersPerRound*10 (???)
        }
        emit StopFunding(_taskId);
    }

    //helper function
    function isAlreadyWorker(address worker, address[] memory regWorkers) internal pure returns(bool) {
        for (uint i=0; i<regWorkers.length; i++) {
            if (regWorkers[i] == worker) return true;
        }
        return false;
    }

    function register(uint _taskId) payable validTask(_taskId) external {
        Task storage task = taskList[_taskId];
        uint numRegWorkers = task.registeredWorkers.length; //caching
        uint workersPerRound = task.workersPerRound; //caching
        uint numberOfRounds = task.numberOfRounds; //caching
        uint workersRequired = workersPerRound*numberOfRounds;
        require(numRegWorkers < workersRequired, "Impossible to register!");
        //check if address is already registered
        require(!isAlreadyWorker(msg.sender, task.registeredWorkers));
        console.log("Registered worker %d",numRegWorkers);
        task.registeredWorkers.push();
        task.registeredWorkers[numRegWorkers] = msg.sender; // no need to decrease by 1 because refers to the value before the push
        if (numRegWorkers+1 == workersRequired) { // (task.registeredWorkers.length == workersRequired) numRegWorkers refers to the value before the push, so the +1 it's because of the push above
            console.log("All workers registered!");
            if (task.fundingCompleted) {
                console.log("Requesting randomness...");
                emit NeedRandomness(_taskId, workersPerRound*10);
            }
        }
        emit Registered(_taskId, msg.sender);
    }

    function setRandomness(uint _taskId, uint _seed) validTask(_taskId) external {
        //require(msg.sender == oracle); //only the oracle can set the seeds
        Task storage task = taskList[_taskId];
        uint numOfRegWorkers = task.registeredWorkers.length;
        uint workersRequired = task.workersPerRound*task.numberOfRounds;
        require(numOfRegWorkers == workersRequired); //Registering completed
        require(task.fundingCompleted); //The funding is stopped
        require(task.state == State.DEPLOYED); //the training wasn't started yet
        //require(task.seeds.length == 0); //seeds were not set yet
        //task.seeds = _seeds;
        shuffleWorkers(_taskId, _seed);
        task.state = State.STARTED; //the task is started when the registration and the funding phases are completed and the seed is received         
        startRound(_taskId);
    }

    function setEntranceFee(uint _taskId, uint _fee) validTask(_taskId) external {
        Task storage task = taskList[_taskId];
        require(msg.sender == task.admin);
        task.entranceFee = _fee;
    }

    function shuffleWorkers(uint _taskId, uint _seed) internal {
        // Shuffle the registeredWorkers array
        // Since we know the current round and the number of workers per round then
        // we can refer to the corresponding portion of the array registeredWorkers for the single round 
        Task storage task = taskList[_taskId];        
        uint numOfRegWorkers = task.registeredWorkers.length; //number of registered workers to the task _taskId

        for (uint i = 0; i < numOfRegWorkers; i++) {
            uint rand = uint(keccak256(abi.encodePacked(_seed, i)));
            uint j = rand % numOfRegWorkers;
            address worker = task.registeredWorkers[j];
            task.registeredWorkers[j] = task.registeredWorkers[i];
            task.registeredWorkers[i] = worker;
        }
    }
 
    function startRound(uint _taskId) internal {
        Task storage task = taskList[_taskId];
        uint currentRound = task.rounds.length; //caching
        task.rounds.push(); //task.rounds.length increments by 1        
        // Starting round number currentRound (where 0 <= currentRound <= numberOfRounds-1)
        console.log("Starting round number %s", currentRound);
        //Start next round
        emit RoundStarted(_taskId, currentRound); //task.rounds[task.currentRound-1].committedWorks
        //}
    }
    
    //Checks if worker is selected for the current round
    function isWorkerSelected(uint _taskId, address worker, uint _round) validTask(_taskId) view public returns (bool) {
        Task storage task = taskList[_taskId];
        require(task.rounds.length > 0); //at least one round has been started
        //check if the worker was selected, i.e. that it is in the proper portion of the array registeredWorkers after the shuffling
        bool selected = false;
        // the loop can be optimized, todo change it into a while loop
        uint workersPerRound = task.workersPerRound; //caching
        for (uint i = _round*workersPerRound; i < workersPerRound*(_round+1); i++) {
            if(task.registeredWorkers[i] == worker) {
                selected = true;
                break;
            }
        }
        return selected;
    }

    //Checks if the worker has already committed for the current round
    function hasCommitted(uint _taskId, address worker) validTask(_taskId) view public returns (bool) {
        Task storage task = taskList[_taskId]; 
        require(task.rounds.length > 0); //at least one round has been started
        uint currentRound = task.rounds.length-1;
        bool committed = false;
        for (uint i = 0; i < task.rounds[currentRound].committedWorks.length; i++) {
            if(task.rounds[currentRound].committedWorks[i].committer == worker) {
                committed = true;
                break;
            }
        }
        return committed;
    }

    function commit(uint _taskId, bytes32 workPart1, bytes32 workPart2, uint[] calldata votes) validTask(_taskId) external {
                
        Task storage task = taskList[_taskId];
        require(task.state == State.STARTED, "Task not started!"); //task not completed yet
        require(isWorkerSelected(_taskId, msg.sender, task.rounds.length -1), "You are not selected!"); //the worker is selected for the current round, could prevent registering!
        require(!hasCommitted(_taskId, msg.sender), "You have already committed!"); //the worker has not committed yet
        uint currentRound = task.rounds.length-1;

        if (currentRound > 0) {
            require(votes.length == task.workersPerRound); 
            for (uint i = 0; i < votes.length; i++) {
                task.rounds[currentRound-1].ranking[i] += votes[i]; // assign or increase and assign?
                task.rounds[currentRound-1].totalScore += votes[i];
            }
        }

        Commit memory work;
        work.committer = msg.sender;
        task.rounds[currentRound].ranking.push();
        //check this check
        if (currentRound < task.workersPerRound) {
            work.hashPart1 = workPart1;
            work.hashPart2 = workPart2;
        }
        task.rounds[currentRound].committedWorks.push(work);
  
        //If it was the last commitment for the current round, end the round
        //uint commitCount = task.rounds[currentRound].committedWorks.length;
        if (task.rounds[currentRound].committedWorks.length == task.workersPerRound) {
            console.log("All workers submitted their work for round %s", currentRound);
            //endRound(_taskId);
            // END ROUND
            // if the current round is the last one then terminate the task
            if (currentRound+1 == task.numberOfRounds) {
                //endTask(_taskId);
                // END TASK
                //assign rewards
                task.state = State.COMPLETED;
                emit TaskEnded(_taskId);
            }            
                startRound(_taskId);
            }
        }
    }

    function lastRoundCommit(uint _taskId, uint[] calldata votes) validTask(_taskId) external {
        Task storage task = taskList[_taskId];
        require(task.state == State.STARTED, "Task not started!"); //task not completed yet
        require(isWorkerSelected(_taskId, msg.sender, task.rounds.length -1), "You are not selected!"); //the worker is selected for the current round, could prevent registering!
        require(!hasCommitted(_taskId, msg.sender), "You have already committed!");
    
        for (uint i = 0; i < votes.length; i++) {
                task.rounds[currentRound-1].ranking[i] += votes[i]; // assign or increase and assign?
                task.rounds[currentRound-1].totalScore += votes[i];
            }
    }

    function withdrawReward() external payable {
        Task storage task  = taskList[_taskId];
        uint workerIndex;
        for (uint i = 0; i < task.registeredWorkers.length; i++) {
            if (task.registeredWorkers[i] == msg.sender) {
                workerIndex = i;
                break;
            }
        }
        require(task.hasPendingReward[workerIndex], "No reward to be withdrawn");
        task.hasPendingRewards[workerIndex] = false;

        payable(msg.sender).transfer(amount);
    }


    function computeRewards(uint _taskId, uint _round) public returns (uint) {
        
        Task storage task  = taskList[_taskId];
        Round storage round = task.rounds[_round];
        

        uint fundedAmount = getFundsAmount(_taskId);

        

        uint roundBounty = fundedAmount / task.numberOfRounds;
        uint totalScore = round.totalScore;

        console.log("Round bounty is: %s", roundBounty);
        console.log("Total score for round %s is: %s", _round, totalScore);
        //for each worker compute the coefficient and assign the reward
        for (uint j = 0; j < task.workersPerRound; j++) {
            address worker = round.committedWorks[j].committer;
            uint coefficient = (round.ranking[j] * 1000) / totalScore;
            uint reward = task.entranceFee + (roundBounty * coefficient)/1000;
            
            pendingRewards[worker] += reward;
            console.log("Worker %s at round %s got reward %s", worker, _round, reward);
        }



    }

    function getRanking(uint _taskId) validTask(_taskId) external view returns (uint[][] memory) {
        Task storage task = taskList[_taskId];
        uint numOfRounds = task.numberOfRounds;
        uint[][] memory ranking = new uint[][](numOfRounds);
        for (uint i = 0; i < numOfRounds; i++) {
            ranking[i] = task.rounds[i].ranking;
            console.log("Round number: %s, ranking:\n", i);
            for (uint j = 0; j < ranking[i].length; j++) {
                console.log("%s",ranking[i][j]);
            }
        }
        return ranking;
    }

    function getRewards(uint _taskId) validTask(_taskId) external view returns (uint) {
        return pendingRewards[msg.sender];
    }

    function getRoundWork(uint _taskId, uint _round) validTask(_taskId) external view returns (Commit[] memory) {
        Task storage task = taskList[_taskId];
        require(_round < task.rounds.length); // available from round 1 until current round - 1 
        return task.rounds[_round].committedWorks; // index adjustment
    }

    function getEntranceFee(uint _taskId) validTask(_taskId) external view returns (uint) {
        return taskList[_taskId].entranceFee;
    }

    function getNumberOfRounds(uint _taskId) validTask(_taskId) external view returns (uint) {
        return taskList[_taskId].numberOfRounds;
    }
}
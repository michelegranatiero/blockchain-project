// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

//@title Decentralized Federated Machine Learning using Blockchain
//@author TeamName (names of the authors)
//@notice Description of the functionalities of the SC
contract FedMLContract {

    using EnumerableMap for EnumerableMap.AddressToUintMap;

    event Deployed(uint taskId);
    event Registered(uint taskId, address worker);
    event NewFunding(uint taskId, uint numFunders, uint updatedBalance, uint value);
    event StopFunding(uint taskId);
    event NeedRandomness(uint taskId, uint upperBound);
    event RoundStarted(uint taskId, uint roundNumber);
    event LastRoundCommittmentEnded(uint taskId);
    event TaskEnded(uint taskId);
    //event ContractTerminated();

    // private variables ???
    address payable owner;
    address oracle;
    bool public active;

    constructor (address _oracle) {
       owner = payable(msg.sender);
       oracle = _oracle;
       active = true;
   }

    ///@notice The state of a task
    ///@custom:state DEPLOYED the task is deployed
    ///@custom:state STARTED trainig phase is started, i.e., the funding and the registering phases are terminated, and the oracle has set the seed
    ///@custom:state COMPLETED the whole task is completed, the training and all the previous phases are terminated
    ///@custom:state ABORTED the task is aborted
    enum State {DEPLOYED, STARTED, COMPLETED, ABORTED}

    struct Commit {
        address committer;
        bytes32 hashPart1;
        bytes32 hashPart2;
        uint[] votes;
    }

    struct Round {
        uint[] scoreboard;
        Commit[] committedWorks;
        uint totalScore;
    }

    struct TaskMetadata {
        uint id; //32 bytes
        uint numberOfRounds;
        uint workersPerRound;
        //added entranceFee for computing rewards
        uint entranceFee;
        //uint minFunds;
        Commit model; //initial weights
        address admin; //20 bytes //the admin of the task is stored inside the struct of the model
        State state; //1 bytes
        bool fundingCompleted; // 1 bytes
        address[] registeredWorkers;
        Round[] rounds;
    }    

    struct Task {
        TaskMetadata metadata;
        EnumerableSet.AddressSet pendingRewards;
        mapping (address => uint) withdrawersMap;
        EnumerableMap.AddressToUintMap fundersMap;
        //these are the scores of the workers for the last round, computed as the inverse of the sum of the distances between the worker's votes and lastRoundMeanRanking
        EnumerableMap.AddressToUintMap lastRoundScores;
        //this is the mean of the votes sent by the workers of the last round (the i-th ranking refers to the i-th worker of the previous round)
        uint[] lastRoundMeanRanking;
    }

    uint public taskCounter = 0;
    mapping (uint taskId => Task task) taskList;
 
    mapping (uint taskId => EnumerableMap.AddressToUintMap funderMap) taskFundersMap;
    mapping (address => uint) pendingRewards; //rewards assigned to workers

    modifier validTask(uint _taskId) {
        require(_taskId < taskCounter);
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function setOracle(address _oracle) onlyOwner external {
        oracle = _oracle;
    }

    function abort(uint _taskId) internal {
        Task storage task = taskList[_taskId];
        task.state = State.ABORTED;
    }

    function terminate() onlyOwner external {
        selfdestruct(owner); // it's deprecated
    }

    function withdrawAll() onlyOwner external payable {
        // only the owner can invoke this function
        owner.transfer(address(this).balance);
    }

    function withdrawReward() external payable {
        uint amount = pendingRewards[msg.sender];
        // what if amount is null ???
        pendingRewards[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    ///@notice It allows for the deployement of a new task
    function deployTask(
        bytes32 _hashPart1,
        bytes32 _hashPart2,
        uint _numberOfRounds,
        uint _workersPerRound,
        //uint _minFunds,
        uint _entranceFee
        ) external {
        require(_workersPerRound > 1);
        require(_numberOfRounds > 1);
        //require(_minFunds > 0);
        Task storage task = taskList[taskCounter];
        TaskMetadata storage taskMetadata = task.metadata;
        taskMetadata.id = taskCounter++;
        taskMetadata.admin = msg.sender; //the admin of the task is stored inside the struct of the model
        taskMetadata.model = Commit(msg.sender, _hashPart1, _hashPart2, new uint[](0));
        taskMetadata.numberOfRounds = _numberOfRounds;
        taskMetadata.workersPerRound = _workersPerRound;
        taskMetadata.fundingCompleted; //by default initialized to false (saves gas)
        taskMetadata.state = State.DEPLOYED;
        taskMetadata.entranceFee = _entranceFee;
        //taskMetadata.minFunds = _minFunds;
        task.lastRoundMeanRanking = new uint[](_workersPerRound);
        emit Deployed(taskMetadata.id); //this event needs to be catched by the oracle
    }

    modifier validTask(uint _taskId) {
        require(_taskId < taskCounter); //, "Required a valid task"
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner); //, "Only the owner can invoke this function"
        _;
    }

    modifier activeContract() {
        require(active); //, "Contract is no longer active"
        _;
    }

    function setOracle(address _oracle) onlyOwner external {
        oracle = _oracle;
    }

    function abort(uint _taskId) internal {
        Task storage task = taskList[_taskId];
        task.metadata.state = State.ABORTED;
    }

    ///@notice Allows the owner to terminate the contract 
    ///@dev Replaces selfdestruct (now deprecated)
    function terminate() onlyOwner external {
        active = false;
        //emit ContractTerminated();
    }

    function withdrawAll() onlyOwner external payable {
        uint balance = address(this).balance;
        require(balance > 0, "No ether to withdraw");
        owner.transfer(balance);
    }

    function withdrawAmount(uint amount) onlyOwner external payable {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(owner).transfer(amount);
    }

    // ------------------------------------------- GETTERS -------------------------------------------
    
    ///@notice Returns the metadata associated to the specified task
    ///@param _taskId The numerical identifier of the task
    ///@return The metadata associated to the task
    function getTask(uint _taskId) validTask(_taskId) external view returns (TaskMetadata memory) {
        return taskList[_taskId].metadata;
    }

    ///@notice Returns the list of funders associated to the specified task
    ///@param _taskId The numerical identifier of the task
    ///@return The list of funders associated to the task
    function getFunderList(uint _taskId) validTask(_taskId) external view returns (address[] memory) {
        return taskList[_taskId].fundersMap.keys();
    }

    ///@notice Returns the total amount of funds received by the specified task
    ///@param _taskId The numerical identifier of the task
    ///@return The total amount of funds the task has received
    function getFundsAmount(uint _taskId) validTask(_taskId) public view returns (uint) {
        uint totalFunds = 0;
        EnumerableMap.AddressToUintMap storage fundersMap = taskList[_taskId].fundersMap;
        for (uint i = 0; i < fundersMap.length(); i++) {
            (, uint amount) = fundersMap.at(i);
            totalFunds += amount;
        }
        return totalFunds;
    }

    ///@notice Returns the role of the sender within the specified task
    ///@dev The returned value is a triple of bools, telling respectively if the sender is a funder, a worker, or the admin
    ///@param _taskId The numerical identifier of the task
    function getRoles(uint _taskId) validTask(_taskId) external view returns (bool isFunder, bool isWorker, bool isAdmin) {
        Task storage task = taskList[_taskId];
        return(
            task.fundersMap.contains(msg.sender),
            isAlreadyWorker(msg.sender, task.metadata.registeredWorkers),
            task.metadata.admin == msg.sender
        );
    }

    // ------------------------------------------- PROCESS -------------------------------------------
    
    ///@notice Allows to fund a task
    ///@param _taskId The numerical identifier of the task
    function fund(uint _taskId) activeContract validTask(_taskId) external payable {
        //how to estimate gas fee? Also for the oracle balance to execute transactions
        require(msg.value > 0); // non-zero funding
        require(!taskList[_taskId].metadata.fundingCompleted); //funding still open
        EnumerableMap.AddressToUintMap storage fundersMap = taskList[_taskId].fundersMap;
        // if the user is already a funder (he has already funded in the past)
        if (fundersMap.contains(msg.sender)) {
            // then increase the funding amount
            fundersMap.set(msg.sender, fundersMap.get(msg.sender) + msg.value);
        }
        else { //otherwise: New Funder
            fundersMap.set(msg.sender, msg.value);
        }
        console.log("User %s funded %d", msg.sender, msg.value);
        emit NewFunding(_taskId, fundersMap.length(), msg.value, fundersMap.get(msg.sender)); 
        //Do we really need for the event all of these parameters?
    }

    ///@notice Allows the admin to stop the funding phase
    ///@param _taskId The numerical identifier of the task
    function stopFunding(uint _taskId) activeContract validTask(_taskId) external {
        TaskMetadata storage taskMetadata = taskList[_taskId].metadata;
        require(msg.sender == taskMetadata.admin); // only the admin can stop the funding
        // or the oracle if we want to set a timer/funding treshold
        require(!taskMetadata.fundingCompleted); // the funding was not stopped yet
        taskMetadata.fundingCompleted = true;
        //uint16 workersRequired = task.metadata.workersPerRound * task.metadata.numberOfRounds; // removed to save gas, added comment instead
        uint workersPerRound = taskMetadata.workersPerRound; //caching
        uint numberOfRounds = taskMetadata.numberOfRounds; //just for readability
        // if the registering is completed
        // i.e., the number of registered workers matches the number of required workers (workersPerRound * numberOfRounds)
        if (taskMetadata.registeredWorkers.length == workersPerRound*numberOfRounds) {
            emit NeedRandomness(_taskId, workersPerRound*10); //workersPerRound*10 (???)
        }
        emit StopFunding(_taskId);
    }

    ///@dev helper function
    function isAlreadyWorker(address worker, address[] memory regWorkers) internal pure returns(bool) {
        for (uint i=0; i<regWorkers.length; i++) {
            if (regWorkers[i] == worker) return true;
        }
        return false;
    }

    ///@notice Allows to register as a worker for a task
    ///@param _taskId The numerical identifier of the task
    function register(uint _taskId) payable activeContract validTask(_taskId) external {
        TaskMetadata storage taskMetadata = taskList[_taskId].metadata;
        require(msg.value == taskMetadata.entranceFee, "Insufficient funds!"); //check if the entrance fee is enough
        uint numRegWorkers = taskMetadata.registeredWorkers.length; //caching
        uint workersPerRound = taskMetadata.workersPerRound; //caching
        uint numberOfRounds = taskMetadata.numberOfRounds; //just for readability
        uint workersRequired = workersPerRound*numberOfRounds; //caching
        require(numRegWorkers < workersRequired, "Impossible to register!");
        //check if address is already registered
        require(!isAlreadyWorker(msg.sender, taskMetadata.registeredWorkers));
        console.log("Registered worker %d",numRegWorkers);
        taskMetadata.registeredWorkers.push();
        taskMetadata.registeredWorkers[numRegWorkers] = msg.sender; // no need to decrease by 1 because refers to the value before the push
        if (numRegWorkers+1 == workersRequired) { // (task.metadata.registeredWorkers.length == workersRequired) numRegWorkers refers to the value before the push, so the +1 it's because of the push above
            console.log("All workers registered!");
            if (taskMetadata.fundingCompleted) {
                console.log("Requesting randomness...");
                emit NeedRandomness(_taskId, workersPerRound*10);
            }
        }
        emit Registered(_taskId, msg.sender);
    }

    ///@notice Allows the oracle to set the seed to be used within the specified task
    ///@param _taskId The numerical identifier of the task
    ///@param _seed The random seed to be used by the task
    function setRandomness(uint _taskId, uint _seed) activeContract validTask(_taskId) external {
        //require(msg.sender == oracle); //only the oracle can set the seed
        TaskMetadata storage taskMetadata = taskList[_taskId].metadata;
        uint numOfRegWorkers = taskMetadata.registeredWorkers.length; //just for readability
        uint workersRequired = taskMetadata.workersPerRound*taskMetadata.numberOfRounds; //just for readability
        require(numOfRegWorkers == workersRequired); //registering completed
        require(taskMetadata.fundingCompleted); //the funding is stopped
        require(taskMetadata.state == State.DEPLOYED); //the training wasn't started yet
        shuffleWorkers(_taskId, _seed);
        taskMetadata.state = State.STARTED; //the task is started when the registration and the funding phases are completed and the seed is received         
        startRound(_taskId);
    }

    // REMOVE, otherwise the admin can change the entrance fee and the reward computation will be wrong
    /* function setEntranceFee(uint _taskId, uint _fee) validTask(_taskId) external {
        Task storage task = taskList[_taskId];
        require(msg.sender == task.metadata.admin);
        task.metadata.entranceFee = _fee;
    } */

    ///@notice Shuffles the registeredWorkers array
    ///@param _taskId The numerical identifier of the task
    ///@param _seed The random seed received from the oracle
    function shuffleWorkers(uint _taskId, uint _seed) internal {
        // Since we know the current round and the number of workers per round then
        // we can refer to the corresponding portion of the array registeredWorkers for the single round 
        
        //Task storage task = taskList[_taskId];       
        //uint numOfRegWorkers = task.metadata.registeredWorkers.length; //number of registered workers to the task _taskId

        address[] storage registeredWorkers = taskList[_taskId].metadata.registeredWorkers;
        uint numOfRegWorkers = registeredWorkers.length; //number of registered workers to the task _taskId

        for (uint i = 0; i < numOfRegWorkers; i++) {
            uint rand = uint(keccak256(abi.encodePacked(_seed, i)));
            uint j = rand % numOfRegWorkers;
            address worker = registeredWorkers[j];
            registeredWorkers[j] = registeredWorkers[i];
            registeredWorkers[i] = worker;
        }

        //display the new order of the workers
        for (uint i = 0; i < numOfRegWorkers; i++) {
            console.log("Worker %s is at position %s", registeredWorkers[i], i);
        }

    }
 
    function startRound(uint _taskId) internal {

        //Task storage task = taskList[_taskId];
        //uint currentRound = task.metadata.rounds.length; //caching

        Round[] storage taskRounds = taskList[_taskId].metadata.rounds;
        uint currentRound = taskRounds.length; //caching
        taskRounds.push(); //task.metadata.rounds.length increments by 1        
        // Starting round number currentRound (where 0 <= currentRound <= numberOfRounds-1)
        console.log("Starting round number %s", currentRound);
        //Start next round
        emit RoundStarted(_taskId, currentRound);
    }
    
    ///@notice Checks if the worker is selected for the specified round of the task
    ///@param _taskId The numerical identifier of the task
    ///@param _worker The address of the worker
    ///@param round The round number
    ///@return true if the worker is selected for the round of the specified task, false otherwise
    function isWorkerSelected(uint _taskId, address _worker, uint round) activeContract validTask(_taskId) view public returns (bool) {
        TaskMetadata storage taskMetadata = taskList[_taskId].metadata;
        require(taskMetadata.rounds.length > 0); //at least one round has been started
        //check if the worker was selected, i.e., that it is in the proper portion of the array registeredWorkers after the shuffling
        bool selected = false;
        // the loop can be optimized, todo change it into a while loop
        uint workersPerRound = taskMetadata.workersPerRound; //caching
        for (uint i = round*workersPerRound; i < workersPerRound*(round+1); i++) {
            if(taskMetadata.registeredWorkers[i] == _worker) {
                selected = true;
                break;
            }
        }
        return selected;
    }

    ///@notice Checks if the worker has already committed for the current round of the task
    ///@param _taskId The numerical identifier of the task
    ///@param worker The address of the worker
    ///@return true if the worker has committed for the current round of the specified task, false otherwise
    function hasCommitted(uint _taskId, address worker) activeContract validTask(_taskId) view public returns (bool) {
        Round[] storage taskRounds = taskList[_taskId].metadata.rounds; 
        require(taskRounds.length > 0); //at least one round has been started
        uint currentRound = taskRounds.length-1;
        bool committed = false;
        for (uint i = 0; i < taskRounds[currentRound].committedWorks.length; i++) {
            if(taskRounds[currentRound].committedWorks[i].committer == worker) {
                committed = true;
                break;
            }
        }
        return committed;
    }

    ///@notice Allow a worker to commit his work
    ///@param _taskId The numerical identifier of the task
    ///@param workPart1 The first half of the hashed CID of the work
    ///@param workPart2 The sencond half of the hashed CID of the work
    ///@param votes The votes given to the works of the previous round
    function commit(uint _taskId, bytes32 workPart1, bytes32 workPart2, uint[] calldata votes) activeContract validTask(_taskId) external {

        Task storage task = taskList[_taskId];
        TaskMetadata storage taskMetadata = task.metadata;
        require(taskMetadata.state == State.STARTED, "Task not started!"); //task not completed yet
        require(isWorkerSelected(_taskId, msg.sender, taskMetadata.rounds.length -1), "You are not selected!"); //the worker is selected for the current round, could prevent registering!
        require(!hasCommitted(_taskId, msg.sender), "You have already committed!"); //the worker has not committed yet
        uint currentRound = taskMetadata.rounds.length-1;

        //set the sender eligible for rewards
        EnumerableSet.add(task.pendingRewards, msg.sender);

        if (currentRound > 0) {
            require(votes.length == taskMetadata.workersPerRound);
            //assign votes
            for (uint i = 0; i < votes.length; i++) {
                taskMetadata.rounds[currentRound-1].scoreboard[i] += votes[i]; // assign or increase and assign?
                taskMetadata.rounds[currentRound-1].totalScore += votes[i];
                console.log(taskMetadata.rounds[currentRound-1].totalScore);//////////////////////////////////////////////////////////////////////////////////////////////////
            }
        }

        Commit memory work;
        work.committer = msg.sender;
        work.votes = votes;

        //if the current round is the last round
        if (currentRound == taskMetadata.numberOfRounds-1) {
            taskMetadata.rounds[currentRound].committedWorks.push(work);
            console.log("Updating the last round mean ranking...");
            //update the last round mean ranking as a running average
            for (uint i = 0; i < votes.length; i++) {
                console.log("Vote: %s", votes[i]);
                console.log("Last round mean ranking: %s", task.lastRoundMeanRanking[i]);
                task.lastRoundMeanRanking[i] = uint(int256(task.lastRoundMeanRanking[i]) + 
                int256(int256(votes[i]) - int256(task.lastRoundMeanRanking[i]))/int256(taskMetadata.rounds[currentRound].committedWorks.length));
            }

            //If it was the last commitment for the round emit the event LastRoundCommittmentEnded
            if (taskMetadata.rounds[currentRound].committedWorks.length == taskMetadata.workersPerRound) {
                console.log("All workers submitted their work for round %s (last round)", currentRound);
                emit LastRoundCommittmentEnded(_taskId);
            }
        } else { //if not last round
            taskMetadata.rounds[currentRound].scoreboard.push();
            work.hashPart1 = workPart1;
            work.hashPart2 = workPart2;
            taskMetadata.rounds[currentRound].committedWorks.push(work);
    
            //If it was the last commitment for the current round, end the round
            //uint commitCount = task.metadata.rounds[currentRound].committedWorks.length;
            if (taskMetadata.rounds[currentRound].committedWorks.length == taskMetadata.workersPerRound) {
                console.log("All workers submitted their work for round %s", currentRound);          
                startRound(_taskId);
            }
        }
        
    }

    ///@notice Checks if the worker has already computed the score of the last round
    ///@param _taskId The numerical identifier of the task
    ///@param worker The worker to be checked
    function hasLRScore(uint _taskId, address worker) activeContract validTask(_taskId) view public returns (bool) {
        Task storage task = taskList[_taskId];
        // require sender is selected for the last round
        require(isWorkerSelected(_taskId, worker, task.metadata.numberOfRounds - 1), "You are not selected for this round!");
        // require all workers have committed their work in last round
        require(task.metadata.rounds[task.metadata.numberOfRounds-1].committedWorks.length == task.metadata.workersPerRound);
        return task.lastRoundScores.contains(worker);
    }

    function computeLastRoundScore(uint _taskId) activeContract validTask(_taskId) external {
        Task storage task = taskList[_taskId];
        //require the worker has not already computed the score + other things inside hasLRScore
        require(!hasLRScore(_taskId, msg.sender), "You have already computed the score!");
        //compute the sender's score as the inverse of the sum of the distances between the sender's votes and the mean ranking of the last round
        //retrieve the sender's votes

        uint[] memory senderVotes;
        for (uint i = 0; i < task.metadata.workersPerRound; i++) {

            if (task.metadata.rounds[task.metadata.numberOfRounds - 1].committedWorks[i].committer == msg.sender) {
                senderVotes = task.metadata.rounds[task.metadata.numberOfRounds - 1].committedWorks[i].votes;
                break;
            }
        }

        //sum of the distances between the sender's votes and the mean ranking of the last round
        uint score;
        for (uint i = 0; i < senderVotes.length; i++) {
            score += abs(int(senderVotes[i]) - int(task.lastRoundMeanRanking[i]));
        }

        //save the sender score in the last round ranking
        task.lastRoundScores.set(msg.sender, 100000/(1 + score));

        //update the last round total score
        task.metadata.rounds[task.metadata.numberOfRounds - 1].totalScore += task.lastRoundScores.get(msg.sender);

        //check all workers have computed their score in last round
        if (task.lastRoundScores.length() == task.metadata.workersPerRound) {
            console.log("Finished calculating last round scores, ending task...");
            task.metadata.state = State.COMPLETED;
            emit TaskEnded(_taskId);
        }

    }

    function hasWithdrawn(uint _taskId) activeContract validTask(_taskId) public view returns (bool) {
        Task storage task  = taskList[_taskId];
        require(task.metadata.rounds.length > 1); //at least round 2 has been started
        uint roundIdx = getWorkerRoundIdx(_taskId);
        if (roundIdx == task.metadata.numberOfRounds-1) { //if last round
            require(task.metadata.state == State.COMPLETED, "Task not completed!");
        }else {
            // require NEXT round w.r.t. msg.sender's round is "completed"
            require(task.metadata.rounds[roundIdx+1].committedWorks.length == task.metadata.workersPerRound);
        }
        return !EnumerableSet.contains(task.pendingRewards, msg.sender);

    }

    function withdrawReward(uint _taskId) activeContract external payable {
        Task storage task  = taskList[_taskId];
        require(!hasWithdrawn(_taskId), "You have already withdrawn the reward"); //checks also other things
        EnumerableSet.remove(task.pendingRewards, msg.sender);
        uint roundIdx = getWorkerRoundIdx(_taskId);
        uint reward;
        if (roundIdx == task.metadata.numberOfRounds-1) {
            reward = computeLastRoundReward(_taskId, roundIdx);
        } else {
            reward = computeReward(_taskId, roundIdx);
        }
         //add to withdrawers map
        console.log("reward: %s", reward);
        task.withdrawersMap[msg.sender] = reward;

        payable(msg.sender).transfer(reward);
    }

    function computeReward(uint _taskId, uint _round) internal view returns (uint) {
        
        TaskMetadata storage taskMetadata  = taskList[_taskId].metadata;
        Round storage round = taskMetadata.rounds[_round];
        
        uint fundedAmount = getFundsAmount(_taskId);
        uint roundBounty = fundedAmount / taskMetadata.numberOfRounds;
        uint totalScore = round.totalScore;

        console.log("Round bounty is: %s", roundBounty);
        console.log("Total score for round %s is: %s", _round, totalScore);

        uint workerIndex;
        for (uint i = 0; i < taskMetadata.workersPerRound; i++) {
            if (round.committedWorks[i].committer == msg.sender) {
                workerIndex = i;
                break;
            }
        }
        uint coefficient = (round.scoreboard[workerIndex]) * 100000 / totalScore;
        //log the coegfficient
        console.log("Coefficient for worker %s at round %s is: %s", msg.sender, _round, coefficient);
        uint reward = taskMetadata.entranceFee + (roundBounty * coefficient)/100000;
        
        console.log("Worker %s at round %s got reward %s", msg.sender, _round, reward);

        return reward;
    }

    function computeLastRoundReward(uint _taskId, uint _round) internal view returns (uint) {
        
        Task storage task  = taskList[_taskId];
        Round storage round = task.metadata.rounds[_round];
        
        uint fundedAmount = getFundsAmount(_taskId);
        uint roundBounty = fundedAmount / task.metadata.numberOfRounds;
        
        uint workerScore = task.lastRoundScores.get(msg.sender);
        uint coefficient = workerScore * 100000 / round.totalScore;
        //log the coefficient
        console.log("Coefficient for worker %s at round %s is: %s", msg.sender, _round, coefficient);
        uint reward = task.metadata.entranceFee + (roundBounty * coefficient)/100000;

        console.log("Worker %s at round %s got reward %s", msg.sender, _round, reward);        

        return reward;
    }
    
    function getRoundWork(uint _taskId, uint _round) activeContract validTask(_taskId) external view returns (Commit[] memory) {
        Round[] storage taskRounds = taskList[_taskId].metadata.rounds;
        require(_round < taskRounds.length); // available from round 1 until current round - 1 
        return taskRounds[_round].committedWorks; // index adjustment
    }

    function getEntranceFee(uint _taskId) activeContract validTask(_taskId) external view returns (uint) {
        return taskList[_taskId].metadata.entranceFee;
    }

    function getNumberOfRounds(uint _taskId) activeContract validTask(_taskId) external view returns (uint) {
        return taskList[_taskId].metadata.numberOfRounds;
    }

    function abs(int x) internal pure returns (uint) {
        return uint(x >= 0 ? x : -x);
    }

    function getWorkerRoundIdx(uint _taskId)internal view returns (uint round) {
        //iterate over registerd workers and return the round of the worker as the division of the index by the number of workers per round
        TaskMetadata storage taskMetadata = taskList[_taskId].metadata;
        for (uint i = 0; i < taskMetadata.registeredWorkers.length; i++) {
            if (taskMetadata.registeredWorkers[i] == msg.sender) {
                return i / taskMetadata.workersPerRound; //round index
            }
        }
    }
}
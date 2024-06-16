// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

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
        EnumerableMap.AddressToUintMap fundersMap;
        //these are the scores of the workers for the last round, computed as the inverse of the sum of the distances between the worker's votes and lastRoundMeanRanking
        EnumerableMap.AddressToUintMap lastRoundScores;
        //this is the mean of the votes sent by the workers of the last round (the i-th ranking refers to the i-th worker of the previous round)
        uint[] lastRoundMeanRanking;
    }

    uint public taskCounter = 0;
    mapping (uint taskId => Task task) taskList;

    function deployTask(
        bytes32 _hashPart1,
        bytes32 _hashPart2,
        uint _numberOfRounds,
        uint _workersPerRound
        ) external {
        require(_workersPerRound > 1);
        require(_numberOfRounds > 1);
        Task storage task = taskList[taskCounter];
        task.metadata.id = taskCounter++;
        task.metadata.admin = msg.sender; //the admin of the task is stored inside the struct of the model
        task.metadata.model = Commit(msg.sender, _hashPart1, _hashPart2, new uint[](0));
        task.metadata.numberOfRounds = _numberOfRounds;
        task.metadata.workersPerRound = _workersPerRound;
        task.metadata.fundingCompleted; //by default initialized to false (saves gas)
        task.metadata.state = State.DEPLOYED;
        task.lastRoundMeanRanking = new uint[](_workersPerRound);
        emit Deployed(task.metadata.id); //this event needs to be catched by the oracle
    }

    modifier validTask(uint _taskId) {
        //require(_taskId < taskList.length);
        require(_taskId < taskCounter);
        _;
    }

    // ------------------------------------------- GETTERS -------------------------------------------
    
    function getTask(uint _taskId) validTask(_taskId) external view returns (TaskMetadata memory) {
        return taskList[_taskId].metadata;
    }

    function getFunderList(uint _taskId) validTask(_taskId) external view returns (address[] memory) {
        return taskList[_taskId].fundersMap.keys();
    }

    function getFundsAmount(uint _taskId) validTask(_taskId) public view returns (uint) {
        uint totalFunds = 0;
        EnumerableMap.AddressToUintMap storage fundersMap = taskList[_taskId].fundersMap; 
        for (uint i = 0; i < fundersMap.length(); i++) {
            (, uint amount) = fundersMap.at(i);
            totalFunds += amount;
        }
        return totalFunds;
    }

    // Return the role of the sender within the specified task.
    // The returned value is a triple of bools, respectively indicating if it is a funder, a worker and an admin of the task.metadata. 
    function getRoles(uint _taskId) validTask(_taskId) external view returns (bool isFunder, bool isWorker, bool isAdmin) {
        return(
            taskList[_taskId].fundersMap.contains(msg.sender),
            isAlreadyWorker(msg.sender, taskList[_taskId].metadata.registeredWorkers),
            taskList[_taskId].metadata.admin == msg.sender
        );
    }

    // ------------------------------------------- PROCESS -------------------------------------------
    
    function fund(uint _taskId) validTask(_taskId) external payable {
        //how to estimate gas fee? Also for the oracle balance to execute transactions
        require(msg.value > 0); // non-zero funding
        require(!taskList[_taskId].metadata.fundingCompleted); //funding still open
        EnumerableMap.AddressToUintMap storage fundersMap = taskList[_taskId].fundersMap; //taskList[_taskId].fundersMap;
        // if the user is already a funder (he has already funded in the past)
        if (fundersMap.contains(msg.sender)) {
            // then increase the funding amount 
            fundersMap.set(msg.sender, fundersMap.get(msg.sender) + msg.value); //check if this is correct
        }
        else { //otherwise: New Funder
            fundersMap.set(msg.sender, msg.value);
        }
        console.log("User %s funded %d", msg.sender, msg.value);
        emit NewFunding(_taskId, fundersMap.length(), msg.value, fundersMap.get(msg.sender)); 
        //Do we need all of these parameters for the event?
    }

    function stopFunding(uint _taskId) validTask(_taskId) external {
        Task storage task = taskList[_taskId];
        require(msg.sender == task.metadata.admin); // only the admin can stop the funding
        // or the oracle if we want to set a timer/funding treshold
        require(!task.metadata.fundingCompleted); // the funding wasn't stopped yet
        task.metadata.fundingCompleted = true;
        //uint16 workersRequired = task.metadata.workersPerRound * task.metadata.numberOfRounds; // removed to save gas, added comment instead
        uint workersPerRound = task.metadata.workersPerRound; //caching
        uint numberOfRounds = task.metadata.numberOfRounds; //caching
        // if the registering is completed
        // i.e. the number of registered workers matches with the number of required workers (workersPerRound * numberOfRounds)
        if (task.metadata.registeredWorkers.length == workersPerRound*numberOfRounds) { // taskList[_taskId].registeringCompleted // taskList[_taskId].workersRequired
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
        uint numRegWorkers = task.metadata.registeredWorkers.length; //caching
        uint workersPerRound = task.metadata.workersPerRound; //caching
        uint numberOfRounds = task.metadata.numberOfRounds; //caching
        uint workersRequired = workersPerRound*numberOfRounds;
        require(numRegWorkers < workersRequired, "Impossible to register!");
        //check if address is already registered
        require(!isAlreadyWorker(msg.sender, task.metadata.registeredWorkers));
        console.log("Registered worker %d",numRegWorkers);
        task.metadata.registeredWorkers.push();
        task.metadata.registeredWorkers[numRegWorkers] = msg.sender; // no need to decrease by 1 because refers to the value before the push
        if (numRegWorkers+1 == workersRequired) { // (task.metadata.registeredWorkers.length == workersRequired) numRegWorkers refers to the value before the push, so the +1 it's because of the push above
            console.log("All workers registered!");
            if (task.metadata.fundingCompleted) {
                console.log("Requesting randomness...");
                emit NeedRandomness(_taskId, workersPerRound*10);
            }
        }
        emit Registered(_taskId, msg.sender);
    }

    function setRandomness(uint _taskId, uint _seed) validTask(_taskId) external {
        //require(msg.sender == oracle); //only the oracle can set the seeds
        Task storage task = taskList[_taskId];
        uint numOfRegWorkers = task.metadata.registeredWorkers.length;
        uint workersRequired = task.metadata.workersPerRound*task.metadata.numberOfRounds;
        require(numOfRegWorkers == workersRequired); //Registering completed
        require(task.metadata.fundingCompleted); //The funding is stopped
        require(task.metadata.state == State.DEPLOYED); //the training wasn't started yet
        //require(task.metadata.seeds.length == 0); //seeds were not set yet
        //task.metadata.seeds = _seeds;
        shuffleWorkers(_taskId, _seed);
        task.metadata.state = State.STARTED; //the task is started when the registration and the funding phases are completed and the seed is received         
        startRound(_taskId);
    }

    function setEntranceFee(uint _taskId, uint _fee) validTask(_taskId) external {
        Task storage task = taskList[_taskId];
        require(msg.sender == task.metadata.admin);
        task.metadata.entranceFee = _fee;
    }

    function shuffleWorkers(uint _taskId, uint _seed) internal {
        // Shuffle the registeredWorkers array
        // Since we know the current round and the number of workers per round then
        // we can refer to the corresponding portion of the array registeredWorkers for the single round 
        Task storage task = taskList[_taskId];        
        uint numOfRegWorkers = task.metadata.registeredWorkers.length; //number of registered workers to the task _taskId

        for (uint i = 0; i < numOfRegWorkers; i++) {
            uint rand = uint(keccak256(abi.encodePacked(_seed, i)));
            uint j = rand % numOfRegWorkers;
            address worker = task.metadata.registeredWorkers[j];
            task.metadata.registeredWorkers[j] = task.metadata.registeredWorkers[i];
            task.metadata.registeredWorkers[i] = worker;
        }

        //display the new order of the workers
        for (uint i = 0; i < numOfRegWorkers; i++) {
            console.log("Worker %s is at position %s", task.metadata.registeredWorkers[i], i);
        }

    }
 
    function startRound(uint _taskId) internal {
        Task storage task = taskList[_taskId];
        uint currentRound = task.metadata.rounds.length; //caching
        task.metadata.rounds.push(); //task.metadata.rounds.length increments by 1        
        // Starting round number currentRound (where 0 <= currentRound <= numberOfRounds-1)
        console.log("Starting round number %s", currentRound);
        //Start next round
        emit RoundStarted(_taskId, currentRound); //task.metadata.rounds[task.metadata.currentRound-1].committedWorks
        //}
    }
    
    //Checks if worker is selected for the current round
    function isWorkerSelected(uint _taskId, address worker, uint _round) validTask(_taskId) view public returns (bool) {
        Task storage task = taskList[_taskId];
        require(task.metadata.rounds.length > 0); //at least one round has been started
        //check if the worker was selected, i.e. that it is in the proper portion of the array registeredWorkers after the shuffling
        bool selected = false;
        // the loop can be optimized, todo change it into a while loop
        uint workersPerRound = task.metadata.workersPerRound; //caching
        for (uint i = _round*workersPerRound; i < workersPerRound*(_round+1); i++) {
            if(task.metadata.registeredWorkers[i] == worker) {
                selected = true;
                break;
            }
        }
        return selected;
    }

    //Checks if the worker has already committed for the current round
    function hasCommitted(uint _taskId, address worker) validTask(_taskId) view public returns (bool) {
        Task storage task = taskList[_taskId]; 
        require(task.metadata.rounds.length > 0); //at least one round has been started
        uint currentRound = task.metadata.rounds.length-1;
        bool committed = false;
        for (uint i = 0; i < task.metadata.rounds[currentRound].committedWorks.length; i++) {
            if(task.metadata.rounds[currentRound].committedWorks[i].committer == worker) {
                committed = true;
                break;
            }
        }
        return committed;
    }

    function commit(uint _taskId, bytes32 workPart1, bytes32 workPart2, uint[] calldata votes) validTask(_taskId) external {
                
        Task storage task = taskList[_taskId];
        require(task.metadata.state == State.STARTED, "Task not started!"); //task not completed yet
        require(isWorkerSelected(_taskId, msg.sender, task.metadata.rounds.length -1), "You are not selected!"); //the worker is selected for the current round, could prevent registering!
        require(!hasCommitted(_taskId, msg.sender), "You have already committed!"); //the worker has not committed yet
        uint currentRound = task.metadata.rounds.length-1;

        //set the sender eligible for rewards
        EnumerableSet.add(task.pendingRewards, msg.sender);

        if (currentRound > 0) {
            require(votes.length == task.metadata.workersPerRound); 
            for (uint i = 0; i < votes.length; i++) {
                task.metadata.rounds[currentRound-1].scoreboard[i] += votes[i]; // assign or increase and assign?
                task.metadata.rounds[currentRound-1].totalScore += votes[i];
                console.log(task.metadata.rounds[currentRound-1].totalScore);//////////////////////////////////////////////////////////////////////////////////////////////////
            }
        }

        Commit memory work;
        work.committer = msg.sender;
        work.votes = votes;


        //if last round
        if (currentRound == task.metadata.numberOfRounds-1) {
            task.metadata.rounds[currentRound].committedWorks.push(work);
            console.log("Updating the last round mean ranking...");
            //update the last round mean ranking as a running average
            for (uint i = 0; i < votes.length; i++) {
                console.log("Vote: %s", votes[i]);
                console.log("Last round mean ranking: %s", task.lastRoundMeanRanking[i]);
                task.lastRoundMeanRanking[i] = uint(int256(task.lastRoundMeanRanking[i]) + 
                int256(int256(votes[i]) - int256(task.lastRoundMeanRanking[i]))/int256(task.metadata.rounds[currentRound].committedWorks.length));
            }

            //If it was the last commitment for the round emit the event LastRoundCommittmentEnded
            if (task.metadata.rounds[currentRound].committedWorks.length == task.metadata.workersPerRound) {
                console.log("All workers submitted their work for round %s (last round)", currentRound);
                emit LastRoundCommittmentEnded(_taskId);
            }
        } else { //if not last round
            task.metadata.rounds[currentRound].scoreboard.push();
            work.hashPart1 = workPart1;
            work.hashPart2 = workPart2;
            task.metadata.rounds[currentRound].committedWorks.push(work);
    
            //If it was the last commitment for the current round, end the round
            //uint commitCount = task.metadata.rounds[currentRound].committedWorks.length;
            if (task.metadata.rounds[currentRound].committedWorks.length == task.metadata.workersPerRound) {
                console.log("All workers submitted their work for round %s", currentRound);          
                startRound(_taskId);
            }
        }
        
    }
    

    /* function lastRoundCommit(uint _taskId, uint[] calldata votes) validTask(_taskId) external {
        Task storage task = taskList[_taskId];
        require(task.metadata.state == State.STARTED, "Task not started!"); //task not completed yet
        require(isWorkerSelected(_taskId, msg.sender, task.metadata.rounds.length -1), "You are not selected!"); //the worker is selected for the current round, could prevent registering!
        require(!hasCommitted(_taskId, msg.sender), "You have already committed!");
        uint currentRound = task.metadata.numberOfRounds-1;

        //set the sender eligible for rewards
        EnumerableSet.add(task.pendingRewards, msg.sender);
        
        console.log("Votes received from worker %s", msg.sender);
        //print the votes received
        for (uint i = 0; i < votes.length; i++) {
            console.log("Vote %s: %s", i, votes[i]);
        }

        //update the previous round ranking based on the votes sent
        for (uint i = 0; i < votes.length; i++) {
            task.metadata.rounds[currentRound-1].scoreboard[i] += votes[i]; // assign or increase and assign?
            task.metadata.rounds[currentRound-1].totalScore += votes[i];
        }

        console.log("Saving the work...");
        Commit memory work;
        work.committer = msg.sender;
        work.votes = votes;
        task.metadata.rounds[currentRound].committedWorks.push(work);
        
        console.log("Updating the last round mean ranking...");
        //update the last round mean ranking as a running average
        for (uint i = 0; i < votes.length; i++) {
            console.log("Vote: %s", votes[i]);
            console.log("Last round mean ranking: %s", task.lastRoundMeanRanking[i]);
            task.lastRoundMeanRanking[i] = uint(int256(task.lastRoundMeanRanking[i]) + 
            int256(int256(votes[i]) - int256(task.lastRoundMeanRanking[i]))/int256(task.metadata.rounds[currentRound].committedWorks.length));
        }

        //If it was the last commitment for the round emit the event LastRoundCommittmentEnded
        if (task.metadata.rounds[currentRound].committedWorks.length == task.metadata.workersPerRound) {
            console.log("All workers submitted their work for round %s (last round)", currentRound);
            emit LastRoundCommittmentEnded(_taskId);
        }
    } */

    //Checks if the worker has already computed the last round score
    function hasLRScore(uint _taskId, address worker) validTask(_taskId) view public returns (bool) {
        Task storage task = taskList[_taskId];
        //UNCOMMENT ALL IF WANT TO MAKE FUNCTION PUBLIC  
        // require sender is selected for the last round
        console.log("1111111", _taskId, worker, task.metadata.numberOfRounds - 1);
        require(isWorkerSelected(_taskId, worker, task.metadata.numberOfRounds - 1), "You are not selected for this round!");
        
        // require all workers have committed their work in last round
        console.log("22222222: ", task.metadata.rounds[task.metadata.numberOfRounds-1].committedWorks.length == task.metadata.workersPerRound);
        require(task.metadata.rounds[task.metadata.numberOfRounds-1].committedWorks.length == task.metadata.workersPerRound);
        console.log("ok2");
        console.log( task.lastRoundScores.contains(worker));
        return task.lastRoundScores.contains(worker);
    }

    function computeLastRoundScore(uint _taskId) validTask(_taskId) external {
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

        //compute the score
        uint score;
        for (uint i = 0; i < senderVotes.length; i++) {
            console.log("senderVotes222: ", senderVotes[i], task.lastRoundMeanRanking[i]);
            score += abs(int(senderVotes[i]) - int(task.lastRoundMeanRanking[i]));
            console.log("Score: %s", score);

        }
        console.log("6");
        console.log("Score: %s", score);


        //save the sender score in the last round ranking
        task.lastRoundScores.set(msg.sender, 100000/score);
        console.log("7");


        //update the last round total score
        task.metadata.rounds[task.metadata.numberOfRounds - 1].totalScore += task.lastRoundScores.get(msg.sender);
        console.log("8");

        //check all workers have computed their score in last round
        if (task.lastRoundScores.length() == task.metadata.workersPerRound) {
            console.log("9");

            console.log("Finished calculating last round scores, ending task...");
            task.metadata.state = State.COMPLETED;
            console.log("10");

            emit TaskEnded(_taskId);
        }
        console.log("11");

    }


    function hasWithdrawn(uint _taskId) validTask(_taskId) public view returns (bool) {
        require(taskList[_taskId].metadata.state == State.COMPLETED, "Task not completed!"); ///////////////////
        require(isAlreadyWorker(msg.sender, taskList[_taskId].metadata.registeredWorkers), "You are not registered for this task!");
        return !EnumerableSet.contains(taskList[_taskId].pendingRewards, msg.sender);
    }


    function withdrawReward(uint _taskId, uint _round) external payable {
        Task storage task  = taskList[_taskId];
        require(!hasWithdrawn(_taskId), "You have already withdrawn the reward"); //checks also other things
        EnumerableSet.remove(task.pendingRewards, msg.sender);
        
        uint reward;
        if (_round == task.metadata.numberOfRounds-1) {
            reward = computeLastRoundReward(_taskId, _round);
        } else {
            reward = computeReward(_taskId, _round);
        }
        payable(msg.sender).transfer(reward);
    }

    function computeReward(uint _taskId, uint _round) internal view returns (uint) {
        
        Task storage task  = taskList[_taskId];
        Round storage round = task.metadata.rounds[_round];
        
        uint fundedAmount = getFundsAmount(_taskId);
        uint roundBounty = fundedAmount / task.metadata.numberOfRounds;
        uint totalScore = round.totalScore;

        console.log("Round bounty is: %s", roundBounty);
        console.log("Total score for round %s is: %s", _round, totalScore);

        uint workerIndex;
        for (uint i = 0; i < task.metadata.workersPerRound; i++) {
            if (round.committedWorks[i].committer == msg.sender) {
                workerIndex = i;
                break;
            }
        }
        uint coefficient = (round.scoreboard[workerIndex]) / totalScore;
        uint reward = task.metadata.entranceFee + (roundBounty * coefficient)/100000;
        
        console.log("Worker %s at round %s got reward %s", msg.sender, _round, reward);

        return reward;
    }

    function computeLastRoundReward(uint _taskId, uint _round) internal view returns (uint) {
        
        Task storage task  = taskList[_taskId];
        Round storage round = task.metadata.rounds[_round];
        
        uint fundedAmount = getFundsAmount(_taskId);
        uint roundBounty = fundedAmount / task.metadata.numberOfRounds;
        
        uint workerScore = task.lastRoundScores.get(msg.sender);
        uint coefficient = workerScore / round.totalScore;
        uint reward = task.metadata.entranceFee + (roundBounty * coefficient);//1000;

        console.log("Worker %s at round %s got reward %s", msg.sender, _round, reward);        

        return reward;
    }
    
    function getRoundWork(uint _taskId, uint _round) validTask(_taskId) external view returns (Commit[] memory) {
        Task storage task = taskList[_taskId];
        require(_round < task.metadata.rounds.length); // available from round 1 until current round - 1 
        return task.metadata.rounds[_round].committedWorks; // index adjustment
    }

    function getEntranceFee(uint _taskId) validTask(_taskId) external view returns (uint) {
        return taskList[_taskId].metadata.entranceFee;
    }

    function getNumberOfRounds(uint _taskId) validTask(_taskId) external view returns (uint) {
        return taskList[_taskId].metadata.numberOfRounds;
    }

    function abs(int x) internal pure returns (uint) {
        return uint(x >= 0 ? x : -x);
    }
}
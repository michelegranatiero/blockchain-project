// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;
import "hardhat/console.sol";

// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Task{

    using EnumerableSet for EnumerableSet.AddressSet;

    string public title;
    string public description;
    //address public owner;
    address public issuer;

    //---------------------------------------
    

    event Selected(address[] workers, uint16 roundNumber);
    event NeedRandomness(uint16 numberOfSeeds, uint16 upperBound);
    event RoundStarted(string[] previousWork, uint16 roundNumber);
    event TaskEnded();
    event NewFunding(uint numFunders, uint updatedBalance, uint value);
    uint16[] seeds;

    uint16 numberOfRounds;
    uint16 workersRequired;
    uint16 workersPerRound;

    bool fundingCompleted = false;
    bool registeringCompleted = false;

    address[] registeredWorkers;
    address[] funders;
    mapping (address funder => uint amount) funderMap;

    EnumerableSet.AddressSet private selectedWorkers;

    struct Round {
        uint16 commitCount;
        // The following three arrays are synchronized meaning that workers[i] has committed committedWorks[i] and is ranked ranking[i]
        address[] workers;
        string[] committedWorks;
        uint256[] ranking;
    }
    
    //this is sent to the workers of the first round
    string[] firstRoundWork;

    Round[] rounds;
    uint16 currentRound;

    constructor(
        string memory _title,
        string memory _description,
        address _issuer,
        uint16 _numberOfRounds,
        uint16 _workersRequired

    ) {
        title = _title;
        description = _description;
        issuer = _issuer;
        //owner = msg.sender;

        numberOfRounds = _numberOfRounds;
        workersRequired = _workersRequired;
        workersPerRound = workersRequired / numberOfRounds;

        currentRound = 0;
        for (uint16 i = 0; i < workersPerRound; i++) {
                firstRoundWork.push('');
            }
    }

    //------------------------------------

    function stopFunding() external {
        require(msg.sender == issuer);

        fundingCompleted = true;
        if (registeringCompleted){
            emit NeedRandomness(numberOfRounds, workersPerRound*10);
        }

    }

    function fund() public payable {
        //how to estimate gas fee, also for the oracle balance to execute transactions
        require(msg.value > 0);
        if (funderMap[msg.sender] == 0){ // is New Funder
            funders.push(msg.sender);
        }
        funderMap[msg.sender] += msg.value;
        emit NewFunding(funders.length, msg.value, funderMap[msg.sender]); // is balance already updated?????
    }



    //-------------------------------------

    function register() public {
        //check if address is already registered
        require(registeredWorkers.length < workersRequired, "Impossible to register!");
        registeredWorkers.push();
        registeredWorkers[registeredWorkers.length - 1] = msg.sender;

        if (registeredWorkers.length == workersRequired) {
            registeringCompleted = true;
            if (fundingCompleted){
                emit NeedRandomness(numberOfRounds, workersPerRound*10);
            }
        }
    }

    function startRound() internal {
        console.log("Starting round number %s", currentRound);
        rounds.push();
        selectWorkers(seeds[currentRound]);
        if (currentRound == 0) {
            emit RoundStarted(firstRoundWork, currentRound);
        } else {
            //Start next round and give to the workers the work from previous round
            console.log("Sending previous work");
            for (uint16 i = 0; i  < workersPerRound; i++) {
                console.log(rounds[currentRound - 1].committedWorks[i]);
            }
            emit RoundStarted(rounds[currentRound - 1].committedWorks, currentRound);
        }
    }

    function setRandomness(uint16[] memory _seeds) public {
        seeds = _seeds;
        startRound();
    }

    function selectWorkers(uint16 seed) internal {
        console.log("Selecting workers...");
        for (uint16 i = 0; i < workersPerRound; i ++) {
            rounds[currentRound].ranking.push();
            rounds[currentRound].workers.push();
            uint16 offset = 0;
            address worker = registeredWorkers[(seed + i) % registeredWorkers.length];
            while (selectedWorkers.contains(worker)) {
                offset++;
                worker = registeredWorkers[(seed + i + offset) % registeredWorkers.length];
            }
            rounds[currentRound].workers[i] = worker;
            selectedWorkers.add(worker);
            console.log("Selected worker at address: %s", worker);
        }
        emit Selected(rounds[currentRound].workers, currentRound);            
    }

    function commitWork(string memory work, uint256[] memory votes) public {
        //TODO: Only selected workers can call this method 
        //Save the work done
        rounds[currentRound].committedWorks.push();
        rounds[currentRound].workers[rounds[currentRound].commitCount] = msg.sender;
        rounds[currentRound].committedWorks[rounds[currentRound].commitCount] = work;
        

        console.log("Worker %s submitted %s", msg.sender, rounds[currentRound].committedWorks[rounds[currentRound].commitCount]);
        rounds[currentRound].commitCount++;
        //If it is not the first round, update the ranking of the previous round
        if (currentRound != 0) {
            updatePreviousRoundRanking(votes);    
        }
        

        //If it was the last commitment for the current round, end the round
        if (rounds[currentRound].commitCount == workersPerRound) {
            console.log("All workers submitted their work for round %s", currentRound);
            endRound();
        }
    }

    function updatePreviousRoundRanking(uint256[] memory votes) internal {

        //the i-th worker of the previous round receives votes[i] attestations (points?)
        for (uint16 i = 0; i < votes.length; i ++) {
            rounds[currentRound - 1].ranking[i] += votes[i]; 
        }
    }

    function endRound() internal {
        if (rounds.length == numberOfRounds) {
            endTask();
        }
        else {
            currentRound++;
            startRound();
        }
        
    }

    function endTask() internal {
        //assign rewards
        emit TaskEnded();
    }

    function getRanking() public view returns (uint256[][] memory) {
        uint256[][] memory ranking = new uint256[][](numberOfRounds);
        for (uint16 i = 0; i < numberOfRounds; i++) {
            ranking[i] = rounds[i].ranking;
            console.log("Round number: %s, ranking:\n", i);
            for (uint256 j = 0; j < ranking[i].length; j++) {
                console.log("%s",ranking[i][j]);
            }
        }
        return ranking;
    }

    function getWork() public view returns (string[][] memory) {
        string[][] memory work = new string[][](numberOfRounds);
        for (uint16 i = 0; i < numberOfRounds; i++) {
            work[i] = rounds[i].committedWorks;
        }
        return work;
    }

    function getWorkers() public view returns (address[][] memory) {
        address[][] memory workers = new address[][](numberOfRounds);
        for (uint16 i = 0; i < numberOfRounds; i++) {
            workers[i] = rounds[i].workers;
        }
        return workers;
    }

    function getRequiredWorkers() public view returns (uint16) {
        return workersRequired;
    }

    function getNumberOfRounds() public view returns (uint16) {
        return numberOfRounds;
    }


}
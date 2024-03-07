// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

import "hardhat/console.sol";
import "./Task.sol";

contract StorageFactory {
    Task[] public taskList;

    

    event Deployed(Task taskAddress);

    function deployTask(
        string calldata title,
        string calldata description,
        uint16 numberOfRounds,
        uint16 workersRequired
        ) external {
        Task task = new Task(
            title,
            description,
            msg.sender,
            numberOfRounds,
            workersRequired); // returns address

        taskList.push(task);
        emit Deployed(task);
    }

    function getAllTasks() public view returns (Task[] memory) {
        return taskList;
    }

}
import EventsApp from "../../artifacts/contracts/EventsApp.sol/EventsApp.json";

//Contract address and ABI
//export const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
export const contractAddress = "0xe7369249c40407837d8D488907Df6d7E8f223B93";


//export const contractAbi = EventsApp.abi;
export const contractAbi = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "contract Task",
				"name": "taskAddress",
				"type": "address"
			}
		],
		"name": "Deployed",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "uint16",
				"name": "numberOfRounds",
				"type": "uint16"
			},
			{
				"internalType": "uint16",
				"name": "workersRequired",
				"type": "uint16"
			}
		],
		"name": "deployTask",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllTasks",
		"outputs": [
			{
				"internalType": "contract Task[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "taskList",
		"outputs": [
			{
				"internalType": "contract Task",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

export const taskAbi = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_description",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "_issuer",
				"type": "address"
			},
			{
				"internalType": "uint16",
				"name": "_numberOfRounds",
				"type": "uint16"
			},
			{
				"internalType": "uint16",
				"name": "_workersRequired",
				"type": "uint16"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint16",
				"name": "numberOfSeeds",
				"type": "uint16"
			},
			{
				"indexed": false,
				"internalType": "uint16",
				"name": "upperBound",
				"type": "uint16"
			}
		],
		"name": "NeedRandomness",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "numFunders",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "updatedBalance",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "NewFunding",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string[]",
				"name": "previousWork",
				"type": "string[]"
			},
			{
				"indexed": false,
				"internalType": "uint16",
				"name": "roundNumber",
				"type": "uint16"
			}
		],
		"name": "RoundStarted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address[]",
				"name": "workers",
				"type": "address[]"
			},
			{
				"indexed": false,
				"internalType": "uint16",
				"name": "roundNumber",
				"type": "uint16"
			}
		],
		"name": "Selected",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "TaskEnded",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "work",
				"type": "string"
			},
			{
				"internalType": "uint256[]",
				"name": "votes",
				"type": "uint256[]"
			}
		],
		"name": "commitWork",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "description",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "fund",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getNumberOfRounds",
		"outputs": [
			{
				"internalType": "uint16",
				"name": "",
				"type": "uint16"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getRanking",
		"outputs": [
			{
				"internalType": "uint256[][]",
				"name": "",
				"type": "uint256[][]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getRequiredWorkers",
		"outputs": [
			{
				"internalType": "uint16",
				"name": "",
				"type": "uint16"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getWork",
		"outputs": [
			{
				"internalType": "string[][]",
				"name": "",
				"type": "string[][]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getWorkers",
		"outputs": [
			{
				"internalType": "address[][]",
				"name": "",
				"type": "address[][]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "issuer",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "register",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint16[]",
				"name": "_seeds",
				"type": "uint16[]"
			}
		],
		"name": "setRandomness",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "stopFunding",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "title",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
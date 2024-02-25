import EventsApp from "../../artifacts/contracts/EventsApp.sol/EventsApp.json";

//Contract address and ABI
//export const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
export const contractAddress = "0xe7369249c40407837d8D488907Df6d7E8f223B93";


//export const contractAbi = EventsApp.abi;
export const contractAbi = [
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
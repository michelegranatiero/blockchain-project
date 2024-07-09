from web3 import Web3
import json
import time
from threading import Timer

w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))

# Get contract abi
f = open('./artifacts/contracts/FedMLContract.sol/FedMLContract.json')

data = json.load(f)
abi = data['abi']
f.close()

contract_address = Web3.to_checksum_address('0x5fbdb2315678afecb367f032d93f642f64180aa3')
contract = w3.eth.contract(address=contract_address, abi=abi)

deployed_event_filter = contract.events['Deployed'].create_filter(fromBlock='latest')

accounts = w3.eth.accounts
#the oracle and the task admin addresses are the same
my_address = accounts[len(accounts) - 1]

params = {"from":my_address}

def stopFunding(taskId):
    return contract.functions.stopFunding(taskId).transact(params)

print('Timer is ready...\n')
try:
    while True:
        for event in deployed_event_filter.get_new_entries():
            taskId = event.args['taskId']
            print(f"Task {taskId} deployed, timer started!")
            t = Timer(20, stopFunding, [taskId])
            t.start()

            
except KeyboardInterrupt:
    print('Exiting oracle...')
from web3 import Web3
import json
import random
w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))

# Get contract abi
f = open('./artifacts/contracts/FedMLContract.sol/FedMLContract.json')
data = json.load(f)
abi = data['abi']
f.close()

contract_address = Web3.to_checksum_address('0x5fbdb2315678afecb367f032d93f642f64180aa3')
contract = w3.eth.contract(address=contract_address, abi=abi)

# Master contract should emit event and specify the address of the task contract

event_filter = contract.events['NeedRandomness'].create_filter(fromBlock='latest')

accounts = w3.eth.accounts
#the oracle address and the task admin address are the same
# my_address = accounts[len(accounts) - 1]

my_address = accounts[0]; # the first account is the oracle address

print('Number oracle is ready to serve...\n')
try:
    while True:
        for event in event_filter.get_new_entries():
            # retrive specific task address from event (in smart contract: put address inside event)
            rnd = random.randint(0,event.args['upperBound'] - 1)
            print(f"Sending randomness to Smart Contract at address: {contract_address}...")
            print(f"\nSelected randomness is: {rnd}")
            contract.functions.setRandomness(event.args['taskId'],rnd).transact({"from":my_address})
except KeyboardInterrupt:
    print('Exiting oracle...')
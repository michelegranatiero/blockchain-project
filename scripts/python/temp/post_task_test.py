from web3 import Web3
import json


f = open('./artifacts/contracts/FedMLContract.sol/FedMLContract.json')
data = json.load(f)
abi = data['abi']
f.close()

w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
contract_address = Web3.to_checksum_address('0x5fbdb2315678afecb367f032d93f642f64180aa3')
contract = w3.eth.contract(address=contract_address, abi=abi)

address1 = Web3.to_checksum_address('0x90f79bf6eb2c4f870365e785982e1f101e93b906')
address2 = w3.eth.accounts[-10]

balance = w3.eth.get_balance(address1)

print(f"{address1[:10]}: {balance}")
contract.functions.withdrawReward(0).transact({'from':address1})
new_balance = w3.eth.get_balance(address1)
print(f"Reward: {new_balance - balance}")
print(f"{address1[:10]}: {new_balance}")




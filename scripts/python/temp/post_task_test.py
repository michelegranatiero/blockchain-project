from web3 import Web3
import json


f = open('./artifacts/contracts/FedMLContract.sol/FedMLContract.json')
data = json.load(f)
abi = data['abi']
f.close()

w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
contract_address = Web3.to_checksum_address('0x5fbdb2315678afecb367f032d93f642f64180aa3')
contract = w3.eth.contract(address=contract_address, abi=abi)

address1 = Web3.to_checksum_address('0x2546bcd3c84621e976d8185a91a922ae77ecec30')
address2 = w3.eth.accounts[-10]

reward = contract.functions.getRewards(0).call({"from":address1})
balance = w3.eth.get_balance(address1)

reward_ether = Web3.from_wei(reward, 'ether')

print(f"Reward: {reward}")
print(f"Balance: {balance}")
print(f"Balance + reward: {balance + reward}")

print(reward_ether)
print(reward_ether * 3500)
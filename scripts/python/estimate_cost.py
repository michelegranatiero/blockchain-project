import os
from web3 import Web3
import json
import random
import ipfshttpclient
from utils import encode_CID_to_2_bytes_32, decode_2_bytes_32_to_CID

ipfsclient = ipfshttpclient.connect()

# Get contract abi
f = open('./artifacts/contracts/FedMLContract.sol/FedMLContract.json')
data = json.load(f)
abi = data['abi']
f.close()

w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
contract_address = Web3.to_checksum_address('0x5fbdb2315678afecb367f032d93f642f64180aa3')
smartContract = w3.eth.contract(address=contract_address, abi=abi)

gas_price = w3.eth.gas_price

registerTx = smartContract.functions.register(0).buildTransaction({
    'from': w3.eth.accounts[-1],  # L'indirizzo dell'account che esegue la transazione
    'nonce': w3.eth.getTransactionCount(w3.eth.accounts[-1])
})

register_gas_estimate = w3.eth.estimate_gas(registerTx)
register_cost = register_gas_estimate * gas_price
register_in_ether = Web3.fromWei(register_cost, 'ether')
print(f"""Register cost estimate: {register_cost}\n
      Corresponding to {register_in_ether} ETH\n
      Corresponding to {register_in_ether * 3500} EUR\n""")


votes= [random.randint(1,1000) for i in range(10)]
work = 'QmPP8kQvfs7fbg6kTjfUdJ4rvLiRbLXGzgcHNBQAPPGtNv'
part1, part2 = encode_CID_to_2_bytes_32(work)
commitTx = smartContract.functions.commitWork(0, part1, part2, votes).buildTransaction({
    'from': w3.eth.accounts[-1],  # L'indirizzo dell'account che esegue la transazione
    'nonce': w3.eth.getTransactionCount(w3.eth.accounts[-1])
})
commit_gas_estimate = w3.eth.estimate_gas(commitTx)
commit_cost = commit_gas_estimate * gas_price
commit_in_ether = Web3.fromWei(commit_cost, 'ether')
print(f"""Commit cost estimate: {commit_cost}\n
      Corresponding to {commit_in_ether} ETH\n
      Corresponding to {commit_in_ether * 3500} EUR\n""")

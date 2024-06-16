from web3 import Web3
import json
import utils
import random
from utils import encode_CID_to_2_bytes_32, decode_2_bytes_32_to_CID

f = open('./artifacts/contracts/FedMLContract.sol/FedMLContract.json')
data = json.load(f)
abi = data['abi']
f.close()

w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
contract_address = Web3.to_checksum_address('0x5fbdb2315678afecb367f032d93f642f64180aa3')
contract = w3.eth.contract(address=contract_address, abi=abi)

accounts = w3.eth.accounts
my_address = accounts[-1]

cid = 'QmPP8kQvfs7fbg6kTjfUdJ4rvLiRbLXGzgcHNBQAPPGtNv'
part1, part2 = utils.encode_CID_to_2_bytes_32(cid)

rounds = 2
workersPerRound = 2

tx_hash = contract.functions.deployTask(part1, part2, rounds, workersPerRound).transact({"from":my_address})
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)


#compute entrance fee based on current gas price
gas_price = w3.eth.gas_price

#estimate cost for registering
registerTx = contract.functions.register(0).buildTransaction({
    'from': my_address,  # L'indirizzo dell'account che esegue la transazione
    'nonce': w3.eth.getTransactionCount(my_address)
})
register_gas_estimate = w3.eth.estimate_gas(registerTx)
register_cost = register_gas_estimate * gas_price

print(f"Gas price: {gas_price}")
print(f"Registering cost: {register_cost}")
""" 
Estimating cost for the commit function requires the task to be started
#estimate cost for committing work
votes= [random.randint(1,1000) for i in range(10)]
commitTx = contract.functions.commitWork(0, part1, part2, votes).buildTransaction({
    'from': my_address,  # L'indirizzo dell'account che esegue la transazione
    'nonce': w3.eth.getTransactionCount(my_address)
})
commit_gas_estimate = w3.eth.estimate_gas(commitTx)
commit_cost = commit_gas_estimate * gas_price """

entrance_fee = register_cost
funding = (entrance_fee + register_cost) * workersPerRound * rounds * 1000

#set the fee and fund the task
print(f"Entrance fee set at: {entrance_fee}")
print(f"Funding {funding} wei")
contract.functions.setEntranceFee(0,entrance_fee).transact({"from":my_address})
contract.functions.fund(0).transact({"value":funding,"from":my_address})




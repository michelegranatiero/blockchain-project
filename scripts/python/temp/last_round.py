import random
import numpy

from web3 import Web3
import json


f = open('./artifacts/contracts/Rewards.sol/Rewards.json')
data = json.load(f)
abi = data['abi']
f.close()

w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
contract_address = Web3.to_checksum_address('0x5fbdb2315678afecb367f032d93f642f64180aa3')
contract = w3.eth.contract(address=contract_address, abi=abi)
my_address = w3.eth.accounts[-1]

contract.functions.computeRewards().transact({"from":my_address})












"""
bounty = 1234567890

local_rankings = [[random.randint(0,100) for _ in range(10)] for _ in range(10)]

local_rankings = numpy.array(local_rankings)

global_ranking = sum(rank for rank in local_rankings)

median_ranking = global_ranking/len(local_rankings)

local_variations = abs(local_rankings - median_ranking)

variation_score = [1/sum(v) for v in local_variations]

tot_score = sum(v for v in variation_score)

coefficients = [round(v/tot_score,2) for v in variation_score]

rewards = [bounty * c for c in coefficients]

 print(local_rankings)
print(global_ranking)
print(median_ranking)
print(local_variations)
print(variation_score)
print(coefficients)
print(rewards) """
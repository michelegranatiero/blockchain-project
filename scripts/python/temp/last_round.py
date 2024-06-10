import random
import numpy

from web3 import Web3
import json


""" f = open('./artifacts/contracts/Rewards.sol/Rewards.json')
data = json.load(f)
abi = data['abi']
f.close()

w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
contract_address = Web3.to_checksum_address('0x5fbdb2315678afecb367f032d93f642f64180aa3')
contract = w3.eth.contract(address=contract_address, abi=abi)
my_address = w3.eth.accounts[-1] """




bounty = 123456789000000

local_rankings = [[random.randint(0,100) for _ in range(10)] for _ in range(10)]

local_rankings = numpy.array(local_rankings) #this array exists only when the worker sends its votes to the smart contract

global_ranking = sum(rank for rank in local_rankings) #this is the ranking for the round

median_ranking = global_ranking/len(local_rankings)

local_variations = abs(local_rankings - median_ranking) #distance of each worker from the median ranking

variation_score = [int(100000/sum(v)) for v in local_variations] #inverse of the sum of the distances

tot_score = sum(v for v in variation_score)

coefficients = [int(v/tot_score*100000) for v in variation_score]

rewards = [int(bounty * c/100000) for c in coefficients]

print(f"Local rankings:\n {local_rankings}")
print(f"Round ranking:\n {global_ranking}")
print(f"Median ranking:\n {median_ranking}")
print(f"Local variation:\n {local_variations}")
print(f"Variation score:\n {variation_score}")
print(f"Coefficients:\n {coefficients}")
print(f"Rewards:\n {rewards}")
print(f"Tot score: {tot_score}")
rewards_sum = sum(rewards)

print(bounty - rewards_sum)



matrix = np.array([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
])

vector_size = matrix.shape[1]

m_n = np.zeros(vector_size)

n = 0
for i in range(len(matrix)):
    n+=1
    for j in range(len(matrix)):
        m_n[j] += (matrix[i,j] - m_n[j])/n
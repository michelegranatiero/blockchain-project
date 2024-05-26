import random

participants = 10
funders = 7
fee = 25

fee_reward = participants * fee
funded_reward = fee_reward + funders*fee


ranking = [random.randint(0,10) for _ in range(participants)]

total_score = sum(rank for rank in ranking)

proportions = [rank/total_score for rank in ranking]

rewards = [fee + (funded_reward - fee_reward)*p for p in proportions]


print(f"Total score: {funded_reward}\n Proportions: {proportions} \n Rewards: {rewards}")

bounty = 0
coefficientsSum = 145
workersNumber = 49
workersInRound = 7
topWorkersInRound = 3
roundsNumber = 7


r1 =(bounty * 10^18 * 10^18) /(coefficientsSum *
                roundsNumber -
                ((workersNumber *
                    (workersInRound - 2 * topWorkersInRound + 1) *
                    10^18) /
                    (workersInRound - 1) /
                    (workersInRound - topWorkersInRound + 1)))

print(f"r1: {r1}")
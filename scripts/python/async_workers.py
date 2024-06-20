import os
from web3 import Web3
import json
import asyncio
import ml_utils
import requests
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

device = ml_utils.getDevice()

taskId = 2

class worker:
    def __init__(self, address, contract, dataset):
        self.address = address
        self.contract = contract
        self.selected = False
        self.round = 0
        self.traindata = dataset[0]
        self.testdata = dataset[1]

    async def simulate(self):
        entrance_fee = self.contract.functions.getEntranceFee(taskId).call()
        tx_hash = self.contract.functions.register(taskId).transact({'from':self.address, 'value':entrance_fee})
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt:
            print(f'{self.address[:10]} registered to the task!')
            print(f'{self.address[:10]} listening for events...')

            round_start_event_filter = self.contract.events['RoundStarted'].createFilter(fromBlock='latest')
            numberOfRounds = self.contract.functions.getNumberOfRounds(taskId).call()

            while not self.selected:

                for event in round_start_event_filter.get_new_entries():
                    round = event.args["roundNumber"]
                    self.selected = self.contract.functions.isWorkerSelected(taskId,self.address,round).call({'from':self.address})
                    if self.selected:
                        self.round = round
                        print(f"Worker at address {self.address[:10]} was selected for round {self.round}")
                        if (round + 1 == numberOfRounds):
                            await self.handle_last_round_start_event(event)
                        else:
                            self.handle_round_start_event(event)
                await asyncio.sleep(1)

        print(f"Task ended, worker {self.address[:10]} exiting...")
        

    #Handlers for SC events  
    def handle_round_start_event(self, event):
        previous_work = []
        if self.round != 0:
            commits = self.contract.functions.getRoundWork(taskId, self.round-1).call({'from':self.address})
            previous_work = [decode_2_bytes_32_to_CID(commit[1],commit[2]) for commit in commits]
            print(f"Previous work: {previous_work}")
        print(f"Round {self.round}:{self.address[:10]} start training...")
        work, votes = self.train(previous_work, device, ipfsclient) #plug model training here. the work variable should contain the model CID
        print(f"Votes: {votes}")
        print(f"{self.address[:10]} submitting work...\n")
        part1, part2 = encode_CID_to_2_bytes_32(work)
        tx_hash = self.contract.functions.commit(taskId, part1, part2, votes).transact({"from":self.address})
        w3.eth.wait_for_transaction_receipt(tx_hash)
    
    async def handle_last_round_start_event(self, event):
        commits = self.contract.functions.getRoundWork(taskId, self.round-1).call()
        previous_work = [decode_2_bytes_32_to_CID(commit[1],commit[2]) for commit in commits]
        votes = self.train(previous_work, device, ipfsclient)
        tx_hash = self.contract.functions.commit(taskId, votes, commits[1], commits[2]).transact({"from":self.address})
        w3.eth.wait_for_transaction_receipt(tx_hash)

        commit_ended_event = self.contract.events['LastRoundCommittmentEnded'].createFilter(fromBlock='latest')
        done = False
        while not done:
            for event in commit_ended_event.get_new_entries():
                done = True
                print(f"Worker {self.address[:10]} computing last round score...")
                tx_hash = self.contract.functions.computeLastRoundScore(taskId).transact({"from":self.address})
                w3.eth.wait_for_transaction_receipt(tx_hash)
            await asyncio.sleep(1)


    def handle_end_event(self, event):
        print("Task ended, exiting...")

    def getRandomWord(self):
        response = requests.get('http://127.0.0.1:5000/random-word')
        word = response.content.decode('utf-8')
        return word
    
    def train(self, previousRoundHashes, device, ipfsclient):
        votes = [0 for _ in previousRoundHashes]
        if self.round == 0:
            model = ml_utils.cnn().to(device)
        else:
            #receive models' CIDs from the SC
            #download models from IPFS
            model = ml_utils.cnn().to(device)
            #evaluate all the models and select the best one
            best_accuracy = 0
            for i,hash in enumerate(previousRoundHashes):
                state_dict = ml_utils.torch.load(ml_utils.downloadFromIPFS(ipfsclient, hash))
                model.load_state_dict(state_dict)
                model.eval()
                correct = 0
                total = 0
                for data, target in self.testdata:
                    data, target = data.to(device), target.to(device)
                    output = model(data)
                    _, predicted = ml_utils.torch.max(output.data, 1)
                    total += target.size(0)
                    correct += (predicted == target).sum().item()
                accuracy = 100 * correct / total
                votes[i] = int(accuracy * 10)
                
                if accuracy > best_accuracy:
                    best_state_dict = state_dict
            print("Check if worker is in the last round")
            if self.round + 1 == self.contract.functions.getNumberOfRounds(taskId).call() : #worker of the last round
                return votes
                        
            model.load_state_dict(best_state_dict)
        
        weightsPath = f'rounds/round{self.round}/cnn{self.address[:10]}.params'
        accuracyPath = f'rounds/round{self.round}/accuracy{self.address[:10]}.json'

        # Define loss function and optimizer (assuming you want to do this as well)
        criterion = ml_utils.nn.CrossEntropyLoss()
        optimizer = ml_utils.torch.optim.Adam(model.parameters(), lr = ml_utils.LEARNING_RATE)

        model.train()
        #print(f"Worker {worker_id} started. \n")
        accuracy = []
        for epoch in range(ml_utils.EPOCHS):  # number of epochs
            correct = 0
            total = 0
            for data, target in self.traindata:
                data, target = data.to(device), target.to(device)
                optimizer.zero_grad()
                output = model(data)
                loss = criterion(output, target)
                loss.backward()
                optimizer.step() 

                _, predicted = ml_utils.torch.max(output.data, 1)
                total += target.size(0)
                correct += (predicted == target).sum().item()
            
            epoch_accuracy = 100 * correct / total
            accuracy.append(epoch_accuracy)
        
        if not os.path.exists(f'rounds/round{self.round}'):
            os.makedirs(f'rounds/round{self.round}')

        # Save accuracy to a JSON file
        with open(accuracyPath, 'w') as f:
            json.dump(accuracy, f)

        ml_utils.torch.save(model.state_dict(), weightsPath)
        response = ml_utils.saveToIPFS(ipfsclient, weightsPath)
        hashFile = response['Hash']
        return hashFile, votes
    
async def main():

    task = smartContract.functions.getTask(taskId).call()
    workersRequired = task[1]*task[2]
    dataLoader = ml_utils.getDataLoaders(workersRequired)

    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
    accounts = w3.eth.accounts
    workers = [worker(address, smartContract, dataLoader[i]) for i,address in enumerate(accounts[:workersRequired])]
    print(f"Activating {len(workers)} workers...")
    try:
        result = await asyncio.gather(*[w.simulate() for w in workers], return_exceptions=True)
        for i, result in enumerate(result):
            if isinstance(result, Exception):
                print(f"Worker {i} raised an exception: {result}")
            else:
                print(f"Worker {i} completed successfully with result: {result}")
    except Exception as e:
        print(e.args)

if __name__ == '__main__':
    asyncio.run(main())
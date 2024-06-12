@echo off

echo Building the blockchain...
start call npx hardhat node

echo DONE

set URL=http://127.0.0.1:8545

:waitingForTheBlockchain

for /f "delims=" %%i in ('curl -s -o NUL -w "%%{http_code}" %URL%') do set HTTP_STATUS=%%i

if  %HTTP_STATUS% neq 200 (
    ping 127.0.0.1 -n 2 > nul
    goto waitingForTheBlockchain
)


echo Deploying the contract...
call npx hardhat run .\scripts\deploy.js --network localhost
echo DONE

echo Starting the oracles...
start python .\scripts\python\time_oracle.py
start python .\scripts\python\number_oracle.py
echo DONE
call ping 127.0.0.1 -n 2 > nul
echo Deploying the task...
start python .\scripts\python\deployTask.py
echo DONE

echo Running the workers...
start cmd /k python .\scripts\python\async_workers.py
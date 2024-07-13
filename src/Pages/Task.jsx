import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Progress } from "@/Components/ui/progress"
import { useWeb3 } from "@/hooks/useWeb3";
import  { gweiToWei, weiToGwei } from '@/utils/formatWeb3'
import  { formatAddress, formatState, capitalizeFirstChar } from '@/utils/formatWeb3'
import etherIcon from '@/assets/ethereum.png'

import TaskButtons from "@/Components/TaskButtons";

function Task() {
  const { wallet, contract, getTask, setTaskEvents, getContractBalance} = useWeb3();

  const { id } = useParams();

  const [task, setTask] = useState(false);
  
  const [loading, setLoading] = useState(true);

  const [forceUpdate, setForceUpdate] = useState(0);

  const [contractBalance, setContractBalance] = useState(0);

  useEffect(() => {
    async function fetchTask() {
      let tsk = await getTask(id, true);
      if (tsk) setTask(tsk);
      let balance = await getContractBalance();
      if (balance) setContractBalance(balance);
      setLoading(false);      
      
    }
    if (contract){
      fetchTask();
    }
    else {
      const timeout = setTimeout(() => {
        if (!contract && loading) setLoading(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [contract, wallet, forceUpdate]);

  // EVENTS
  useEffect(() => {
    if (!contract) return;
    const cleanUpFunct = setTaskEvents(id, setForceUpdate);
    
    if (cleanUpFunct) return () => cleanUpFunct();
  }, [contract, wallet]);

  const [progress, setProgress] = useState(0)
 
  /* useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, []) */

  if (!task)
    return (<h1 className="text-xl m-auto text-center"> {loading ? "Loading..." : `Task #${id} not found 😞`} </h1>);

  const items = [
    { label: "Entrance fee", value: weiToGwei(Number(task.entranceFee)) },
    { label: "Funds", value: weiToGwei(Number(task.funds)) },
    { label: "Admin Address", value: formatAddress(String(task.admin)) },
    { label: "# Funders", value: String(task.funders.length) },
    { label: "# Workers", value: `${String(task.registeredWorkers.length)} of ${String(task.workersPerRound * task.numberOfRounds)} (${String(task.workersPerRound)} per round)` },
    ...(formatState(task.state) === "deployed" ? [
      { label: "# Rounds", value: String(task.numberOfRounds) },
    ] : []),
    ...(formatState(task.state) === "started" ? [
      { label: "Current Round", value: `${String(task.rounds.length)} of ${String(task.numberOfRounds)}` },
      { label: "Committed Works in this round", value: `${String(task.rounds[task.rounds.length - 1].committedWorks.length)}/${String(task.workersPerRound)}` },
    ] : []),
    ...(wallet.accounts.length > 0 && ["started", "completed"].includes(formatState(task.state)) && task.amWorker ? [
      { label: "You are selected for round", value: String(task.workerRound)},
    ] : [])
  ];

  return (
    <section className="h-full w-full">
      <Card className="p-4 flex flex-col gap-2 h-full">
        <CardHeader className="gap-4">
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="text-xl"> 
              <span className="text-muted-foreground">#</span>{String(id)}
            </Badge>
            <CardTitle>{task.title}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 w-full justify-between">
              <div className="flex flex-nowrap items-center text-sm text-muted-foreground">
                State:&nbsp;<Badge className="text-sm">{capitalizeFirstChar(formatState(Number(task.state)))}</Badge></div>
              <div className="flex flex-nowrap gap-2">
                {task.amAdmin ? <Badge className="text-sm" variant="secondary"> Admin </Badge> : null}
                {task.amFunder ? <Badge className="text-sm" variant="secondary"> Funder </Badge> : null}
                {task.amWorker ? <Badge className="text-sm" variant="secondary"> Worker</Badge> : null}
              </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <CardDescription>{task.description}</CardDescription>
          {wallet.accounts.length > 0 && formatState(task.state) === "started" &&  task.isWorkerSelected ? (
            <Badge variant="outline" 
            className="text-base justify-center mt-4 py-2 px-4 border-2 border-dashed border-orange-500 text-orange-500">
               You are selected for the current round!
            </Badge>
          ): null}
          <hr className=" w-full h-1 rounded bg-border mt-4"/>
          {items.map((item, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-4 items-center my-1">
                <span className="w-full sm:w-64 font-bold text-center sm:text-left">{item.label}:</span>
                <span className="flex items-center flex-wrap grow gap-1 w-full sm:w-auto justify-center sm:justify-start">
                  {item.label === "# Workers" ? (
                    <span className="flex min-w-[10em] items-center justify-center">
                      <Progress className="w-full"
                      value={task.registeredWorkers.length/Number(task.workersPerRound * task.numberOfRounds)*100}/>
                    </span>
                  ) : null}
                  <span className="text-primary whitespace-nowrap">{item.value}</span>
                  {item.label === "Entrance fee" || item.label === "Funds" ? (
                    <>
                      <span className="font-bold ml-1 text-sm">GWei</span>
                      <img src={etherIcon} alt="Custom Icon" className="w-6 h-6" />
                    </>
                  ) : null}
                </span>
              </div>
              <hr className="w-full h-1 rounded bg-border" />
            </div>
          ))}
          {formatState(task.state) === "deployed"? (
            <Badge variant="outline" 
            className={`text-base justify-center mt-4 py-2 px-4 border-2 border-dashed
               ${task.fundingCompleted ? 'border-red-900 text-red-900' : 'border-emerald-600 text-emerald-600'}`}>
                {task.fundingCompleted ? "Funding Completed" : "Funding in progress"}
            </Badge>
          ): null}
          

        </CardContent>
        <CardFooter className="flex flex-col items-stretch sm:flex-row sm:flex-wrap gap-3 justify-center sm:items-end w-full mt-auto">
          <TaskButtons task={task} setForceUpdate={setForceUpdate}/>
        </CardFooter>

      </Card>
    </section>
  );
}

export default Task;

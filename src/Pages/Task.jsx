import { useParams } from "react-router-dom";
import { Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { useWeb3 } from "@/hooks/useWeb3";
import { useEffect, useState } from "react";

import  { formatAddress, formatState, capitalizeFirstChar } from '@/utils/formatWeb3'
import RegisterTaskModal from "@/Components/RegisterTaskModal";
import FundTaskModal from "@/Components/FundTaskModal";
import GetWeightsBtn from "@/Components/GetWeightsBtn";
import DownloadFileButton from "@/Components/DownloadFileButton";
import CommitWorkModal from "@/Components/CommitWorkModal";
import StopFundingModal from "@/Components/StopFundingModal";

function Task() {
  const { wallet, contract, getTask, setTaskEvents} = useWeb3();

  const { id } = useParams();

  const [task, setTask] = useState(false);
  
  const [loading, setLoading] = useState(true);

  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    async function fetchTask() {
      let tsk = await getTask(id, true);
      if (tsk) setTask(tsk);
      setLoading(false);
    }
    if (contract) fetchTask();
    else {
      const timeout = setTimeout(() => {
        if (!contract && loading) setLoading(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [contract, wallet, forceUpdate]);

  // EVENTS
  useEffect(() => {
    const cleanUpFunct = setTaskEvents(id, setForceUpdate);
    if (cleanUpFunct) return () => cleanUpFunct();
  }, [contract, wallet]);

  if (!task)
    return (<h1 className="text-xl m-auto text-center"> {loading ? "Loading..." : `Task #${id} not found 😞`} </h1>);

  return (
    <section className="h-full w-full">
      <Card className="p-4 flex flex-col gap-2 h-full">
        <CardHeader className="gap-4">
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="text-sm"> 
              <span className="text-muted-foreground">#</span>{String(id)}
            </Badge>
            <CardTitle>{task.title}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 w-full justify-between">
              <div className="flex flex-nowrap items-center text-sm text-muted-foreground">
                State:&nbsp;<Badge>{capitalizeFirstChar(formatState(Number(task.state)))}</Badge></div>
              <div className="flex flex-nowrap gap-2">
                {task.amAdmin ? <Badge variant="secondary"> Admin </Badge> : null}
                {task.amFunder ? <Badge variant="secondary"> Funder </Badge> : null}
                {task.amWorker ? <Badge variant="secondary"> Worker</Badge> : null}
              </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <CardDescription>{task.description}</CardDescription>
          <p>Funds (wei): {Number(task.funds)}</p>
          <p># Funders: {String(task.funders.length)}</p>
          <p>Admin Address: {formatAddress(String(task.admin))}</p>
          <p>Workers per round: {String(task.workersPerRound)}</p>
          <p>Workers: {String(task.registeredWorkers.length)}/{String(task.workersPerRound*task.numberOfRounds)}</p>
          {formatState(task.state) == "deployed"?<>
            <p>Funding completed: {task.fundingCompleted ? "Yes": "No"}</p>
            <p># Rounds: {String(task.numberOfRounds)}</p>
          </> : null}
          {formatState(task.state) == "started"?<>
            <p>Current Round: {String(task.rounds.length)} of {String(task.numberOfRounds)}</p>{/* something to change here on initialization*/}
            <p>Committed Works in this round: {String(task.rounds[task.rounds.length-1].committedWorks.length)}/{String(task.workersPerRound)}</p>
            {wallet.accounts.length > 0 ?<>
              <p>Are you selected for current round?: {task.isWorkerSelected ? "Yes" : "No"}</p>
              {/* insert which is the round of the current connected account if task.amWorker */}
            </>: null}
          </> : null}

        </CardContent>
        <CardFooter className="flex gap-3 justify-center items-end w-full h-full">
          { formatState(task.state) == "deployed" ? <>
            <FundTaskModal taskId={task.id}
              disabledState={!formatState(task.state) == "deployed" || task.fundingCompleted}
              forceUpdate={setForceUpdate}/>
            <RegisterTaskModal taskId={task.id}
              disabledState={task.amWorker || !formatState(task.state) == "deployed"} 
              forceUpdate={setForceUpdate}/>
          </>: null}
          { formatState(task.state) == "deployed" && task.amAdmin ?
            <StopFundingModal taskId={task.id}
              disabledState={!formatState(task.state) == "deployed" || task.fundingCompleted} 
              forceUpdate={setForceUpdate}/>
            : null}
          { formatState(task.state) == "started" ? <> {/*  to add: check if this account can download weights (check round) */}
            <GetWeightsBtn taskId={task.id} // to be implemented
              disabledState={!formatState(task.state) == "deployed"}
              forceUpdate={setForceUpdate}/>
          </>: null}
          { formatState(task.state) == "started" && task.isWorkerSelected ? <>
          <CommitWorkModal taskId={task.id}
            disabledState={!formatState(task.state) == "deployed" || task.hasCommitted}
            forceUpdate={setForceUpdate}/>
          </>: null}
          <DownloadFileButton ipfsCID={task.file}
            forceUpdate={setForceUpdate}/> {/* always available */}
          {/* create button for getRanking when task is completed?? create button for claim reward? */}
        </CardFooter>

      </Card>
    </section>
  );
}

export default Task;

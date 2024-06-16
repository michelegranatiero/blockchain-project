import RegisterTaskModal from "@/Components/RegisterTaskModal";
import FundTaskModal from "@/Components/FundTaskModal";
import GetWeightsBtn from "@/Components/GetWeightsBtn";
import DownloadFileButton from "@/Components/DownloadFileButton";
import CommitWorkModal from "@/Components/CommitWorkModal";
import StopFundingModal from "@/Components/StopFundingModal";
import ComputeLRScoreButton from "./ComputeLRScoreButton";
import WithdrawRewardButton from "./WithdrawRewardButton";

import  { formatState } from '@/utils/formatWeb3'

function TaskButtons({task, setForceUpdate}) {

  //condition: we are in phase 2 of last round
  const scoreLRCondition = task.rounds[Number(task.numberOfRounds) - 1]?.committedWorks.length == task.workersPerRound;

  //condition: withdraw reward
  const withdrawCondition = () => {
    if (stateIs("completed") || stateIs("started")){
      if (task.workerRound == task.numberOfRounds && stateIs("completed")) return true;
      //next round wrt workerRound: task.workerRound - 1 + 1 (-1 for 0-indexed, +1 for next round)
      if (task.rounds[task.workerRound]?.committedWorks.length == task.workersPerRound) return true;
      
      return false;
    }
    return false;
  } 

  function stateIs(taskState){
    return formatState(task.state) == taskState;
  }

  return (
    <>
    { stateIs("deployed") ? <>
      <FundTaskModal taskId={task.id}
        disabledState={!stateIs("deployed") || task.fundingCompleted}
        forceUpdate={setForceUpdate}/>
      <RegisterTaskModal taskId={task.id} entranceFee={task.entranceFee}
        disabledState={task.amWorker || task.registeredWorkers.length >= task.workersPerRound*task.numberOfRounds} 
        forceUpdate={setForceUpdate}/>
    </>: null}
    { stateIs("deployed") && task.amAdmin ?
      <StopFundingModal taskId={task.id}
        disabledState={task.fundingCompleted} 
        forceUpdate={setForceUpdate}/>
    : null}
    { stateIs("started") && task.isWorkerSelected && task.rounds.length > 1 ? <>
      <GetWeightsBtn taskId={task.id} round={task.rounds.length-2} // previous round
        forceUpdate={setForceUpdate}/>
    </>: null}
    { stateIs("started") && task.isWorkerSelected ? <>
    <CommitWorkModal task={task}
      disabledState={task.hasCommitted}
      forceUpdate={setForceUpdate}/>
    </>: null}
    <DownloadFileButton ipfsCID={task.file}
      forceUpdate={setForceUpdate}
    />
    { stateIs("started") && task.isWorkerSelected && scoreLRCondition?
      <ComputeLRScoreButton taskId={task.id}
        disabledState={task.hasLRScore} //disable if already computed last round score
        forceUpdate={setForceUpdate}/>
    : null}
    { task.amWorker && withdrawCondition() ? //withdraw reward
      <WithdrawRewardButton taskId={task.id}
        disabledState={task.hasWithdrawn} //check: disable if already withdrawn
        forceUpdate={setForceUpdate}/>
    : null}
    </>
  );
}

export default TaskButtons;

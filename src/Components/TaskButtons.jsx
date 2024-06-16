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

  return (
    <>
    { formatState(task.state) == "deployed" ? <>
      <FundTaskModal taskId={task.id}
        disabledState={!formatState(task.state) == "deployed" || task.fundingCompleted}
        forceUpdate={setForceUpdate}/>
      <RegisterTaskModal taskId={task.id}
        disabledState={task.amWorker || task.registeredWorkers.length >= task.workersPerRound*task.numberOfRounds} 
        forceUpdate={setForceUpdate}/>
    </>: null}
    { formatState(task.state) == "deployed" && task.amAdmin ?
      <StopFundingModal taskId={task.id}
        disabledState={task.fundingCompleted} 
        forceUpdate={setForceUpdate}/>
    : null}
    { formatState(task.state) == "started" && task.isWorkerSelected && task.rounds.length > 1 ? <>
      <GetWeightsBtn taskId={task.id} round={task.rounds.length-2} // previous round
        forceUpdate={setForceUpdate}/>
    </>: null}
    { formatState(task.state) == "started" && task.isWorkerSelected ? <>
    <CommitWorkModal task={task}
      disabledState={task.hasCommitted}
      forceUpdate={setForceUpdate}/>
    </>: null}
    <DownloadFileButton ipfsCID={task.file}
      forceUpdate={setForceUpdate}
    />
    { formatState(task.state) == "started" && task.isWorkerSelected
      && task.rounds[Number(task.numberOfRounds) - 1]?.committedWorks.length == task.workersPerRound ? //phase 2 of last round
      <ComputeLRScoreButton taskId={task.id}
        disabledState={task.hasLRScore} //disable if already computed last round score
        forceUpdate={setForceUpdate}/>
    : null}
    { formatState(task.state) == "completed" && task.amWorker? //withdraw reward
      <WithdrawRewardButton taskId={task.id} workerRound = {task.workerRound}
        disabledState={task.hasWithdrawn} //check: disable if already withdrawn
        forceUpdate={setForceUpdate}/>
    : null}
    </>
  );
}

export default TaskButtons;

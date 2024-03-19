import { useParams } from "react-router-dom";
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { useWeb3 } from "@/hooks/useWeb3";
import { useEffect, useState } from "react";

import  { formatAddress, formatState } from '@/utils/formatWeb3'
import RegisterTaskModal from "@/Components/RegisterTaskModal";
import FundTaskModal from "@/Components/FundTaskModal";

function Task() {
  const { wallet, contract, getTask, getFunderList, getFunds,
     getSelWorkerList, amFunder, amWorker, amIssuer} = useWeb3();

  const { id } = useParams();

  const [task, setTask] = useState({
    details: {},
    funders: [],
    selWorkers: [],
    funds: null,
    amFunder: false,
    amWorker: false,
    amIssuer: false,
  });

  const [forceUpdate, setForceUpdate] = useState(0);


  useEffect(() => {

    async function getDetails() {
      let details = await getTask(id);
      let funders = await getFunderList(id);
      let funds = await getFunds(id);
      let selWorkers = await getSelWorkerList(id);
      let funderBool = await amFunder(id);
      let workerBool = await amWorker(id);
      let issuerBool = await amIssuer(id);
      setTask(prevDetails => ({ ...prevDetails, 
        details: details, 
        funders: funders, 
        selWorkers: selWorkers,
        funds: funds,
        amFunder: funderBool,
        amWorker: workerBool,
        amIssuer: issuerBool,
      }));
    }
    if (contract && wallet.accounts.length > 0) getDetails();
  }, [contract, wallet, forceUpdate]);

  return (
    <section className="h-full w-full">
      <Card className="p-4 flex flex-col gap-2 h-full">
        <h1>Title: {task.details.title}</h1>
        <p>Description: {task.details.description}</p>
        <p>Id: {id}</p>
        <p>Current round: {String(task.details.currentRound)}</p>{/* something to change here on initialization*/}
        <p>Issuer: {formatAddress(String(task.details.issuer))}</p>
        <p>Funding completed: {String(task.details.fundingCompleted)}</p>
        <p>numberOfRounds: {String(task.details.numberOfRounds)}</p>
        <p>registeredWorkers: {String(task.details.registeredWorkers)}</p>
        <p>registeringCompleted: {String(task.details.registeringCompleted)}</p>
        <p>rounds (struct): {String(task.details.rounds)}</p>
        <p>state: {formatState(Number(task.details.state))}</p>
        <p>workersPerRound: {String(task.details.workersPerRound)}</p>
        <p>workersRequired: {String(task.details.workersRequired)}</p>
    	  <hr />
        <p>Funds: {String(task.funds)} (wei)</p>
        <p>Funders: {String(task.funders)}</p>
        <p>Selected Workers: {String(task.workers)}</p>
        <hr />
        <p>current account is funder: {String(task.amFunder)}</p>
        <p>current account is worker: {String(task.amWorker)}</p>
        <p>current account is issuer: {String(task.amIssuer)}</p>
        <div className="flex gap-3 justify-end self-end w-full h-full">
        { formatState(task.details.state) == "deployed" ?<>
          <FundTaskModal className="self-end" taskId={id} disabledState={!formatState(task.details.state) == "deployed"} forceUpdate={setForceUpdate}/>
          <RegisterTaskModal className="self-end" taskId={id} disabledState={task.amWorker || !formatState(task.details.state) == "deployed"} forceUpdate={setForceUpdate}/>
        </>: null}
        </div>

      </Card>
    </section>
  );
}

export default Task;

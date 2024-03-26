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
import GetAdminFileBtn from "@/Components/GetAdminFileBtn";
import CommitWorkModal from "@/Components/CommitWorkModal";
import StopFundingModal from "@/Components/StopFundingModal";

function Task() {
  const { wallet, contract, getTask, getFunderList, getFunds,
     getSelWorkerList, getRoles} = useWeb3();

  const { id } = useParams();

  const [task, setTask] = useState({
    details: {},
    funders: [],
    selWorkers: [],
    funds: null,
    amFunder: false,
    amWorker: false,
    amAdmin: false,
  });

  const [forceUpdate, setForceUpdate] = useState(0);


  useEffect(() => {

    async function getDetails() {
      let details = await getTask(id);
      let funders = await getFunderList(id);
      let funds = await getFunds(id);
      let selWorkers = await getSelWorkerList(id);
      let roles = await getRoles(id);
      
      setTask(prevDetails => ({ ...prevDetails, 
        details: details, 
        funders: funders, 
        selWorkers: selWorkers,
        funds: funds,
        amFunder: roles.funder,
        amWorker: roles.worker,
        amAdmin: roles.admin,
      }));
    }

    if (contract) getDetails(); // da sistemare, aggiungere <div>{<Navigate to="/" />}</div>
  }, [contract, wallet, forceUpdate]);

  return (
    <section className="h-full w-full">
      <Card className="p-4 flex flex-col gap-2 h-full">
        <CardHeader className="gap-4">
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="text-sm"> 
              <span className="text-muted-foreground">#</span>{String(id)}
            </Badge>
            <CardTitle>{task.details.title}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 w-full justify-between">
              <div className="flex flex-nowrap items-center text-sm text-muted-foreground">
                State:&nbsp;<Badge>{capitalizeFirstChar(formatState(Number(task.details.state)))}</Badge></div>
              <div className="flex flex-nowrap gap-2">
                {task.amAdmin ? <Badge variant="secondary"> Admin </Badge> : null}
                {task.amFunder ? <Badge variant="secondary"> Funder </Badge> : null}
                {task.amWorker ? <Badge variant="secondary"> Worker</Badge> : null}
              </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <CardDescription>{task.details.description}</CardDescription>
          <p>Current round: {String(task.details.currentRound)}</p>{/* something to change here on initialization*/}
          <p>Admin: {formatAddress(String(task.details.admin))}</p>
          <p>Funding completed: {String(task.details.fundingCompleted)}</p>
          <p>numberOfRounds: {String(task.details.numberOfRounds)}</p>
          <p>registeredWorkers: {String(task.details.registeredWorkers)}</p>
          <p>registeringCompleted: {String(task.details.registeringCompleted)}</p> {/* va rimossa?*/}
          <p>rounds (struct): {String(task.details.rounds)}</p>
          <p>workersPerRound: {String(task.details.workersPerRound)}</p>
          <p>workersRequired: {String(task.details.workersRequired)}</p>
          <hr />
          <p>Funds: {String(task.funds)} (wei)</p>
          <p>Funders: {String(task.funders)}</p>
          <p>Selected Workers: {String(task.workers)}</p>
          <hr />

        </CardContent>
        <CardFooter className="flex gap-3 justify-center items-end w-full h-full">
          { formatState(task.details.state) == "deployed" ?<>
            <FundTaskModal taskId={id} disabledState={!formatState(task.details.state) == "deployed"} forceUpdate={setForceUpdate}/>
            <RegisterTaskModal taskId={id} disabledState={task.amWorker || !formatState(task.details.state) == "deployed"} forceUpdate={setForceUpdate}/>
          </>: null}
          { formatState(task.details.state) == "deployed" && task.amAdmin ?<>
            <StopFundingModal taskId={id} disabledState={!formatState(task.details.state) == "deployed"} forceUpdate={setForceUpdate}/>
            {/* check other conditions (disabled if is funding is already stopped) */}
          </>: null}
          { formatState(task.details.state) == "deployed" ?<> {/*state:started check round + other things */}
            <GetWeightsBtn taskId={id} disabledState={!formatState(task.details.state) == "deployed"} forceUpdate={setForceUpdate}/>
          </>: null}
          { formatState(task.details.state) == "deployed" ?<> {/*state:started check round + other things*/}
            <CommitWorkModal taskId={id} disabledState={!formatState(task.details.state) == "deployed"} forceUpdate={setForceUpdate}/>
            {/* disable state if worker has already committed the work */}
          </>: null}

          <GetAdminFileBtn taskId={id} forceUpdate={setForceUpdate}/>
        </CardFooter>

      </Card>
    </section>
  );
}

export default Task;

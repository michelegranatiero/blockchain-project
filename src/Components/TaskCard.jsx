import { Button } from "./ui/button";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";

import RegisterTaskModal from "@/Components/RegisterTaskModal";
import FundTaskModal from "@/Components/FundTaskModal";
import GetWeightsBtn from "@/Components/GetWeightsBtn";
import GetAdminFileBtn from "@/Components/GetAdminFileBtn";
import CommitWorkModal from "@/Components/CommitWorkModal";
import StopFundingModal from "@/Components/StopFundingModal";
import { ScrollArea } from "@/Components/ui/scroll-area"
import { Badge } from "@/Components/ui/badge"
import { useEffect, useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import {formatState, capitalizeFirstChar} from "@/utils/formatWeb3";

function TaskCard({ forceUpd, id, title, description, state, regWorkers,}) {

  const navigate = useNavigate();

  function navigateStopPropagation(e, path) {
    e.stopPropagation();
    navigate(path);
  }

  const [forceUpdate, setForceUpdate] = forceUpd;

  const {wallet, getRoles} = useWeb3();

  const [data, setData] = useState({
    amFunder: false,
    amWorker: false,
    amAdmin: false,
  });


  useEffect(() => {    
    async function getData() {
      /* let details = await getTask(id);
      let funders = await getFunderList(id);
      let funds = await getFunds(id);
      let selWorkers = await getSelWorkerList(id); */
      let roles = await getRoles(id);
      setData(prevData => ({ ...prevData, 
        /* details: details, 
        funders: funders, 
        selWorkers: selWorkers,
        funds: funds, */
        amFunder: roles.funder,
        amWorker: roles.worker,
        amAdmin: roles.admin,
      }));
    }
    //if (contract && wallet.accounts.length > 0) getDetails();
    getData();
  }, [forceUpdate, wallet]);

  return (
    <article
      className="rounded-lg outline-0 ring-primary transition duration-300
      hover:ring-2 focus:ring-2 cursor-pointer ">
        <Card onClick={(e) => navigateStopPropagation(e, `/tasks/${id}`)}
          className="flex flex-col rounded-lg border-2
          sm:h-60 sm:flex-row sm:items-center sm:justify-between overflow-hidden   min-h-[22rem]"> {/* max-h-[25rem] */}
          <div className="flex h-full flex-col overflow-hidden grow">
            <CardHeader className="sm:pr-0">
              <div className="flex gap-2 items-center">
                <Badge variant="outline" className="text-sm"> 
                  <span className="text-muted-foreground">#</span>{String(id)}
                </Badge>
                <CardTitle className="line-clamp-2 sm:line-clamp-1">{title}</CardTitle>
              </div>
            </CardHeader>
            <ScrollArea className="mx-6 mb-6 sm:mr-0 h-32 sm:min-h-24 rounded-md border "
              onClick={(e) => {e.stopPropagation()}}>
              <div className="px-2 py-1">
                <CardDescription className="text-sm ">{description}</CardDescription>
              </div>
            </ScrollArea>
            <CardFooter className="sm:pr-0 pb-0 sm:pb-6">
              <div className="flex flex-wrap gap-2 w-full justify-between">
                  <div className="flex flex-nowrap items-center text-sm text-muted-foreground">
                    State:&nbsp;<Badge>{capitalizeFirstChar(formatState(state))}</Badge>
                  </div>
                  <div className="flex flex-nowrap gap-2">
                    {data.amAdmin ? <Badge variant="secondary"> Admin </Badge> : null}
                    {data.amFunder ? <Badge variant="secondary"> Funder </Badge> : null}
                    {data.amWorker ? <Badge variant="secondary"> Worker</Badge> : null}
                  </div>
              </div>
            </CardFooter>
          </div>
          
          <div className="flex flex-wrap justify-around gap-3 p-6 sm:flex-col sm:justify-center sm:h-full sm:w-40">
            { formatState(state) == "deployed" ?<>
              {/* FundtaskModal: disable 👇🏻 also if fundingCompleted == true  or balance == 0*/}
              <FundTaskModal taskId={id} disabledState={!formatState(state) == "deployed"} forceUpdate={setForceUpdate}/>
              <RegisterTaskModal taskId={id} disabledState={data.amWorker || !formatState(state) == "deployed"} forceUpdate={setForceUpdate}/>
            </>: null}
            { formatState(state) == "deployed" && data.amAdmin ?<>
              {/* StopFundingModal: disable 👇🏻 also if fundingCompleted == true */}
              <StopFundingModal taskId={id} disabledState={!formatState(state) == "deployed"} forceUpdate={setForceUpdate}/>
            </>: null}
            { formatState(state) == "deployed" ?<>
              {/*state: started 👆🏻,  disable 👇🏻: check round + other things */}
              <GetWeightsBtn taskId={id} disabledState={!formatState(state) == "deployed"} forceUpdate={setForceUpdate}/>
            </>: null}
            { formatState(state) == "deployed" ?<>
              {/*state:started 👆🏻, disable 👇🏻: check round + other things + disable if worker has already committed the work*/}
            <CommitWorkModal taskId={id} disabledState={!formatState(state) == "deployed"} forceUpdate={setForceUpdate}/>
            </>: null}
            <GetAdminFileBtn taskId={id} forceUpdate={setForceUpdate}/> {/* always available */}
            {/* create button for getRanking when task is completed?? create button for claim reward? */}
          </div>
          
        </Card>
    </article>
  );
}

export default TaskCard;

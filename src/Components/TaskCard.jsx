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
import { ScrollArea } from "@/Components/ui/scroll-area"
import { useEffect, useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";

function TaskCard({ forceUpd, id, title, description, regWorkers,}) {

  const navigate = useNavigate();

  function navigateStopPropagation(e, path) {
    e.stopPropagation();
    navigate(path);
  }

  const [forceUpdate, setForceUpdate] = forceUpd;

  const {wallet, amFunder, amWorker, amIssuer} = useWeb3();

  const [data, setData] = useState({
    amFunder: false,
    amWorker: false,
    amIssuer: false,
  });


  useEffect(() => {    
    async function getData() {
      /* let details = await getTask(id);
      let funders = await getFunderList(id);
      let funds = await getFunds(id);
      let selWorkers = await getSelWorkerList(id); */
      let funderBool = await amFunder(id);
      
      let workerBool = await amWorker(id);
      let issuerBool = await amIssuer(id);
      setData(prevData => ({ ...prevData, 
        /* details: details, 
        funders: funders, 
        selWorkers: selWorkers,
        funds: funds, */
        amFunder: funderBool,
        amWorker: workerBool,
        amIssuer: issuerBool,
      }));
    }
    //if (contract && wallet.accounts.length > 0) getDetails();
    getData();
  }, [forceUpdate, wallet]);

  return (
    <article
      className="rounded-lg outline-0 ring-primary transition duration-300
      hover:ring-2 focus:ring-2 cursor-pointer">
      
        <Card onClick={(e) => navigateStopPropagation(e, `/tasks/${id}`)}
          className="flex flex-col rounded-lg border-2
          max-h-[25rem] sm:h-60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex h-full flex-col overflow-hidden grow">
            <CardHeader className="sm:pr-0">
              <CardTitle className="line-clamp-2 sm:line-clamp-1">{title}</CardTitle>
            </CardHeader>
            <ScrollArea className="mx-6 mb-6 sm:mr-0 h-32 sm:min-h-24 rounded-md border "
              onClick={(e) => {e.stopPropagation()}}>
              <div className="px-2 py-1">
              <CardDescription className="text-sm">{description} </CardDescription>
                <p>amFunder: {String(data.amFunder)}</p>
                <p>amWorker: {String(data.amWorker)}</p>
                <p>amIssuer: {String(data.amIssuer)}</p>
              </div>
            </ScrollArea>
            <CardFooter className="sm:pr-0 pb-0 sm:pb-6 gap-2">
              {/* <p className="line-clamp-2 sm:line-clamp-1">Paragraph</p> */}
              {data.amIssuer ? <div> Issuer </div> : null}
              {data.amFunder ? <div> Funder </div> : null}
              {data.amWorker ? <div> Worker</div> : null}
            </CardFooter>
          </div>
          <div className="flex justify-around gap-3 p-6 sm:flex-col sm:justify-center sm:h-full">
            <FundTaskModal className="self-end" taskId={id} disabledState={false} forceUpdate={setForceUpdate}/>
            <RegisterTaskModal className="self-end" taskId={id} disabledState={data.amWorker} forceUpdate={setForceUpdate}/>
          </div>
        </Card>
    </article>
  );
}

export default TaskCard;

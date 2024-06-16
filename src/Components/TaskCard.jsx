import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";

import { ScrollArea } from "@/Components/ui/scroll-area"
import { Badge } from "@/Components/ui/badge"
import {formatState, capitalizeFirstChar} from "@/utils/formatWeb3";
import TaskButtons from "@/Components/TaskButtons";

function TaskCard({ forceUpd, task}) {

  const navigate = useNavigate();

  function navigateStopPropagation(e, path) {
    e.stopPropagation();
    navigate(path);
  }

  const [forceUpdate, setForceUpdate] = forceUpd;

  /* const {wallet} = useWeb3();

  const [data, setData] = useState({
    amFunder: false,
    amWorker: false,
    amAdmin: false,
  }); */


  
/*   useEffect(() => {    
    async function getData() {
      let roles = await getRoles(task.id);
      setData(prevData => ({ ...prevData,
        amFunder: roles.funder,
        amWorker: roles.worker,
        amAdmin: roles.admin,
      }));
    }
    //if (contract && wallet.accounts.length > 0) getDetails();
    getData();
  }, [forceUpdate, wallet]); */

  return (
    <article
      className="rounded-lg outline-0 ring-primary transition duration-300
      hover:ring-2 focus:ring-2 cursor-pointer ">
        <Card onClick={(e) => navigateStopPropagation(e, `/tasks/${task.id}`)}
          className="flex flex-col rounded-lg border-2
          sm:h-64 sm:flex-row sm:items-center sm:justify-between overflow-hidden max-h-[25rem]">
          <div className="flex h-full flex-col overflow-hidden grow">
            <CardHeader className="sm:pr-0">
              <div className="flex gap-2 items-center">
                <Badge variant="outline" className="text-sm"> 
                  <span className="text-muted-foreground">#</span>{String(task.id)}
                </Badge>
                <CardTitle className="line-clamp-2 sm:line-clamp-1">{task.title}</CardTitle>
              </div>
            </CardHeader>
            <ScrollArea className="mx-6 mb-6 sm:mr-0 h-32 sm:min-h-24 rounded-md border cursor-default"
              onClick={(e) => {e.stopPropagation()}}>
              <div className="px-2 py-1">
                <CardDescription className="text-sm ">{task.description}</CardDescription>
              </div>
            </ScrollArea>
            <CardFooter className="sm:pr-0 pb-0 sm:pb-6">
              <div className="flex flex-wrap gap-2 w-full justify-between">
                  <div className="flex flex-nowrap items-center text-sm text-muted-foreground">
                    State:&nbsp;<Badge>{capitalizeFirstChar(formatState(task.state))}</Badge>
                  </div>
                  <div className="flex flex-nowrap gap-2">
                    {task.amAdmin ? <Badge variant="secondary"> Admin </Badge> : null}
                    {task.amFunder ? <Badge variant="secondary"> Funder </Badge> : null}
                    {task.amWorker ? <Badge variant="secondary"> Worker</Badge> : null}
                  </div>
              </div>
            </CardFooter>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap justify-around gap-3 p-6 sm:flex-col sm:justify-center sm:h-full sm:w-40">
          <TaskButtons task={task} setForceUpdate={setForceUpdate}/>
          </div>
        </Card>
    </article>
  );
}

export default TaskCard;

import { Button } from "@/Components/ui/button";
import NewTaskModal from "@/Components/NewTaskModal";

//import { useWeb3 } from '@/hooks/useWeb3';


function InfoBar({ pageName }) {

  //const { deployTask } = useWeb3();

  return (
    <div className="flex justify-between px-4 text-3xl font-semibold tracking-tight">
      <h1>{pageName}</h1>
      
      <NewTaskModal/>

      {/* <Button className="bg-emerald-600 hover:bg-emerald-600/90" onClick={() => deployTask()}>
        New Task
      </Button> */}
    </div>
  );
}

export default InfoBar;

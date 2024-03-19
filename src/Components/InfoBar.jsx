import { Button } from "@/Components/ui/button";
import NewTaskModal from "@/Components/NewTaskModal";

function InfoBar({ forceUpdate,pageName }) {

  return (
    <div className="flex justify-between px-4 text-3xl font-semibold tracking-tight">
      <h1>{pageName}</h1>
      
      <NewTaskModal forceUpdate={forceUpdate}/>
    </div>
  );
}

export default InfoBar;

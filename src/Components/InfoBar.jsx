import { Button } from "@/Components/ui/button";

function InfoBar({pageName}) {
  return (
    <div className="px-4 flex justify-between text-3xl font-semibold tracking-tight">
      <h1>{pageName}</h1>
        <Button className="bg-emerald-600 hover:bg-emerald-600/90" >
          New Task
        </Button>
      
    </div>
  );
}

export default InfoBar;

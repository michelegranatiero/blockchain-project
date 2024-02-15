import { Button } from "@/Components/ui/button";

function InfoBar({ pageName }) {
  return (
    <div className="flex justify-between px-4 text-3xl font-semibold tracking-tight">
      <h1>{pageName}</h1>
      
      <Button className="bg-emerald-600 hover:bg-emerald-600/90">
        New Task
      </Button>
    </div>
  );
}

export default InfoBar;

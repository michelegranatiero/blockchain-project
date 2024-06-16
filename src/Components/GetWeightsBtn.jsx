import { useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import { Button } from "@/Components/ui/button"
import { Loader2 } from "lucide-react"

function GetWeightsBtn({ className = "", disabledState = false, taskId, round, forceUpdate}) {

  const {wallet, getRoundWork} = useWeb3();

  const [loadingBtn, setloadingBtn] = useState(false);

  async function handleClick(e){
    e.stopPropagation();
    //check wallet, state etc...
    if (wallet.accounts.length == 0) {
      alert("Please, connect your account first.");
      return;
    }

    setloadingBtn(true);
    //round-1 
    const res = await getRoundWork(taskId, round); //download zip file 
    if (res) {
      forceUpdate((k) => k + 1);
    }else alert("Request failed.");
    setloadingBtn(false);
  }

  return (
    <Button variant="outline"
      disabled={loadingBtn || disabledState} className={` ${className}`}
      onClick={(e) => handleClick(e)}>
      {loadingBtn ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> <>Wait...</></> :
      <>Get Weights</>}
    </Button>
  )
}

export default GetWeightsBtn;
import { useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import { Button } from "@/Components/ui/button"
import { Loader2 } from "lucide-react"

function GetWeightsBtn({ className = "", disabledState = false, taskId, forceUpdate}) {

  const {wallet, getWork} = useWeb3();

  const [loadingBtn, setloadingBtn] = useState(false);

  async function handleClick(e){
    e.stopPropagation();
    //check wallet, state etc...
    if (wallet.accounts.length == 0) {
      alert("Please, connect your account first.");
      return;
    }

    setloadingBtn(true);
    const res = await getWork(taskId);
    if (res) {
      alert("Transaction successful");
      //download weights...

      //window.location.reload();
      forceUpdate((k) => k + 1);
    }else alert("Transaction canceled or denied.");
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



{/* <Dialog open={open} onOpenChange={handleOpenChanging}>
  <DialogTrigger asChild onClick={(e) => {e.stopPropagation()}}>
    <Button className={` ${className}`} disabled={disabledState}>Get Weights</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[470px]">
    <DialogHeader>
      <DialogTitle>Confirm</DialogTitle>
      <DialogDescription>
        Do you want to get the weights of this task?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button type="button" variant="secondary">
          Close
        </Button>
      </DialogClose>
      {loadingBtn ? 
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Please wait
      </Button>
      : <Button type="submit" onClick={onRegister}>Register</Button>
      }
      
      
    </DialogFooter>
  </DialogContent>
</Dialog> */}
import { useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import { Button } from "@/Components/ui/button"
import { Loader2, Download } from "lucide-react"

function GetAdminFileBtn({ className = "", disabledState = false, taskId, forceUpdate}) {

  const {getFile} = useWeb3(); //create getFile function in useWeb3 and smart contract

  const [loadingBtn, setloadingBtn] = useState(false);

  async function handleClick(e){
    e.stopPropagation();
    //check state etc...
    setloadingBtn(true);
    const res = await getFile(taskId);
    if (res) {
      alert("Transaction successful");
      //download admin file...

      //window.location.reload();
      forceUpdate((k) => k + 1);
    }else alert("Transaction canceled or denied.");
    setloadingBtn(false);
  }

  return (
    <Button variant="outline"
      disabled={loadingBtn || disabledState} className={` ${className}`}
      onClick={(e) => handleClick(e)}>
      {loadingBtn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      <Download />
    </Button>
  )
}

export default GetAdminFileBtn;

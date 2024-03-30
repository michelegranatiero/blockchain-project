import { useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import { Button } from "@/Components/ui/button"
import { Loader2, Download } from "lucide-react"

function DownloadFileButton({ ipfsCID, disabledState = false, className = ""}) {

  const {fetchFromIPFS, downloadFile} = useWeb3();

  const [loadingBtn, setloadingBtn] = useState(false);

  async function handleClick(e){
    e.stopPropagation();
    setloadingBtn(true);
    const res = await fetchFromIPFS(ipfsCID);
    if (res) {
      downloadFile(res);
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

export default DownloadFileButton;

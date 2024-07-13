import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { useWeb3 } from "@/hooks/useWeb3";
import { useMetaMask } from '@/hooks/useMetaMask'
import  { formatAddress } from '@/utils/formatWeb3'
import { Button } from "@/Components/ui/button";

function ConnectButton({className=""}) {

  const { wallet, hasProvider, isConnecting, connectMetaMask, disconnectMetaMask } = useMetaMask()
  const { setDefaultFilters } = useWeb3();

  function handleConnection() {
    wallet.accounts.length < 1 ? connectMetaMask() : disconnect();
  }

  function disconnect(){
    setDefaultFilters();
    disconnectMetaMask();
  }

  return (
    <>
    {hasProvider && wallet.accounts.length > 0 ? 
      <DropdownMenu>
        <DropdownMenuTrigger asChild className={` ${className}`}>
          <Button variant="outline"> {formatAddress(wallet.accounts[0])} </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent>
          <DropdownMenuItem className="cursor-pointer" onClick={handleConnection}>
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      : 
      <Button variant="secondary" onClick={handleConnection}>Connect</Button>
    }
    </>
    
  )
}

export default ConnectButton


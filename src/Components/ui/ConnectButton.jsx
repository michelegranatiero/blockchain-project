import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { useMetaMask } from '@/hooks/useMetaMask'
import  { formatAddress } from '@/utils/formatWeb3'
import { Button } from "@/Components/ui/button";

function ConnectButton() {

  const { wallet, hasProvider, isConnecting, connectMetaMask, disconnectMetaMask } = useMetaMask()

  function handleConnection() {
    wallet.accounts.length < 1 ? connectMetaMask() : disconnectMetaMask();
  }

  return (
    <>
    {hasProvider && wallet.accounts.length > 0 ? 
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
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


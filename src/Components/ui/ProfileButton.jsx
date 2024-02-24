import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMetaMask } from '@/hooks/useMetaMask'
import  { formatAddress } from '@/utils/formatWeb3'

function ProfileButton() {

  const { wallet, hasProvider, isConnecting, connectMetaMask, disconnectMetaMask } = useMetaMask()

  function handleConnection() {
    wallet.accounts.length < 1 ? connectMetaMask() : disconnectMetaMask();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src="/img/shadcn.jpg" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {hasProvider && wallet.accounts.length > 0 && 
          <DropdownMenuLabel>
             <a> Address: {formatAddress(wallet.accounts[0])} </a>
          </DropdownMenuLabel>
        }
        <DropdownMenuItem className="cursor-pointer" onClick={handleConnection}>
          {wallet.accounts.length > 0 ? 'Disconnect' : 'Connect'}

        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ProfileButton


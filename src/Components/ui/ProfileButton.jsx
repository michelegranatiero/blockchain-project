import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMetaMask } from '../../hooks/useMetaMask'
import  { formatAddress } from '../../utils'

function ProfileButton() {

  const { wallet, hasProvider, isConnecting, connectMetaMask, disconnectMetaMask } = useMetaMask()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src="/img/shadcn.jpg" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {wallet.accounts.length > 0 && 
          <DropdownMenuLabel>
             <a> Address: {formatAddress(wallet.accounts[0])} </a>
          </DropdownMenuLabel>
        }
        <DropdownMenuItem className="cursor-pointer" onClick={wallet.accounts.length < 1 ? connectMetaMask : disconnectMetaMask}>
          {wallet.accounts.length > 0 ? 'Disconnect' : 'Connect'}

        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ProfileButton


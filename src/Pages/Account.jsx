import InfoBar from "@/Components/InfoBar"
import { useMetaMask } from '../hooks/useMetaMask'
import { formatChainAsNum } from '../utils'

function Account() {

  const { wallet } = useMetaMask();

  return (
    <>
      <InfoBar pageName="Account"/>
      <section className="flex flex-col gap-y-4 rounded-lg p-4">
      {wallet.accounts.length > 0 &&   
      <>
        <div>Wallet Accounts: {wallet.accounts[0]}</div>
        <div>Wallet Balance: {wallet.balance}</div>
        <div>Hex ChainId: {wallet.chainId}</div>
        <div>Numeric ChainId: {formatChainAsNum(wallet.chainId)}</div>
      </>
      }
      </section>
    </>
  )
}

export default Account
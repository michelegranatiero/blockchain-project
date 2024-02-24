import InfoBar from "@/Components/InfoBar"
import { useMetaMask } from '@/hooks/useMetaMask'

function Account() {

  const { wallet } = useMetaMask();

  return (
    <>
      <InfoBar pageName="Account"/>
      <section className="flex flex-col gap-y-4 rounded-lg p-4">
      {wallet.accounts.length > 0 &&   
      <>
        <div>Account: {wallet.accounts[0]}</div>
        <div>Balance: {wallet.balance}</div>
        {/* <div>Hex ChainId: {wallet.chainId}</div> */}
        <div>{/* Numeric  */}Chain Id: {wallet.chainId}</div>
      </>
      }
      </section>
    </>
  )
}

export default Account
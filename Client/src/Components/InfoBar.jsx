import { Button } from "@/Components/ui/button";

//import { Web3 } from 'web3';
//import { Contract } from 'web3-eth-contract';

//import { useMetaMask } from '../hooks/useMetaMask';

import { useWeb3 } from '../hooks/useWeb3';


function InfoBar({ pageName }) {

  const { register } = useWeb3();

  return (
    <div className="flex justify-between px-4 text-3xl font-semibold tracking-tight">
      <h1>{pageName}</h1>
      
      <Button className="bg-emerald-600 hover:bg-emerald-600/90" onClick={() => register()}>
        New Task
      </Button>
    </div>
  );
}

export default InfoBar;

export const formatBalance = (rawBalance) => {
    const balance = (parseInt(rawBalance) / 1000000000000000000).toFixed(2)
    return balance
  }
  
  export const formatChainAsNum = (chainIdHex) => {
    const chainIdNum = parseInt(chainIdHex)
    return chainIdNum
  }
  
  export const formatAddress = (addr) => {
    return `${addr.slice(0,7)}...${addr.slice(-5)}`
  }


  export const formatState = (state) => {
    const states = ["deployed", "started", "completed"]
    return states[state];
  }

  export const capitalizeFirstChar = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }


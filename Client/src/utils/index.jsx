export const formatBalance = (rawBalance) => {
    const balance = (parseInt(rawBalance) / 1000000000000000000).toFixed(2)
    return balance
  }
  
  export const formatChainAsNum = (chainIdHex) => {
    const chainIdNum = parseInt(chainIdHex)
    return chainIdNum
  }
  
  export const formatAddress = (addr) => {
    return `${addr.substring(0, 8)}...`
  }
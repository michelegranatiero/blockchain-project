require("@nomicfoundation/hardhat-toolbox");


const { API_URL, PRIVATE_KEY } = process.env;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        count: 55
      }
    },
    local: {
      url: "http://yourLocalIp:8545", // your local ip (different from localhost)
      chainId: 1337,
    },
    sepolia: {
      url: "https://mainnet.infura.io/v3/18ed72045f9d426e8a0c6de3be42ef06",
      accounts: [`0xc2c7072707044ee6ccb05cf1a7db29ae2b750df212bd7004141abf133303fdab`]
    }
  }
};

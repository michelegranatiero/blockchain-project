// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
import hre from "hardhat";

async function main() {

  // Define the dimensions of your matrix
  const numRows = 10;
  const numCols = 10;

  // Initialize an empty matrix
  const matrix = [];

  // Populate the matrix with integers
  for (let i = 0; i < numRows; i++) {
      // Initialize an empty row
      const row = [];
      for (let j = 0; j < numCols; j++) {
          // Generate a random integer, or you can set it to any specific value
          const randomNumber = Math.floor(Math.random() * 10); // Generates random integers between 0 and 9
          row.push(randomNumber);
      }
      // Add the row to the matrix
      matrix.push(row);
  }

  const factory = await hre.ethers.getContractFactory("Rewards");
  const Rewards = await factory.deploy(matrix,100000);
  await Rewards.waitForDeployment();

  console.log(
    `Deployed to ${Rewards.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

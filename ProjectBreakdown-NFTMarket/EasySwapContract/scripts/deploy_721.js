const { ethers, upgrades } = require("hardhat")

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("deployer: ", deployer.address)

  // let TestERC721 = await ethers.getContractFactory("TestERC721")
  // const testERC721 = await TestERC721.deploy()
  // await testERC721.deployed()
  // console.log("testERC721 contract deployed to:", testERC721.address)

  //mint
  let testERC721Address = "0x20B58EdCe011027A524D1dd995055a123a8D9C9a";
  let testERC721 = await (await ethers.getContractFactory("TestERC721")).attach(testERC721Address)
  // tx = await testERC721.mint(deployer.address, i);
  // await tx.wait()
  // console.log("mint tx:", tx.hash)

  for (let i = 1; i <= 5; i++) {
    tx = await testERC721.mint(deployer.address, i);
    await tx.wait()
    console.log("mint tx:", tx.hash)
  }
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

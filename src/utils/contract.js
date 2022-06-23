import { ethers } from "ethers";

class Contract {
  constructor(eth, abi, contractAddress) {
    this.eth = eth;
    this.contractAddress = contractAddress;
    this.abi = abi;
  }
  provider() {
    return new ethers.providers.Web3Provider(this.eth);
  }
  signer() {
    return this.provider().getSigner();
  }
  create() {
    return new ethers.Contract(this.contractAddress, this.abi, this.signer());
  }
  async auctionForNFT(address, tokenId) {
    const contract = this.create();
    let auction = await contract.auctionForNFT(address, tokenId);
    return auction;
  }
  async createBid(address, tokenId, amount) {
    const contract = this.create();
    let value = ethers.utils.parseUnits(amount, 18);

    return await contract.createBid(address, tokenId, {
      value: value.toString(),
      gasLimit: 200000,
    });
  }
}
export { Contract };

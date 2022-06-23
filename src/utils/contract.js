import { ethers } from "ethers";
import { Interface } from "ethers/lib/utils";

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
  getTopics(nftAddress, tokenId) {
    /*function to get the history of bids in the auction */
    const contract = this.create();
    return contract.filters.AuctionBid(nftAddress, tokenId, null);
  }
  async getLogs(filterLog) {
    /* function to parse the history of bids */
    let provider = this.provider();
    let logList = await provider.getLogs(filterLog);
    let iface = new Interface(this.abi);
    let events = logList.map((log) => iface.parseLog(log));
    return events;
  }
  checkAuctionBid(callback, callback2) {
    /* function to listen the events emitted in the contract,
     will when contract emit the event we will execute a function to update the history   */
    let observer = this.create();
    observer.on("AuctionBid", () => {
      callback();
      callback2();
    });
  }
  checkAuctionEnd(callback, callback2, callback3) {
    let observer = this.create();
    observer.on("AuctionEnded", () => {
      callback();
      callback2();
      callback3(true);
    });
  }
}
export { Contract };

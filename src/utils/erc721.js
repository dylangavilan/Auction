import { ethers } from "ethers";
import abi from "../erc721.json";
class ERC721 {
  constructor(eth, contractAddress) {
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
}
export { ERC721 };

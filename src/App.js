import { useEffect, useState } from "react";
import abi from "./abi.json";
import { Contract } from "./utils/contract";
import {
  checkIfWalletIsConnected,
  connectWallet,
  formatAddress,
} from "./utils/utils";
import { formatEther } from "ethers/lib/utils";
function App() {
  const networkId = 4;
  const tokenId = 4;
  const nftAddress = "0xbe213eaa1ab245d9ab96ece663af82e2cf285bf0";
  const contractAddress = "0x3feaf4c06211680e5969a86adb1423fc8ad9e994";
  const [wallet, setWallet] = useState("");
  const [highestBid, sethighestBid] = useState();
  const [reservePrice, setReservePrice] = useState();
  const [bid, setBid] = useState("0.1");
  const [contract, setContract] = useState();
  const [highestBider, setHighestBider] = useState("");
  const [seller, setSeller] = useState("");
  const init = async () => {
    let connected = await checkIfWalletIsConnected();
    if (!connected) return; //if not connected stop the process to avoid bugs
    setWallet(connected);
    if (parseInt(window.ethereum.networkVersion) !== networkId) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${networkId}` }],
      });
    }
    /* when the user is connected and on the correct network then we will create the contract */
    const contract = new Contract(window.ethereum, abi, contractAddress);
    let auctionInfo = await contract.auctionForNFT(nftAddress, tokenId);
    setSeller(auctionInfo.seller);
    setHighestBider(auctionInfo.highestBidder);
    let highestBid = auctionInfo.highestBid.toNumber();
    sethighestBid(highestBid);
    let defaultPrice = formatEther(auctionInfo.reservePrice.toString()); //transform in eth format
    setReservePrice(defaultPrice > highestBid ? defaultPrice : highestBid);
    setContract(contract);
  };
  const connect = async () => {
    await connectWallet();
  };
  const initBid = async () => {
    return await contract.createBid(nftAddress, tokenId, bid);
  };
  useEffect(() => {
    if (window.ethereum) {
      /* only if metamask injected in browser */
      init();
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);
  return (
    <div>
      {
        !wallet && (
          <button
            className="button"
            onClick={() => {
              connect();
            }}
          >
            Connect metamask
          </button>
        ) /*to show the button only when user is not connected */
      }
      {wallet && (
        <div>
          <h1>Highest Bid: {highestBid}</h1>
          <h2>Highest Bider: {formatAddress(highestBider)}</h2>
          <h3>Seller: {formatAddress(seller)}</h3>
          <h3>Price to reserve: {reservePrice} eth</h3>
          <input
            type="number"
            min={reservePrice}
            step="0.01"
            defaultValue={reservePrice}
            onChange={(e) => {
              setBid(e.target.value);
            }}
          />
          <button onClick={initBid}>Reserve</button>
        </div>
      )}
    </div>
  );
}

export default App;

import { useEffect, useState } from "react";
import abi from "./abi.json";
import { Contract } from "./utils/contract";
import {
  checkIfWalletIsConnected,
  connectWallet,
  formatAddress,
} from "./utils/utils";
import { formatEther } from "ethers/lib/utils";
// import rinkebyZoraAddresses from "@zoralabs/v3/dist/addresses/4.json"; // Mainnet addresses, 4.json would be Rinkeby Testnet
// import { IERC721__factory } from "@zoralabs/v3/dist/typechain/factories/IERC721__factory";
// import { IERC20__factory } from "@zoralabs/v3/dist/typechain/factories/IERC20__factory";
// import { ZoraModuleManager__factory } from "@zoralabs/v3/dist/typechain/factories/ZoraModuleManager__factory";

function App() {
  const networkId = 4;
  const tokenId = 34;
  const nftAddress = "0x5ddd592791d0c2260d6105879c1ff17ad74e1d42";
  const contractAddress = "0x3feaf4c06211680e5969a86adb1423fc8ad9e994";

  const [wallet, setWallet] = useState("");
  const [highestBid, sethighestBid] = useState();
  const [reservePrice, setReservePrice] = useState();
  const [bid, setBid] = useState("0.1");
  const [contract, setContract] = useState();
  const [highestBider, setHighestBider] = useState("");
  const [seller, setSeller] = useState("");
  const [duration, setDuration] = useState("");
  const [sellerFundsRecipient, setSellerFunds] = useState("");
  const [firstBidTime, setfirstBidTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
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
    let observer = contract.create();

    observer.on("AuctionBid", (addressToken, tokenId) => {
      console.log("Event auction bid: ");
      console.log("addressToken: ", addressToken);
      console.log("tokenId: ", tokenId.toNumber());
      // console.log("firstBid: ", firstBid);
      // console.log("extended: ", extended);
      // console.log("auction: ", auction);
    });
    let auctionInfo = await contract.auctionForNFT(nftAddress, tokenId);
    setSeller(auctionInfo.seller);
    setHighestBider(auctionInfo.highestBidder);
    setSellerFunds(auctionInfo.sellerFundsRecipient);
    setDuration(auctionInfo.duration);
    setfirstBidTime(auctionInfo.firstBidTime);
    setStartTime(auctionInfo.startTime);
    let highestBid = formatEther(auctionInfo.highestBid);
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
          <h4>Seller funds recipient: {formatAddress(sellerFundsRecipient)}</h4>
          <h4>First bid time: {firstBidTime}</h4>
          <h5>Duration: {duration}</h5>
          <h5>Start time: {startTime}</h5>
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

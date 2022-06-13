import { useEffect, useState } from "react";
import abi from "./abi.json";
import { Contract } from "./utils/contract";
import { checkIfWalletIsConnected, connectWallet } from "./utils/utils";
import { formatEther } from "ethers/lib/utils";
function App() {
  const networkId = 4;
  const tokenId = 4;
  const nftAddress = "0xbe213eaa1ab245d9ab96ece663af82e2cf285bf0";
  const contractAddress = "0x3feaf4c06211680e5969a86adb1423fc8ad9e994";
  const [wallet, setWallet] = useState();
  const [highestBid, sethighestBid] = useState();
  const [reservePrice, setReservePrice] = useState();
  const [bid, setBid] = useState("");
  const [contract, setContract] = useState();
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
    // console.log(auctionInfo);
    sethighestBid(auctionInfo.highestBid.toNumber());
    let price = formatEther(auctionInfo.reservePrice.toString()); //transform in eth format
    setReservePrice(price);
    setContract(contract);
  };
  const connect = async () => {
    await connectWallet();
  };
  const initBid = async () => {
    return await contract.createBid(nftAddress, contractAddress, bid);
  };
  useEffect(() => {
    if (window.ethereum) {
      /* only if metamask injected in browser */
      init();
    }
  }, []);
  console.log(bid);
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
          <h3>Price to reserve: {reservePrice} eth</h3>
          <input
            type="number"
            min="0.1"
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

import { useEffect, useState } from "react";
import abi from "./abi.json";
import "./App.css";
import { Contract } from "./utils/contract";
import {
  checkIfWalletIsConnected,
  connectWallet,
  formatAddress,
} from "./utils/utils";
import { formatEther } from "ethers/lib/utils";
import { ERC721 } from "./utils/erc721";

function App() {
  const networkId = 4;
  const tokenId = 32;
  const contractAddress = "0x3feaf4c06211680e5969a86adb1423fc8ad9e994";
  const nftAddress = "0x5ddd592791d0c2260d6105879c1ff17ad74e1d42";
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
  const [history, setHistory] = useState([]);
  const [ended, setEnded] = useState(false);
  const [ipfsData, setIpfsData] = useState("");
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
    const get = async () => {
      let topic = contract.getTopics(nftAddress, tokenId);
      let filterLog = {
        fromBlock: 0,
        toBlock: "latest",
        topics: topic.topics,
      };
      let logs = await contract.getLogs(filterLog);
      let x = [];
      logs.forEach((el) => {
        x.push({
          wallet: el.args.auction[4],
          bid: formatEther(el.args.auction[3]),
        });
      });
      setHistory(x);
    };
    const getData = async () => {
      let auctionInfo = await contract.auctionForNFT(nftAddress, tokenId);
      setSeller(auctionInfo.seller);
      let erc721 = new ERC721(window.ethereum, nftAddress);
      let ipfsData = await erc721.getUri(tokenId);
      setIpfsData(ipfsData);
      if (auctionInfo.seller === "0x0000000000000000000000000000000000000000") {
        let topic = contract.getTopics(nftAddress, tokenId);
        let filterLog = {
          fromBlock: 0,
          toBlock: "latest",
          topics: topic.topics,
        };
        let logs = await contract.getLogs(filterLog);
        sethighestBid(formatEther(logs[0].args.auction.highestBid));
        setHighestBider(logs[0].args.auction.highestBidder);
        return setEnded(true);
      } else {
        setHighestBider(auctionInfo.highestBidder);
        setSellerFunds(auctionInfo.sellerFundsRecipient);
        setDuration(auctionInfo.duration);
        setfirstBidTime(auctionInfo.firstBidTime);
        setStartTime(auctionInfo.startTime);
        let highestBid = formatEther(auctionInfo.highestBid);
        sethighestBid(highestBid);
        let defaultPrice = formatEther(auctionInfo.reservePrice.toString()); //transform in eth format
        setReservePrice(defaultPrice > highestBid ? defaultPrice : highestBid);
      }
      setContract(contract);
    };
    get();
    getData();
    contract.checkAuctionEnd(get, getData, setEnded);
    contract.checkAuctionBid(get, getData);
  };
  const connect = async () => {
    await connectWallet();
  };
  const initBid = async () => {
    const tx = await contract.createBid(nftAddress, tokenId, bid);
    tx.wait();
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
  console.log(ended);
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
        <div className="group">
          <h3>Metadata </h3>
          <p>{ipfsData}</p>
          {!ended ? (
            <div>
              {" "}
              <h4>Highest Bid: {highestBid}</h4>
              <h4>Highest Bider: {formatAddress(highestBider)}</h4>
              <h4>Seller: {formatAddress(seller)}</h4>
              <h4>Price to reserve: {reservePrice} eth</h4>
              <h4>
                Seller funds recipient: {formatAddress(sellerFundsRecipient)}
              </h4>
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
          ) : (
            <div>
              <h1>Auction ended</h1>
              <h3>highestBid: {highestBid}</h3>
              <h3>winner: {formatAddress(highestBider)}</h3>
            </div>
          )}

          <h1>History bid</h1>
          <div className="container">
            {history?.map((el) => {
              return (
                <div className="history">
                  <h3>Wallet: {formatAddress(el.wallet)}</h3>
                  <h4>Price: {el.bid}</h4>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

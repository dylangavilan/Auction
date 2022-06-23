import { useEffect, useState } from "react";
import abi from "./abi.json";
import "./App.css";
import { Contract } from "./utils/contract";
import {
  checkIfWalletIsConnected,
  connectWallet,
  formatAddress,
} from "./utils/utils";
import { formatEther, Interface } from "ethers/lib/utils";
import { ERC721 } from "./utils/erc721";
// import axios from "axios";
// import rinkebyZoraAddresses from "@zoralabs/v3/dist/addresses/4.json"; // Mainnet addresses, 4.json would be Rinkeby Testnet
// import { IERC721__factory } from "@zoralabs/v3/dist/typechain/factories/IERC721__factory";
// import { IERC20__factory } from "@zoralabs/v3/dist/typechain/factories/IERC20__factory";
// import { ZoraModuleManager__factory } from "@zoralabs/v3/dist/typechain/factories/ZoraModuleManager__factory";

function App() {
  const networkId = 4;
  const tokenId = 135;
  const nftAddress = "0x775B572e0CEB816625Af9779Bb686A8b47975876";
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
  const [history, setHistory] = useState([]);
  const [ended, setEnded] = useState(false);
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
    const get = () => {
      let topic = observer.filters.AuctionBid(nftAddress, tokenId, null);
      let filterLog = {
        fromBlock: 0,
        toBlock: "latest",
        topics: topic.topics,
      };
      let provider = contract.provider();
      let iface = new Interface(abi);
      provider.getLogs(filterLog).then((logList) => {
        let events = logList.map((log) => iface.parseLog(log));
        let x = [];
        events.forEach((el) => {
          x.push({
            wallet: el.args.auction[4],
            bid: formatEther(el.args.auction[3]),
          });
        });
        setHistory(x);
      });
    };
    const getData = async () => {
      let auctionInfo = await contract.auctionForNFT(nftAddress, tokenId);
      setSeller(auctionInfo.seller);
      let erc721 = new ERC721(window.ethereum, nftAddress);
      erc721 = erc721.create();
      let ipfsData = await erc721.tokenURI(tokenId);
      console.log(ipfsData);
      // await axios.get(
      //   "https://ipfs.io/ipfs/bafkreih72hdsnfwatrj3c7alplkkq3pnqwqe4kibyoikhs7y4xlnkwdkqy"
      // );
      if (auctionInfo.seller === "0x0000000000000000000000000000000000000000") {
        let topic = observer.filters.AuctionEnded(nftAddress, tokenId, null);
        let filterLog = {
          fromBlock: 0,
          toBlock: "latest",
          topics: topic.topics,
        };
        let provider = contract.provider();
        let iface = new Interface(abi);
        provider.getLogs(filterLog).then((logList) => {
          let events = logList.map((log) => iface.parseLog(log));
          sethighestBid(formatEther(events[0].args.auction.highestBid));
          setHighestBider(events[0].args.auction.highestBidder);
        });
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
    observer.on("AuctionEnded", () => {
      get();
      getData();
      setEnded(true);
    });
    observer.on("AuctionBid", () => {
      get();
      getData();
    });
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
          {!ended ? (
            <div>
              {" "}
              <h1>Highest Bid: {highestBid}</h1>
              <h2>Highest Bider: {formatAddress(highestBider)}</h2>
              <h3>Seller: {formatAddress(seller)}</h3>
              <h3>Price to reserve: {reservePrice} eth</h3>
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

          <div className="container">
            <h1>History bid</h1>
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

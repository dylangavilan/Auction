export const checkIfWalletIsConnected = async () => {
  try {
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });
    if (accounts.length !== 0) {
      return accounts[0]; //return wallet
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
};
export const connectWallet = async () => {
  try {
    const { ethereum } = window;
    if (!ethereum) {
      alert("Get MetaMask!");
      return;
    }
    await ethereum.request({
      method: "eth_requestAccounts",
    });
    return window.location.reload();
  } catch (error) {
    console.log(error);
  }
};
export const formatAddress = (wallet) => {
  return (
    wallet.slice(0, 4) + "..." + wallet.slice(wallet.length - 4, wallet.length)
  );
};

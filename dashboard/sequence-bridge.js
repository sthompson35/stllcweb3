// Drop-in helper for the existing stllcweb3 HTML dashboard.
// Requires ethers v5 (loaded via CDN in index.html).

window.STLLCBridge = (() => {
  const state = {
    contractAddress: null,
    abi: null,
  };

  async function init({ contractAddress, abi }) {
    state.contractAddress = contractAddress;
    state.abi = abi;
  }

  async function connectWallet() {
    if (!window.ethereum) throw new Error('Wallet provider not found');
    const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return account;
  }

  async function contractWithSigner() {
    if (!state.contractAddress || !state.abi) throw new Error('Bridge not initialized');
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(state.contractAddress, state.abi, signer);
  }

  async function mintAsset(to, metadataUri) {
    const contract = await contractWithSigner();
    const tx = await contract.mintAsset(to, metadataUri);
    return await tx.wait();
  }

  async function nextTokenId() {
    const contract = await contractWithSigner();
    return String(await contract.nextTokenId());
  }

  return { init, connectWallet, mintAsset, nextTokenId };
})();

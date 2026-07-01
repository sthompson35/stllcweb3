import { useOpenConnectModal } from '@0xsequence/kit'
import { useAccount, useDisconnect } from 'wagmi'

export default function WalletButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { setOpenConnectModal } = useOpenConnectModal()

  if (isConnected && address) {
    return (
      <button className="wallet-chip" onClick={() => disconnect()}>
        <span className="wallet-chip-dot" />
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    )
  }

  return (
    <button
      className="btn btn-primary btn-sm"
      onClick={() => setOpenConnectModal(true)}
    >
      Connect Wallet
    </button>
  )
}

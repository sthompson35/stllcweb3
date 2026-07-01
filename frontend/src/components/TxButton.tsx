import { useWaitForTransactionReceipt } from 'wagmi'

type Props = {
  label: string
  pendingLabel?: string
  hash?: `0x${string}`
  isPending: boolean
  isSuccess?: boolean
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  onClick: () => void
}

export default function TxButton({
  label, pendingLabel = 'Confirming…', hash, isPending, isSuccess, disabled, className = 'btn btn-primary', style, onClick,
}: Props) {
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  const busy = isPending || isConfirming
  const done = isSuccess || isConfirmed

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        className={className}
        disabled={disabled || busy}
        onClick={onClick}
        style={{ opacity: busy ? 0.7 : 1, ...style }}
      >
        {busy ? pendingLabel : label}
      </button>
      {isConfirming && hash && (
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--steel)' }}>
          Tx: {hash.slice(0, 10)}… waiting for block…
        </div>
      )}
      {done && (
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--teal)' }}>
          ✓ Transaction confirmed
        </div>
      )}
    </div>
  )
}

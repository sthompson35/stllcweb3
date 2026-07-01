import { createConfig } from '@0xsequence/kit'
import { polygon } from 'wagmi/chains'
import { http } from 'wagmi'

const env = (import.meta as unknown as { env: Record<string, string> }).env

const projectAccessKey  = env.VITE_SEQUENCE_ACCESS_KEY       || 'placeholder'
const waasConfigKey     = env.VITE_SEQUENCE_WAAS_CONFIG_KEY  || ''
const walletConnectId   = env.VITE_WALLETCONNECT_PROJECT_ID  || ''

const ALCHEMY_KEY = 'PJNEmFraZPsFRB13V9zCI'

export const { wagmiConfig, kitConfig } = createConfig('waas', {
  waasConfigKey,
  appName: 'STLLC Investment Portal',
  projectAccessKey,

  chainIds: [polygon.id],
  defaultChainId: polygon.id,

  // Social login options (WaaS mode: no 'sequence' option, google/apple need clientId objects)
  email: true,
  google: false,
  apple: false,

  // Traditional wallet connectors
  metaMask: true,
  coinbase: true,
  walletConnect: walletConnectId ? { projectId: walletConnectId } : false,

  wagmiConfig: {
    transports: {
      [polygon.id]: http(`https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    },
  },
})

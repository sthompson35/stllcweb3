export type AgentKey = 'crypto' | 'contract' | 'nft' | 'tokenomics' | 'compliance';

export const AI_AGENT_REGISTRY = [
  {
    key: 'crypto',
    name: 'Crypto Intelligence Agent',
    mission: 'Track crypto markets, wallet activity, risk events, token trends, and Web3 opportunity signals.',
    tools: ['market_data', 'wallet_scan', 'news_context', 'risk_flags'],
  },
  {
    key: 'contract',
    name: 'Smart Contract Auditor Agent',
    mission: 'Review ABIs, deployments, permissions, upgrade risk, owner controls, and suspicious contract patterns.',
    tools: ['abi_reader', 'bytecode_lookup', 'openzeppelin_check', 'explorer_verification'],
  },
  {
    key: 'nft',
    name: 'NFT Strategy Agent',
    mission: 'Design and monitor NFTs for loyalty, memberships, deal records, KhakiSol campaigns, and tokenized access.',
    tools: ['metadata_review', 'collection_health', 'royalty_policy', 'utility_mapping'],
  },
  {
    key: 'tokenomics',
    name: 'Tokenomics Agent',
    mission: 'Evaluate supply, utility, incentives, vesting, liquidity, treasury risk, and investor alignment.',
    tools: ['supply_model', 'vesting_review', 'liquidity_map', 'scenario_analysis'],
  },
  {
    key: 'compliance',
    name: 'Compliance Agent',
    mission: 'Flag securities, investor solicitation, KYC/AML, real-estate tokenization, and disclosure risks.',
    tools: ['policy_check', 'disclosure_review', 'jurisdiction_notes', 'risk_memo'],
  },
] as const;

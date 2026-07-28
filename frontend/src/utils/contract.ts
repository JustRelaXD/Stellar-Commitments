import type { ContractEvent } from '../types';

// Demo events shown when no real contract events are available
const DEMO_EVENTS: ContractEvent[] = [
  {
    type: 'vault_created',
    data: {
      vault_id: 1,
      stake: 10,
      required: 7,
      deadline: Math.floor(Date.now() / 1000) + 7 * 86400,
      owner: 'GBR3KX4LZVNB4SVHFGMGQJ5QTKX7K4J5M7J5K7K4J5M7J5K7K4J5M7',
    },
    timestamp: Date.now() - 120000,
  },
  {
    type: 'checked_in',
    data: {
      vault_id: 1,
      count: 1,
      required: 7,
      owner: 'GBR3KX4LZVNB4SVHFGMGQJ5QTKX7K4J5M7J5K7K4J5M7J5K7K4J5M7',
    },
    timestamp: Date.now() - 60000,
  },
  {
    type: 'checked_in',
    data: {
      vault_id: 1,
      count: 2,
      required: 7,
      owner: 'GBR3KX4LZVNB4SVHFGMGQJ5QTKX7K4J5M7J5K7K4J5M7J5K7K4J5M7',
    },
    timestamp: Date.now() - 30000,
  },
  {
    type: 'vault_settled',
    data: {
      vault_id: 1,
      owner: 'GBR3KX4LZVNB4SVHFGMGQJ5QTKX7K4J5M7J5K7K4J5M7J5K7K4J5M7',
      returned: 2,
      donated: 8,
      completed: false,
    },
    timestamp: Date.now() - 10000,
  },
];

export function getDemoEvents(): ContractEvent[] {
  return DEMO_EVENTS;
}

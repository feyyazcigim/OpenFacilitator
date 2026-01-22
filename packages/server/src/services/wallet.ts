/**
 * User billing wallet service
 * Manages custodial wallets for user subscriptions on Solana and Base
 */
import {
  generateSolanaKeypair,
  getSolanaPublicKey,
  getSolanaUSDCBalance,
} from '@openfacilitator/core';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http, erc20Abi } from 'viem';
import { base } from 'viem/chains';
import { encryptPrivateKey, decryptPrivateKey } from '../utils/crypto.js';
import {
  createUserWallet,
  getUserWalletByUserId,
  getUserWalletsByUserId,
  getUserWalletByUserIdAndNetwork,
} from '../db/user-wallets.js';

// Base USDC contract address (verified on Basescan)
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

// Create a public client for Base chain RPC calls
const basePublicClient = createPublicClient({
  chain: base,
  transport: http(),
});

/**
 * Generate a new Solana billing wallet for a user
 * Returns existing wallet if one already exists on Solana
 */
export async function generateWalletForUser(userId: string): Promise<{ address: string; created: boolean }> {
  // Check if Solana wallet already exists
  const existing = getUserWalletByUserIdAndNetwork(userId, 'solana');
  if (existing) {
    return { address: existing.wallet_address, created: false };
  }

  // Generate new Solana keypair
  const keypair = generateSolanaKeypair();

  // Encrypt and store
  const encrypted = encryptPrivateKey(keypair.privateKey);
  createUserWallet(userId, keypair.publicKey, encrypted, 'solana');

  return { address: keypair.publicKey, created: true };
}

/**
 * Generate a new Base billing wallet for a user
 * Returns existing wallet if one already exists on Base
 */
export async function generateBaseWalletForUser(userId: string): Promise<{ address: string; created: boolean }> {
  // Check if Base wallet already exists
  const existing = getUserWalletByUserIdAndNetwork(userId, 'base');
  if (existing) {
    return { address: existing.wallet_address, created: false };
  }

  // Generate new Base/EVM keypair using viem
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  // Encrypt and store (remove '0x' prefix for consistency)
  const encrypted = encryptPrivateKey(privateKey.slice(2));
  createUserWallet(userId, account.address, encrypted, 'base');

  return { address: account.address, created: true };
}

/**
 * Get wallet info for a user (address only, never private key)
 * Returns the first/default wallet for backward compatibility
 */
export function getWalletForUser(userId: string): { address: string; network: string } | null {
  const wallet = getUserWalletByUserId(userId);
  if (!wallet) return null;
  return { address: wallet.wallet_address, network: wallet.network };
}

/**
 * Get all wallets for a user
 */
export function getAllWalletsForUser(userId: string): Array<{ address: string; network: string }> {
  const wallets = getUserWalletsByUserId(userId);
  return wallets.map((w) => ({ address: w.wallet_address, network: w.network }));
}

/**
 * Get a specific wallet for a user by network
 */
export function getWalletForUserByNetwork(userId: string, network: string): { address: string; network: string } | null {
  const wallet = getUserWalletByUserIdAndNetwork(userId, network);
  if (!wallet) return null;
  return { address: wallet.wallet_address, network: wallet.network };
}

/**
 * Decrypt user's private key for signing
 * INTERNAL USE ONLY - never expose via API
 */
export function decryptUserPrivateKey(userId: string, network: string = 'solana'): string {
  const wallet = getUserWalletByUserIdAndNetwork(userId, network);
  if (!wallet) {
    throw new Error(`Wallet not found for user on network ${network}`);
  }
  return decryptPrivateKey(wallet.encrypted_private_key);
}

/**
 * Get USDC balance for a Solana wallet
 */
export async function getUSDCBalance(address: string): Promise<{ balance: bigint; formatted: string }> {
  return getSolanaUSDCBalance('solana', address);
}

/**
 * Get USDC balance for a Base wallet
 * Base USDC has 6 decimals (same as Solana USDC)
 */
export async function getBaseUSDCBalance(address: string): Promise<{ balance: bigint; formatted: string }> {
  try {
    const balance = await basePublicClient.readContract({
      address: BASE_USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    // USDC has 6 decimals
    const formatted = (Number(balance) / 1e6).toFixed(2);

    return { balance, formatted };
  } catch (error) {
    console.error('Error fetching Base USDC balance:', error);
    // Return zero balance on error (account may not exist or RPC issue)
    return { balance: BigInt(0), formatted: '0.00' };
  }
}

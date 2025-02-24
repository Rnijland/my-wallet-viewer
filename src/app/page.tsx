'use client';

import React, { useState } from 'react';
import { ethers } from 'ethers';
import Image from 'next/image'; // Import Next.js Image component

// Define interfaces for token and NFT data
interface Attribute {
  trait_type?: string;
  value: string | number;
}

interface TokenMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Attribute[];
}

interface Token {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string | null;
  decimals?: number;
  balance?: string;
  type: 'ERC-20' | 'NFT';
  token_id?: string;
  metadata?: TokenMetadata | null;
}

export default function WalletTokens() {
  const [address, setAddress] = useState<string>('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedAddress = address.trim();

    if (!ethers.isAddress(trimmedAddress)) {
      setError('Invalid Base address');
      return;
    }

    setLoading(true);
    setError(null);
    setTokens([]);

    try {
      const res = await fetch(`/api/getTokens?address=${trimmedAddress}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch tokens');
      }
      const data: Token[] = await res.json();
      setTokens(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Wallet Token & NFT Viewer (Base Chain)</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Base wallet address"
          className="border p-2 flex-grow"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Get Data'}
        </button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {tokens.length > 0 && (
        <div>
          <h2 className="text-lg mb-2">
            Assets for{' '}
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              {address}
            </a>
          </h2>
          <table className="table-auto w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Type</th>
                <th className="border p-2">Logo</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Symbol</th>
                <th className="border p-2">Balance/Token ID</th>
                <th className="border p-2">Contract Address</th>
                <th className="border p-2">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token, index) => {
                const formattedBalance =
                  token.type === 'ERC-20' && token.balance && token.decimals
                    ? ethers.formatUnits(token.balance, token.decimals)
                    : token.type === 'NFT'
                    ? token.token_id || 'N/A'
                    : 'N/A';

                return (
                  <tr key={index}>
                    <td className="border p-2">{token.type}</td>
                    <td className="border p-2">
                      {token.logo ? (
                        <Image src={token.logo} alt={token.name} width={20} height={20} />
                      ) : token.metadata?.image ? (
                        <Image src={token.metadata.image} alt={token.name} width={20} height={20} />
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="border p-2">{token.name || 'Unknown'}</td>
                    <td className="border p-2">{token.symbol || 'N/A'}</td>
                    <td className="border p-2">{formattedBalance}</td>
                    <td className="border p-2">
                      <a
                        href={`https://basescan.org/token/${token.token_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        {token.token_address}
                      </a>
                    </td>
                    <td className="border p-2">
                      {token.metadata ? (
                        <div>
                          {token.metadata.image && (
                            <Image
                              src={token.metadata.image}
                              alt="NFT"
                              width={50}
                              height={50}
                              className="mb-2"
                            />
                          )}
                          <p>{token.metadata.name || 'No name'}</p>
                          <p>{token.metadata.description || 'No description'}</p>
                          {token.metadata.attributes && (
                            <ul className="list-disc pl-4">
                              {token.metadata.attributes.map((attr, i) => (
                                <li key={i}>
                                  {attr.trait_type || 'Trait'}: {attr.value}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tokens.length === 0 && !loading && !error && (
        <p>No tokens or NFTs found or enter an address to start.</p>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { ethers } from 'ethers'; // Import ethers for version 6

// Define the Token interface for type safety
interface Token {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  decimals: number;
  balance: string;
}

export default function WalletTokens() {
  // State variables for address input, token list, loading, and error handling
  const [address, setAddress] = useState<string>('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission to fetch tokens
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedAddress = address.trim();

    // Validate Ethereum address using ethers v6
    if (!ethers.isAddress(trimmedAddress)) {
      setError('Invalid Ethereum address');
      return;
    }

    setLoading(true);
    setError(null);
    setTokens([]);

    try {
      // Fetch token data from the API
      const res = await fetch(`/api/getTokens?address=${trimmedAddress}`);
      if (!res.ok) {
        throw new Error('Failed to fetch tokens');
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
      <h1 className="text-2xl font-bold mb-4">Wallet Token Viewer</h1>

      {/* Form to input Ethereum address */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Ethereum wallet address"
          className="border p-2 flex-grow"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Get Tokens'}
        </button>
      </form>

      {/* Display error message if present */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Display token table if tokens are fetched */}
      {tokens.length > 0 && (
        <div>
          <h2 className="text-lg mb-2">
            Tokens for{' '}
            <a
              href={`https://etherscan.io/address/${address}`}
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
                <th className="border p-2">Logo</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Symbol</th>
                <th className="border p-2">Balance</th>
                <th className="border p-2">Contract Address</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token, index) => {
                // Format balance using ethers v6, with fallback for missing data
                const formattedBalance =
                  token.balance && token.decimals
                    ? ethers.formatUnits(token.balance, token.decimals)
                    : 'N/A';

                return (
                  <tr key={index}>
                    <td className="border p-2">
                      {token.logo ? (
                        <img src={token.logo} alt={token.name} width="20" />
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="border p-2">{token.name || 'Unknown'}</td>
                    <td className="border p-2">{token.symbol || 'N/A'}</td>
                    <td className="border p-2">{formattedBalance}</td>
                    <td className="border p-2">
                      <a
                        href={`https://etherscan.io/token/${token.token_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        {token.token_address}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Message when no tokens are found */}
      {tokens.length === 0 && !loading && !error && (
        <p>No tokens found or enter an address to start.</p>
      )}
    </div>
  );
}
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    console.error('MORALIS_API_KEY is not defined');
    return NextResponse.json(
      { error: 'Server configuration error: API key missing' },
      { status: 500 }
    );
  }

  try {
    // Fetch ERC-20 tokens on Base
    const tokenUrl = `https://deep-index.moralis.io/api/v2/${address}/erc20?chain=base`;
    const tokenResponse = await axios.get(tokenUrl, {
      headers: { 'X-API-Key': apiKey, 'Accept': 'application/json' },
    });
    console.log('Raw ERC-20 response:', tokenResponse.data);

    const tokens = tokenResponse.data.map((token: any) => ({
      token_address: token.token_address,
      name: token.name,
      symbol: token.symbol,
      logo: token.logo || null,
      decimals: parseInt(token.decimals, 10),
      balance: token.balance,
      type: 'ERC-20',
    }));

    // Fetch NFTs on Base with metadata
    const nftUrl = `https://deep-index.moralis.io/api/v2/${address}/nft?chain=base&format=decimal&normalizeMetadata=true`;
    const nftResponse = await axios.get(nftUrl, {
      headers: { 'X-API-Key': apiKey, 'Accept': 'application/json' },
    });
    console.log('Raw NFT response:', nftResponse.data);

    const nfts = await Promise.all(
      nftResponse.data.result.map(async (nft: any) => {
        let metadata = nft.metadata ? JSON.parse(nft.metadata) : null;

        // If metadata is missing or incomplete, fetch it from tokenURI
        if (!metadata && nft.token_uri) {
          try {
            const metadataResponse = await axios.get(nft.token_uri, {
              timeout: 5000, // Avoid hanging on bad URIs
            });
            metadata = metadataResponse.data;
          } catch (err) {
            console.warn(`Failed to fetch metadata for token ${nft.token_id}:`, err.message);
          }
        }

        return {
          token_address: nft.token_address,
          name: nft.name || 'Unknown NFT',
          symbol: nft.symbol || 'N/A',
          token_id: nft.token_id,
          metadata: metadata || null,
          type: 'NFT',
        };
      })
    );

    // Combine and return
    const combinedData = [...tokens, ...nfts];
    console.log('Combined processed data:', combinedData);

    return NextResponse.json(combinedData);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return NextResponse.json(
        {
          error: error.response?.data?.message || error.message,
          status: error.response?.status || 500,
        },
        { status: error.response?.status || 500 }
      );
    }
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address is required' });
  }

  const apiKey = process.env.MORALIS_API_KEY;
  const url = `https://deep-index.moralis.io/api/v2/${address}/erc20?chain=eth`;

  try {
    const response = await axios.get(url, {
      headers: { 'X-API-Key': apiKey },
    });
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
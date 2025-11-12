import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const response = await axios.get(`${process.env.N8N_API_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching n8n workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://192.168.10.203:8001';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching auction data from backend...');
    console.log('Backend URL:', BACKEND_URL);
    
    const response = await fetch(`${BACKEND_URL}/api/v1/domains/auctions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      
      // Return sandbox/demo data if backend is not available
      console.log('Returning sandbox auction data...');
      return NextResponse.json({
        auctions: [
          {
            id: '1',
            domain: 'techstartup.com',
            currentBid: 150,
            timeLeft: '2d 14h 32m',
            bids: 12,
            category: 'Technology',
            description: 'Perfect for tech startups and innovation companies',
            endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 32 * 60 * 1000).toISOString(),
            minBid: 160,
            buyNowPrice: 500
          },
          {
            id: '2',
            domain: 'businesshub.net',
            currentBid: 89,
            timeLeft: '1d 8h 15m',
            bids: 7,
            category: 'Business',
            description: 'Great for business networking and professional services',
            endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
            minBid: 95,
            buyNowPrice: 300
          },
          {
            id: '3',
            domain: 'creativeart.org',
            currentBid: 75,
            timeLeft: '5h 42m',
            bids: 3,
            category: 'Creative',
            description: 'Ideal for artists, designers, and creative professionals',
            endTime: new Date(Date.now() + 5 * 60 * 60 * 1000 + 42 * 60 * 1000).toISOString(),
            minBid: 80,
            buyNowPrice: 250
          },
          {
            id: '4',
            domain: 'healthcare.pro',
            currentBid: 200,
            timeLeft: '3d 12h 8m',
            bids: 18,
            category: 'Healthcare',
            description: 'Perfect for medical and healthcare businesses',
            endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
            minBid: 210,
            buyNowPrice: 800
          },
          {
            id: '5',
            domain: 'ecommerce.store',
            currentBid: 120,
            timeLeft: '6h 23m',
            bids: 9,
            category: 'E-commerce',
            description: 'Excellent for online stores and retail businesses',
            endTime: new Date(Date.now() + 6 * 60 * 60 * 1000 + 23 * 60 * 1000).toISOString(),
            minBid: 125,
            buyNowPrice: 400
          },
          {
            id: '6',
            domain: 'cryptocurrency.io',
            currentBid: 300,
            timeLeft: '1d 2h 45m',
            bids: 25,
            category: 'Crypto',
            description: 'Perfect for cryptocurrency and blockchain projects',
            endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
            minBid: 320,
            buyNowPrice: 1000
          }
        ]
      });
    }

    const data = await response.json();
    console.log('Backend response data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Auction data proxy error:', error);
    
    // Return sandbox data on error
    return NextResponse.json({
      auctions: [
        {
          id: '1',
          domain: 'techstartup.com',
          currentBid: 150,
          timeLeft: '2d 14h 32m',
          bids: 12,
          category: 'Technology',
          description: 'Perfect for tech startups and innovation companies',
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 32 * 60 * 1000).toISOString(),
          minBid: 160,
          buyNowPrice: 500
        },
        {
          id: '2',
          domain: 'businesshub.net',
          currentBid: 89,
          timeLeft: '1d 8h 15m',
          bids: 7,
          category: 'Business',
          description: 'Great for business networking and professional services',
          endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
          minBid: 95,
          buyNowPrice: 300
        }
      ]
    });
  }
}
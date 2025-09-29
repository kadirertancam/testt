const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // CORS preflight handling
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  // Environment variables
  const ETSY_API_KEY = ydxz8fti8nun292vwrx73f5w;
  const ETSY_SHOP_ID = 62262592;
  
  // Validation
  if (!ETSY_API_KEY || !ETSY_SHOP_ID) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false,
        error: 'API yapılandırması eksik',
        message: 'ETSY_API_KEY ve ETSY_SHOP_ID environment variables gerekli'
      })
    };
  }

  try {
    console.log('Fetching Etsy listings...');
    
    // Aktif ürünleri çek
    const listingsResponse = await fetch(
      `https://openapi.etsy.com/v3/application/shops/${ETSY_SHOP_ID}/listings/active?limit=50&includes=Images`,
      {
        method: 'GET',
        headers: {
          'x-api-key': ETSY_API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (!listingsResponse.ok) {
      const errorText = await listingsResponse.text();
      console.error('Etsy API Error:', listingsResponse.status, errorText);
      throw new Error(`Etsy API error: ${listingsResponse.status}`);
    }

    const listingsData = await listingsResponse.json();
    console.log(`Found ${listingsData.count} listings`);
    
    // Her ürün için resim bilgisini al
    const productsWithImages = await Promise.all(
      listingsData.results.map(async (listing) => {
        try {
          // Ürün resimlerini çek
          const imagesResponse = await fetch(
            `https://openapi.etsy.com/v3/application/listings/${listing.listing_id}/images`,
            {
              headers: {
                'x-api-key': ETSY_API_KEY
              }
            }
          );
          
          const imagesData = await imagesResponse.json();
          const mainImage = imagesData.results && imagesData.results[0] 
            ? imagesData.results[0].url_570xN 
            : null;

          // Ürün bilgilerini formatla
          return {
            id: listing.listing_id,
            title: listing.title,
            price: {
              amount: (listing.price.amount / listing.price.divisor).toFixed(2),
              currency: listing.price.currency_code
            },
            url: listing.url,
            image: mainImage,
            description: listing.description 
              ? listing.description.substring(0, 150).trim() + '...' 
              : 'Detaylar için Etsy\'de görüntüleyin',
            quantity: listing.quantity,
            state: listing.state,
            tags: listing.tags || []
          };
        } catch (error) {
          console.error(`Error fetching images for listing ${listing.listing_id}:`, error);
          
          // Resim alınamazsa yine de ürünü döndür
          return {
            id: listing.listing_id,
            title: listing.title,
            price: {
              amount: (listing.price.amount / listing.price.divisor).toFixed(2),
              currency: listing.price.currency_code
            },
            url: listing.url,
            image: null,
            description: 'Detaylar için Etsy\'de görüntüleyin',
            quantity: listing.quantity,
            state: listing.state,
            tags: []
          };
        }
      })
    );

    // Başarılı yanıt
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=7200' // 1-2 saat cache
      },
      body: JSON.stringify({
        success: true,
        count: productsWithImages.length,
        products: productsWithImages,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Etsy API Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Ürünler yüklenirken bir hata oluştu',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
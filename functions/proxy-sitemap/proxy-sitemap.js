
// Netlify function to proxy requests to our Supabase edge function
exports.handler = async (event) => {
  try {
    // Extract the sitemap type from the query parameters
    const type = event.queryStringParameters.type || 'all';
    
    // Make a request to our Supabase edge function
    const response = await fetch(
      `https://etgkuasmqjidwtaxrfww.supabase.co/functions/v1/dynamic-sitemap?type=${type}`,
      {
        headers: {
          'Content-Type': 'application/xml',
          'Accept': 'application/xml'
        }
      }
    );
    
    if (!response.ok) {
      console.error(`Error from sitemap function: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return {
        statusCode: response.status,
        body: `Error fetching sitemap: ${response.statusText}`
      };
    }
    
    const sitemap = await response.text();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      },
      body: sitemap
    };
  } catch (error) {
    console.error('Error in proxy-sitemap function:', error);
    return {
      statusCode: 500,
      body: `Error generating sitemap: ${error.message}`
    };
  }
};

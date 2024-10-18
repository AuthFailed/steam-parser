export async function GET({ request }) {
    console.log('API route hit');
    console.log('Full request URL:', request.url);

    const url = new URL(request.url);
    console.log('Parsed URL:', url.toString());
    console.log('Search params:', url.searchParams.toString());

    const appid = url.searchParams.get('appid');
    console.log('Extracted appid:', appid);

    if (!appid) {
        console.log('No appid found, returning error');
        return new Response(JSON.stringify({ error: 'Missing appid parameter' }), {
            status: 400,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }

    try {
        console.log('Fetching data from Steam API');
        const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}`);
        const data = await response.json();

        console.log('Successfully fetched data, returning response');
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error('Error fetching game details:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch game details' }), {
            status: 500,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
}
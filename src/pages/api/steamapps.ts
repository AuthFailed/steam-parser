export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('query')?.toLowerCase();

        const response = await fetch('https://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json');
        const data = await response.json();

        let filteredApps = data.applist.apps;

        if (searchQuery) {
            filteredApps = filteredApps.filter(app =>
                app.name.toLowerCase().includes(searchQuery)
            );
        }

        return new Response(JSON.stringify({ applist: { apps: filteredApps } }), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error('Error fetching or processing Steam app list:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch or process Steam app list' }), {
            status: 500,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
}
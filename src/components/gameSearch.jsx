import React, { useState, useEffect } from 'react';
import { Settings, X, Info } from 'lucide-react';

const DB_NAME = 'SteamAppCache';
const STORE_NAME = 'appList';
const CACHE_KEY = 'steamAppList';
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const LANGUAGES = [
	{ code: 'en', name: 'English' },
	{ code: 'ru', name: 'Русский' },
	{ code: 'de', name: 'Deutsch' },
	{ code: 'fr', name: 'Français' },
	{ code: 'es', name: 'Español' }
];

const openDB = () => {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onerror = () => reject("IndexedDB error");
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			db.createObjectStore(STORE_NAME);
		};
	});
};

const getFromCache = async () => {
	const db = await openDB();
	return new Promise((resolve) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.get(CACHE_KEY);
		request.onerror = () => resolve(null);
		request.onsuccess = () => resolve(request.result);
	});
};

const saveToCache = async (data) => {
	const db = await openDB();
	const transaction = db.transaction(STORE_NAME, 'readwrite');
	const store = transaction.objectStore(STORE_NAME);
	store.put({ timestamp: Date.now(), data }, CACHE_KEY);
};

const GameSearch = () => {
	const [games, setGames] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [appList, setAppList] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showSettings, setShowSettings] = useState(false);
	const [language, setLanguage] = useState('en');
	const [gameDetails, setGameDetails] = useState({});
	const [loadingDetails, setLoadingDetails] = useState({});

	useEffect(() => {
		const fetchAppList = async () => {
			try {
				const cachedData = await getFromCache();
				if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRATION)) {
					setAppList(cachedData.data);
					setIsLoading(false);
					return;
				}

				const response = await fetch('/api/steamapps');
				if (!response.ok) throw new Error('Failed to fetch app list');
				const data = await response.json();
				const apps = data.applist.apps.filter(app => app.name !== "");
				setAppList(apps);
				await saveToCache(apps);
			} catch (error) {
				console.error('Error fetching app list:', error);
				setError('Failed to load Steam app list. Please try again later.');
			}
			setIsLoading(false);
		};

		fetchAppList();
	}, []);

	const handleSearch = (e) => {
		e.preventDefault();
		if (searchTerm.trim() === '') return;

		const searchResults = appList
			.filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase()))
			.slice(0, 9);

		setGames(searchResults);
	};

	const fetchGameDetails = async (appId) => {
		setLoadingDetails(prev => ({ ...prev, [appId]: true }));
		const url = `/api/gamedetails?appid=${appId}`;
		console.log('Fetching game details from:', url);
		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error('Failed to fetch game details');
			const data = await response.json();
			console.log('Received data:', data);
			setGameDetails(prev => ({ ...prev, [appId]: data[appId].data }));
		} catch (error) {
			console.error('Error fetching game details:', error);
		}
		setLoadingDetails(prev => ({ ...prev, [appId]: false }));
	};

	if (isLoading) {
		return <div className="text-center text-white text-2xl mt-10">Loading app list...</div>;
	}

	if (error) {
		return <div className="text-center text-red-500 text-2xl mt-10">{error}</div>;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-white py-12">
			<div className="container mx-auto px-4">
				<div className="max-w-3xl mx-auto">
					<h1 className="text-4xl font-bold mb-8 text-center text-blue-400">Steam Game Search</h1>
					<form onSubmit={handleSearch} className="mb-12">
						<div className="flex">
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Enter game name"
								className="flex-grow p-3 rounded-l-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<button
								type="submit"
								className="bg-blue-500 text-white px-6 py-3 rounded-none hover:bg-blue-600 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								Search
							</button>
							<button
								type="button"
								onClick={() => setShowSettings(true)}
								className="bg-gray-600 text-white px-4 rounded-r-lg hover:bg-gray-700 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<Settings size={24} />
							</button>
						</div>
					</form>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{games.map((game) => (
							<div key={game.appid} className="bg-gray-700 rounded-lg p-6 shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1">
								{gameDetails[game.appid] && (
									<img
										src={gameDetails[game.appid].header_image}
										alt={game.name}
										className="w-full h-32 object-cover rounded-lg mb-4"
									/>
								)}
								<h2 className="text-xl font-semibold text-center mb-2">{game.name}</h2>
								<p className="text-center text-sm text-gray-400 mb-4">App ID: {game.appid}</p>
								<button
									onClick={() => fetchGameDetails(game.appid)}
									disabled={loadingDetails[game.appid]}
									className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300 flex items-center justify-center gap-2"
								>
									<Info size={18} />
									{loadingDetails[game.appid] ? 'Loading...' : 'View Details'}
								</button>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Settings Modal */}
			{showSettings && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
					<div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-bold">Settings</h2>
							<button
								onClick={() => setShowSettings(false)}
								className="text-gray-400 hover:text-white"
							>
								<X size={24} />
							</button>
						</div>
						<div className="mb-4">
							<label className="block text-sm font-medium mb-2">Language</label>
							<select
								value={language}
								onChange={(e) => setLanguage(e.target.value)}
								className="w-full bg-gray-700 text-white rounded p-2"
							>
								{LANGUAGES.map((lang) => (
									<option key={lang.code} value={lang.code}>
										{lang.name}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default GameSearch;
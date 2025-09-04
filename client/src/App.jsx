import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// The main App component, containing all UI logic and state.
const App = () => {
    // State to manage user input, video link, and subtitles.
    const [youtubeLink, setYoutubeLink] = useState('');
    const [videoId, setVideoId] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [subtitles, setSubtitles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Hardcoded list of supported languages for the dropdown.
    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'ja', name: 'Japanese' },
        { code: 'zh', name: 'Chinese' },
    ];

    // Function to handle form submission and fetch subtitles.
    const fetchSubtitles = async () => {
        // Simple validation for the YouTube URL.
        const urlRegex = /(?:https?:\/\/)?(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([^&?\s]+)/;
        const match = youtubeLink.match(urlRegex);

        if (!match) {
            setError('Please enter a valid YouTube video URL.');
            setVideoId('');
            setSubtitles([]);
            return;
        }

        const extractedVideoId = match[1];
        setVideoId(extractedVideoId);
        setError(null);
        setIsLoading(true);
        setSubtitles([]);

        try {
            // Call the backend API to get subtitles.
            const response = await fetch('http://localhost:3000/api/subtitles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoId: extractedVideoId,
                    language: selectedLanguage,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch subtitles from the server.');
            }

            const data = await response.json();
            setSubtitles(data.subtitles);
        } catch (err) {
            console.error('API Error:', err);
            setError('An error occurred while fetching subtitles. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6 sm:p-10 transition-all duration-300">
            <header className="w-full max-w-4xl text-center py-8">
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-2">AI Subtitles for YouTube</h1>
                <p className="text-lg text-gray-600">
                    Paste a YouTube link to get accurate, context-aware subtitles in the language of your choice, powered by Gemini AI.
                </p>
            </header>

            <main className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-6 sm:p-8 space-y-8">
                {/* Input Section */}
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <input
                        type="text"
                        className="flex-1 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        placeholder="Paste YouTube video link here..."
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                    />
                    <select
                        className="w-full sm:w-auto px-4 py-3 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                    >
                        {languages.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                    <button
                        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={fetchSubtitles}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Generating...' : 'Generate Subtitles'}
                    </button>
                </div>

                {/* Status and Error Messages */}
                {error && (
                    <div className="w-full bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
                        <p>{error}</p>
                    </div>
                )}
                {isLoading && (
                    <div className="w-full text-center text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-400 border-t-blue-500"></div>
                        <p className="mt-2">Generating subtitles, please wait...</p>
                    </div>
                )}

                {/* Video Player */}
                {videoId && (
                    <div className="aspect-w-16 aspect-h-9 w-full bg-gray-200 rounded-lg overflow-hidden shadow-lg">
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="YouTube video player"
                        ></iframe>
                    </div>
                )}

                {/* Subtitle Display */}
                {subtitles.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Subtitles</h2>
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                            {subtitles.map((subtitle, index) => (
                                <p key={index} className="text-gray-700 leading-relaxed mb-2">
                                    {subtitle.text}
                                </p>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <footer className="mt-10 text-center text-gray-500 text-sm">
                <p>&copy; 2025 AI Subtitles App. All rights reserved.</p>
            </footer>
        </div>
    );
};

// Render the App component to the DOM.
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);


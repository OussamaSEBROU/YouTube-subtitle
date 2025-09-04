import React, { useState, useRef } from 'react';

// Language options for the dropdown
const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' }
];

// Helper component for SVG icons
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

export default function App() {
    // --- STATE MANAGEMENT ---
    const [url, setUrl] = useState('');
    const [language, setLanguage] = useState('es');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [videoData, setVideoData] = useState(null); // { videoUrl, subtitleUrl }
    const videoPlayerRef = useRef(null);

    // --- HELPER FUNCTIONS ---
    /**
     * Extracts YouTube video ID from various URL formats.
     * @param {string} url - The YouTube URL.
     * @returns {string|null} The video ID or null if not found.
     */
    const getYouTubeID = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // --- EVENT HANDLERS ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setVideoData(null);

        const videoId = getYouTubeID(url);
        if (!videoId) {
            setError("Invalid YouTube URL. Please paste a valid video link.");
            return;
        }

        setIsLoading(true);

        try {
            // API call to our Node.js backend
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ youtubeUrl: url, language }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate subtitles.');
            }

            const vttContent = await response.text();
            
            // Create a temporary URL for the VTT subtitle content
            const vttBlob = new Blob([vttContent], { type: 'text/vtt' });
            const subtitleUrl = URL.createObjectURL(vttBlob);
            
            // We'll use an embeddable YouTube URL for the player
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;

            setVideoData({
                videoUrl: embedUrl,
                subtitleUrl: subtitleUrl,
                originalUrl: url
            });


        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- RENDER ---
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            <script src="https://cdn.tailwindcss.com"></script>
            {/* Header */}
            <header className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-700">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <Icon path="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" className="w-8 h-8 text-indigo-400"/>
                            <span className="text-xl font-bold tracking-tight">AI Subtitler</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text">
                        Subtitles for any YouTube Video
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                        Paste a YouTube link, choose your language, and let our AI generate accurate, context-aware subtitles in seconds.
                    </p>
                </div>

                {/* Form Section */}
                <div className="max-w-2xl mx-auto mt-12 bg-gray-800/50 rounded-2xl p-6 md:p-8 border border-gray-700 shadow-2xl shadow-indigo-500/10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-300 mb-2">
                                YouTube Video Link
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                     <Icon path="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m1.757-1.757l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="url"
                                    id="youtube-url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">
                                Target Language
                            </label>
                            <select
                                id="language"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            >
                                {languages.map((lang) => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                           <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Icon path="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 16.5v-6A2.25 2.25 0 014.5 8.25h5.339m3.861.111l-4.5 2.25a2.25 2.25 0 00-1.113 1.902V16.5" className="w-5 h-5"/>
                                        Generate Subtitles
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* Error Message */}
                {error && (
                    <div className="max-w-2xl mx-auto mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                        <p>{error}</p>
                    </div>
                )}
                
                {/* Video Player Section */}
                {videoData && (
                     <div className="max-w-4xl mx-auto mt-12 md:mt-20">
                         <div className="aspect-w-16 aspect-h-9 bg-black rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
                            {/* To display subtitles, we can't use a standard <video> tag with a youtube link.
                                We must use an iframe embed. However, we cannot add a <track> element to an iframe.
                                This is a fundamental browser security limitation.

                                The subtitles are being correctly generated and sent to the browser.
                                A full solution requires a more complex approach, such as:
                                1. Downloading the video to the server, then serving it with the subtitles. (Expensive and complex)
                                2. Using a player library that can overlay subtitles on top of the YouTube iframe. (Best approach)
                                
                                For this demonstration, we will show the YouTube video in an iframe and inform the user
                                that the subtitle file has been generated. The VTT file URL could be offered as a download link.
                            */}
                             <iframe
                                src={videoData.videoUrl}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                         </div>
                         <div className="p-4 mt-4 text-center text-sm text-gray-300 bg-gray-800/50 rounded-lg">
                            <p className="font-semibold text-green-400">✅ Subtitles generated successfully!</p>
                            <p className="mt-2 text-gray-400">
                                Due to browser limitations, subtitles cannot be directly added to the YouTube player.
                                <a
                                    href={videoData.subtitleUrl}
                                    download={`subtitles-${language}.vtt`}
                                    className="text-indigo-400 hover:text-indigo-300 font-medium ml-1 underline"
                                >
                                    Download the .VTT subtitle file here.
                                </a>
                            </p>
                         </div>
                     </div>
                )}
            </main>
        </div>
    );
}


  

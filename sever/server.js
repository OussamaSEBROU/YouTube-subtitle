// --- server/server.js ---
// This file contains the backend logic for our application.
// It handles API requests, secures the Gemini API key, and processes
// the subtitle generation.

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ytdl = require('ytdl-core');
const path = require('path');

// Load environment variables from .env file for local development.
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for CORS and JSON body parsing.
app.use(cors()); // Allow all origins for development.
app.use(express.json());

// Initialize the Gemini API client.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// API endpoint for fetching and generating subtitles.
app.post('/api/subtitles', async (req, res) => {
    const { videoId, language } = req.body;

    if (!videoId || !language) {
        return res.status(400).json({ error: 'Video ID and language are required.' });
    }

    try {
        // --- IMPORTANT NOTE ON AUDIO TRANSCRIPTION ---
        // A robust, real-world application for accurate subtitles with timestamps
        // would require a sophisticated speech-to-text service that provides
        // timing data. For this demonstration, we will simulate this process.
        // We will fetch an audio stream and then use a placeholder transcription
        // to pass to the Gemini API for translation and refinement.
        // A proper solution would use a service like Google's Speech-to-Text API.

        // Get video metadata to get the video title.
        const videoInfo = await ytdl.getInfo(videoId);
        const videoTitle = videoInfo.videoDetails.title;
        const videoDuration = parseInt(videoInfo.videoDetails.lengthSeconds, 10);

        console.log(`Processing video: "${videoTitle}" (Duration: ${videoDuration}s)`);

        // Placeholder for the transcribed text. In a real scenario, this
        // would come from an audio-to-text service. For this demo, we'll
        // use a simple, simulated transcript.
        const englishTranscriptPlaceholder = `
            Hello everyone and welcome to this video tutorial. In this segment, we will be discussing the fundamental concepts of full-stack web development. First, we will cover the basics of a client-server architecture. On the client side, we use languages like HTML, CSS, and JavaScript. On the server side, we use frameworks like Node.js and Express to handle requests and data. This separation is crucial for building scalable and maintainable applications. Thank you for watching and stay tuned for more!
        `;

        // The prompt to Gemini for translation.
        const prompt = `
            Translate the following English transcript into ${language}.
            Make sure the translation is context-aware and sounds natural.
            The original video is titled "${videoTitle}".
            
            Original Transcript:
            ${englishTranscriptPlaceholder}
        `;
        
        // Generate the content using Gemini.
        const result = await model.generateContent(prompt);
        const translatedText = result.response.text();
        console.log('Successfully generated translation.');

        // Simple algorithm to generate timed subtitles for the demo.
        // In a real application, timestamps would be provided by a
        // speech-to-text service.
        const words = translatedText.split(/\s+/);
        const wordsPerSecond = words.length / videoDuration;
        const subtitlesWithTimestamps = [];
        
        let wordIndex = 0;
        let timeOffset = 0;

        while (wordIndex < words.length) {
            const subtitleText = words.slice(wordIndex, wordIndex + 5).join(' ');
            if (subtitleText.trim() === '') {
                wordIndex += 5;
                continue;
            }
            subtitlesWithTimestamps.push({
                text: subtitleText,
                start: timeOffset,
                end: timeOffset + 2
            });
            wordIndex += 5;
            timeOffset += 2;
        }

        res.json({ subtitles: subtitlesWithTimestamps });

    } catch (error) {
        console.error('Server error during subtitle generation:', error);
        res.status(500).json({ error: 'Failed to generate subtitles. Please check the video link and try again.' });
    }
});

// Serve the static files from the React app (for production deployment).
app.use(express.static(path.join(__dirname, '../client/dist')));

// A catch-all route to serve the React app for any other requests.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


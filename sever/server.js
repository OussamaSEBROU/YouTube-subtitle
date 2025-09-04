const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getSubtitles } = require('youtube-captions-scraper');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../client/build')));


// --- API ROUTE ---
app.post('/api/generate', async (req, res) => {
    const { youtubeUrl, language } = req.body;

    if (!youtubeUrl || !language) {
        return res.status(400).json({ message: 'Missing youtubeUrl or language in request body.' });
    }
    
    // Extract video ID from URL
    const videoIDMatch = youtubeUrl.match(/(?:v=|youtu\.be\/)([^&?]+)/);
    if (!videoIDMatch || !videoIDMatch[1]) {
        return res.status(400).json({ message: 'Invalid YouTube URL format.' });
    }
    const videoID = videoIDMatch[1];
    
    try {
        // 1. Fetch English subtitles from YouTube
        console.log(`Fetching captions for video ID: ${videoID}`);
        const captions = await getSubtitles({ videoID, lang: 'en' });
        
        if (!captions || captions.length === 0) {
            return res.status(404).json({ message: "No English subtitles found for this video. Cannot generate translation." });
        }
        
        // Combine captions into a single transcript string for the AI
        const transcript = captions.map(c => c.text).join(' ');
        console.log("Successfully fetched and combined transcript.");

        // 2. Initialize Gemini AI
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // 3. Construct the prompt for Gemini for VTT generation
        const languageName = new Intl.DisplayNames(['en'], { type: 'language' }).of(language);
        const prompt = `
            You are a professional subtitle translator and formatter.
            Your task is to translate the following English transcript into ${languageName} and then format the translation as a WebVTT (.vtt) file.
            
            RULES:
            - The final output MUST strictly be a valid VTT file format, starting with "WEBVTT" on the first line.
            - Do not include any extra text, explanations, or comments outside of the VTT content itself.
            - Break the translated text into logical subtitle cues. Each cue should be a reasonable length for reading.
            - Create timestamps for each cue in the format HH:MM:SS.mmm --> HH:MM:SS.mmm.
            - A typical cue duration is between 2 and 7 seconds.
            - Timestamps must be sequential and must not overlap. Start the very first cue at 00:00:00.000.

            Here is the English transcript to translate and format:
            ---
            ${transcript}
            ---
        `;

        // 4. Call the Gemini API
        console.log(`Sending prompt to Gemini for ${languageName} translation...`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let vttContent = response.text();
        
        // Clean up the response to ensure it's a valid VTT file
        // Sometimes the model might wrap the content in markdown backticks
        vttContent = vttContent.replace(/```vtt\n/g, '').replace(/```/g, '').trim();
        if (!vttContent.startsWith('WEBVTT')) {
            vttContent = 'WEBVTT\n\n' + vttContent;
        }


        // 5. Send the VTT content back to the client
        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
        res.send(vttContent);
        console.log("Successfully generated and sent VTT content.");

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: "An internal server error occurred.", details: error.message });
    }
});

// --- CATCH-ALL ROUTE ---
// This serves the React app's index.html for any request that doesn't match an API route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});


// --- START SERVER ---
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});



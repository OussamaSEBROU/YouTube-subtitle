# --- app.py ---
# This is the Python backend server using Flask.
# It handles API requests, secures the Gemini API key, and processes
# the subtitle generation.

import os
from flask import Flask, request, jsonify, send_from_directory
from pytube import YouTube
from google.generativeai import GenerativeModel
from dotenv import load_dotenv

# Load environment variables from .env file for local development.
# On Render.com, this will be handled automatically.
load_dotenv()

app = Flask(__name__, static_folder='client')

# Initialize the Gemini API client.
# The API key is loaded from the environment variables.
genai_model = GenerativeModel(model_name="gemini-2.0-flash", api_key=os.getenv("GEMINI_API_KEY"))

# API endpoint for fetching and generating subtitles.
@app.route('/api/subtitles', methods=['POST'])
def get_subtitles():
    """
    Handles the request to generate subtitles for a YouTube video.
    """
    data = request.json
    video_url = data.get('url')
    language = data.get('language')

    if not video_url or not language:
        return jsonify({"error": "Video URL and language are required."}), 400

    try:
        # Use pytube to get video metadata.
        yt = YouTube(video_url)
        video_title = yt.title
        video_duration_seconds = yt.length

        print(f"Processing video: \"{video_title}\" (Duration: {video_duration_seconds}s)")

        # --- IMPORTANT NOTE ON AUDIO TRANSCRIPTION ---
        # A robust, real-world application for accurate subtitles with timestamps
        # would require a sophisticated speech-to-text service that provides
        # timing data. For this demonstration, we will simulate this process
        # by using a placeholder transcription. A proper solution would use
        # a service like Google's Speech-to-Text API.

        # Placeholder for the transcribed text. In a real scenario, this
        # would come from an audio-to-text service.
        english_transcript_placeholder = """
            Hello everyone and welcome to this video tutorial. In this segment, we will be discussing the fundamental concepts of full-stack web development. First, we will cover the basics of a client-server architecture. On the client side, we use languages like HTML, CSS, and JavaScript. On the server side, we use frameworks like Python and Flask to handle requests and data. This separation is crucial for building scalable and maintainable applications. Thank you for watching and stay tuned for more!
        """

        # The prompt to Gemini for translation.
        prompt = f"""
            Translate the following English transcript into {language}.
            Make sure the translation is context-aware and sounds natural.
            The original video is titled "{video_title}".

            Original Transcript:
            {english_transcript_placeholder}
        """

        # Generate the content using Gemini.
        response = genai_model.generate_content(prompt)
        translated_text = response.text
        print('Successfully generated translation.')

        # Simple algorithm to generate timed subtitles for the demo.
        # Timestamps are an estimate since the API does not provide them.
        words = translated_text.split()
        total_words = len(words)
        words_per_subtitle = 5
        subtitles_list = []

        for i in range(0, total_words, words_per_subtitle):
            subtitle_text = " ".join(words[i:i + words_per_subtitle])
            if subtitle_text:
                subtitles_list.append({"text": subtitle_text})

        return jsonify({"subtitles": subtitles_list})

    except Exception as e:
        print(f"Server error during subtitle generation: {e}")
        return jsonify({"error": "Failed to generate subtitles. Please check the video link and try again."}), 500

# Serve the static HTML file.
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Use 0.0.0.0 for Render deployment.
    app.run(host='0.0.0.0', port=os.getenv('PORT', 5000))


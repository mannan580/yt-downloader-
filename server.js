const express = require('express');
const cors = require('cors');
const youtubedl = require('yt-dlp-exec');

const app = express();
app.use(cors());
app.use(express.json());

/**
 * 🔎 Get Video Info (Title + Thumbnail)
 */
app.get('/info', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing URL' });
    }

    try {
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            preferFreeFormats: true
        });

        res.json({
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/**
 * ⬇️ Download Endpoint (MP4 + MP3)
 */
app.get('/download', async (req, res) => {
    const { url, type, quality } = req.query;

    if (!url) {
        return res.status(400).send('Missing URL');
    }

    try {
        // 🎧 MP3 Download
        if (type === 'mp3') {
            res.setHeader('Content-Disposition', 'attachment; filename=\"audio.mp3\"');

            const process = youtubedl.exec(url, {
                extractAudio: true,
                audioFormat: 'mp3',
                audioQuality: 0,
                output: '-'
            });

            process.stdout.pipe(res);

            process.stderr.on('data', (data) => {
                console.log('yt-dlp:', data.toString());
            });

            process.on('close', () => res.end());
        }

        // 🎬 MP4 Download
        else {
            const q = quality || 1080;

            res.setHeader('Content-Disposition', 'attachment; filename=\"video.mp4\"');

            const process = youtubedl.exec(url, {
                format: `bestvideo[height<=${q}]+bestaudio/best`,
                output: '-'
            });

            process.stdout.pipe(res);

            process.stderr.on('data', (data) => {
                console.log('yt-dlp:', data.toString());
            });

            process.on('close', () => res.end());
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Download failed');
    }
});


/**
 * ❤️ Health Check (Important for Railway)
 */
app.get('/', (req, res) => {
    res.send('YouTube Downloader API is running 🚀');
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const YTDlpWrap = require('yt-dlp-wrap').default;

const app = express();
app.use(cors());

const ytDlp = new YTDlpWrap();

/**
 * 🔎 Get Video Info
 */
app.get('/info', async (req, res) => {
    const { url } = req.query;

    if (!url) return res.status(400).json({ error: 'Missing URL' });

    try {
        const result = await ytDlp.execPromise([
            url,
            '--dump-json'
        ]);

        const info = JSON.parse(result);

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
 * ⬇️ Download Endpoint
 */
app.get('/download', async (req, res) => {
    const { url, type, quality } = req.query;

    if (!url) return res.status(400).send('Missing URL');

    try {
        if (type === 'mp3') {
            res.setHeader('Content-Disposition', 'attachment; filename=\"audio.mp3\"');

            const stream = ytDlp.execStream([
                url,
                '-x',
                '--audio-format', 'mp3',
                '-o', '-'
            ]);

            stream.pipe(res);
        } else {
            const q = quality || 1080;

            res.setHeader('Content-Disposition', 'attachment; filename=\"video.mp4\"');

            const stream = ytDlp.execStream([
                url,
                '-f', `bestvideo[height<=${q}]+bestaudio`,
                '-o', '-'
            ]);

            stream.pipe(res);
        }

    } catch (err) {
        res.status(500).send(err.message);
    }
});


/**
 * ❤️ Health Check
 */
app.get('/', (req, res) => {
    res.send('YouTube Downloader API Running 🚀');
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

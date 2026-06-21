const express = require('express');
const cors = require('cors');
const axios = require('axios'); 

const app = express();
app.use(cors());
app.use(express.json());


const keywordDatabase = {
    "news": ["https://ycombinator.com", "https://reddit.com"],
    "books": ["https://gutenberg.org", "https://gutenberg.org"],
    "images": ["https://picsum.photos", "https://typicode.com"]
};


app.get('/api/urls', (req, res) => {
    const keyword = req.query.keyword?.toLowerCase().trim();
    if (!keyword || !keywordDatabase[keyword]) {
        return res.status(404).json({ error: "Ключевое слово не найдено" });
    }
    res.json({ urls: keywordDatabase[keyword] });
});


app.get('/api/download', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ error: "URL не указан" });
    }

    try {
        
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream'
        });

        
        const totalLength = response.headers['content-length'];
        if (totalLength) res.setHeader('Content-Length', totalLength);
        res.setHeader('Content-Type', response.headers['content-type'] || 'text/plain');

        
        response.data.pipe(res);
    } catch (error) {
        res.status(500).json({ error: `Ошибка при скачивании стороннего ресурса: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
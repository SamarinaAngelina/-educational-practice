let SERVER_URL = 'https://sdsds-foxickl.amvera.io/api';

let keywordInput = document.getElementById('keywordInput');
let searchBtn = document.getElementById('searchBtn');
let urlList = document.getElementById('urlList');
let errorContainer = document.getElementById('errorContainer');

let statusText = document.getElementById('statusText');
let progressBar = document.getElementById('progressBar');
let progressFill = document.getElementById('progressFill');

let refreshBtn = document.getElementById('refreshBtn');
let offlineList = document.getElementById('offlineList');
let contentViewer = document.getElementById('contentViewer');

searchBtn.addEventListener('click', searchUrls);
refreshBtn.addEventListener('click', renderLocalStorageList);

async function searchUrls() {
    urlList.innerHTML = '';
    errorContainer.innerText = '';
    errorContainer.style.display = 'none';

    let keyword = keywordInput.value;

    try {
        let response = await fetch(`${SERVER_URL}/urls?keyword=${encodeURIComponent(keyword)}`);
        
        if (!response.ok) {
            let errorText = await response.text();
            throw new Error(errorText || 'Ключевое слово не найдено');
        }

        let data = await response.json();
        
        data.urls.forEach(url => {
            let li = document.createElement('li');
            
            let span = document.createElement('span');
            span.textContent = url;
            
            let downloadButton = document.createElement('button');
            downloadButton.textContent = 'Скачать';
            
            downloadButton.addEventListener('click', () => {
                downloadContent(url);
            });
            
            li.appendChild(span);
            li.appendChild(downloadButton);
            urlList.appendChild(li);
        });

    } catch (err) {
        errorContainer.innerText = `Ошибка: ${err.message}`;
        errorContainer.style.display = 'block';
    }
}

async function downloadContent(url) {
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    statusText.innerText = 'Связь с сервером';

    try {
        let response = await fetch(`${SERVER_URL}/download?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error('Не удалось скачать контент через сервер');
        }

        let contentLength = response.headers.get('content-length');
        let totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
        
        if (totalBytes === 0) {
            statusText.innerText = 'Размер неизвестен. Начинаем загрзку...';
        }

        let reader = response.body.getReader();
        let loadedBytes = 0;
        let chunks = [];

        while(true) {
            let {done, value} = await reader.read();
            
            if (done) {
                break;
            }
            
            chunks.push(value);
            loadedBytes += value.length;

            if (totalBytes > 0) {
                let percent = Math.round((loadedBytes / totalBytes) * 100);
                progressFill.style.width = `${percent}%`;
                statusText.innerText = `Скачано: ${(loadedBytes/1024).toFixed(1)} КБ из ${(totalBytes/1024).toFixed(1)} КБ (${percent}%)`;
            } else {
                statusText.innerText = `Скачано: ${(loadedBytes/1024).toFixed(1)} КБ (общий размер неизвестен)`;
            }
        }

        let blob = new Blob(chunks);
        let textContent = await blob.text();

        saveToLocalStorage(url, textContent);
        statusText.innerText = 'Контент сохранен в LocalStorage.';
        renderLocalStorageList();

    } catch (err) {
        statusText.innerText = `Ошибка при загрузке: ${err.message}`;
    }
}

function saveToLocalStorage(url, content) {
    try {
        let cache = JSON.parse(localStorage.getItem('downloaded_content') || '{}');
        cache[url] = {
            content: content,
            timestamp: new Date().toLocaleString()
        };
        localStorage.setItem('downloaded_content', JSON.stringify(cache));
    } catch (e) {
        alert('Ошибка: Память LocalStorage переполнена! Удалите старые данные.');
    }
}

async function renderLocalStorageList() {
    offlineList.innerHTML = '';
    
    let cache = JSON.parse(localStorage.getItem('downloaded_content') || '{}');

    Object.keys(cache).forEach(url => {
        let li = document.createElement('li');
        
        let infoDiv = document.createElement('div');
        infoDiv.innerHTML = `<b>${escapeHtml(url)}</b><span class="timestamp">Загружено: ${cache[url].timestamp}</span>`;
        
        let viewBtn = document.createElement('button');
        viewBtn.textContent = 'Посмотреть оффлайн';
        viewBtn.addEventListener('click', () => {
            viewContent(url);
        });
        
        li.appendChild(infoDiv);
        li.appendChild(viewBtn);
        offlineList.appendChild(li);
    });
}

function viewContent(url) {
    let cache = JSON.parse(localStorage.getItem('downloaded_content') || '{}');
    
    if (cache[url]) {
        contentViewer.innerHTML = `<pre>${escapeHtml(cache[url].content)}</pre>`;
    }
}
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

renderLocalStorageList();

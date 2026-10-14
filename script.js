// Hello Devs
// yeah, putting this here is not at all anywhere close to basic security
// but like it's discord, oh no I get spammed on the platform I don't have notifications on for
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1357468392864485547/AWMZlnNaH-odeVVqRjEJAUVKSkP1QklDQP84hqdVxt7thXzvdioP5Io3xcSFdiUsHvhb";

// --- MARKDOWN CONTENT ---
function safeMarkdownUrl(value, baseUrl, isImage) {
    const url = value.trim();
    if (!isImage && /^window:win-[a-z0-9-]+$/i.test(url)) return url;

    try {
        const parsedUrl = new URL(url, baseUrl);
        const allowedProtocols = isImage
            ? ['http:', 'https:']
            : ['http:', 'https:', 'mailto:'];
        return allowedProtocols.includes(parsedUrl.protocol) ? parsedUrl.href : null;
    } catch {
        return null;
    }
}

function renderMarkdownInline(text, baseUrl) {
    const fragment = document.createDocumentFragment();
    const syntax = /(!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = syntax.exec(text)) !== null) {
        fragment.append(document.createTextNode(text.slice(lastIndex, match.index)));

        if (match[1] && match[2] !== undefined) {
            const imageUrl = safeMarkdownUrl(match[3], baseUrl, true);
            if (imageUrl) {
                const image = document.createElement('img');
                image.src = imageUrl;
                image.alt = match[2];
                fragment.append(image);
            } else {
                fragment.append(document.createTextNode(match[0]));
            }
        } else if (match[4]) {
            const linkUrl = safeMarkdownUrl(match[5], baseUrl, false);
            if (linkUrl) {
                const link = document.createElement('a');
                link.href = linkUrl;
                link.textContent = match[4];
                fragment.append(link);
            } else {
                fragment.append(document.createTextNode(match[0]));
            }
        } else if (match[6]) {
            const strong = document.createElement('strong');
            strong.textContent = match[6];
            fragment.append(strong);
        } else if (match[7]) {
            const code = document.createElement('code');
            code.textContent = match[7];
            fragment.append(code);
        } else if (match[8]) {
            const emphasis = document.createElement('em');
            emphasis.textContent = match[8];
            fragment.append(emphasis);
        }
        lastIndex = syntax.lastIndex;
    }

    fragment.append(document.createTextNode(text.slice(lastIndex)));
    return fragment;
}

function renderMarkdown(markdown, baseUrl) {
    const fragment = document.createDocumentFragment();
    const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
    let index = 0;

    while (index < lines.length) {
        const line = lines[index].trim();
        if (!line) {
            index++;
            continue;
        }

        const heading = /^(#{1,6})\s+(.+)$/.exec(line);
        if (heading) {
            const element = document.createElement(`h${heading[1].length}`);
            element.append(renderMarkdownInline(heading[2], baseUrl));
            fragment.append(element);
            index++;
            continue;
        }

        if (/^(---+|___+|\*\*\*+)$/.test(line)) {
            fragment.append(document.createElement('hr'));
            index++;
            continue;
        }

        const list = /^([-*+]|\d+\.)\s+(.+)$/.exec(line);
        if (list) {
            const isOrdered = /^\d/.test(list[1]);
            const listElement = document.createElement(isOrdered ? 'ol' : 'ul');
            while (index < lines.length) {
                const item = /^([-*+]|\d+\.)\s+(.+)$/.exec(lines[index].trim());
                if (!item || /^\d/.test(item[1]) !== isOrdered) break;
                const listItem = document.createElement('li');
                listItem.append(renderMarkdownInline(item[2], baseUrl));
                listElement.append(listItem);
                index++;
            }
            fragment.append(listElement);
            continue;
        }

        if (line.startsWith('> ')) {
            const quote = document.createElement('blockquote');
            while (index < lines.length && lines[index].trim().startsWith('> ')) {
                const paragraph = document.createElement('p');
                paragraph.append(renderMarkdownInline(lines[index].trim().slice(2), baseUrl));
                quote.append(paragraph);
                index++;
            }
            fragment.append(quote);
            continue;
        }

        const paragraphLines = [];
        while (index < lines.length && lines[index].trim()
            && !/^(#{1,6})\s+/.test(lines[index].trim())
            && !/^(---+|___+|\*\*\*+)$/.test(lines[index].trim())
            && !/^([-*+]|\d+\.)\s+/.test(lines[index].trim())
            && !lines[index].trim().startsWith('> ')) {
            paragraphLines.push(lines[index].trim());
            index++;
        }
        const paragraph = document.createElement('p');
        paragraph.append(renderMarkdownInline(paragraphLines.join(' '), baseUrl));
        fragment.append(paragraph);
    }

    return fragment;
}

function showGalleryAlbum(album) {
    const folders = document.getElementById('gallery-folders');
    const feed = document.getElementById('gallery-feed');
    const feedContent = document.getElementById('gallery-feed-content');
    document.getElementById('gallery-folder-title').textContent = album.title;
    feedContent.replaceChildren();

    let card = null;
    album.content.forEach(node => {
        if (node.tagName === 'H3') {
            card = document.createElement('div');
            card.className = 'feed-item';
            const title = document.createElement('div');
            title.className = 'feed-title';
            title.textContent = node.textContent;
            card.append(title);
            feedContent.append(card);
        } else if (card) {
            const content = node.cloneNode(true);
            if (content.tagName === 'P' && content.querySelector('img')) {
                content.className = 'feed-image';
            } else if (content.tagName === 'P') {
                content.className = 'feed-desc';
            }
            card.append(content);
        } else {
            feedContent.append(node.cloneNode(true));
        }
    });

    folders.hidden = true;
    feed.hidden = false;
}

function renderGallery(markdownElement, fragment) {
    const nodes = Array.from(fragment.childNodes).filter(node =>
        node.nodeType !== Node.TEXT_NODE || node.textContent.trim()
    );
    const albums = [];
    let currentAlbum = null;

    nodes.forEach(node => {
        if (node.tagName === 'H2') {
            currentAlbum = { title: node.textContent, content: [] };
            albums.push(currentAlbum);
        } else if (currentAlbum) {
            currentAlbum.content.push(node);
        }
    });

    markdownElement.replaceChildren();
    albums.forEach(album => {
        const folder = document.createElement('div');
        folder.className = 'folder-item';
        folder.tabIndex = 0;
        folder.setAttribute('role', 'button');

        const icon = document.createElement('div');
        icon.className = 'folder-icon';
        icon.textContent = '📁';
        const label = document.createElement('div');
        label.className = 'folder-label';
        label.textContent = album.title;
        folder.append(icon, label);
        folder.addEventListener('click', () => showGalleryAlbum(album));
        folder.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                showGalleryAlbum(album);
            }
        });
        markdownElement.append(folder);
    });
}

async function loadMarkdownContent() {
    const contentElements = document.querySelectorAll('[data-markdown]');
    await Promise.all(Array.from(contentElements, async element => {
        const markdownPath = element.dataset.markdown;
        try {
            const response = await fetch(markdownPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} loading ${markdownPath}`);
            }
            const markdownUrl = new URL(markdownPath, document.baseURI);
            const fragment = renderMarkdown(await response.text(), markdownUrl);

            if (element.id === 'gallery-folders') {
                renderGallery(element, fragment);
            } else {
                element.replaceChildren(fragment);
            }
        } catch (error) {
            console.error(`Unable to load Markdown content from ${markdownPath}`, error);
            element.textContent = `Unable to load content (${markdownPath}).`;
            element.classList.add('markdown-load-error');
        }
    }));
    const termInputElement = document.getElementById('term-input');
    if (termInputElement) termInputElement.disabled = false;
}

loadMarkdownContent();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' })
            .catch(error => console.error('Unable to register the offline service worker.', error));
    });
}

document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="window:"]');
    if (!link) return;
    event.preventDefault();
    openWindow(link.getAttribute('href').slice('window:'.length));
});

// --- WINDOW MANAGEMENT ---
let zIndexCounter = 10;

function getOpenWindowIds() {
    return Array.from(document.querySelectorAll('.window.active'), win => win.id);
}

function updateWindowUrl() {
    const url = new URL(window.location.href);
    const openWindows = getOpenWindowIds().map(id => id.replace(/^win-/, ''));
    url.searchParams.set('w', openWindows.join(','));
    window.history.replaceState(null, '', url);
}

function applyWindowStateFromUrl() {
    const url = new URL(window.location.href);
    const hasWindowParameter = url.searchParams.has('w');
    const requestedWindows = hasWindowParameter
        ? url.searchParams.get('w').split(',').map(name => name.trim()).filter(Boolean)
        : ['terminal'];
    const knownWindowIds = new Set(
        Array.from(document.querySelectorAll('.window'), win => win.id)
    );

    document.querySelectorAll('.window.active').forEach(win => win.classList.remove('active'));
    requestedWindows.forEach(name => {
        const id = name.startsWith('win-') ? name : `win-${name}`;
        if (knownWindowIds.has(id)) openWindow(id, false);
    });

    updateWindowUrl();
}

function openWindow(id, syncUrl = true) {
    const win = document.getElementById(id);
    if (!win || !win.classList.contains('window')) return;
    if (id === 'win-3d') {
        const iframe = win.querySelector('iframe[data-src]');
        if (iframe) {
            iframe.src = iframe.dataset.src;
            delete iframe.dataset.src;
        }
    }
    win.classList.add('active');
    bringToFront(win);
    if (syncUrl) updateWindowUrl();
}

function closeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.classList.remove('active');
    updateWindowUrl();
}

function closeAll() {
    document.querySelectorAll('.window').forEach(win => win.classList.remove('active'));
    updateWindowUrl();
}

window.addEventListener('popstate', applyWindowStateFromUrl);

function bringToFront(win) {
    zIndexCounter++;
    win.style.zIndex = zIndexCounter;
}

// Window Dragging logic
document.querySelectorAll('.window').forEach(win => {
    const titleBar = win.querySelector('.title-bar');
    let isDragging = false, offsetX, offsetY;

    win.addEventListener('mousedown', () => bringToFront(win));

    titleBar.addEventListener('mousedown', (e) => {
    if(e.target.classList.contains('dot')) return;
    isDragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        win.style.left = `${e.clientX - offsetX}px`;
        win.style.top = `${e.clientY - offsetY}px`;
    }
    });

    document.addEventListener('mouseup', () => isDragging = false);
});

// --- DROPDOWN MENUS ---
function toggleMenu(e, menuId) {
    e.stopPropagation();
    const targetMenu = document.getElementById(menuId);
    const isAlreadyOpen = targetMenu.parentElement.classList.contains('active');
    
    closeDropdowns();

    if (!isAlreadyOpen) {
    targetMenu.parentElement.classList.add('active');
    }
}

function closeDropdowns() {
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
}

document.addEventListener('click', closeDropdowns);

// --- SYSTEM CLOCK ---
// Change 'America/New_York' to your actual IANA time zone
const MY_TIME_ZONE = 'America/Los_Angeles'; 

function updateClocks() {
  const now = new Date();

  // 1. User's local time
  const userTimeString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  document.getElementById('user-clock').innerText = userTimeString;

  // 2. Calculate difference in hours
  // Create date objects for comparison
  const userTimeUTC = now.getTime();
  const myDateString = now.toLocaleString('en-US', { timeZone: MY_TIME_ZONE });
  const myTimeUTC = new Date(myDateString).getTime();
  
  const diffHours = Math.round((myTimeUTC - userTimeUTC) / (1000 * 60 * 60));
  
  let diffText = null;
  if (diffHours > 0) {
    diffText = `+${diffHours}`;
  } else if (diffHours < 0) {
    diffText = `-${Math.abs(diffHours)}`;
  }
  
  document.getElementById('time-diff').innerText = diffText;
}

setInterval(updateClocks, 1000);
updateClocks();

// --- TERMINAL CONTACT FORM ENGINE ---
const termInput = document.getElementById('term-input');
const termOutput = document.getElementById('terminal-output');
const promptLabel = document.getElementById('prompt-text');

// Terminal State Machine: 0 = normal, 1 = Name, 2 = Email, 3 = Subject, 4 = Message
let contactState = 0;
let contactData = { name: '', email: '', subject: '', message: '' };

function printTerm(text) {
    const p = document.createElement('p');
    p.textContent = text;
    termOutput.appendChild(p);
    termOutput.parentElement.scrollTop = termOutput.parentElement.scrollHeight;
}

termInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
    const val = termInput.value.trim();
    printTerm(`${promptLabel.innerText} ${val}`);
    termInput.value = '';

    if (contactState === 0) {
        // Normal Command Mode
        switch (val.toLowerCase()) {
        case 'contact':
            contactState = 1;
            printTerm("--- Starting Contact Wizard ---");
            promptLabel.innerText = "Enter your Name:";
            break;
        case 'help':
            printTerm("Available commands: 'contact', 'clear', 'about', 'projects', '3d', 'gallery' or type exit to exit enter in the secret code to unlock the secret commands");
            break;
        case '8248':
            printTerm("Secret commands unlocked! New available commands: 'doom', 'mc', 'pong'");
            printTerm("Welcome to the dark side...")
            break;
        case 'clear':
            termOutput.innerHTML = '';
            break;
        case 'about':
            openWindow('win-about');
            break;
        case 'projects':
            openWindow('win-projects');
            break;
        case '3d':
            openWindow('win-3d');
            break;
        case 'tba':
            printTerm("This command is not yet implemented. Please check back later.");
            break;
        case 'uwu':
            printTerm("uwu :3");
            break;
        case 'doom':
            window.open('/doom/', '_blank');
            break;
        case 'mc':
            window.open('/mc/', '_blank');
            break;
        case 'gallery':
            openWindow('win-gallery');
            break;
        case 'pong':
            window.open('/pong/', '_blank');
            break;
        case 'exit':
            closeWindow('win-terminal');
            break;
        default:
            if (val !== '') printTerm(`command not found: ${val}`);
            break;
        }
    } else {
        // Contact Form Wizard Steps
        handleContactStep(val);
    }
    }
});

function handleContactStep(val) {
    if (val.toLowerCase() === 'cancel') {
    resetContactForm("Contact process cancelled.");
    return;
    }

    switch (contactState) {
    case 1: // Name
        if (!val) return printTerm("Name cannot be empty. Enter your Name:");
        contactData.name = val;
        contactState = 2;
        promptLabel.innerText = "Enter your Email:";
        break;

    case 2: // Email
        if (!val || !val.includes('@')) return printTerm("Please enter a valid Email:");
        contactData.email = val;
        contactState = 3;
        promptLabel.innerText = "Enter Subject:";
        break;

    case 3: // Subject
        if (!val) return printTerm("Subject cannot be empty. Enter Subject:");
        contactData.subject = val;
        contactState = 4;
        promptLabel.innerText = "Enter Message:";
        break;

    case 4: // Message
        if (!val) return printTerm("Message cannot be empty. Enter Message:");
        contactData.message = val;
        
        printTerm("\nSending payload to server...");
        sendDiscordWebhook(contactData);
        break;
    }
}

function resetContactForm(msg) {
    if (msg) printTerm(msg);
    contactState = 0;
    promptLabel.innerText = "user@macosx:~$";
    contactData = { name: '', email: '', subject: '', message: '' };
}

function sendDiscordWebhook(data) {
    if (DISCORD_WEBHOOK_URL === "YOUR_DISCORD_WEBHOOK_URL_HERE" || !DISCORD_WEBHOOK_URL) {
    printTerm("⚠️ Error: Webhook URL is not configured in code.");
    printTerm("Please set the DISCORD_WEBHOOK_URL variable inside the <script> block.");
    resetContactForm();
    return;
    }

    const payload = {
    embeds: [{
        title: `📬 New Portfolio Contact: ${data.subject}`,
        color: 2847715, // OS X Blue
        fields: [
        { name: "Name", value: data.name, inline: true },
        { name: "Email", value: data.email, inline: true },
        { name: "Subject", value: data.subject },
        { name: "Message", value: data.message }
        ],
        timestamp: new Date().toISOString()
    }]
    };

    fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
    })
    .then(res => {
    if (res.ok) {
        printTerm("✅ SUCCESS: Your message has been sent!");
    } else {
        printTerm(`❌ FAILED: Server responded with status ${res.status}`);
    }
    })
    .catch(err => {
    printTerm(`❌ ERROR: Could not send message (${err.message})`);
    })
    .finally(() => {
    resetContactForm();
    });
}

// Restore the requested windows, or open Terminal by default.
applyWindowStateFromUrl();

function closeGalleryFolder() {
  document.getElementById('gallery-folders').hidden = false;
  document.getElementById('gallery-feed').hidden = true;
}
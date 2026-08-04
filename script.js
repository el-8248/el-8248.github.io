// --- CONFIGURATION ---
    // Paste your Discord Webhook URL below:
    const DISCORD_WEBHOOK_URL = "YOUR_DISCORD_WEBHOOK_URL_HERE";

    // --- WINDOW MANAGEMENT ---
    let zIndexCounter = 10;

    function openWindow(id) {
      const win = document.getElementById(id);
      win.classList.add('active');
      bringToFront(win);
    }

    function closeWindow(id) {
      document.getElementById(id).classList.remove('active');
    }

    function closeAll() {
      document.querySelectorAll('.window').forEach(win => win.classList.remove('active'));
    }

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
        if(e.target.classList.contains('dot')) return; // ignore clicks on close dots
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
    function updateClock() {
      const now = new Date();
      document.getElementById('clock').innerText = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    setInterval(updateClock, 1000);
    updateClock();

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
              printTerm("Available commands: 'contact', 'clear', 'about', 'projects' or type exit to exit");
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

    // Auto-open Terminal on load
    openWindow('win-terminal');
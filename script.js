// Tailwind Configuration
tailwind.config = {
    darkMode: 'class'
}

// --- WEB3 WALLET CONNECTION ---
let userAccount = null;

// Network and Token Configuration
const NETWORKS = {
    '0x1': { name: 'Ethereum', symbol: 'ETH', coingeckoId: 'ethereum' },
    '0x89': { name: 'Polygon', symbol: 'MATIC', coingeckoId: 'matic-network' },
    '0xa4b1': { name: 'Arbitrum', symbol: 'ETH', coingeckoId: 'ethereum' },
    '0x38': { name: 'BSC', symbol: 'BNB', coingeckoId: 'binancecoin' },
    '0x2105': { name: 'Base', symbol: 'ETH', coingeckoId: 'ethereum' }
};

const TRACKED_TOKENS = {
    '0x1': [ // Mainnet
        { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', name: 'Tether', coingeckoId: 'tether', decimals: 6 },
        { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', coingeckoId: 'usd-coin', decimals: 6 },
        { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', symbol: 'WETH', name: 'Wrapped Ether', coingeckoId: 'wethereum', decimals: 18 }
    ],
    '0x89': [ // Polygon
        { address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', symbol: 'USDT', name: 'Tether (PoS)', coingeckoId: 'tether', decimals: 6 },
        { address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', symbol: 'USDC', name: 'USD Coin (PoS)', coingeckoId: 'usd-coin', decimals: 6 },
        { address: '0x7ceb23fd6bc0ad5d406236119475151059739514', symbol: 'WETH', name: 'Wrapped Ether (PoS)', coingeckoId: 'wethereum', decimals: 18 }
    ],
    '0xa4b1': [ // Arbitrum
        { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', symbol: 'USDT', name: 'Tether', coingeckoId: 'tether', decimals: 6 },
        { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', coingeckoId: 'usd-coin', decimals: 6 },
        { address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', symbol: 'WETH', name: 'Wrapped Ether', coingeckoId: 'wethereum', decimals: 18 }
    ],
    '0x38': [ // BSC
        { address: '0x55d398326f99059ff775485246999027b3197955', symbol: 'USDT', name: 'Tether-Peg', coingeckoId: 'tether', decimals: 18 },
        { address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', symbol: 'USDC', name: 'USDC-Peg', coingeckoId: 'usd-coin', decimals: 18 },
        { address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', symbol: 'WBNB', name: 'Wrapped BNB', coingeckoId: 'binancecoin', decimals: 18 }
    ],
    '0x2105': [ // Base
        { address: '0x50c5725949a6f0c72e6c4a641f24049a917db0ec', symbol: 'USDC', name: 'USD Coin', coingeckoId: 'usd-coin', decimals: 6 },
        { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', coingeckoId: 'wethereum', decimals: 18 }
    ]
};

// State for real portfolio
let portfolioItems = [];
let isLoadingPortfolio = false;

async function getProvider() {
    console.log("[Web3 Debug] Searching for provider...");

    // 1. Check if already present
    if (window.ethereum) {
        return getMetaMaskFromProviders(window.ethereum);
    }

    // 2. Wait for ethereum#initialized event (MetaMask specific)
    return new Promise((resolve) => {
        const handleInitialized = () => {
            window.removeEventListener('ethereum#initialized', handleInitialized);
            resolve(getMetaMaskFromProviders(window.ethereum));
        };
        window.addEventListener('ethereum#initialized', handleInitialized, { once: true });

        // 3. Fallback: poll for 3 seconds
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (window.ethereum) {
                clearInterval(interval);
                resolve(getMetaMaskFromProviders(window.ethereum));
            } else if (attempts > 30) { // 3 seconds
                clearInterval(interval);
                resolve(null);
            }
        }, 100);
    });
}

function getMetaMaskFromProviders(baseProvider) {
    if (!baseProvider) return null;
    if (baseProvider.providers) {
        return baseProvider.providers.find(p => p.isMetaMask) || baseProvider.providers[0];
    }
    return baseProvider;
}

async function connectWallet() {
    console.log("[Web3 Debug] Connect clicked...");
    const provider = await getProvider();

    if (provider) {
        console.log("[Web3 Debug] Provider found. isMetaMask:", provider.isMetaMask);
        try {
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            console.log('[Web3 Debug] Accounts linked:', userAccount);
            updateWalletUI(userAccount);
            fetchRealPortfolio();
        } catch (error) {
            console.error('[Web3 Debug] Connection error:', error);
            alert("Connection error: " + (error.message || "Unknown error"));
        }
    } else {
        console.error("[Web3 Debug] NO provider detected after polling.");
        const isLocal = window.location.protocol === 'file:';
        let msg = 'Web3 Provider (MetaMask) not detected!\n\n';
        if (isLocal) {
            msg += '⚠️ You are using the "file://" protocol. Browser extensions often block local files.\n\n';
            msg += 'SOLUTION:\n1. Open brave://extensions\n2. MetaMask -> Details -> Enable "Allow access to file URLs"\n3. Restart browser.';
        } else {
            msg += 'Please ensure MetaMask is installed and enabled.';
        }
        alert(msg);
    }
}

function updateWalletUI(account) {
    const btn = document.getElementById('connect-wallet-btn');
    if (btn && account) {
        btn.innerHTML = `
            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i>
            ${account.substring(0, 6)}...${account.substring(account.length - 4)}
        `;
        btn.classList.add('border-emerald-500/50');
        btn.onclick = null;
        lucide.createIcons();
    }
}

async function fetchRealPortfolio() {
    if (!userAccount) return;
    isLoadingPortfolio = true;
    renderPortfolio();

    try {
        const provider = await getProvider();
        const chainId = await provider.request({ method: 'eth_chainId' });
        const network = NETWORKS[chainId] || { name: 'Unknown', symbol: 'ETH', coingeckoId: 'ethereum' };

        // 1. Fetch Native Balance
        const rawBalance = await provider.request({
            method: 'eth_getBalance',
            params: [userAccount, 'latest']
        });
        const nativeBalance = parseInt(rawBalance, 16) / Math.pow(10, 18);

        // 2. Fetch Prices from CoinGecko
        const tokensToTrack = TRACKED_TOKENS[chainId] || [];
        const ids = [network.coingeckoId, ...tokensToTrack.map(t => t.coingeckoId)].join(',');
        const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        const prices = await priceRes.json();

        // 3. Construct Portfolio Array
        const items = [];

        // Add Native
        const nativePrice = prices[network.coingeckoId]?.usd || 0;
        const nativeChange = prices[network.coingeckoId]?.usd_24h_change || 0;
        if (nativeBalance > 0) {
            items.push({
                name: network.name,
                symbol: network.symbol,
                amount: nativeBalance.toFixed(4),
                value: `$${(nativeBalance * nativePrice).toFixed(2)}`,
                change: (nativeChange >= 0 ? '+' : '') + nativeChange.toFixed(2) + '%'
            });
        }

        // Add Tokens (Mini Scanner)
        for (const token of tokensToTrack) {
            try {
                // ERC-20 balanceOf data hash: 0x70a08231 + padding + address
                const data = '0x70a08231' + userAccount.substring(2).padStart(64, '0');
                const rawTokenBalance = await provider.request({
                    method: 'eth_call',
                    params: [{ to: token.address, data }, 'latest']
                });
                const tokenBalance = parseInt(rawTokenBalance, 16) / Math.pow(10, token.decimals);

                if (tokenBalance > 0.0001) {
                    const price = prices[token.coingeckoId]?.usd || 0;
                    const change = prices[token.coingeckoId]?.usd_24h_change || 0;
                    items.push({
                        name: token.name,
                        symbol: token.symbol,
                        amount: tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                        value: `$${(tokenBalance * price).toFixed(2)}`,
                        change: (change >= 0 ? '+' : '') + change.toFixed(2) + '%'
                    });
                }
            } catch (e) { console.error(`Failed to fetch ${token.symbol}:`, e); }
        }

        portfolioItems = items;
    } catch (error) {
        console.error("Portfolio fetch error:", error);
    } finally {
        isLoadingPortfolio = false;
        renderPortfolio();
    }
}

function renderPortfolio() {
    const container = document.getElementById('portfolio-list');
    if (!container) return;

    if (!userAccount) {
        container.innerHTML = `
            <div class="text-center py-20 bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-[#413124]/10 dark:border-white/10 text-[#413124] dark:text-white">
                <i data-lucide="lock" class="w-12 h-12 mx-auto mb-4 opacity-20"></i>
                <p class="text-translate opacity-50 italic text-sm" data-key="crypto-locked">
                    Connect wallet to unlock your real portfolio...
                </p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    if (isLoadingPortfolio) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <div class="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-xs uppercase tracking-widest font-bold">Fetching Live Data...</p>
            </div>
        `;
        return;
    }

    if (portfolioItems.length === 0) {
        container.innerHTML = `
            <div class="text-center py-20">
                <p class="opacity-50 italic text-sm">No assets found on this network.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${portfolioItems.map(coin => `
                <div class="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 backdrop-blur-md border border-[#413124]/10 dark:border-white/10 rounded-2xl hover:bg-[#413124]/5 dark:hover:bg-white/10 transition-all duration-500 group cursor-pointer">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#413124] to-black dark:from-gray-700 dark:to-black flex items-center justify-center font-bold text-white border border-white/10 group-hover:border-emerald-500/50 transition-colors">
                            ${coin.symbol[0]}
                        </div>
                        <div>
                            <h4 class="font-bold text-[#413124] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">${coin.name}</h4>
                            <p class="text-[10px] uppercase tracking-widest text-[#413124]/60 dark:text-white/50">${coin.amount} ${coin.symbol}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-[#413124] dark:text-white text-sm md:text-base">${coin.value}</p>
                        <p class="text-[10px] ${coin.change.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} font-bold px-2 py-0.5 rounded-full bg-[#413124]/5 dark:bg-white/5 inline-block">
                            ${coin.change}
                        </p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    lucide.createIcons();
}

// Try to reconnect on load
async function initSession() {
    console.log("[Web3 Debug] Initializing session...");
    const provider = await getProvider();

    if (provider) {
        try {
            const accounts = await provider.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                userAccount = accounts[0];
                console.log("[Web3 Debug] Already connected:", userAccount);
                updateWalletUI(userAccount);
                fetchRealPortfolio();
            } else {
                console.log("[Web3 Debug] Not connected.");
                renderPortfolio();
            }
        } catch (err) {
            console.error('[Web3 Debug] Reconnect failed:', err);
            renderPortfolio();
        }
    } else {
        console.warn("[Web3 Debug] No provider for session init.");
        renderPortfolio();
    }
}



// --- AOS ANIMATIONS & COPY EMAIL FUNCTION ---
// Moved AOS init to DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    AOS.init({
        duration: 800,   // Skrócony czas dla płynności (zamiast 2000)
        once: true,      // Animacja tylko raz - prevents glitching on weak devices
        mirror: false,   // Disable mirror for better performance
        offset: 50,
        anchorPlacement: 'top-bottom'
    });

    lucide.createIcons();

    // ... (reszta kodu hover video)
});

// --- GALERIA ZDJĘĆ (ZOPTYMALIZOWANA) ---
let currentGalleryTimeout = null;

function updateGallery(newSrc, clickedElement) {
    const mainImg = document.getElementById('main-gallery-img');
    if (!mainImg) return;

    // Jeśli kliknięto to samo zdjęcie, nic nie rób
    if (mainImg.src.includes(newSrc)) return;

    // 1. Dodaj klasę zanikania
    mainImg.classList.add('fading-out');

    // 2. Wyczyść poprzedni timeout jeśli użytkownik szybko klika
    if (currentGalleryTimeout) clearTimeout(currentGalleryTimeout);

    // 3. Czekaj na zaniknięcie (300ms zgodnie z CSS) i załaduj nowe
    currentGalleryTimeout = setTimeout(() => {
        // Preload nowego zdjęcia w tle (opcjonalnie, ale browser cache zazwyczaj wystarcza przy małych plikach)
        // Zmieniamy src
        mainImg.src = newSrc;

        // Ważne: czekamy chwilę aż przeglądarka "chwyci" nowe src, zanim zdejmiemy opacity
        mainImg.onload = () => {
            mainImg.classList.remove('fading-out');
        };
        // Fallback gdyby onload nie zadziałał (np. cache)
        setTimeout(() => {
            mainImg.classList.remove('fading-out');
        }, 50);

    }, 300);

    // 4. Obsługa miniaturek (od razu)
    document.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.classList.add('blur-[2px]');
        thumb.classList.remove('blur-0', 'ring-2', 'ring-white/50');
    });

    if (clickedElement) {
        clickedElement.classList.remove('blur-[2px]');
        clickedElement.classList.add('blur-0', 'ring-2', 'ring-white/50');
    }
}
const hoverVideos = document.querySelectorAll('.hover-video');

hoverVideos.forEach(video => {
    // Play on hover
    video.addEventListener('mouseenter', function () {
        this.play().catch(e => console.log('Autoplay blocked:', e));
    });

    // Pause + reset on leave
    video.addEventListener('mouseleave', function () {
        this.pause();
        this.currentTime = 0;
    });

    // Dla urządzeń dotykowych - toggle play/pause
    video.addEventListener('touchstart', function (e) {
        if (this.paused) {
            this.play();
        } else {
            this.pause();
        }
    }, { passive: true });
});

// --- ZINTEGROWANY SYSTEM SCROLLOWANIA ---
window.addEventListener('scroll', () => {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    // 1. Obsługa paska postępu
    const progressBar = document.getElementById("scroll-progress");
    if (progressBar) {
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";
    }

    // 2. Parallax tła wideo (Hero Section)
    const bgImage = document.getElementById('parallax-bg');
    if (bgImage) {
        // Przesuwamy o 0.4 zamiast 0.6 dla większej płynności
        bgImage.style.transform = `translateY(${winScroll * 0.4}px)`;
    }

    // 3. Parallax tekstów (About Me)
    const scrolls = document.querySelectorAll('.parallax-text');
    scrolls.forEach(el => {
        const speed = el.getAttribute('data-speed') || 0.1;
        const rect = el.getBoundingClientRect();

        // Animujemy tylko gdy element jest w polu widzenia (oszczędność procesora)
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            const centerOffset = window.innerHeight / 2 - rect.top;
            const yPos = centerOffset * speed;
            el.style.transform = `translateY(${yPos}px)`;
        }
    });
});

function copyEmail(element) {
    const email = "mateusz.nowak.zabrze@gmail.com";
    const tooltip = element.querySelector('.tooltip-text');

    // Kopiowanie do schowka
    navigator.clipboard.writeText(email).then(() => {
        // Pokaż dymek
        tooltip.classList.remove('opacity-0');
        tooltip.classList.add('opacity-100');

        // Ukryj dymek po 2 sekundach
        setTimeout(() => {
            tooltip.classList.remove('opacity-100');
            tooltip.classList.add('opacity-0');
        }, 2000);
    }).catch(err => {
        console.error('Error during copying: ', err);
    });
}

// DARK MODE LOGIC
function setTheme(theme) {
    const toggle = document.getElementById('theme-toggle');
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (toggle) toggle.checked = true;
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if (toggle) toggle.checked = false;
    }
}

function toggleTheme(checkbox) {
    setTheme(checkbox.checked ? 'dark' : 'light');
}

// Init State
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
} else {
    document.documentElement.classList.remove('dark');
}

// Sync Toggle Button on Load
// Initial Toggle Sync
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.checked = document.documentElement.classList.contains('dark');
    }
    if (typeof initSession === 'function') initSession();
});


// TRANSLATIONS DATA
const translations = {
    en: {
        "nav-about": "About Me",
        "nav-intro": "Intro",
        "nav-vision": "PV-Monitoring Project",
        "nav-travel": "Travel",
        "nav-chill": "Chill",
        "nav-music": "Music",
        "nav-crypto": "Crypto",
        "nav-contact": "Contact",
        "hero-sub": "Digital Networking",
        "about-title": "ABOUT ME",
        "about-text": "I am Mateusz Nowak, born and raised in Poland, in the Silesia region, but I currently live and work in Germany, in Saarland. It is here that I have acquired many of my skills, from roofing to electrical work, construction, and photovoltaic techniques, through electronics, to digital networking, which is now my main occupation.",
        "about-text2": "Instead of creating endless copies of information about myself on various social media, I will create a place here — About Me — where I write about what I create, what I do, who I am, what I like, and what interests me. I will show what tools I use daily, which will also give me the opportunity to bring everything together instead of having hundreds of open browser tabs.",

        "contact-title": "Contact",
        "website-goal": "This website is my digital legacy. It is a place where I document my projects and information. Instead of getting lost in the chaos of bookmarks, I am building my own knowledge operating system here.",
        "website-goal2": "It serves as my personal substitute for all social media feeds; a single link that defines my place on the internet.",
        "website-project-intro": "My most important current endeavor is the PV-Monitoring project. It is a tool I am developing independently to analyze the status of networks and energy systems in real-time. This is where my experience in digital networking meets the practical application of monitoring. At the same time, I dedicate my time to the continuous development of this website and exploring the possibilities of the CachyOS distribution. Working with Arch Linux-based systems allows me to maximize environment optimization, which combined with learning modern web technologies, gives me full control over my digital ecosystem.",
        "vibe-travel": "Travel is my way of resetting the compass. I find my peace in the heights—from the familiar trails of the Polish Beskids and the granite peaks of the Tatras, to the misty Vosges and the technical challenge of Alpine via ferratas. These landscapes are where I test my limits. Currently, I am scaling this passion into a larger vision: the first chapters of a global journey with a Round the World ticket, with the raw wilderness of Norway and Iceland already mapped out as my first milestones.",
        "vibe-sport": "Water is my ultimate element. Training for a triathlon as an amateur is where I build the discipline that translates into every other aspect of my life. Swimming is the time when I completely disconnect from notifications and code—it is just me, the rhythm of my breath, and the water. This physical effort is the reset I need to keep my mind sharp for complex networking challenges.",
        "vibe-nutrition": "Sport, combined with proper nutrition, allows me to stay in peak shape despite being 37. It's about more than just calories; it's about fueling the body and mind for the long run, both in training and in the technical world of crypto and tech.",
        "vibe-chill": "True growth requires moments of absolute stillness. For me, that place is the sauna—a ritual of heat and silence that strips away the noise of the digital world. It is where my best ideas are born, in the space between intense heat and the refreshing cold.",
        "vibe-chill-library": "When I am not in the water or at my desk, you will find me in my library. I value the weight of a real book and the depth of focused reading.",
        "vibe-music": "I love discovering new music, regardless of the genre. It's best experienced behind the wheel – long drives are the perfect time for new sounds, and Spotify is the ideal tool for that.",
        "vibe-entertainment-text": "Of course, it's not all about work and sports. When it's time for a full reset, the couch wins – that's when Netflix, YouTube, or Twitch come in. It's my digital window to the world when I just need to 'power down' the system.",
        "btn-library": "Explore Full Library",
        "lib-title": "Library",
        "lib-author": "Author",
        "crypto-title": "Crypto Command Center",
        "crypto-locked": "Connect wallet to unlock your shitcoin portfolio...",
        "crypto-portfolio-label": "Web3 Portfolio"
    },
    de: {
        "nav-about": "Über mich",
        "nav-intro": "Intro",
        "nav-vision": "PV-Monitoring Projekt",
        "nav-travel": "Reisen",
        "nav-chill": "Chill",
        "nav-music": "Musik",
        "nav-crypto": "Krypto",
        "nav-contact": "Kontakt",
        "hero-sub": "Digitale Vernetzung",
        "about-title": "ÜBER MICH",
        "about-text": "Ich bin Mateusz Nowak, geboren und aufgewachsen in Polen, in der Region Schlesien, aber ich lebe und arbeite jetzt in Deutschland, im Saarland. Hier habe ich viele meiner Fähigkeiten erlernt, vom Dachdeckerhandwerk über Elektrik, Bau- und Photovoltaiktechnik, Elektronik bis hin zum Digital Networking, was heute meine Hauptbeschäftigung ist.",
        "about-text2": "Anstatt endlose Kopien von Informationen über mich in verschiedenen sozialen Medien zu erstellen, werde ich hier einen Ort schaffen — Über mich — an dem ich schreibe, was ich erschaffe, was ich tue, wer ich bin, was ich mag und was mich interessiert. Ich werde zeigen, welche Werkzeuge ich täglich benutze, was mir auch die Möglichkeit gibt, alles zusammenzuführen, anstatt Hunderte von offenen Browser-Tabs zu haben.",

        "contact-title": "Kontakt",
        "website-goal": "Diese Website ist mein digitales Vermächtnis. Es ist ein Ort, an dem ich meine Projekte und Informationen dokumentiere. Anstatt mich im Chaos der Lesezeichen zu verlieren, baue ich hier mein eigenes Wissensbetriebssystem auf.",
        "website-goal2": "Sie dient mir als persönlicher Ersatz für alle Social-Media-Feeds; ein einziger Link, der definierte meinen Platz im Internet.",
        "website-project-intro": "Mein wichtigstes aktuelles Vorhaben ist das Projekt PV-Monitoring. Es ist ein Tool, das ich eigenständig entwickle, um den Status von Netzwerken und Energiesystemen in Echtzeit zu analysieren. Hier trifft meine Erfahrung im Digital Networking auf die praktische Anwendung von Monitoring. Parallel dazu widme ich meine Zeit der kontinuierlichen Weiterentwicklung dieser Website und der Erkundung der Möglichkeiten der CachyOS-Distribution. Die Arbeit mit Arch Linux-basierten Systemen ermöglicht mir eine maximale Optimierung der Umgebung, was mir in Kombination mit dem Erlernen moderner Webtechnologien die volle Kontrolle über mein digitales Ökosystem gibt.",
        "vibe-travel": "Reisen ist für mich wie das Neuausrichten eines Kompasses. Meinen Frieden finde ich in der Höhe – von den vertrauten Pfaden der polnischen Beskiden und den Granitgipfeln der Tatra bis hin zu den nebligen Vogesen und der technischen Herausforderung alpiner Klettersteige. In diesen Landschaften teste ich meine Grenzen. Derzeit entwickle ich diese Leidenschaft zu einer größeren Vision weiter: die ersten Kapitel einer Weltreise mit einem Round-the-World-Ticket, wobei die unberührte Wildnis von Norwegen und Island bereits als meine ersten Meilensteine fest eingeplant sind.",
        "vibe-sport": "Wasser ist mein ultimatives Element. Training für ein Triathlon als Amateure ist, wo ich die Disziplin aufbaue, die in alle anderen Aspekte meines Lebens übertragen wird. Schwimmen ist die Zeit, in der ich mich komplett von Benachrichtigungen und Code abtrenne – es ist nur ich, der Rhythmus meines Atems und das Wasser. Dieser physische Aufwand ist der Reset, den ich brauche, um meinen Geist für komplexe Networking-Herausforderungen schärfer zu halten.",
        "vibe-nutrition": "Sport, kombiniert mit richtiger Ernährung, ermöglicht es mir, trotz meines Alters von 37 in Topform zu bleiben. Es geht um mehr als nur Kalorien; es geht darum, Körper und Geist für die lange Strecke zu stärken, sowohl im Training als auch in der technischen Welt von Krypto und Technologie.",
        "vibe-chill": "Wahrer Fortschritt erfordert Momente absoluter Ruhe. Für mich ist dieser Ort die Sauna – ein Ritual aus Hitze und Stille, das den Lärm der digitalen Welt abträgt. Dort werden meine besten Ideen geboren, in dem Raum zwischen intensiver Hitze und der erfrischenden Kälte.",
        "vibe-chill-library": "Wenn ich nicht im Wasser oder am Schreibtisch bin, findest du mich in meiner Bibliothek. Ich schätze das Gewicht eines echten Buches und die Tiefe konzentrierten Lesens.",
        "vibe-music": "Ich liebe es, neue Musik zu entdecken, unabhängig vom Genre. Am besten geht das am Steuer – lange Fahrten sind der perfekte Moment für neue Klänge, und Spotify ist dafür das ideale Werkzeug.",
        "vibe-entertainment-text": "Natürlich dreht sich nicht alles um Arbeit und Sport. Wenn es Zeit für einen vollständigen Reset ist, gewinnt die Couch – dann kommen Netflix, YouTube oder Twitch ins Spiel. Es ist mein digitales Fenster zur Welt, wenn ich einfach nur das System 'herunterfahren' muss.",
        "btn-library": "Bibliothek erkunden",
        "lib-title": "Bibliothek",
        "lib-author": "Autor",
        "crypto-title": "Krypto Kommandozentrale",
        "crypto-locked": "Verbinde dein Wallet, um dein Shitcoin-Portfolio freizuschalten...",
        "crypto-portfolio-label": "Web3 Portfolio"
    },
};

function changeLang(lang) {
    const elements = document.querySelectorAll('.text-translate');
    elements.forEach(el => {
        const key = el.getAttribute('data-key');
        if (translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });
    localStorage.setItem('lang', lang);
}

window.onload = () => {
    const savedLang = localStorage.getItem('lang') || 'en';
    changeLang(savedLang);
};

// --- SKRYPT STERUJĄCY CZASEM WIDEO (Lustrzane odbicie) ---
const video = document.getElementById('parallax-bg');
const heroSection = document.getElementById('hero-section');
const heroText = document.getElementById('hero-text-container');

if (video && heroSection && heroText) {
    video.addEventListener('timeupdate', function () {
        const currentTime = video.currentTime;

        // Przedział: 2s do 4.14s
        if (currentTime >= 2.02 && currentTime <= 4.14) {
            // Ustawienia LUSTRZANE (Do lewej)
            heroSection.classList.remove('justify-end', 'pr-10', 'md:pr-48');
            heroSection.classList.add('justify-start', 'pl-10', 'md:pl-48');

            heroText.classList.remove('text-right', 'md:mr-10');
            heroText.classList.add('text-left', 'md:ml-10');
        } else {
            // Powrót do oryginału (Do prawej)
            heroSection.classList.remove('justify-start', 'pl-10', 'md:pl-48');
            heroSection.classList.add('justify-end', 'pr-10', 'md:pr-48');

            heroText.classList.remove('text-left', 'md:ml-10');
            heroText.classList.add('text-right', 'md:mr-10');
        }
    });
}



function scrollGallery(distance) {
    const slider = document.getElementById('thumbnail-slider');
    slider.scrollBy({
        left: distance,
        behavior: 'smooth'
    });
}

// --- MOBILE MENU LOGIC ---
// --- MOBILE MENU & SETTINGS TOGGLE ---
document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const icon = mobileBtn ? mobileBtn.querySelector('i') : null;

    // Settings Toggle (especially for mobile/touch)
    const settingsBtn = document.querySelector('.relative.group > button');
    const settingsDropdown = settingsBtn ? settingsBtn.nextElementSibling : null;

    if (settingsBtn && settingsDropdown) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = !settingsDropdown.classList.contains('invisible');

            // Toggle visibility using classes that override group-hover if needed, 
            // but here we just manually toggle the classes tailwind uses
            if (isVisible) {
                settingsDropdown.classList.add('opacity-0', 'invisible');
                settingsDropdown.classList.remove('opacity-100', 'visible');
            } else {
                settingsDropdown.classList.remove('opacity-0', 'invisible');
                settingsDropdown.classList.add('opacity-100', 'visible');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!settingsDropdown.contains(e.target) && !settingsBtn.contains(e.target)) {
                settingsDropdown.classList.add('opacity-0', 'invisible');
                settingsDropdown.classList.remove('opacity-100', 'visible');
            }
        });
    }

    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.contains('open');

            if (isOpen) {
                // Close
                mobileMenu.classList.remove('open');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    lucide.createIcons();
                }
            } else {
                // Open
                mobileMenu.classList.add('open');
                if (icon) {
                    icon.setAttribute('data-lucide', 'x');
                    lucide.createIcons();
                }
            }
        });

        // Close menu when a link is clicked
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    lucide.createIcons();
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !mobileBtn.contains(e.target) && mobileMenu.classList.contains('open')) {
                mobileMenu.classList.remove('open');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    lucide.createIcons();
                }
            }
        });
    }
});

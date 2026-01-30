// Tailwind Configuration
tailwind.config = {
    darkMode: 'class'
}

// --- WEB3 WALLET CONNECTION ---
let userAccount = null;

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            updateWalletUI(userAccount);
            console.log('Connected:', userAccount);
        } catch (error) {
            console.error('User denied account access', error);
        }
    } else {
        alert('Please install MetaMask to use this feature!');
    }
}

function updateWalletUI(account) {
    const btn = document.getElementById('connect-wallet-btn');
    if (btn && account) {
        btn.innerHTML = `
            <i data-lucide="wallet" class="w-4 h-4"></i>
            ${account.substring(0, 6)}...${account.substring(account.length - 4)}
        `;
        btn.onclick = null; // Disable click or show meaningful info
        lucide.createIcons();
    }
}

// Check if already connected
window.addEventListener('load', async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                userAccount = accounts[0];
                updateWalletUI(userAccount);
            }
        } catch (err) {
            console.error('Error checking accounts', err);
        }
    }
});

// --- AOS ANIMATIONS & COPY EMAIL FUNCTION ---
// Moved AOS init to DOMContentLoaded or just script execution if defer used
document.addEventListener('DOMContentLoaded', () => {
    AOS.init({
        duration: 2000,
        once: false,     // Animacja wykona się tylko raz (ikony nie znikną po odjechaniu)
        mirror: true,   // Animacje będą działać również podczas scrollowania w górę
        offset: 50,     // Animacja odpali się 50px wcześniej, zanim element wejdzie na ekran
        anchorPlacement: 'top-bottom' // Animacja odpali się, gdy tylko góra stopki dotknie dołu ekranu
    });

    lucide.createIcons();

    // --- HOVER VIDEO PLAYER ---
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
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
}
if (localStorage.theme === 'dark') document.documentElement.classList.add('dark');


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
        "label-inv": "My investments",
        "label-trade": "Things I trade",
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
        "vibe-entertainment-text": "Of course, it's not all about work and sports. When it's time for a full reset, the couch wins – that's when Netflix, YouTube, or Twitch come in. It's my digital window to the world when I just need to 'power down' the system."
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
        "label-inv": "Meine Investitionen",
        "label-trade": "Was ich handle",
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
        "vibe-entertainment-text": "Natürlich dreht sich nicht alles um Arbeit und Sport. Wenn es Zeit für einen vollständigen Reset ist, gewinnt die Couch – dann kommen Netflix, YouTube oder Twitch ins Spiel. Es ist mein digitales Fenster zur Welt, wenn ich einfach nur das System 'herunterfahren' muss."
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

function updateGallery(newSrc, clickedElement) {
    const mainImg = document.getElementById('main-gallery-img');

    // 1. Zmiana głównego zdjęcia z efektem przejścia
    mainImg.style.filter = 'blur(10px) opacity(0.5)';
    setTimeout(() => {
        mainImg.src = newSrc;
        mainImg.style.filter = 'none';
    }, 250);

    // 2. Podświetlanie miniaturki
    // Najpierw przywracamy blur wszystkim miniaturkom
    document.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.classList.add('blur-[2px]');
        thumb.classList.remove('blur-0', 'ring-2', 'ring-white/50');
    });

    // Teraz usuwamy blur i dodajemy "blask" wybranej miniaturce
    if (clickedElement) {
        clickedElement.classList.remove('blur-[2px]');
        clickedElement.classList.add('blur-0', 'ring-2', 'ring-white/50');
    }
}

function scrollGallery(distance) {
    const slider = document.getElementById('thumbnail-slider');
    slider.scrollBy({
        left: distance,
        behavior: 'smooth'
    });
}

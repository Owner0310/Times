document.addEventListener('DOMContentLoaded', () => {
    /* ==============================
       初回同意モーダル
    ============================== */
    if (location.pathname.endsWith("index.html") || location.pathname === "/") {
        const agreed = localStorage.getItem('timesAgreed');
        if (!agreed) {
            const modal = document.createElement('div');
            modal.id = 'welcome-modal';
            modal.innerHTML = `
                <div class="welcome-content">
                    <h1>Times</h1>
                    <p>このサービスを利用する場合、利用規約に同意しているものとします。</p>
                    <div class="center actions">
                        <a href="terms.html" class="btn">利用規約を見る</a>
                    </div>
                    <button id="agree-btn">始める</button>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('agree-btn').addEventListener('click', () => {
                localStorage.setItem('timesAgreed', 'true');
                modal.remove();
            });
        }
    }

    /* ==============================
       Loader
    ============================== */
    window.addEventListener('load', () => {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    });

    /* ==============================
       Navigation ページ切替
    ============================== */
    const navLinks = document.querySelectorAll('nav a, nav button.linklike');
    const pages = document.querySelectorAll('.page');
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            const target = e.target.getAttribute('data-target');
            if (target) {
                pages.forEach(p => p.classList.remove('active'));
                document.getElementById(target).classList.add('active');

                navLinks.forEach(n => n.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    });

    /* ==============================
       Clock
    ============================== */
    function updateClock() {
        const now = new Date();
        const time = now.toLocaleTimeString('ja-JP', { hour12: false });
        const date = now.toLocaleDateString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const tEl = document.getElementById('clock-time');
        const dEl = document.getElementById('clock-date');
        if (tEl) tEl.textContent = time;
        if (dEl) dEl.textContent = date;
    }
    setInterval(updateClock, 1000);
    updateClock();

    /* ==============================
       Settings Dialog
    ============================== */
    const settings = document.getElementById('settings');
    const openSettings = document.getElementById('open-settings');
    const resetBtn = document.getElementById('reset-btn');

    if (openSettings && settings) {
        openSettings.addEventListener('click', () => {
            settings.showModal();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', e => {
            e.preventDefault();
            localStorage.clear();
            alert("設定をリセットしました。ページを再読み込みします。");
            location.reload();
        });
    }

    /* ==============================
       背景管理
    ============================== */
    const bgEl = document.getElementById('bg');
    const bgUpload = document.getElementById('bgUpload');
    const thumbs = document.getElementById('localImagesPreview');
    let localImages = [];

    // 背景切替
    function setBackground(url) {
        if (bgEl) {
            bgEl.style.backgroundImage = `url('${url}')`;
        }
    }

    // プレビュー作成
    if (bgUpload && thumbs) {
        bgUpload.addEventListener('change', e => {
            thumbs.innerHTML = "";
            localImages = [];
            const files = Array.from(e.target.files);

            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = ev => {
                    const url = ev.target.result;
                    localImages.push(url);

                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = `背景 ${index + 1}`;
                    img.addEventListener('click', () => {
                        // 全ての選択状態を解除
                        thumbs.querySelectorAll('img').forEach(el => el.classList.remove('selected'));
                        // この画像を選択
                        img.classList.add('selected');
                        // 背景を即反映
                        setBackground(url);
                        // 保存
                        localStorage.setItem('selectedBg', url);
                    });

                    thumbs.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // ページ読込時に保存した背景を復元
    const savedBg = localStorage.getItem('selectedBg');
    if (savedBg) {
        setBackground(savedBg);
    }
});

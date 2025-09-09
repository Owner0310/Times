console.log("✅ js/script.js file loaded.");

const SETTINGS_KEY = "times.settings";
const HISTORY_KEY = "times.timerHistory";
const DEFAULT_SETTINGS = {
    bgSource: "online",
    interval: 300,
    seeds: ["pine", "mountain", "river", "sea", "meadow", "canyon", "forest"],
    customImages: [],
    fontPreset: "system-ui",
    fontCustom: ""
};

document.addEventListener("DOMContentLoaded", () => {
  // UI init
  initSettingsUI();
  applySettings(loadSettings());
  startBackgroundEngine();

  // ⏰ clock関係は削除（clock.jsに移動済み）
  if (document.getElementById("timer-form")) initTimer();
});

/* ========== Settings ========== */
function loadSettings(){
  try{
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return { ...DEFAULT_SETTINGS, ...(stored || {}) };
  }catch(e){
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(s){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function applySettings(s){
  // Font
  const html = document.documentElement;
  let family = '';

  if (s.fontCustom && s.fontCustom.trim()){
    family = s.fontCustom.trim();
  }else{
    switch(s.fontPreset){
      case "noto":
        injectGoogleFont("Noto+Sans+JP:opsz,wght@6..72,200..900");
        family = '"Noto Sans JP", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
        break;
      case "inter":
        injectGoogleFont("Inter:wght@300;400;500;600");
        family = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
        break;
      default:
        family = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans JP", Arial, sans-serif';
    }
  }
  html.style.setProperty("--font", family);
}

function injectGoogleFont(spec){
  const id = "times-google-font-" + spec;
  if (document.getElementById(id)) return;
  const link1 = document.createElement("link");
  link1.rel = "preconnect";
  link1.href = "https://fonts.googleapis.com";
  const link2 = document.createElement("link");
  link2.rel = "preconnect";
  link2.href = "https://fonts.gstatic.com";
  link2.crossOrigin = "anonymous";
  const link3 = document.createElement("link");
  link3.id = id;
  link3.rel = "stylesheet";
  link3.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  document.head.append(link1, link2, link3);
}

function initSettingsUI(){
  const openBtn = document.getElementById("open-settings");
  const dialog = document.getElementById("settings");
  if (!openBtn || !dialog) return;

  const s = loadSettings();

  // Controls
  const rOnline = dialog.querySelector('input[name="bgSource"][value="online"]');
  const rLocal = dialog.querySelector('input[name="bgSource"][value="local"]');
  const intervalInput = dialog.querySelector("#bgInterval");
  const upload = dialog.querySelector("#bgUpload");
  const preview = dialog.querySelector("#localImagesPreview");
  const preset = dialog.querySelector("#fontPreset");
  const custom = dialog.querySelector("#fontCustom");
  const saveBtn = dialog.querySelector("#save-settings");

  // Prefill
  (s.bgSource === "local" ? rLocal : rOnline).checked = true;
  intervalInput.value = s.interval;
  preset.value = s.fontPreset;
  custom.value = s.fontCustom || "";

  // Preview thumbnails
  renderThumbs(preview, s.customImages);

  // Open/close
  openBtn.addEventListener("click", () => dialog.showModal());

  // Upload handler
  upload.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newImgs = [];
    for (const f of files){
      if (!f.type.startsWith("image/")) continue;
      const dataUrl = await fileToDataURL(f);
      newImgs.push(dataUrl);
    }
    const s2 = loadSettings();
    s2.customImages = [...s2.customImages, ...newImgs];
    saveSettings(s2);
    renderThumbs(preview, s2.customImages);
  });

  // Save
  saveBtn.addEventListener("click", () => {
    const s2 = loadSettings();
    s2.bgSource = rLocal.checked ? "local" : "online";
    s2.interval = Math.max(5, Number(intervalInput.value) || DEFAULT_SETTINGS.interval);
    s2.fontPreset = preset.value;
    s2.fontCustom = custom.value.trim();
    saveSettings(s2);
    applySettings(s2);
    restartBackgroundEngine(); // 反映
  });
}

function renderThumbs(container, imgs){
  container.innerHTML = "";
  imgs.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.title = `local ${i+1}`;
    container.appendChild(img);
  });
}

function fileToDataURL(file){
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

/* ========== Background Engine ========== */
let bgIntervalId = null;
let bgIndex = 0;

function startBackgroundEngine(){
  stopBackgroundEngine();
  const s = loadSettings();
  // 初回即時
  setBackgroundOnce(s);
  // 周期変更
  bgIntervalId = setInterval(() => setBackgroundOnce(loadSettings()), s.interval * 1000);
}

function restartBackgroundEngine(){
  startBackgroundEngine();
}

function stopBackgroundEngine(){
  if (bgIntervalId) clearInterval(bgIntervalId);
  bgIntervalId = null;
}

function setBackgroundOnce(s){
  const bg = document.getElementById("bg");
  if (!bg) return;

  const apply = (url) => {
    // フェード
    bg.classList.add("fade");
    setTimeout(() => {
      bg.style.backgroundImage = `url('${url}')`;
      bg.classList.remove("fade");
    }, 200);
  };

  if (s.bgSource === "local" && s.customImages.length){
    const url = s.customImages[bgIndex % s.customImages.length];
    bgIndex++;
    apply(url);
    return;
  }

  // online provider: picsum.photos（CORSに強い）
  const seed = (s.seeds && s.seeds.length) ? s.seeds[bgIndex % s.seeds.length] : DEFAULT_SETTINGS.seeds[bgIndex % DEFAULT_SETTINGS.seeds.length];
  bgIndex++;

  const width = Math.max(1920, window.innerWidth);
  const height = Math.max(1080, window.innerHeight);
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}_${Date.now()}/${width}/${height}`;

  const img = new Image();
  img.src = url;
  img.onload = () => apply(url);
  img.onerror = () => {
    console.warn("⚠️ 背景画像の取得に失敗しました。", url);
    // フォールバック（グラデーション）
    bg.style.backgroundImage = `
      radial-gradient(1200px 600px at 70% 15%, rgba(42,71,120,.25), rgba(8,15,24,.85)),
      linear-gradient(120deg, #0b1730, #0e2238, #102a44, #0b1730)
    `;
  };
}







/* ===== Timer ===== */
function initTimer(){
  const form = document.getElementById("timer-form");
  const historyList = document.getElementById("timer-history");
  const currentTimerDisplay = document.getElementById("current-timer");

  let timerId = null;
  let remaining = 0;

  const history = loadHistory();
  renderHistory();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const timeInput = document.getElementById("timer-time").value || "00:00:00";
    const name = document.getElementById("timer-name").value || "";
    const desc = document.getElementById("timer-desc").value || "";

    const [h, m, s] = timeInput.split(":").map(n => Number(n) || 0);
    remaining = h * 3600 + m * 60 + s;
    if (remaining <= 0) return;

    if (timerId) clearInterval(timerId);
    currentTimerDisplay.textContent = formatTime(remaining);

    timerId = setInterval(() => {
      remaining--;
      currentTimerDisplay.textContent = formatTime(remaining);
      if (remaining <= 0){
        clearInterval(timerId);
        timerId = null;
        currentTimerDisplay.textContent = "00:00:00";
        alert("タイマー終了");
      }
    }, 1000);

    // 履歴保存
    history.push({ time: timeInput, name, desc, savedAt: Date.now() });
    saveHistory(history);
    renderHistory();
  });

  function renderHistory(){
    historyList.innerHTML = "";
    history.slice().reverse().forEach((item, idx) => {
      const li = document.createElement("li");
      const row1 = document.createElement("div");
      row1.className = "row";
      const mainText = document.createElement("div");
      mainText.textContent = `${item.time} — ${item.name || "（無題）"}`;
      const pill = document.createElement("span");
      pill.className = "pill";
      const d = new Date(item.savedAt || Date.now());
      pill.textContent = d.toLocaleString();
      row1.append(mainText, pill);

      const row2 = document.createElement("div");
      row2.className = "row";
      const desc = document.createElement("div");
      desc.style.opacity = ".85";
      desc.textContent = item.desc || "";
      row2.append(desc);

      const row3 = document.createElement("div");
      row3.className = "row";
      const reuseBtn = document.createElement("button");
      reuseBtn.className = "btn";
      reuseBtn.textContent = "再利用";
      reuseBtn.onclick = () => {
        document.getElementById("timer-time").value = item.time;
        document.getElementById("timer-name").value = item.name;
        document.getElementById("timer-desc").value = item.desc;
      };

      const delBtn = document.createElement("button");
      delBtn.className = "btn ghost";
      delBtn.textContent = "削除";
      delBtn.onclick = () => {
        const indexFromStart = history.length - 1 - idx;
        history.splice(indexFromStart, 1);
        saveHistory(history);
        renderHistory();
      };

      row3.append(reuseBtn, delBtn);

      li.append(row1, row2, row3);
      historyList.appendChild(li);
    });
  }

  function loadHistory(){
    try{ return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }catch{ return []; }
  }
  function saveHistory(arr){
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
  }
}

function formatTime(sec){
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}




window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if(loader){
    loader.style.transition = 'opacity 0.5s ease';
    loader.style.opacity = 0;
    setTimeout(() => loader.remove(), 500); // フェードアウト後に削除
  }
});



        // Stopwatch機能
        const display = document.getElementById('stopwatch-time');
        const startBtn = document.getElementById('sw-start');
        const stopBtn = document.getElementById('sw-stop');
        const resetBtn = document.getElementById('sw-reset');

        let swInterval = null;
        let elapsed = 0;

        function formatTime(sec){
            const h = String(Math.floor(sec / 3600)).padStart(2,'0');
            const m = String(Math.floor((sec % 3600)/60)).padStart(2,'0');
            const s = String(sec % 60).padStart(2,'0');
            return `${h}:${m}:${s}`;
        }

        startBtn.addEventListener('click', () => {
            if (swInterval) return;
            swInterval = setInterval(() => {
                elapsed++;
                display.textContent = formatTime(elapsed);
            }, 1000);
        });

        stopBtn.addEventListener('click', () => {
            if (swInterval) clearInterval(swInterval);
            swInterval = null;
        });

        resetBtn.addEventListener('click', () => {
            if (swInterval) clearInterval(swInterval);
            swInterval = null;
            elapsed = 0;
            display.textContent = "00:00:00";
        });






// 初回モーダルフラグ
    document.addEventListener('DOMContentLoaded', () => {
        // index.html でのみ実行
        if (!location.pathname.endsWith('index.html') && location.pathname !== '/') return;

        const agreed = localStorage.getItem('timesAgreed');

        if (!agreed) {
            const modal = document.createElement('div');
            modal.id = 'welcome-modal';

            // 画面表示
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
    });



// 設定画面のリセットボタン
    document.addEventListener('DOMContentLoaded', () => {
        const resetBtn = document.getElementById('reset-btn');
        const ressetBtn = document.getElementById('SettingsResetBtn');

        if(resetBtn){
            resetBtn.addEventListener('click', () => {
              console.warn("⚠️ リaaaaaました。");
              // 確認
              if(!confirm("すべての設定とデータをリセットします。")) return;

              // localStorageのTimes関連キーを削除
                  // 初回モーダルフラグ
                  localStorage.removeItem('timesAgreed');
                  // タイマー履歴
                  localStorage.removeItem('timerHistory');
                  // 背景設定
                  localStorage.removeItem('backgroundImages');
              console.warn("⚠️ リセットしました。");

              // ページリロード
              window.location.reload();
            });
        }
    });



// 縦画面警告
    function checkOrientation() {
        if(window.innerHeight > window.innerWidth && window.innerWidth <= 768){
                console.warn("⚠️ 画面の横幅が規定値以下です。正しく表示できない可能性があります。");
            }
        }

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('load', checkOrientation);



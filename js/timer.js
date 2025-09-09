console.log("✅ js/timer.js loaded");

const HISTORY_KEY = "times.timerHistory";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("timer-form");
    const historyList = document.getElementById("timer-history");
    const currentTimerDisplay = document.getElementById("current-timer");

    if (!form || !historyList || !currentTimerDisplay) return;

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

    function formatTime(sec){
        const h = String(Math.floor(sec / 3600)).padStart(2, "0");
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
        const s = String(sec % 60).padStart(2, "0");
        return `${h}:${m}:${s}`;
    }
});
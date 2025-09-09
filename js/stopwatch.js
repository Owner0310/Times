// js動作確認用
console.log("✅ js/pomodoro.js file loaded.");



document.addEventListener("DOMContentLoaded", () => {

    /* ===============
    ストップウォッチ処理部
    =============== */

    // HTMLより要素取得：時間
    const DisplayTime = document.getElementById("stopwatch-Time");

    // HTMLより要素取得：ボタン
    const Start_PauseBtn = document.getElementById("stopwatch-Start/PauseBtn");
    const ResetBtn = document.getElementById("stopwatch-ResetBtn");

    // 変数定義（初期値設定）
    let Interval = null;
    let Elapsed = 0;


    // 警告
    if (!DisplayTime || !Start_PauseBtn || !ResetBtn) {
        console.warn("⚠️ Stopwatch 要素が見つかりません。");
        return;
    }

    
    // 時間処理
    function formatTime(sec){
        const h = String(Math.floor(sec / 3600)).padStart(2,'0');
        const m = String(Math.floor((sec % 3600)/60)).padStart(2,'0');
        const s = String(sec % 60).padStart(2,'0');
        return `${h}:${m}:${s}`;
    }
    
    
    // スタート / ポーズ
    function Start_PauseStopwatch() {
        if (Interval) {
            StopStopwatch();
        } else {
            StartStopwatch();
        }
    }


    // スタート
    function StartStopwatch() {
        Interval = setInterval(() => {
            Elapsed ++;
            DisplayTime.textContent = formatTime(Elapsed);
        }, 1000);
    }


    // ストップ
    function StopStopwatch() {
        if (Interval) {
            clearInterval(Interval);
            Interval = null;
        }
    }


    // リセット
    function ResetStopwatch() {
        if (Interval) {
            clearInterval(Interval);
            Interval = null;
        }
        Elapsed = 0;
        DisplayTime.textContent = "00:00:00";
    }


    // ボタン操作のイベント
    Start_PauseBtn.addEventListener("click", Start_PauseStopwatch);
    ResetBtn.addEventListener("click", ResetStopwatch);



    /* ===============
        データ保存処理部
    =============== */

    // HTML要素取得
    const SaveSettingsBtn = document.getElementById("pomodoro-SaveSettingsBtn");
    const SavedSettingsCards = document.getElementById("pomodoro-SavedSettingsCards");


    // 保存処理
    SaveSettingsBtn.addEventListener("click", () => {
        const title = prompt("📝 保存名を入力してください");

        if (!title) return;    // 不安定動作防止

        // JSON構成
        const key = "Times-Pomodoro-" + title;
        const data = {
            WorkTime: WorkTime.value,
            BreakTime: BreakTime.value,
            LongBreakTime: LongBreakTime.value,
            LongBreakTime_Interval: LongBreakTime_Interval.value
        };

        // JSON LocalStrageへ保存
        localStorage.setItem(key, JSON.stringify(data));

        // 通知
        alert(`👍 「${title}」を保存しました`);
        RenderSavedSettings();
    });


    // 保存済み設定の表示
    function RenderSavedSettings() {
        SavedSettingsCards.innerHTML = "";

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key.startsWith("Times-Pomodoro-")) continue;

            const data = JSON.parse(localStorage.getItem(key));
            const card = document.createElement("div");
            card.className = "settings-card-compact";

            // カード内容表示
            card.innerHTML = `
                <div class="card">
                    <h3><strong>${key.replace("Times-Pomodoro-", "")}</strong></h3>
                    <p>作業時間: ${data.WorkTime}</p>
                    <p>短い休憩: ${data.BreakTime}</p>
                    <p>長い休憩: ${data.LongBreakTime}</p>
                    <p>長い休憩の間隔: ${data.LongBreakTime_Interval} 回</p>
                    <button class="load-btn btn">呼び出し</button>
                    <button class="delete-btn btn">削除</button>
                </div>
            `;


            // 呼び戻しボタン
            card.querySelector(".load-btn").addEventListener("click", () => {
                WorkTime.value = data.WorkTime;
                BreakTime.value = data.BreakTime;
                LongBreakTime.value = data.LongBreakTime;
                LongBreakTime_Interval.value = data.LongBreakTime_Interval;

                ResetTimer();
            });


            // 削除ボタン
            card.querySelector(".delete-btn").addEventListener("click", () => {
                if (confirm(`⚠️ 「${key.replace("Times-Pomodoro-", "")}」を削除しますか？`)) {  // 警告
                    localStorage.removeItem(key);

                    RenderSavedSettings();
                }
            });

            SavedSettingsCards.appendChild(card);
        }
    }



    /* ===============
        Settingsリセット処理部
    =============== */

    // HTML要素取得
    const SettingsResetBtn = document.getElementById("SettingsResetBtn");

    SettingsResetBtn.addEventListener("click", (e) => {
        e.preventDefault();  // form送信防止

        if (!confirm("⚠️ 本当にすべての保存設定をリセットしますか？")) return;  // 警告

        // localStorage削除
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith("Times-Pomodoro-")) {
                localStorage.removeItem(key);
            }
        }

        // 保存済みカードがある場合は更新
        if (typeof RenderSavedSettings === "function") {
            RenderSavedSettings();
        }

        // 入力フォーム初期化
        WorkTime.value = "00:25:00";
        BreakTime.value = "00:05:00";
        LongBreakTime.value = "00:30:00";
        LongBreakTime_Interval.value = 3;

        // タイマー初期化
        ResetTimer();

        // 通知
        alert("⚠️ すべての保存設定をリセットしました");
    });


    // js動作確認用
    console.log("✅ js/pomodoro.js script loaded.");
});
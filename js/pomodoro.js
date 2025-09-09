// js動作確認用
console.log("✅ js/pomodoro.js file loaded.");



document.addEventListener("DOMContentLoaded", () => {

    /* ===============
    ポモドーロ処理部
    =============== */

    // HTMLより要素取得：時間・ステータス
    const DisplayTime = document.getElementById("pomodoro-DisplayTime");
    const DisplayWorkStatus = document.getElementById("pomodoro-DisplayWorkStatus");
    const DisplaySetStatus = document.getElementById("pomodoro-DisplaySetStatus");

    // HTMLより要素取得：ボタン
    const Start_PauseBtn = document.getElementById("pomodoro-Start/PauseBtn");
    const ResetBtn = document.getElementById("pomodoro-ResetBtn");

    // HTMLより要素取得：入力フォーム
    const WorkTime = document.getElementById("pomodoro-WorkTime");
    const BreakTime = document.getElementById("pomodoro-BreakTime");
    const LongBreakTime = document.getElementById("pomodoro-LongBreakTime");
    const LongBreakTime_Interval = document.getElementById("pomodoro-LongBreakTime-Interval");

    // 変数定義（初期値設定）
    let Timer = null;
    let RunningTimer = false;
    let WorkStatus = true;  // true=作業時間, false=休憩時間
    let RemainingTime = 0;
    let CurrentSet = 1;


    // 秒変換
    function TimeConverte(Converte) {
        // 入力値を ":" で分割して配列にする
        const parts = Converte.value.split(":").map(Number);
        let seconds = 0;
        if (parts.length === 3) {
            // hh:mm:ss
            seconds = parts[0]*3600 + parts[1]*60 + parts[2];
        } else if (parts.length === 2) {
            // mm:ss
            seconds = parts[0]*60 + parts[1];
        } else if (parts.length === 1) {
            // ss
            seconds = parts[0];
        }
        return seconds;
    }


    // 表示更新
    function UpdateDisplay() {
        // 時間
        const min = Math.floor(RemainingTime / 60);
        const sec = RemainingTime % 60;

        // 表示
        DisplayTime.textContent = `${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
        DisplayWorkStatus.textContent = WorkStatus ? "作業時間" : "休憩時間";
        DisplaySetStatus.textContent = `セット: ${CurrentSet}`;
    }


    // スタート / ポーズ
    function Start_Pause() {
        if (RunningTimer) {
            PauseTimer();
        } else {
            StartTimer();
        }
    }


    // スタート
    function StartTimer() {
        if (RunningTimer) return; // 二重動作防止

        // 時間設定
        if (RemainingTime <= 0) {
            if (WorkStatus) {
                RemainingTime = TimeConverte(WorkTime);
            } else {
                // 休憩判定
                if (CurrentSet % LongBreakTime_Interval.value === 0) {
                    RemainingTime = TimeConverte(LongBreakTime);
                } else {
                    RemainingTime = TimeConverte(BreakTime);
                }
            }
        }

        // タイマー
        RunningTimer = true;
        Timer = setInterval(() => {
            RemainingTime--;
            UpdateDisplay();

            // WorkStatus切替
            if (RemainingTime <= 0) {
                clearInterval(Timer);
                RunningTimer = false;

                if (WorkStatus) {
                    WorkStatus = false; // 作業→休憩
                } else {
                    CurrentSet++;       // 休憩→作業
                    WorkStatus = true;
                }

                StartTimer();
            }
        }, 1000); // 毎秒実行
    }


    // 一時停止
    function PauseTimer() {
        clearInterval(Timer);
        RunningTimer = false;
    }


    // リセット
    function ResetTimer() {
        clearInterval(Timer);
        RunningTimer = false;
        WorkStatus = true;
        RemainingTime = TimeConverte(WorkTime);
        CurrentSet = 1;
        UpdateDisplay();
    }


    // ボタン操作のイベント
    Start_PauseBtn.addEventListener("click", Start_Pause);
    ResetBtn.addEventListener("click", ResetTimer);



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



    // ページ読み込み時リセット
    ResetTimer();

    RenderSavedSettings();


    // js動作確認用
    console.log("✅ js/pomodoro.js script loaded.");
});
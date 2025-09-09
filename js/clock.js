// js動作確認用
console.log("✅ js/clock.js file loaded.");



document.addEventListener("DOMContentLoaded", () => {

    /* ===============
    クロック処理部
    =============== */

// HTMLより要素取得
    const clockTime = document.getElementById("clock-Time");
    const clockDate = document.getElementById("clock-Date");

    // 時間処理
    function loadClock(){
        if (!clockTime || !clockDate) return; // 不正動作防止

        (function tick() {
            const now = new Date();
            clockTime.textContent = now.toLocaleTimeString("en-GB", {hour12: false});
            clockDate.textContent = now.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });
            setTimeout(tick, 1000);
        })();
    }


    // ページ読み込み時リセット
    loadClock();


    // js動作確認用
    console.log("✅ js/clock.js script loaded.");
});
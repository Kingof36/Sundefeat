const START_BALANCE = 100000;
const ROUND_SECONDS = 30;
const PAYOUT_MULTIPLIER = 1.98;
const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const $ = (id) => document.getElementById(id);
let balance = Number(localStorage.getItem("taixiu_balance_v2"));
if (!Number.isFinite(balance) || balance < 0) balance = START_BALANCE;
let round = Number(localStorage.getItem("taixiu_round_v2")) || 1;
let selected = "";
let busy = false;
let betPlaced = false;
let secondsLeft = ROUND_SECONDS;
let countdownTimer = null;
let rollTimeout = null;

const format = (n) => Math.floor(n).toLocaleString("vi-VN");
function updateBalance() {
  $("balance").textContent = format(balance);
  localStorage.setItem("taixiu_balance_v2", String(balance));
}
function updateRound() {
  $("round").textContent = String(round).padStart(3, "0");
  localStorage.setItem("taixiu_round_v2", String(round));
}
function setChoice(choice) {
  if (betPlaced || busy) return;
  selected = choice;
  document.querySelectorAll(".choice").forEach(btn => {
    btn.setAttribute("aria-pressed", String(btn.dataset.choice === choice));
  });
  $("roll").disabled = !selected || busy || betPlaced;
  $("roll").textContent = selected ? "XÁC NHẬN ĐẶT CƯỢC" : "CHỌN TÀI HOẶC XỈU";
  $("hint").textContent = choice === "tai" ? "Bạn chọn Tài. Nhập số điểm rồi xác nhận cược." :
    choice === "xiu" ? "Bạn chọn Xỉu. Nhập số điểm rồi xác nhận cược." :
    "Chọn cửa và số điểm cược trong thời gian đếm ngược.";
}
function getBet() {
  const n = Math.floor(Number($("bet").value));
  return Number.isFinite(n) ? n : 0;
}
function normalizeBet() {
  if (betPlaced || busy) return;
  let n = getBet();
  if (n < 10) n = 10;
  if (n > balance) n = balance;
  $("bet").value = n;
}
function updateTimerDisplay() {
  $("countdown").textContent = `${secondsLeft}s`;
  $("timerBar").style.width = `${(secondsLeft / ROUND_SECONDS) * 100}%`;
  $("timerBar").classList.toggle("urgent", secondsLeft <= 5);
}
function addHistory(choice, dice, total, status, net, wager) {
  const history = $("history");
  if (history.classList.contains("history-empty")) {
    history.className = "history-list";
    history.textContent = "";
  }
  const item = document.createElement("div");
  item.className = "history-item";
  const left = document.createElement("div");
  const line1 = document.createElement("div");
  line1.textContent = `Phiên ${String(round).padStart(3, "0")} · ${dice.join(" – ")} = ${total}`;
  const line2 = document.createElement("small");
  line2.textContent = choice ? `Cược ${choice === "tai" ? "Tài" : "Xỉu"} · ${format(wager)} điểm` : "Không có cược";
  left.append(line1, line2);
  const right = document.createElement("div");
  right.style.textAlign = "right";
  const pill = document.createElement("span");
  pill.className = `pill ${total >= 11 ? "tai" : "xiu"}`;
  pill.textContent = total >= 11 ? "TÀI" : "XỈU";
  const delta = document.createElement("div");
  delta.className = net > 0 ? "gain" : net < 0 ? "loss" : "";
  delta.style.marginTop = "5px";
  delta.textContent = net > 0 ? `+${format(net)}` : net < 0 ? `−${format(-net)}` : status === "push" ? "HÒA" : "—";
  right.append(pill, delta);
  item.append(left, right);
  history.prepend(item);
  while (history.children.length > 8) history.lastElementChild.remove();
}
function placeBet() {
  if (busy || betPlaced || !selected) return;
  normalizeBet();
  const wager = getBet();
  if (wager < 10 || wager > balance) {
    $("hint").textContent = "Điểm cược phải từ 10 đến số điểm hiện có.";
    return;
  }
  if (secondsLeft <= 0) return;
  balance -= wager;
  updateBalance();
  betPlaced = true;
  $("bet").disabled = true;
  document.querySelectorAll(".choice").forEach(btn => {
    btn.disabled = true;
  });
  $("roll").disabled = true;
  $("roll").textContent = "ĐÃ ĐẶT CƯỢC";
  $("status").textContent = "ĐÃ NHẬN CƯỢC";
  $("hint").textContent = `Đã cược ${format(wager)} điểm vào ${selected === "tai" ? "Tài" : "Xỉu"}. Chờ hết giờ để tự động lắc.`;
}
function resetBetControls() {
  selected = "";
  betPlaced = false;
  $("bet").disabled = false;
  document.querySelectorAll(".choice").forEach(btn => {
    btn.disabled = false;
    btn.setAttribute("aria-pressed", "false");
  });
  $("roll").disabled = true;
  $("roll").textContent = "CHỌN TÀI HOẶC XỈU";
  $("bet").value = Math.min(1000, balance);
}
async function rollRound() {
  if (busy) return;
  busy = true;
  clearInterval(countdownTimer);
  clearTimeout(rollTimeout);
  secondsLeft = 0;
  updateTimerDisplay();
  $("status").textContent = "ĐANG LẮC...";
  $("resultLabel").textContent = "Đang lắc xúc xắc…";
  $("total").textContent = "…";
  $("roll").disabled = true;
  const diceEls = [$("die1"), $("die2"), $("die3")];
  diceEls.forEach(el => el.classList.add("rolling"));
  for (let i = 0; i < 15; i++) {
    diceEls.forEach(el => el.textContent = faces[Math.floor(Math.random() * 6)]);
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  const dice = [1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1);
  diceEls.forEach((el, i) => { el.textContent = faces[dice[i] - 1]; el.classList.remove("rolling"); });
  const total = dice.reduce((a, b) => a + b, 0);
  const triple = dice[0] === dice[1] && dice[1] === dice[2];
  const outcome = total <= 10 ? "xiu" : "tai";
  $("total").textContent = total;
  $("resultLabel").textContent = triple ? "BỘ BA" : outcome === "tai" ? "TÀI" : "XỈU";

  let net = 0;
  let status = "none";
  let wager = 0;
  if (betPlaced) {
    wager = Number($("currentWager")?.value || 0);
  }
  // Cược đã trừ khỏi ví lúc xác nhận; khi thắng nhận lại 1,98 lần tiền cược.
  if (window.currentBet && window.currentBet.amount > 0) {
    wager = window.currentBet.amount;
    if (!triple && outcome === window.currentBet.choice) {
      const payout = Math.floor(wager * PAYOUT_MULTIPLIER);
      balance += payout;
      net = payout - wager;
      status = "win";
      $("hint").textContent = `Bạn thắng! Nhận ${format(payout)} điểm (lãi ${format(net)} điểm).`;
    } else {
      net = -wager;
      status = "loss";
      $("hint").textContent = triple ? `Ra bộ ba, cược thua ${format(wager)} điểm.` : `Bạn thua ${format(wager)} điểm.`;
    }
  } else {
    $("hint").textContent = "Phiên vừa rồi bạn không đặt cược.";
  }
  window.currentBet = null;
  updateBalance();
  addHistory(wager ? (status === "none" ? "" : (lastChoiceForHistory || "")) : "", dice, total, status, net, wager);
  $("status").textContent = triple ? "BỘ BA" : status === "win" ? "THẮNG" : status === "loss" ? "THUA" : "KẾT THÚC";
  round++;
  updateRound();
  resetBetControls();
  busy = false;
  startNewRound();
}
let lastChoiceForHistory = "";
function confirmBet() {
  if (busy || betPlaced || !selected) return;
  normalizeBet();
  const amount = getBet();
  if (amount < 10 || amount > balance) {
    $("hint").textContent = "Điểm cược không hợp lệ.";
    return;
  }
  lastChoiceForHistory = selected;
  window.currentBet = { choice: selected, amount };
  placeBet();
}
function startNewRound() {
  secondsLeft = ROUND_SECONDS;
  updateTimerDisplay();
  $("status").textContent = "ĐANG NHẬN CƯỢC";
  countdownTimer = setInterval(() => {
    secondsLeft--;
    if (secondsLeft < 0) secondsLeft = 0;
    updateTimerDisplay();
    if (secondsLeft <= 0) {
      clearInterval(countdownTimer);
      rollTimeout = setTimeout(rollRound, 100);
    }
  }, 1000);
}
document.querySelectorAll(".choice").forEach(btn => btn.addEventListener("click", () => setChoice(btn.dataset.choice)));
document.querySelectorAll("[data-bet]").forEach(btn => btn.addEventListener("click", () => {
  if (betPlaced || busy) return;
  $("bet").value = Math.min(Number(btn.dataset.bet), balance);
  normalizeBet();
}));
$("minus").addEventListener("click", () => { if (!betPlaced && !busy) { $("bet").value = Math.max(10, getBet() - 10); normalizeBet(); } });
$("plus").addEventListener("click", () => { if (!betPlaced && !busy) { $("bet").value = Math.min(balance, getBet() + 10); normalizeBet(); } });
$("maxBet").addEventListener("click", () => { if (!betPlaced && !busy) { $("bet").value = balance; normalizeBet(); } });
$("bet").addEventListener("change", normalizeBet);
$("roll").addEventListener("click", confirmBet);
$("reset").addEventListener("click", () => {
  if (busy) return;
  if (!confirm("Đặt lại điểm về 100.000 và xóa lịch sử trên trình duyệt này?")) return;
  clearInterval(countdownTimer);
  clearTimeout(rollTimeout);
  balance = START_BALANCE;
  round = 1;
  window.currentBet = null;
  localStorage.removeItem("taixiu_balance_v2");
  localStorage.removeItem("taixiu_round_v2");
  $("history").className = "history-empty";
  $("history").textContent = "Chưa có lượt chơi nào.";
  $("total").textContent = "—";
  $("resultLabel").textContent = "Chờ phiên đầu tiên";
  updateBalance();
  updateRound();
  resetBetControls();
  startNewRound();
});
updateBalance();
updateRound();
$("bet").value = Math.min(1000, balance);
setChoice("");
startNewRound();

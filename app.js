document.addEventListener('DOMContentLoaded', () => {
  // Mặc định khởi đầu với số tiền 10.000.000 (10 triệu)
  let balance = parseInt(localStorage.getItem('sun_balance')) || 10000000;
  let currentRound = parseInt(localStorage.getItem('sun_round')) || 125;
  let history = JSON.parse(localStorage.getItem('sun_history')) || [];

  let selectedChip = 1000; // Mức phỉnh chọn mặc định 1K
  let myBets = { tai: 0, xiu: 0 };
  let timer = 40;
  let timerInterval = null;
  
  // Trạng thái: 'betting' (đang cược), 'waiting_open' (chờ mở bát), 'result' (hiển thị kết quả)
  let gameState = 'betting'; 
  let finalDice = [1, 1, 1];

  const diceGlyphs = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  // DOM Elements
  const balanceEl = document.getElementById('balance');
  const roundEl = document.getElementById('round');
  const statusEl = document.getElementById('status');
  const countdownEl = document.getElementById('countdown');
  const die1El = document.getElementById('die1');
  const die2El = document.getElementById('die2');
  const die3El = document.getElementById('die3');
  const totalEl = document.getElementById('total');
  const resultLabelEl = document.getElementById('resultLabel');
  const bowlCoverEl = document.getElementById('bowlCover');
  const openBowlBtn = document.getElementById('openBowlBtn');
  const myBetTaiEl = document.getElementById('myBetTai');
  const myBetXiuEl = document.getElementById('myBetXiu');
  const selectedBetDisplayEl = document.getElementById('selectedBetDisplay');
  const historyEl = document.getElementById('history');

  // Khởi tạo hiển thị ban đầu
  updateBalanceUI();
  updateHistoryUI();
  roundEl.textContent = String(currentRound).padStart(4, '0');
  startTimer();

  // Chọn phỉnh cược
  document.querySelectorAll('.chip').forEach(btn => {
    if(btn.id === 'maxBet') return;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedChip = parseInt(btn.dataset.chip);
      selectedBetDisplayEl.textContent = selectedChip.toLocaleString('vi-VN');
    });
  });

  // Phỉnh TẤT TAY (Max Bet)
  document.getElementById('maxBet').addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
    document.getElementById('maxBet').classList.add('active');
    selectedChip = balance;
    selectedBetDisplayEl.textContent = selectedChip.toLocaleString('vi-VN');
  });

  // Đặt cược vào cửa TÀI hoặc XỈU
  document.querySelectorAll('.gate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (gameState !== 'betting') {
        alert('Đã hết thời gian đặt cược phiên này!');
        return;
      }

      const choice = btn.dataset.choice;
      const amountToBet = selectedChip;

      if (amountToBet <= 0) {
        alert('Vui lòng chọn mức cược hợp lệ!');
        return;
      }

      if (amountToBet > balance) {
        alert('Số dư tài khoản không đủ để đặt cược mức này!');
        return;
      }

      // Trừ tiền ngay khi đặt cược
      balance -= amountToBet;
      myBets[choice] += amountToBet;
      
      updateBalanceUI();
      updateMyBetsUI();
    });
  });

  // Đặt lại ví điểm về 10tr
  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Khôi phục ví điểm về 10.000.000?')) {
      balance = 10000000;
      history = [];
      localStorage.removeItem('sun_history');
      updateBalanceUI();
      updateHistoryUI();
    }
  });

  // Bấm vào Bát hoặc Nút "Mở Bát" để mở kết quả
  bowlCoverEl.addEventListener('click', revealDice);
  openBowlBtn.addEventListener('click', revealDice);

  function startTimer() {
    clearInterval(timerInterval);
    timer = 40;
    gameState = 'betting';
    myBets = { tai: 0, xiu: 0 };
    updateMyBetsUI();

    bowlCoverEl.classList.add('hidden'); // Úp bát lại (ẩn đi hoặc hiện tùy logic, ở đây chuẩn bị cho ván mới)
    openBowlBtn.style.display = 'none';
    statusEl.textContent = 'ĐANG ĐẶT CƯỢC';
    statusEl.style.color = '#38bdf8';
    resultLabelEl.textContent = '';
    totalEl.textContent = '—';
    
    // Xáo trộn xúc xắc tạo hiệu ứng chờ
    die1El.textContent = diceGlyphs[Math.floor(Math.random() * 6)];
    die2El.textContent = diceGlyphs[Math.floor(Math.random() * 6)];
    die3El.textContent = diceGlyphs[Math.floor(Math.random() * 6)];

    timerInterval = setInterval(() => {
      timer--;
      countdownEl.textContent = `${timer}s`;

      if (timer <= 10 && gameState === 'betting') {
        statusEl.textContent = 'SẮP ĐÓNG CƯỢC';
        statusEl.style.color = '#f59e0b';
      }

      if (timer <= 0) {
        clearInterval(timerInterval);
        lockBettingAndRoll();
      }
    }, 1000);
  }

  // Khóa cược, lắc xúc xắc ngầm và úp Bát chờ người chơi mở
  function lockBettingAndRoll() {
    gameState = 'waiting_open';
    statusEl.textContent = 'HẾT GIỜ - CHỜ MỞ BÁT';
    statusEl.style.color = '#ef4444';
    countdownEl.textContent = '0s';

    // Random kết quả trước
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    finalDice = [d1, d2, d3];

    // Úp bát xuống để người chơi tự bấm mở bát
    bowlCoverEl.classList.remove('hidden');
    openBowlBtn.style.display = 'block';
  }

  // Hành động Mở Bát
  function revealDice() {
    if (gameState !== 'waiting_open') return;
    gameState = 'result';

    // Ẩn bát
    bowlCoverEl.classList.add('hidden');
    openBowlBtn.style.display = 'none';

    const d1 = finalDice[0];
    const d2 = finalDice[1];
    const d3 = finalDice[2];
    const total = d1 + d2 + d3;
    const resultStr = total >= 11 ? 'tai' : 'xiu';

    die1El.textContent = diceGlyphs[d1 - 1];
    die2El.textContent = diceGlyphs[d2 - 1];
    die3El.textContent = diceGlyphs[d3 - 1];
    totalEl.textContent = total;

    // Kiểm tra thắng thua
    let totalWin = 0;
    let totalBetOnWinningGate = myBets[resultStr];

    if (totalBetOnWinningGate > 0) {
      // Tỷ lệ trả thưởng 1 ăn 0.98 chuẩn Sunwin
      let bonus = Math.floor(totalBetOnWinningGate * 1.98);
      balance += bonus;
      totalWin = bonus - totalBetOnWinningGate;
      resultLabelEl.textContent = `🎉 THẮNG +${bonus.toLocaleString('vi-VN')} (${resultStr.toUpperCase()})`;
      resultLabelEl.style.color = '#10b981';
    } else {
      let totalLost = myBets.tai + myBets.xiu;
      if (totalLost > 0) {
        resultLabelEl.textContent = `❌ THUA -${totalLost.toLocaleString('vi-VN')} (${resultStr.toUpperCase()})`;
        resultLabelEl.style.color = '#ef4444';
      } else {
        resultLabelEl.textContent = `KẾT QUẢ: ${resultStr.toUpperCase()} (${total}đ)`;
        resultLabelEl.style.color = '#fbbf24';
      }
    }

    updateBalanceUI();

    // Lưu lịch sử
    history.unshift({
      round: currentRound,
      total,
      resultStr
    });
    if (history.length > 15) history.pop();
    localStorage.setItem('sun_history', JSON.stringify(history));
    updateHistoryUI();

    // Tự động chuyển phiên mới sau 4 giây
    setTimeout(() => {
      currentRound++;
      localStorage.setItem('sun_round', currentRound);
      roundEl.textContent = String(currentRound).padStart(4, '0');
      startTimer();
    }, 4000);
  }

  function updateBalanceUI() {
    balanceEl.textContent = balance.toLocaleString('vi-VN');
    localStorage.setItem('sun_balance', balance);
  }

  function updateMyBetsUI() {
    myBetTaiEl.textContent = `Cược: ${myBets.tai.toLocaleString('vi-VN')}`;
    myBetXiuEl.textContent = `Cược: ${myBets.xiu.toLocaleString('vi-VN')}`;
  }

  function updateHistoryUI() {
    if (history.length === 0) {
      historyEl.innerHTML = '<span class="empty-hist">Chưa có dữ liệu</span>';
      return;
    }

    historyEl.innerHTML = history.map(item => `
      <div class="hist-dot ${item.resultStr}" title="Phiên #${item.round} - Tổng: ${item.total}">
        ${item.resultStr === 'tai' ? 'T' : 'X'}
      </div>
    `).join('');
  }
});

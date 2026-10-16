document.addEventListener('DOMContentLoaded', () => {
  let balance = parseInt(localStorage.getItem('tx_balance')) || 100000;
  let currentRound = parseInt(localStorage.getItem('tx_round')) || 1;
  let history = JSON.parse(localStorage.getItem('tx_history')) || [];
  
  let selectedChoice = null;
  let timer = 30;
  let timerInterval = null;
  let isRolling = false;

  const diceGlyphs = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  const balanceEl = document.getElementById('balance');
  const roundEl = document.getElementById('round');
  const statusEl = document.getElementById('status');
  const countdownEl = document.getElementById('countdown');
  const timerBarEl = document.getElementById('timerBar');
  const die1El = document.getElementById('die1');
  const die2El = document.getElementById('die2');
  const die3El = document.getElementById('die3');
  const totalEl = document.getElementById('total');
  const resultLabelEl = document.getElementById('resultLabel');
  const betInput = document.getElementById('bet');
  const rollBtn = document.getElementById('roll');
  const hintEl = document.getElementById('hint');
  const historyEl = document.getElementById('history');

  updateBalanceUI();
  updateHistoryUI();
  roundEl.textContent = String(currentRound).padStart(3, '0');
  startTimer();

  document.querySelectorAll('.choice').forEach(btn => {
    btn.addEventListener('click', () => {
      if (isRolling) return;
      document.querySelectorAll('.choice').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      selectedChoice = btn.dataset.choice;
      updateRollButton();
    });
  });

  document.getElementById('minus').addEventListener('click', () => {
    let val = parseInt(betInput.value) || 0;
    betInput.value = Math.max(10, val - 10);
    updateRollButton();
  });

  document.getElementById('plus').addEventListener('click', () => {
    let val = parseInt(betInput.value) || 0;
    betInput.value = val + 10;
    updateRollButton();
  });

  document.querySelectorAll('.quick-bets button[data-bet]').forEach(btn => {
    btn.addEventListener('click', () => {
      betInput.value = btn.dataset.bet;
      updateRollButton();
    });
  });

  document.getElementById('maxBet').addEventListener('click', () => {
    betInput.value = balance;
    updateRollButton();
  });

  betInput.addEventListener('input', updateRollButton);

  rollBtn.addEventListener('click', () => {
    if (!selectedChoice || isRolling) return;
    const betAmount = parseInt(betInput.value);

    if (isNaN(betAmount) || betAmount < 10) {
      alert('Mức cược tối thiểu là 10 điểm!');
      return;
    }

    if (betAmount > balance) {
      alert('Số dư điểm không đủ!');
      return;
    }

    // Trừ tiền cược ngay khi xác nhận đặt cược
    balance -= betAmount;
    updateBalanceUI();

    executeRoll(betAmount);
  });

  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Bạn có muốn đặt lại số dư về 100.000 điểm không?')) {
      balance = 100000;
      history = [];
      localStorage.removeItem('tx_history');
      updateBalanceUI();
      updateHistoryUI();
    }
  });

  function startTimer() {
    clearInterval(timerInterval);
    timer = 30;
    updateTimerUI();

    timerInterval = setInterval(() => {
      timer--;
      updateTimerUI();

      if (timer <= 0) {
        if (!isRolling && selectedChoice) {
          rollBtn.click();
        } else if (!isRolling) {
          nextRound();
        }
      }
    }, 1000);
  }

  function updateTimerUI() {
    countdownEl.textContent = `${timer}s`;
    timerBarEl.style.width = `${(timer / 30) * 100}%`;
  }

  function updateRollButton() {
    const betAmount = parseInt(betInput.value) || 0;
    if (!selectedChoice) {
      rollBtn.disabled = true;
      rollBtn.textContent = 'CHỌN TÀI HOẶC XỈU';
    } else if (betAmount > balance) {
      rollBtn.disabled = true;
      rollBtn.textContent = 'SỐ DƯ KHÔNG ĐỦ';
    } else if (betAmount < 10) {
      rollBtn.disabled = true;
      rollBtn.textContent = 'CƯỢC TỐI THIỂU 10';
    } else {
      rollBtn.disabled = false;
      rollBtn.textContent = `ĐẶT CƯỢC (${betAmount.toLocaleString('vi-VN')} ĐIỂM)`;
    }
  }

  function executeRoll(betAmount) {
    isRolling = true;
    rollBtn.disabled = true;
    statusEl.textContent = 'ĐANG LẮC...';
    hintEl.textContent = 'Đang chờ kết quả...';

    let rollEffect = setInterval(() => {
      die1El.textContent = diceGlyphs[Math.floor(Math.random() * 6)];
      die2El.textContent = diceGlyphs[Math.floor(Math.random() * 6)];
      die3El.textContent = diceGlyphs[Math.floor(Math.random() * 6)];
    }, 100);

    setTimeout(() => {
      clearInterval(rollEffect);

      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const d3 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2 + d3;
      const resultStr = total >= 11 ? 'tai' : 'xiu';

      die1El.textContent = diceGlyphs[d1 - 1];
      die2El.textContent = diceGlyphs[d2 - 1];
      die3El.textContent = diceGlyphs[d3 - 1];
      totalEl.textContent = total;

      const isWin = selectedChoice === resultStr;
      
      // Xử lý trả thưởng chuẩn xác (cộng tiền thắng vào số dư hiện tại)
      if (isWin) {
        const winAmount = Math.floor(betAmount * 1.98);
        balance += winAmount;
        resultLabelEl.textContent = `THẮNG +${winAmount.toLocaleString('vi-VN')} điểm (${resultStr.toUpperCase()})`;
        resultLabelEl.style.color = '#10b981';
      } else {
        resultLabelEl.textContent = `THUA -${betAmount.toLocaleString('vi-VN')} điểm (${resultStr.toUpperCase()})`;
        resultLabelEl.style.color = '#ef4444';
      }

      updateBalanceUI();

      history.unshift({
        round: currentRound,
        choice: selectedChoice,
        total,
        resultStr,
        isWin,
        betAmount
      });
      if (history.length > 20) history.pop();
      
      localStorage.setItem('tx_history', JSON.stringify(history));
      updateHistoryUI();

      setTimeout(() => {
        nextRound();
      }, 3000);

    }, 2000);
  }

  function nextRound() {
    isRolling = false;
    currentRound++;
    localStorage.setItem('tx_round', currentRound);
    roundEl.textContent = String(currentRound).padStart(3, '0');
    statusEl.textContent = 'ĐANG NHẬN CƯỢC';
    resultLabelEl.textContent = 'Chọn cửa để bắt đầu';
    resultLabelEl.style.color = '#38bdf8';
    totalEl.textContent = '—';
    hintEl.textContent = 'Chọn cửa và số điểm cược, sau đó lắc xúc xắc.';
    
    selectedChoice = null;
    document.querySelectorAll('.choice').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });

    updateRollButton();
    startTimer();
  }

  function updateBalanceUI() {
    balanceEl.textContent = balance.toLocaleString('vi-VN');
    localStorage.setItem('tx_balance', balance);
  }

  function updateHistoryUI() {
    if (history.length === 0) {
      historyEl.className = 'history-empty';
      historyEl.textContent = 'Chưa có lượt chơi nào.';
      return;
    }

    historyEl.className = 'history-list';
    historyEl.innerHTML = history.map(item => `
      <div class="history-item">
        <span>Phiên #${String(item.round).padStart(3, '0')} (${item.choice.toUpperCase()})</span>
        <span style="color: ${item.isWin ? '#10b981' : '#ef4444'}">
          ${item.total} điểm • ${item.isWin ? '+' + Math.floor(item.betAmount * 1.98) : '-' + item.betAmount}
        </span>
      </div>
    `).join('');
  }
});

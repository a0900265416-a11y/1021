/**
 * 巨擘風華・光被八表 — 孫運璿先生歷史事蹟數位互動特展
 * 核心互動邏輯控制器
 */

document.addEventListener('DOMContentLoaded', () => {
  // 狀態管理
  const state = {
    currentTab: 'home',
    currentStationIndex: 0,
    stampedStations: new Set(),
    timelineFilter: 'all',
    quizCurrentIndex: 0,
    quizScore: 0,
    passengerName: '探索旅人',
    autoTourInterval: null,
    isAutoTouring: false
  };

  // DOM 元素引用
  const dom = {
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.page-tab-content'),
    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    whistleBtn: document.getElementById('whistle-btn'),
    stationProgress: document.getElementById('station-progress'),
    trainIndicator: document.getElementById('train-indicator'),
    stationStopsContainer: document.getElementById('station-stops-container'),
    stageBg: document.getElementById('stage-bg'),
    hotspotsContainer: document.getElementById('hotspots-container'),
    stageNarrative: document.getElementById('stage-narrative'),
    btnPrevStation: document.getElementById('btn-prev-station'),
    btnNextStation: document.getElementById('btn-next-station'),
    btnAutoTour: document.getElementById('btn-auto-tour'),
    btnStampAction: document.getElementById('btn-stamp-action'),
    stampGrid: document.getElementById('stamp-grid'),
    ticketPassengerInput: document.getElementById('ticket-passenger-input'),
    ticketPassengerDisplay: document.getElementById('ticket-passenger-display'),
    btnPrintTicket: document.getElementById('btn-print-ticket'),
    timelineContainer: document.getElementById('timeline-container'),
    timelineFilters: document.querySelectorAll('.filter-chip'),
    modalBackdrop: document.getElementById('hotspot-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalTag: document.getElementById('modal-tag'),
    modalTitle: document.getElementById('modal-title'),
    modalBodyText: document.getElementById('modal-body-text'),
    quizBox: document.getElementById('quiz-box'),
    guestbookForm: document.getElementById('guestbook-form'),
    messagesList: document.getElementById('messages-list')
  };

  // =========================================================================
  // 1. 初始化與分頁導覽系統
  // =========================================================================
  function initApp() {
    renderHomeStats();
    renderTimeline(state.timelineFilter);
    initRailwayTour();
    initStampBook();
    initQuiz();
    initGuestbook();
    bindEvents();
  }

  function switchTab(tabId) {
    if (state.currentTab === tabId) return;
    state.currentTab = tabId;

    window.soundEngine.playButtonClick();

    dom.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    dom.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabId}`);
    });

    // 若切換至導覽頁，自動播放火車微氛圍
    if (tabId === 'tour') {
      window.soundEngine.playStationChime();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================================================
  // 2. 首頁資料渲染 (Statistics)
  // =========================================================================
  function renderHomeStats() {
    const statsContainer = document.getElementById('home-stats-container');
    if (!statsContainer) return;

    statsContainer.innerHTML = EXHIBITION_DATA.statistics.map(stat => `
      <div class="stat-item">
        <div class="stat-number">${stat.value}</div>
        <div class="stat-label">${stat.label}</div>
        <div class="stat-subtext">${stat.subtext}</div>
      </div>
    `).join('');
  }

  // =========================================================================
  // 3. 事蹟編年史系統 (Timeline & Filters)
  // =========================================================================
  function renderTimeline(filterCategory = 'all') {
    if (!dom.timelineContainer) return;

    const filteredData = filterCategory === 'all'
      ? EXHIBITION_DATA.timeline
      : EXHIBITION_DATA.timeline.filter(item => item.category === filterCategory);

    dom.timelineContainer.innerHTML = filteredData.map(node => `
      <div class="timeline-node" data-category="${node.category}">
        <div class="node-bullet"></div>
        <div class="node-card">
          <div class="node-meta">
            <span class="node-year">${node.year}</span>
            <span class="node-period-tag">${node.period}</span>
          </div>
          <h3 class="node-title">${node.title}</h3>
          <p class="node-summary">${node.summary}</p>
          <ul class="node-details-list">
            ${node.details.map(d => `<li>${d}</li>`).join('')}
          </ul>
          <div class="node-sources">
            ${node.sources.map(src => `<span class="source-pill">📜 ${src}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }

  // =========================================================================
  // 4. 動畫互動導覽：光與奇蹟時光列車 (Railway Tour & Stations)
  // =========================================================================
  function initRailwayTour() {
    renderStationStops();
    updateStationView(0);
  }

  function renderStationStops() {
    if (!dom.stationStopsContainer) return;

    dom.stationStopsContainer.innerHTML = EXHIBITION_DATA.stations.map((st, idx) => `
      <button class="station-stop ${idx === 0 ? 'active' : ''}" data-index="${idx}">
        <div class="station-stop-circle">${st.number}</div>
        <div class="station-stop-name">${st.name}</div>
        <div class="station-stop-year">${st.year}</div>
      </button>
    `).join('');

    dom.stationStopsContainer.querySelectorAll('.station-stop').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        navigateToStation(idx);
      });
    });
  }

  function navigateToStation(index) {
    if (index < 0 || index >= EXHIBITION_DATA.stations.length) return;
    state.currentStationIndex = index;

    window.soundEngine.playStationChime();
    updateStationView(index);
  }

  function updateStationView(index) {
    const station = EXHIBITION_DATA.stations[index];
    const total = EXHIBITION_DATA.stations.length;

    // 1. 更新軌道進度條與列車定位
    const pct = (index / (total - 1)) * 100;
    if (dom.stationProgress) dom.stationProgress.style.width = `${pct}%`;
    if (dom.trainIndicator) dom.trainIndicator.style.left = `${pct}%`;

    // 2. 更新站牌按鈕 active 樣式
    const allStops = dom.stationStopsContainer.querySelectorAll('.station-stop');
    allStops.forEach((stop, i) => {
      stop.classList.toggle('active', i === index);
    });

    // 3. 更新背景畫面與視差過渡
    if (dom.stageBg) {
      dom.stageBg.style.opacity = '0';
      setTimeout(() => {
        dom.stageBg.style.backgroundImage = `url('${station.bgImage}')`;
        dom.stageBg.style.opacity = '1';
      }, 200);
    }

    // 4. 更新熱點 (Hotspots)
    renderHotspots(station.hotspots);

    // 5. 更新敘事卡內容
    if (dom.stageNarrative) {
      dom.stageNarrative.innerHTML = `
        <div class="station-badge-row">
          <span class="station-code-badge">${station.code}</span>
          <span class="station-year-badge">${station.year} 年・${station.location}</span>
        </div>
        <h2 class="stage-station-title">${station.name}</h2>
        <h3 class="stage-station-subtitle">${station.subtitle}</h3>
        <p class="stage-station-desc">${station.description}</p>
      `;
    }

    // 6. 更新導航按鈕狀態
    if (dom.btnPrevStation) dom.btnPrevStation.disabled = index === 0;
    if (dom.btnNextStation) dom.btnNextStation.disabled = index === total - 1;

    // 7. 更新蓋章按鈕狀態
    updateStampButton(station.id);
  }

  function renderHotspots(hotspots) {
    if (!dom.hotspotsContainer) return;

    dom.hotspotsContainer.innerHTML = hotspots.map(hs => `
      <div class="hotspot-pin" style="left: ${hs.x}%; top: ${hs.y}%;" data-id="${hs.id}">
        <div class="hotspot-ring"></div>
        <div class="hotspot-core">✦</div>
        <div class="hotspot-label-preview">${hs.title}</div>
      </div>
    `).join('');

    dom.hotspotsContainer.querySelectorAll('.hotspot-pin').forEach(pin => {
      pin.addEventListener('click', () => {
        const hsId = pin.dataset.id;
        const target = hotspots.find(h => h.id === hsId);
        if (target) openHotspotModal(target);
      });
    });
  }

  function openHotspotModal(hotspot) {
    window.soundEngine.playButtonClick();
    if (!dom.modalBackdrop) return;

    dom.modalTag.textContent = hotspot.tag;
    dom.modalTitle.textContent = hotspot.title;
    dom.modalBodyText.textContent = hotspot.content;
    dom.modalBackdrop.classList.add('open');
  }

  function closeHotspotModal() {
    window.soundEngine.playButtonClick();
    if (dom.modalBackdrop) dom.modalBackdrop.classList.remove('open');
  }

  // =========================================================================
  // 5. 數位紀念車票與探索集章系統 (Stamp & Ticket)
  // =========================================================================
  function initStampBook() {
    if (!dom.stampGrid) return;

    dom.stampGrid.innerHTML = EXHIBITION_DATA.stations.map((st, i) => `
      <div class="stamp-slot" id="stamp-slot-${st.id}">
        <div class="stamp-ink-seal">
          <span>${st.stamp.icon}</span>
          <span>${st.stamp.name.slice(0, 4)}</span>
          <span style="font-size: 0.55rem;">${st.year}</span>
        </div>
        <span class="stamp-slot-number">第 ${st.number} 站</span>
      </div>
    `).join('');
  }

  function updateStampButton(stationId) {
    if (!dom.btnStampAction) return;

    const isStamped = state.stampedStations.has(stationId);
    dom.btnStampAction.classList.toggle('stamped', isStamped);
    dom.btnStampAction.innerHTML = isStamped 
      ? `<span>✓</span> 已蓋印此站紀念章` 
      : `<span>💮</span> 蓋上此站探索戳章`;
  }

  function handleStampCurrentStation() {
    const station = EXHIBITION_DATA.stations[state.currentStationIndex];
    if (state.stampedStations.has(station.id)) {
      window.soundEngine.playButtonClick();
      return;
    }

    state.stampedStations.add(station.id);
    window.soundEngine.playStampSound();

    // 更新集章本 UI
    const slot = document.getElementById(`stamp-slot-${station.id}`);
    if (slot) slot.classList.add('stamped');

    updateStampButton(station.id);

    // 更新集章進度文字
    const statusText = document.getElementById('collector-count-status');
    if (statusText) {
      statusText.textContent = `已收集 ${state.stampedStations.size} / ${EXHIBITION_DATA.stations.length} 枚`;
    }

    // 若全部集滿，播放成功歡呼音樂
    if (state.stampedStations.size === EXHIBITION_DATA.stations.length) {
      setTimeout(() => {
        window.soundEngine.playSuccessFanfare();
        alert('🎉 恭喜您集齊所有歷史站點紀念戳章！您的「孫運璿時代列車專屬乘車證」已正式點亮生效！');
      }, 300);
    }
  }

  // =========================================================================
  // 6. 歷史知識互動測驗系統 (Quiz Engine)
  // =========================================================================
  function initQuiz() {
    renderQuizQuestion(state.quizCurrentIndex);
  }

  function renderQuizQuestion(idx) {
    if (!dom.quizBox) return;

    const q = EXHIBITION_DATA.quiz[idx];
    if (!q) {
      renderQuizFinished();
      return;
    }

    dom.quizBox.innerHTML = `
      <div class="quiz-question-box">
        <div class="quiz-q-num">第 ${idx + 1} 題 / 共 ${EXHIBITION_DATA.quiz.length} 題</div>
        <h4 class="quiz-q-title">${q.question}</h4>
      </div>
      <div class="quiz-options-list">
        ${q.options.map((opt, oIdx) => `
          <button class="quiz-option-btn" data-index="${oIdx}">
            ${String.fromCharCode(65 + oIdx)}. ${opt}
          </button>
        `).join('')}
      </div>
      <div class="quiz-feedback" id="quiz-feedback"></div>
      <button class="btn-primary quiz-next-btn" id="btn-quiz-next" style="display: none;">
        下一題 ➔
      </button>
    `;

    const optionBtns = dom.quizBox.querySelectorAll('.quiz-option-btn');
    const feedbackBox = dom.quizBox.querySelector('#quiz-feedback');
    const nextBtn = dom.quizBox.querySelector('#btn-quiz-next');

    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedIdx = parseInt(btn.dataset.index, 10);
        optionBtns.forEach(b => b.disabled = true);

        if (selectedIdx === q.answer) {
          btn.classList.add('correct');
          state.quizScore++;
          window.soundEngine.playSuccessFanfare();
          feedbackBox.innerHTML = `<strong>✓ 正確！</strong> ${q.explanation}`;
          feedbackBox.style.borderColor = 'var(--tw-green)';
        } else {
          btn.classList.add('wrong');
          optionBtns[q.answer].classList.add('correct');
          window.soundEngine.playButtonClick();
          feedbackBox.innerHTML = `<strong>✕ 答錯了！</strong> 正確答案為【${String.fromCharCode(65 + q.answer)}】。${q.explanation}`;
          feedbackBox.style.borderColor = 'var(--tw-red)';
        }

        feedbackBox.style.display = 'block';
        nextBtn.style.display = 'block';
      });
    });

    nextBtn.addEventListener('click', () => {
      window.soundEngine.playButtonClick();
      state.quizCurrentIndex++;
      renderQuizQuestion(state.quizCurrentIndex);
    });
  }

  function renderQuizFinished() {
    const total = EXHIBITION_DATA.quiz.length;
    const isPerfect = state.quizScore === total;

    dom.quizBox.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem;">
        <div style="font-size: 3.5rem; margin-bottom: 1rem;">${isPerfect ? '🏆' : '🎖️'}</div>
        <h3 style="font-size: 1.8rem; color: #fff; margin-bottom: 0.5rem;">測驗完成！</h3>
        <p style="font-size: 1.1rem; color: var(--gold-light); margin-bottom: 1.5rem;">
          您的得分：<strong>${state.quizScore} / ${total}</strong>
        </p>
        <p style="color: var(--text-sub); max-width: 500px; margin: 0 auto 2rem; line-height: 1.6;">
          ${isPerfect 
            ? '太棒了！您對孫運璿先生的歷史事蹟與台灣經濟科技轉型歷程瞭若指掌，特頒發「台灣現代化探索先鋒」榮譽證書！' 
            : '感謝您的細心參與！歷史如同明鏡，孫運璿先生為國為民的精神長存於我們生活中的電網、道路與科技成果中。'}
        </p>
        <button class="btn-primary" id="btn-quiz-retry">
          重新挑戰測驗 ↺
        </button>
      </div>
    `;

    document.getElementById('btn-quiz-retry').addEventListener('click', () => {
      state.quizCurrentIndex = 0;
      state.quizScore = 0;
      renderQuizQuestion(0);
    });
  }

  // =========================================================================
  // 7. 紀念留言簿系統 (Guestbook & LocalStorage)
  // =========================================================================
  const DEFAULT_MESSAGES = [
    {
      name: "林工程師",
      location: "新竹科學園區",
      date: "2026-10-18",
      content: "身為竹科半導體研發人員，每次讀到孫院長當年小欣欣豆漿店拍板的魄力，都深深感謝前輩為我們奠定的矽盾基石！"
    },
    {
      name: "陳老師",
      location: "台北市",
      date: "2026-10-15",
      content: "『做官是一時的，做事是一世的』這句話每每讓我動容。在重陽國宅那張簡樸書桌前，見證了真正的政壇風骨。"
    },
    {
      name: "青年學子 阿哲",
      location: "台南成功大學",
      date: "2026-10-12",
      content: "五個月內修復全台80%電網的壯舉令人熱血沸騰！這才是工程師報國的最高典範！"
    }
  ];

  function initGuestbook() {
    renderGuestbookMessages();
  }

  function getStoredMessages() {
    try {
      const stored = localStorage.getItem('sun_memorial_messages');
      return stored ? JSON.parse(stored) : DEFAULT_MESSAGES;
    } catch (e) {
      return DEFAULT_MESSAGES;
    }
  }

  function renderGuestbookMessages() {
    if (!dom.messagesList) return;
    const list = getStoredMessages();

    dom.messagesList.innerHTML = list.map(msg => `
      <div class="message-card">
        <div class="msg-header">
          <span class="msg-author">${msg.name} (${msg.location || '台灣'})</span>
          <span>${msg.date}</span>
        </div>
        <div class="msg-content">${msg.content}</div>
      </div>
    `).join('');
  }

  function handleGuestbookSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('msg-name');
    const locInput = document.getElementById('msg-location');
    const contentInput = document.getElementById('msg-content');

    const name = nameInput.value.trim() || '熱心訪客';
    const location = locInput.value.trim() || '台灣';
    const content = contentInput.value.trim();

    if (!content) return;

    const newMsg = {
      name,
      location,
      date: new Date().toISOString().split('T')[0],
      content
    };

    const currentList = getStoredMessages();
    currentList.unshift(newMsg);

    try {
      localStorage.setItem('sun_memorial_messages', JSON.stringify(currentList));
    } catch (e) {
      console.warn('LocalStorage unavailable', e);
    }

    window.soundEngine.playSuccessFanfare();
    renderGuestbookMessages();

    nameInput.value = '';
    locInput.value = '';
    contentInput.value = '';
  }

  // =========================================================================
  // 8. 綁定事件監聽 (Event Listeners)
  // =========================================================================
  function bindEvents() {
    // 分頁切換
    dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // 快捷跳轉按鈕 (首頁 CTA)
    document.querySelectorAll('[data-goto-tab]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(el.dataset.gotoTab);
      });
    });

    // 音效開關
    if (dom.soundToggleBtn) {
      dom.soundToggleBtn.addEventListener('click', () => {
        const isMuted = window.soundEngine.toggleMute();
        dom.soundToggleBtn.classList.toggle('muted', isMuted);
        dom.soundToggleBtn.innerHTML = isMuted ? '🔇' : '🔊';
        dom.soundToggleBtn.title = isMuted ? '開啟導覽音效' : '關閉導覽音效';
      });
    }

    // 鳴笛按鈕
    if (dom.whistleBtn) {
      dom.whistleBtn.addEventListener('click', () => {
        window.soundEngine.playWhistle();
      });
    }

    // 導覽控制按鈕 (上一站 / 下一站)
    if (dom.btnPrevStation) {
      dom.btnPrevStation.addEventListener('click', () => {
        navigateToStation(state.currentStationIndex - 1);
      });
    }
    if (dom.btnNextStation) {
      dom.btnNextStation.addEventListener('click', () => {
        navigateToStation(state.currentStationIndex + 1);
      });
    }

    // 導覽自動巡航功能
    if (dom.btnAutoTour) {
      dom.btnAutoTour.addEventListener('click', () => {
        state.isAutoTouring = !state.isAutoTouring;
        window.soundEngine.playButtonClick();

        if (state.isAutoTouring) {
          dom.btnAutoTour.innerHTML = '⏸ 暫停自動巡航';
          window.soundEngine.toggleTrainAmbience(true);
          state.autoTourInterval = setInterval(() => {
            const nextIdx = (state.currentStationIndex + 1) % EXHIBITION_DATA.stations.length;
            navigateToStation(nextIdx);
          }, 6000);
        } else {
          dom.btnAutoTour.innerHTML = '▶ 開始自動巡航';
          window.soundEngine.toggleTrainAmbience(false);
          clearInterval(state.autoTourInterval);
        }
      });
    }

    // 蓋章按鈕
    if (dom.btnStampAction) {
      dom.btnStampAction.addEventListener('click', handleStampCurrentStation);
    }

    // 紀念車票姓名同步輸入
    if (dom.ticketPassengerInput) {
      dom.ticketPassengerInput.addEventListener('input', (e) => {
        const val = e.target.value.trim() || '探索旅人';
        state.passengerName = val;
        if (dom.ticketPassengerDisplay) {
          dom.ticketPassengerDisplay.textContent = val;
        }
      });
    }

    // 列印車票
    if (dom.btnPrintTicket) {
      dom.btnPrintTicket.addEventListener('click', () => {
        window.soundEngine.playButtonClick();
        window.print();
      });
    }

    // 事蹟編年史過濾按鈕
    dom.timelineFilters.forEach(chip => {
      chip.addEventListener('click', () => {
        window.soundEngine.playButtonClick();
        dom.timelineFilters.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.timelineFilter = chip.dataset.category;
        renderTimeline(state.timelineFilter);
      });
    });

    // 文物熱點彈窗關閉
    if (dom.modalCloseBtn) {
      dom.modalCloseBtn.addEventListener('click', closeHotspotModal);
    }
    if (dom.modalBackdrop) {
      dom.modalBackdrop.addEventListener('click', (e) => {
        if (e.target === dom.modalBackdrop) closeHotspotModal();
      });
    }

    // 留言板提交
    if (dom.guestbookForm) {
      dom.guestbookForm.addEventListener('submit', handleGuestbookSubmit);
    }
  }

  // 啟動應用程式
  initApp();
});

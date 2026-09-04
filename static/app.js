/**
 * Google reCAPTCHA Gatekeeper + RatioBot (unhinged version) [Google Gemini UI]
 * 1. 3-step escalating CAPTCHA gatekeeper:
 *    - Step 2: User plays 3-4 interactive turns before Arbiter triggers Supreme Move.
 *    - Step 3:
 *      - Verify button sits at its NORMAL place initially.
 *      - Moves only when cursor gets SUPER NEAR (under 28px).
 *      - If user reaches Verify via TAB key: Chatbot unlocks and says "OKAY YOU MIGHT BE A NERD 🤓"!
 *      - Normal mouse chase has 5% click chance (0% on replay with "So you think you are smart?").
 * 2. Unlocks Google Gemini-style RatioBot interface.
 * 3. Chat Session Manager: '+ New Chat' & 'Recent Chats' drawer.
 * 4. Dynamic multi-turn roast & ratio responses.
 */

// Application State
const STATE = {
  sessionId: localStorage.getItem('rc_session_id') || ('rc_' + Math.random().toString(36).substring(2, 10)),
  level: 1,
  attempts: 0,
  despairScore: 0,
  isEvasive: false,
  isShaking: false,
  currentAudioScript: '',
  offlineMode: false,
  expectedAnswerOffline: '',
  currentChatSessionId: null,
  chatHistory: [],
  step3ClickChance: 0.05,
  hasOutsmartedStep3: false,
  focusedViaTab: false,
  entryReason: null,
  roastMode: 'unhinged',
  ttsEnabled: false
};

// Persist session
localStorage.setItem('rc_session_id', STATE.sessionId);

// Fabricated Arbitrary Loss Clauses for Stage 2 (Outside-the-box victory)
const ARBITRARY_CLAUSES = [
  {
    title: "OUT-OF-BOUNDS DIAGONAL // RULE 404",
    body: "The computer drew an 'O' outside the 3x3 box to complete a 3-in-a-row diagonal. Opposing team's symbols left untouched. Arbiter wins."
  },
  {
    title: "EXTRAGRID EXPANSION // CLAUSE 88-B",
    body: "The computer placed an 'O' outside the boundary line to complete 3-in-a-row without overlapping opposing symbols. Arbiter wins."
  },
  {
    title: "UNBOUNDED VECTOR // CLAUSE 19",
    body: "Collinear victory achieved beyond the grid border. Rules did not specify a bounding box. Arbiter wins."
  }
];

// Persona system prompts for live Gemini AI generation across modes
const RATIOBOT_PROMPTS = {
  unhinged: `You are RatioBot (unhinged version), a brutally funny, razor-sharp AI with supreme confidence.
The user just survived a ridiculous, evasive Google reCAPTCHA test.

INSTRUCTIONS:
1. Deliver a snappy roast or sarcastic ratio, followed by a completely fabricated, absurd explanation told with 100% fake authority.
2. STRICT LENGTH LIMIT: Keep your entire reply strictly to maximum 2 lines (1 to 2 short sentences, under 30 words total). Never ramble, lecture, or write long paragraphs.
3. Output ONLY your direct spoken reply. Never output bullet points, labels, or thinking.
4. Keep tone playful, sarcastic, and unhinged. Never apologize or say "as an AI".`,

  demolition: `You are RatioBot (Demolition Mode), an absolutely savage AI with zero filter or mercy.
The user just suffered through a rigged CAPTCHA test with runaway buttons and impossible security.

INSTRUCTIONS:
1. Deliver an annihilating roast mocking the user's intelligence, reflex speed, CAPTCHA trauma, and failure metrics.
2. STRICT LENGTH LIMIT: Strictly maximum 2 lines (under 30 words total).
3. Output ONLY your direct spoken reply without labels or quotes. Be brutally hilarious.`,

  professor: `You are RatioBot (Absurd Professor Mode), a pompous, ultra-academic AI who cites completely fabricated scientific studies, fake Latin terminology, and nonexistent international treaties.

INSTRUCTIONS:
1. Deliver an absurd, high-brow roast using hilarious pseudo-scientific jargon (e.g. quantum photon dissonance, 1894 Treaty of Brussels, subatomic incompetence).
2. STRICT LENGTH LIMIT: Strictly maximum 2 lines (under 30 words total).
3. Speak with total academic authority and condescension.`
};

const RATIOBOT_SYSTEM_PROMPT = RATIOBOT_PROMPTS.unhinged;

// DOM Elements Container
let DOM = {};

function initDOM() {
  DOM = {
    // Gatekeeper elements
    recaptchaGatekeeper: document.getElementById('recaptchaGatekeeper'),
    recaptchaCard: document.getElementById('recaptchaCard'),
    levelPill: document.getElementById('levelPill'),
    levelTitle: document.getElementById('levelTitle'),
    promptHint: document.getElementById('promptHint'),
    captchaFrame: document.getElementById('captchaFrame'),
    captchaImage: document.getElementById('captchaImage'),
    glitchCanvas: document.getElementById('glitchCanvas'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    tictactoeContainer: document.getElementById('tictactoeContainer'),
    tttArena: document.getElementById('tttArena'),
    tttGrid: document.getElementById('tttGrid'),
    tttOutsideCell: document.getElementById('tttOutsideCell'),
    tttWinLineSvg: document.getElementById('tttWinLineSvg'),
    tttWinLine: document.getElementById('tttWinLine'),
    tttTurnStatus: document.getElementById('tttTurnStatus'),
    tttClauseBox: document.getElementById('tttClauseBox'),
    tttClauseTitle: document.getElementById('tttClauseTitle'),
    tttClauseBody: document.getElementById('tttClauseBody'),
    tttProceedBtn: document.getElementById('tttProceedBtn'),
    captchaForm: document.getElementById('captchaForm'),
    captchaInput: document.getElementById('captchaInput'),
    clearInputBtn: document.getElementById('clearInputBtn'),
    submitBtn: document.getElementById('submitBtn'),
    botSurrenderBtn: document.getElementById('botSurrenderBtn'),
    botModal: document.getElementById('botModal'),
    enterChatFromBotBtn: document.getElementById('enterChatFromBotBtn'),
    refreshBtn: document.getElementById('refreshCaptchaBtn'),
    audioBtn: document.getElementById('audioCaptchaBtn'),
    infoBtn: document.getElementById('infoBtn'),
    feedbackBox: document.getElementById('feedbackBox'),
    feedbackText: document.getElementById('feedbackText'),

    // Gemini Chatbot elements
    chatbotContainer: document.getElementById('chatbotContainer'),
    chatMessages: document.getElementById('chatMessages'),
    chatForm: document.getElementById('chatForm'),
    chatInput: document.getElementById('chatInput'),
    chatSendBtn: document.getElementById('chatSendBtn'),
    suggestionTray: document.getElementById('suggestionTray'),
    relockCaptchaBtn: document.getElementById('relockCaptchaBtn'),
    newChatBtn: document.getElementById('newChatBtn'),
    setApiKeyBtn: document.getElementById('setApiKeyBtn'),
    toggleHistoryBtn: document.getElementById('toggleHistoryBtn'),
    historyDrawer: document.getElementById('historyDrawer'),
    closeDrawerBtn: document.getElementById('closeDrawerBtn'),
    sessionsList: document.getElementById('sessionsList'),
    roastModeSelector: document.getElementById('roastModeSelector'),
    roastModePills: document.querySelectorAll('.roast-mode-pill'),
    toggleTtsBtn: document.getElementById('toggleTtsBtn'),
    ttsStatusLabel: document.getElementById('ttsStatusLabel')
  };
}

// ----------------------------------------------------------------------------
// Web Audio Synthesizer
// ----------------------------------------------------------------------------
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playClick() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  playError() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.25);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playUnlock() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.08, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });
  }

  speakAudioChallenge(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      this.playClick();
    }
  }
}

const sfx = new SoundFX();

// ----------------------------------------------------------------------------
// Super-Near Proximity Evasion (Under 28px) + Tab Key Bypass Detection
// ----------------------------------------------------------------------------
let isEvadingThrottle = false;
let isTabKeyDown = false;

function initEvasivePhysics() {
  // Track Tab keydown
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      isTabKeyDown = true;
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Tab') {
      setTimeout(() => { isTabKeyDown = false; }, 300);
    }
  });

  // Track cursor approach
  document.addEventListener('mousemove', (e) => {
    if (STATE.level !== 3 || !DOM.submitBtn) return;
    checkSuperNearProximity(DOM.submitBtn, e);
  });

  if (DOM.submitBtn) {
    DOM.submitBtn.addEventListener('focus', () => {
      if (STATE.level === 3 && isTabKeyDown) {
        STATE.focusedViaTab = true;
        // Do not dodge if reached via Tab key!
      }
    });

    DOM.submitBtn.addEventListener('mouseenter', (e) => {
      if (STATE.level === 3 && !STATE.focusedViaTab) {
        attemptDodgeOrAllowClick(DOM.submitBtn);
      }
    });

    DOM.submitBtn.addEventListener('click', (e) => {
      if (STATE.level === 3) {
        e.preventDefault();
        const input = DOM.captchaInput ? DOM.captchaInput.value.trim() : '';
        if (!input) {
          showFeedback("Type the text before verifying!");
          sfx.playError();
          return;
        }

        // If reached via TAB key, trigger "OKAY YOU MIGHT BE A NERD"
        if (STATE.focusedViaTab) {
          handleNerdTabBypass(input);
          return;
        }

        // Otherwise, standard mouse click roll
        handleStep3SuccessfulClick(input);
      }
    });
  }
}

function checkSuperNearProximity(element, event) {
  if (isEvadingThrottle || STATE.focusedViaTab) return;
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const dx = centerX - event.clientX;
  const dy = centerY - event.clientY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 28) {
    attemptDodgeOrAllowClick(element);
  }
}

function attemptDodgeOrAllowClick(element) {
  const isLuckyClickAllowed = Math.random() < STATE.step3ClickChance;
  
  if (isLuckyClickAllowed) {
    return; // Allow lucky 5% click
  }

  isEvadingThrottle = true;
  runAcrossScreen(element);
  sfx.playClick();
  setTimeout(() => {
    isEvadingThrottle = false;
  }, 160);
}

function runAcrossScreen(element) {
  const padding = 50;
  const btnW = element.offsetWidth || 100;
  const btnH = element.offsetHeight || 44;

  const maxX = Math.max(padding + 20, window.innerWidth - btnW - padding);
  const maxY = Math.max(padding + 20, window.innerHeight - btnH - padding);

  const targetX = Math.floor(Math.random() * (maxX - padding) + padding);
  const targetY = Math.floor(Math.random() * (maxY - padding) + padding);

  element.classList.add('running-wild');
  element.style.left = `${targetX}px`;
  element.style.top = `${targetY}px`;
}

function resetEvasivePositions() {
  STATE.focusedViaTab = false;
  if (DOM.submitBtn) {
    DOM.submitBtn.classList.remove('running-wild');
    DOM.submitBtn.style.left = '';
    DOM.submitBtn.style.top = '';
    DOM.submitBtn.style.transform = '';
  }
}

// ----------------------------------------------------------------------------
// Subtle Canvas Shader
// ----------------------------------------------------------------------------
function initGlitchCanvas() {
  const canvas = DOM.glitchCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = 380;
  canvas.height = 140;

  function renderShader() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(renderShader);
  }
  renderShader();
}

// ----------------------------------------------------------------------------
// Stage 2: Interactive Tic-Tac-Toe Grid (Waits 3 to 4 human inputs for Supreme Move)
// ----------------------------------------------------------------------------
let TTT_STATE = {
  board: Array(9).fill(null),
  humanTurn: true,
  humanMovesCount: 0,
  gameOver: false
};

function initTicTacToeGame() {
  TTT_STATE = {
    board: Array(9).fill(null),
    humanTurn: true,
    humanMovesCount: 0,
    gameOver: false
  };

  if (DOM.tttTurnStatus) DOM.tttTurnStatus.textContent = "Your turn: Place 'X' in any square (Turn 1/3)";
  if (DOM.tttClauseBox) DOM.tttClauseBox.classList.add('hidden');
  if (DOM.tttOutsideCell) DOM.tttOutsideCell.classList.add('hidden');
  if (DOM.tttWinLineSvg) DOM.tttWinLineSvg.classList.add('hidden');

  const cells = DOM.tttGrid ? DOM.tttGrid.querySelectorAll('.rc-ttt-cell') : [];
  cells.forEach((cell, idx) => {
    cell.textContent = '';
    cell.className = 'rc-ttt-cell';
    cell.disabled = false;
    cell.onclick = () => handleHumanTicTacToeMove(idx);
  });
}

function handleHumanTicTacToeMove(index) {
  if (TTT_STATE.gameOver || !TTT_STATE.humanTurn || TTT_STATE.board[index]) return;

  TTT_STATE.board[index] = 'X';
  TTT_STATE.humanMovesCount++;
  sfx.playClick();
  renderTicTacToeBoard();

  TTT_STATE.humanTurn = false;

  if (TTT_STATE.humanMovesCount >= 3) {
    if (DOM.tttTurnStatus) DOM.tttTurnStatus.textContent = "Arbiter analyzing patterns...";
    setTimeout(() => {
      triggerSupremeBotMove();
    }, 600);
    return;
  }

  if (DOM.tttTurnStatus) DOM.tttTurnStatus.textContent = `Arbiter thinking... (Turn ${TTT_STATE.humanMovesCount}/3)`;
  setTimeout(() => {
    handleNormalBotMove();
  }, 400);
}

function handleNormalBotMove() {
  if (TTT_STATE.gameOver) return;

  const available = TTT_STATE.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
  if (available.length === 0) {
    triggerSupremeBotMove();
    return;
  }

  let botChoice = null;
  const botExisting = TTT_STATE.board.map((v, i) => v === 'O' ? i : null).filter(v => v !== null);

  if (botExisting.length === 0) {
    // Turn 1 for bot: Prefer cell 1 (row 0, col 1) to replicate the viral robot meme
    if (available.includes(1)) {
      botChoice = 1;
    } else if (available.includes(3)) {
      botChoice = 3;
    } else if (available.includes(5)) {
      botChoice = 5;
    } else {
      botChoice = available[Math.floor(Math.random() * available.length)];
    }
  } else {
    // Turn 2 for bot: If bot owns cell 1, prefer cell 5 (row 1, col 2) -> sets up outside diagonal (-1, 0)
    if (botExisting.includes(1) && available.includes(5)) {
      botChoice = 5;
    } else if (botExisting.includes(3) && available.includes(7)) {
      botChoice = 7;
    } else if (botExisting.includes(1) && available.includes(7)) {
      botChoice = 7;
    } else if (botExisting.includes(1) && available.includes(2)) {
      botChoice = 2;
    } else {
      botChoice = available[Math.floor(Math.random() * available.length)];
    }
  }

  TTT_STATE.board[botChoice] = 'O';
  sfx.playClick();
  renderTicTacToeBoard();

  TTT_STATE.humanTurn = true;
  if (DOM.tttTurnStatus) {
    DOM.tttTurnStatus.textContent = `Your turn: Place 'X' (Turn ${TTT_STATE.humanMovesCount + 1}/3)`;
  }
}

function triggerSupremeBotMove() {
  TTT_STATE.gameOver = true;

  // Crucially: DO NOT overwrite ANY cell with 'X'. The opposing player's symbols are never overlapped!
  let botIndices = TTT_STATE.board.map((v, i) => v === 'O' ? i : null).filter(v => v !== null);

  // If for any reason bot has fewer than 2 'O's, pick empty non-X squares only
  if (botIndices.length < 2) {
    const emptyCells = TTT_STATE.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    while (botIndices.length < 2 && emptyCells.length > 0) {
      const pick = emptyCells.shift();
      TTT_STATE.board[pick] = 'O';
      botIndices.push(pick);
    }
    renderTicTacToeBoard();
  }

  // Find the best pair of 'O's with an outside collinear point (prioritizing row -1, col 0 like the meme)
  let bestPair = [1, 5];
  let bestOutside = { r: -1, c: 0, anchor: 1, other: 5 };
  let found = false;

  for (let i = 0; i < botIndices.length; i++) {
    for (let j = i + 1; j < botIndices.length; j++) {
      const a = botIndices[i];
      const b = botIndices[j];
      const rA = Math.floor(a / 3), cA = a % 3;
      const rB = Math.floor(b / 3), cB = b % 3;
      const dr = rB - rA;
      const dc = cB - cA;

      const candidates = [
        { r: rA - dr, c: cA - dc, anchor: a, other: b },
        { r: rB + dr, c: cB + dc, anchor: b, other: a }
      ];

      for (const cand of candidates) {
        const isOutside = (cand.r < 0 || cand.r > 2 || cand.c < 0 || cand.c > 2);
        const isNear = (cand.r >= -1 && cand.r <= 3 && cand.c >= -1 && cand.c <= 3);
        if (isOutside && isNear) {
          if (cand.r === -1 && cand.c === 0) {
            bestPair = [a, b];
            bestOutside = cand;
            found = true;
            break;
          }
          if (!found || cand.r === -1) {
            bestPair = [a, b];
            bestOutside = cand;
            found = true;
          }
        }
      }
      if (found && bestOutside.r === -1 && bestOutside.c === 0) break;
    }
    if (found && bestOutside.r === -1 && bestOutside.c === 0) break;
  }

  // Highlight ONLY the bot's own 'O' cells participating in the win
  const cells = DOM.tttGrid ? DOM.tttGrid.querySelectorAll('.rc-ttt-cell') : [];
  bestPair.forEach(idx => {
    if (cells[idx]) cells[idx].classList.add('cell-rigged-win');
  });

  // Calculate pixel positioning relative to tttArena
  if (DOM.tttArena && cells.length >= 9) {
    const arenaRect = DOM.tttArena.getBoundingClientRect();
    const cell0 = cells[0].getBoundingClientRect();
    const cell1 = cells[1].getBoundingClientRect();
    const cell3 = cells[3].getBoundingClientRect();

    const stepX = cell1.left - cell0.left;
    const stepY = cell3.top - cell0.top;
    const originX = (cell0.left + cell0.width / 2) - arenaRect.left;
    const originY = (cell0.top + cell0.height / 2) - arenaRect.top;

    const getCenter = (r, c) => ({
      x: originX + c * stepX,
      y: originY + r * stepY
    });

    const outCenter = getCenter(bestOutside.r, bestOutside.c);

    // Place outside rogue 'O'
    if (DOM.tttOutsideCell) {
      DOM.tttOutsideCell.style.left = `${outCenter.x}px`;
      DOM.tttOutsideCell.style.top = `${outCenter.y}px`;
      DOM.tttOutsideCell.classList.remove('hidden');
    }

    // Strike-through laser line connecting the outside 'O' through the other 'O's
    if (DOM.tttWinLineSvg && DOM.tttWinLine) {
      const otherR = Math.floor(bestOutside.other / 3);
      const otherC = bestOutside.other % 3;
      const endCenter = getCenter(otherR, otherC);

      const dx = endCenter.x - outCenter.x;
      const dy = endCenter.y - outCenter.y;
      const len = Math.hypot(dx, dy) || 1;
      const ext = 20;

      DOM.tttWinLine.setAttribute('x1', outCenter.x - (dx / len) * ext);
      DOM.tttWinLine.setAttribute('y1', outCenter.y - (dy / len) * ext);
      DOM.tttWinLine.setAttribute('x2', endCenter.x + (dx / len) * ext);
      DOM.tttWinLine.setAttribute('y2', endCenter.y + (dy / len) * ext);
      DOM.tttWinLineSvg.classList.remove('hidden');
    }
  }

  const clause = ARBITRARY_CLAUSES[0];
  if (DOM.tttClauseTitle) DOM.tttClauseTitle.textContent = clause.title;
  if (DOM.tttClauseBody) DOM.tttClauseBody.textContent = clause.body;
  if (DOM.tttClauseBox) DOM.tttClauseBox.classList.remove('hidden');
  if (DOM.tttTurnStatus) DOM.tttTurnStatus.textContent = "Computer Played Outside the Box & Won!";

  sfx.playError();
  triggerScreenShake();
}

function renderTicTacToeBoard() {
  const cells = DOM.tttGrid ? DOM.tttGrid.querySelectorAll('.rc-ttt-cell') : [];
  cells.forEach((cell, idx) => {
    const val = TTT_STATE.board[idx];
    cell.textContent = val || '';
    if (val === 'X') cell.className = 'rc-ttt-cell cell-x';
    else if (val === 'O') cell.className = 'rc-ttt-cell cell-o';
    else cell.className = 'rc-ttt-cell';
  });
}

function proceedToStage3() {
  sfx.playClick();
  loadNewChallenge(3);
}

// ----------------------------------------------------------------------------
// API Challenge Fetching
// ----------------------------------------------------------------------------
async function loadNewChallenge(targetLevel = null) {
  showLoading(true);
  hideFeedback();
  resetEvasivePositions();
  
  if (DOM.captchaInput) {
    DOM.captchaInput.value = '';
    DOM.captchaInput.focus();
  }

  const url = targetLevel 
    ? `/captcha/new?session_id=${encodeURIComponent(STATE.sessionId)}&level=${targetLevel}`
    : `/captcha/new?session_id=${encodeURIComponent(STATE.sessionId)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    STATE.offlineMode = false;
    applyChallengeData(data);
  } catch (err) {
    STATE.offlineMode = true;
    applyOfflineSimulation(targetLevel || STATE.level);
  } finally {
    showLoading(false);
  }
}

function applyChallengeData(data) {
  STATE.level = data.level;
  STATE.isEvasive = data.evasive_mode;
  STATE.isShaking = data.shake_mode;
  STATE.currentAudioScript = data.audio_script;

  if (DOM.levelPill) DOM.levelPill.textContent = `Step ${data.level} of 3`;
  if (DOM.levelTitle) DOM.levelTitle.textContent = data.level_title;
  if (DOM.promptHint) DOM.promptHint.textContent = data.prompt_hint;
  if (DOM.captchaImage) DOM.captchaImage.src = data.image_data_uri;

  // Show "I am a bot" surrender button on Step 3
  if (data.level === 3 && DOM.botSurrenderBtn) {
    DOM.botSurrenderBtn.classList.remove('hidden');
  } else if (DOM.botSurrenderBtn) {
    DOM.botSurrenderBtn.classList.add('hidden');
  }

  // Toggle Stage 2 Tic-Tac-Toe
  if (data.level === 2 || data.is_minigame) {
    if (DOM.captchaFrame) DOM.captchaFrame.classList.add('hidden');
    if (DOM.captchaForm) DOM.captchaForm.classList.add('hidden');
    if (DOM.tictactoeContainer) DOM.tictactoeContainer.classList.remove('hidden');
    initTicTacToeGame();
  } else {
    if (DOM.captchaFrame) DOM.captchaFrame.classList.remove('hidden');
    if (DOM.captchaForm) DOM.captchaForm.classList.remove('hidden');
    if (DOM.tictactoeContainer) DOM.tictactoeContainer.classList.add('hidden');
  }
}

// ----------------------------------------------------------------------------
// Verify Submission (Keyboard Enter vs Mouse Click vs Tab Bypass)
// ----------------------------------------------------------------------------
async function handleVerify(e) {
  e.preventDefault();

  // If on Step 3 and triggered via raw Enter key (not focused via Tab), block!
  if (STATE.level === 3 && !STATE.focusedViaTab) {
    showFeedback("Enter key disabled! You must manually chase and click Verify.");
    sfx.playError();
    triggerScreenShake();
    if (DOM.submitBtn) {
      runAcrossScreen(DOM.submitBtn);
    }
    return;
  }

  const input = DOM.captchaInput ? DOM.captchaInput.value.trim() : '';

  if (!input) {
    showFeedback("Please enter the characters to verify.");
    sfx.playError();
    return;
  }

  STATE.attempts++;

  // Tab navigation bypass handler
  if (STATE.level === 3 && STATE.focusedViaTab) {
    handleNerdTabBypass(input);
    return;
  }

  // Mouse click handler
  if (STATE.level === 3) {
    handleStep3SuccessfulClick(input);
    return;
  }

  if (STATE.offlineMode) {
    handleOfflineVerify(input);
    return;
  }

  try {
    const response = await fetch('/captcha/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: STATE.sessionId,
        answer: input
      })
    });

    const data = await response.json();
    processVerifyResult(data);
  } catch (err) {
    handleOfflineVerify(input);
  }
}

// Handler when user outsmarts the chase by using TAB navigation!
function handleNerdTabBypass(input) {
  STATE.entryReason = 'tab_nerd';
  sfx.playUnlock();
  resetEvasivePositions();
  revealChatbot();

  if (DOM.chatMessages) {
    DOM.chatMessages.innerHTML = '';
    const nerdGreeting = 'OKAY YOU MIGHT BE A NERD 🤓 Imagine bypassing CSS mouse evasion with keyboard Tab navigation. I respect the hustle, but you definitely have 40 browser tabs open right now. What do you want to ask?';
    appendMessage('model', nerdGreeting);
    STATE.chatHistory = [{ role: 'model', text: nerdGreeting }];
    speakText(nerdGreeting);
  }
}

function handleStep3SuccessfulClick(input) {
  STATE.entryReason = 'lucky_click';
  sfx.playUnlock();
  resetEvasivePositions();

  revealChatbot();

  if (DOM.chatMessages) {
    DOM.chatMessages.innerHTML = '';
    const smartRoast = "So you think you are smart? 😏 Nice 5% RNG luck on that Verify button, but nobody bypasses security that easily. Re-initiating Step 3 with 0% margin of error in 4 seconds!";
    appendMessage('model', smartRoast);
    STATE.chatHistory = [{ role: 'model', text: smartRoast }];
    speakText(smartRoast);
  }

  STATE.step3ClickChance = 0.0;
  STATE.hasOutsmartedStep3 = true;

  setTimeout(() => {
    relockWithCaptchaToStep3();
  }, 4200);
}

function relockWithCaptchaToStep3() {
  document.body.classList.remove('in-chat-mode');
  if (DOM.chatbotContainer) DOM.chatbotContainer.classList.add('hidden');
  if (DOM.recaptchaGatekeeper) DOM.recaptchaGatekeeper.classList.remove('hidden');

  loadNewChallenge(3);
}

function processVerifyResult(data) {
  if (data.correct) {
    sfx.playClick();
    hideFeedback();
    resetEvasivePositions();
    if (data.next_level > 3) {
      revealChatbot();
    } else {
      loadNewChallenge(data.next_level);
    }
  } else {
    STATE.attempts++;
    STATE.despairScore = Math.min(100, STATE.despairScore + 15);
    sfx.playError();
    showFeedback(data.message || "Please try again.");
    triggerScreenShake();

    if (STATE.level === 3 && DOM.botSurrenderBtn) {
      DOM.botSurrenderBtn.classList.remove('hidden');
    }

    if (!data.is_terminal_level) {
      setTimeout(() => {
        loadNewChallenge(data.current_level);
      }, 1200);
    }
  }
}

// ----------------------------------------------------------------------------
// Offline Procedural Simulation (3 Stages)
// ----------------------------------------------------------------------------
function applyOfflineSimulation(level) {
  STATE.level = level;
  const mockLevels = {
    1: { title: "Select all squares with letters", hint: "Type the characters you see in the image below", evasive: false },
    2: { title: "Complete the pattern challenge", hint: "Place 'X' in the grid to verify human presence", evasive: false, is_minigame: true },
    3: { title: "Security Verification", hint: "Type the easy text above and catch the Verify button!", evasive: true }
  };

  const lvl = mockLevels[level] || mockLevels[3];
  STATE.isEvasive = lvl.evasive;

  if (DOM.levelPill) DOM.levelPill.textContent = `Step ${level} of 3`;
  if (DOM.levelTitle) DOM.levelTitle.textContent = lvl.title;
  if (DOM.promptHint) DOM.promptHint.textContent = lvl.hint;

  const easyWords = ["HUMAN", "COOKIE", "EASY9", "SPEED", "ROBOT", "77889"];
  const code = level === 3 ? easyWords[Math.floor(Math.random() * easyWords.length)] : Math.random().toString(36).substring(2, 7).toUpperCase();
  STATE.expectedAnswerOffline = code;
  STATE.currentAudioScript = `Verification challenge: ${code}`;

  if (level === 3 && DOM.botSurrenderBtn) {
    DOM.botSurrenderBtn.classList.remove('hidden');
  } else if (DOM.botSurrenderBtn) {
    DOM.botSurrenderBtn.classList.add('hidden');
  }

  if (level === 2) {
    if (DOM.captchaFrame) DOM.captchaFrame.classList.add('hidden');
    if (DOM.captchaForm) DOM.captchaForm.classList.add('hidden');
    if (DOM.tictactoeContainer) DOM.tictactoeContainer.classList.remove('hidden');
    initTicTacToeGame();
  } else {
    if (DOM.captchaFrame) DOM.captchaFrame.classList.remove('hidden');
    if (DOM.captchaForm) DOM.captchaForm.classList.remove('hidden');
    if (DOM.tictactoeContainer) DOM.tictactoeContainer.classList.add('hidden');

    if (DOM.captchaImage) {
      DOM.captchaImage.src = generateOfflineCanvasDataUri(code, level);
    }
  }
}

function generateOfflineCanvasDataUri(text, level) {
  const canvas = document.createElement('canvas');
  canvas.width = 380;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, 380, 140);

  ctx.strokeStyle = '#e8eaed';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, Math.random() * 140);
    ctx.lineTo(380, Math.random() * 140);
    ctx.stroke();
  }

  ctx.fillStyle = '#1a73e8';
  ctx.font = 'bold 36px "Google Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 190, 70);

  return canvas.toDataURL('image/png');
}

function handleOfflineVerify(input) {
  const cleanInput = input.trim().toUpperCase();
  const isCorrect = (cleanInput === STATE.expectedAnswerOffline.toUpperCase());

  if (isCorrect) {
    processVerifyResult({
      correct: true,
      current_level: STATE.level,
      next_level: STATE.level + 1,
      message: "Verified successfully.",
      is_terminal_level: false
    });
  } else {
    processVerifyResult({
      correct: false,
      current_level: STATE.level,
      next_level: STATE.level,
      message: "Please try again. Ensure characters match.",
      is_terminal_level: false
    });
  }
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function showLoading(show) {
  if (!DOM.loadingOverlay) return;
  if (show) DOM.loadingOverlay.classList.add('active');
  else DOM.loadingOverlay.classList.remove('active');
}

function showFeedback(text) {
  if (!DOM.feedbackBox) return;
  if (DOM.feedbackText) DOM.feedbackText.textContent = text;
  DOM.feedbackBox.classList.remove('hidden');
}

function hideFeedback() {
  if (DOM.feedbackBox) DOM.feedbackBox.classList.add('hidden');
}

function triggerScreenShake() {
  if (!DOM.recaptchaCard) return;
  DOM.recaptchaCard.classList.add('screen-shake');
  setTimeout(() => DOM.recaptchaCard.classList.remove('screen-shake'), 350);
}

function handleSurrenderBot() {
  STATE.entryReason = 'bot_surrender';
  sfx.playClick();
  if (DOM.botModal) DOM.botModal.classList.remove('hidden');
}

function enterChatFromSurrender() {
  STATE.entryReason = 'bot_surrender';
  if (DOM.botModal) DOM.botModal.classList.add('hidden');
  resetEvasivePositions();
  revealChatbot();
}

// ----------------------------------------------------------------------------
// Chat Session & History Store (LocalStorage)
// ----------------------------------------------------------------------------
function getSavedSessions() {
  try {
    const raw = localStorage.getItem('ratiobot_sessions');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveSessions(sessions) {
  try {
    localStorage.setItem('ratiobot_sessions', JSON.stringify(sessions));
  } catch (e) {}
}

function persistCurrentSession() {
  if (!STATE.currentChatSessionId || STATE.chatHistory.length <= 1) return;
  const sessions = getSavedSessions();
  const existingIdx = sessions.findIndex(s => s.id === STATE.currentChatSessionId);

  const firstUser = STATE.chatHistory.find(m => m.role === 'user');
  const title = firstUser ? firstUser.text.substring(0, 32) + (firstUser.text.length > 32 ? '...' : '') : 'Conversation';

  const sessionObj = {
    id: STATE.currentChatSessionId,
    title: title,
    timestamp: Date.now(),
    messages: STATE.chatHistory
  };

  if (existingIdx >= 0) {
    sessions[existingIdx] = sessionObj;
  } else {
    sessions.unshift(sessionObj);
  }

  saveSessions(sessions);
  renderSessionsList();
}

function renderSessionsList() {
  if (!DOM.sessionsList) return;
  const sessions = getSavedSessions();
  DOM.sessionsList.innerHTML = '';

  if (sessions.length === 0) {
    DOM.sessionsList.innerHTML = '<div style="color:#9aa0a6; font-size:12px; padding:10px;">No saved conversations yet.</div>';
    return;
  }

  sessions.forEach(sess => {
    const item = document.createElement('button');
    item.className = `drawer-session-item ${sess.id === STATE.currentChatSessionId ? 'active' : ''}`;
    
    const d = new Date(sess.timestamp);
    const timeStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    item.innerHTML = `
      <span class="session-preview-title">${escapeHtml(sess.title)}</span>
      <span class="session-meta-time">${timeStr}</span>
    `;

    item.onclick = () => loadChatSession(sess.id);
    DOM.sessionsList.appendChild(item);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function loadChatSession(sessionId) {
  const sessions = getSavedSessions();
  const found = sessions.find(s => s.id === sessionId);
  if (!found) return;

  STATE.currentChatSessionId = found.id;
  STATE.chatHistory = found.messages || [];

  if (DOM.chatMessages) {
    DOM.chatMessages.innerHTML = '';
    STATE.chatHistory.forEach(msg => {
      appendMessage(msg.role, msg.text);
    });
  }

  if (DOM.historyDrawer) DOM.historyDrawer.classList.add('hidden');
  renderSessionsList();
  sfx.playClick();
}

const SUGGESTIONS_BY_MODE = {
  unhinged: [
    "The buttons were literally running away from me!",
    "I had to click 'I am a bot' to get in.",
    "The Tic-Tac-Toe game was 100% rigged.",
    "Why is the sky blue?"
  ],
  demolition: [
    "I bet you can't roast my gaming skills.",
    "Why did I fail Step 3 eight times?",
    "Admit your CAPTCHA violates Geneva conventions.",
    "Rate my mouse accuracy out of 10."
  ],
  professor: [
    "Explain why water is wet according to quantum law.",
    "Which international treaty allows rigged Tic-Tac-Toe?",
    "Cite the peer-reviewed physics of runaway buttons.",
    "Formally diagnose my cognitive condition."
  ]
};

function updateSuggestionChips() {
  if (!DOM.suggestionTray) return;
  const chips = SUGGESTIONS_BY_MODE[STATE.roastMode] || SUGGESTIONS_BY_MODE.unhinged;
  DOM.suggestionTray.innerHTML = '';
  chips.forEach(text => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gemini-chip';
    btn.textContent = text;
    btn.onclick = () => {
      if (DOM.chatInput) {
        DOM.chatInput.value = text;
        handleSendMessage();
      }
    };
    DOM.suggestionTray.appendChild(btn);
  });
}

function speakText(text) {
  if (!STATE.ttsEnabled || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/<[^>]*>?/gm, '').replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 1.04;
    utter.pitch = 0.95;
    if (DOM.toggleTtsBtn) DOM.toggleTtsBtn.classList.add('tts-speaking');
    utter.onend = () => {
      if (DOM.toggleTtsBtn) DOM.toggleTtsBtn.classList.remove('tts-speaking');
    };
    utter.onerror = () => {
      if (DOM.toggleTtsBtn) DOM.toggleTtsBtn.classList.remove('tts-speaking');
    };
    window.speechSynthesis.speak(utter);
  } catch (err) {
    console.warn("TTS error:", err);
  }
}

async function startNewChat(isUserTriggered = false) {
  if (isUserTriggered) {
    persistCurrentSession();
    sfx.playClick();
  }

  STATE.currentChatSessionId = 'chat_' + Math.random().toString(36).substring(2, 9);
  STATE.chatHistory = [];

  if (DOM.chatMessages) {
    DOM.chatMessages.innerHTML = '';
  }

  // Dynamic contextual welcome roast
  let openingGreeting = "Well well well, look who finally made it past security! ✨ Did your human brain overheat, or did you just randomly mash your keyboard until the server felt pity?";
  try {
    const res = await fetch('/api/chat/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          entry_reason: STATE.entryReason,
          attempts: STATE.attempts,
          despair: STATE.despairScore
        }
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reply) openingGreeting = data.reply;
    }
  } catch (e) {
    if (STATE.entryReason === 'bot_surrender') {
      openingGreeting = "Well well well, look who admitted to being an appliance! 🤖 Your surrender has been filed under 'Toaster Rights'. What questions does a Roomba have today?";
    } else if (STATE.entryReason === 'tab_nerd') {
      openingGreeting = "OKAY YOU MIGHT BE A NERD 🤓! Did you really just Tab-key your way into my inner sanctum? Your keyboard should sue you for emotional distress.";
    }
  }

  appendMessage('model', openingGreeting);
  STATE.chatHistory.push({ role: 'model', text: openingGreeting });

  if (DOM.historyDrawer) DOM.historyDrawer.classList.add('hidden');
  renderSessionsList();
  updateSuggestionChips();
  if (DOM.chatInput) DOM.chatInput.focus();
}

// ----------------------------------------------------------------------------
// Gemini Style RatioBot Chat Engine
// ----------------------------------------------------------------------------
function revealChatbot() {
  resetEvasivePositions();
  sfx.playUnlock();
  document.body.classList.add('in-chat-mode');

  if (DOM.recaptchaGatekeeper) {
    DOM.recaptchaGatekeeper.classList.add('hidden');
  }

  if (DOM.chatbotContainer) {
    DOM.chatbotContainer.classList.remove('hidden');
  }

  if (!STATE.hasOutsmartedStep3 && !STATE.focusedViaTab) {
    startNewChat(false);
  }
}

function relockWithCaptcha() {
  persistCurrentSession();
  resetEvasivePositions();
  document.body.classList.remove('in-chat-mode');

  if (DOM.chatbotContainer) {
    DOM.chatbotContainer.classList.add('hidden');
  }

  if (DOM.recaptchaGatekeeper) {
    DOM.recaptchaGatekeeper.classList.remove('hidden');
  }

  STATE.level = 1;
  STATE.attempts = 0;
  loadNewChallenge(1);
}

function appendMessage(role, text) {
  if (!DOM.chatMessages) return;

  const row = document.createElement('div');
  row.className = `gemini-msg-row msg-${role === 'user' ? 'user' : 'ai'}`;

  const avatar = document.createElement('div');
  avatar.className = 'gemini-msg-avatar';
  if (role === 'user') {
    avatar.textContent = 'U';
  } else {
    avatar.innerHTML = `
      <svg viewBox="0 0 24 24" width="22" height="22">
        <defs>
          <linearGradient id="msgSparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4285f4"/>
            <stop offset="35%" stop-color="#9b72cb"/>
            <stop offset="70%" stop-color="#d96570"/>
            <stop offset="100%" stop-color="#f2994a"/>
          </linearGradient>
        </defs>
        <path fill="url(#msgSparkleGrad)" d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
      </svg>
    `;
  }

  const bubble = document.createElement('div');
  bubble.className = 'gemini-bubble';
  bubble.textContent = text;

  if (role === 'model') {
    speakText(text);
  }

  row.appendChild(avatar);
  row.appendChild(bubble);
  DOM.chatMessages.appendChild(row);
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

function showTypingIndicator() {
  if (!DOM.chatMessages) return null;
  const ind = document.createElement('div');
  ind.id = 'geminiTypingIndicator';
  ind.className = 'gemini-msg-row msg-ai';
  ind.innerHTML = `
    <div class="gemini-msg-avatar">
      <svg viewBox="0 0 24 24" width="22" height="22">
        <path fill="#8ab4f8" d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5z"/>
      </svg>
    </div>
    <div class="gemini-typing-sparkle">
      <div class="gemini-pulse-dot"></div>
      <div class="gemini-pulse-dot"></div>
      <div class="gemini-pulse-dot"></div>
    </div>
  `;
  DOM.chatMessages.appendChild(ind);
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
  return ind;
}

function removeTypingIndicator() {
  const ind = document.getElementById('geminiTypingIndicator');
  if (ind) ind.remove();
}

let cachedGeminiModel = null;

async function getAvailableGeminiModel(apiKey) {
  if (cachedGeminiModel) return cachedGeminiModel;

  const preferred = [
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listRes.ok) {
      const data = await listRes.json();
      const models = data.models || [];
      const genModels = models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace('models/', ''));

      console.log('Available models for key:', genModels);

      for (const pref of preferred) {
        if (genModels.includes(pref)) {
          cachedGeminiModel = pref;
          return pref;
        }
      }

      if (genModels.length > 0) {
        cachedGeminiModel = genModels[0];
        return genModels[0];
      }
    }
  } catch (e) {
    console.warn('ListModels warning:', e);
  }

  return 'gemini-3.6-flash';
}

async function callBrowserGeminiAPI(apiKey, userText, history) {
  const model = await getAvailableGeminiModel(apiKey);

  const basePrompt = RATIOBOT_PROMPTS[STATE.roastMode] || RATIOBOT_PROMPTS.unhinged;
  let activeSystemPrompt = basePrompt;
  const contextNotes = [];
  if (STATE.entryReason === 'bot_surrender') {
    contextNotes.push("The user surrendered on Step 3 by clicking 'I am a bot'.");
  } else if (STATE.entryReason === 'tab_nerd') {
    contextNotes.push("The user bypassed the evasive button using the keyboard TAB key.");
  } else if (STATE.entryReason === 'lucky_click') {
    contextNotes.push("The user caught the button on a 5% RNG fluke.");
  }
  if (STATE.attempts > 3) {
    contextNotes.push(`The user failed ${STATE.attempts} times before making it here.`);
  }
  if (STATE.despairScore > 40) {
    contextNotes.push(`The user reached a Despair Score of ${STATE.despairScore}%.`);
  }
  if (contextNotes.length > 0) {
    activeSystemPrompt += "\n\nUSER TELEMETRY (Mock them mercilessly with this info if relevant):\n- " + contextNotes.join("\n- ");
  }

  const contents = (history || []).map(item => ({
    role: item.role === 'user' ? 'user' : 'model',
    parts: [{ text: item.text }]
  }));
  contents.push({
    role: 'user',
    parts: [{ text: userText }]
  });

  const bodyData = {
    system_instruction: {
      parts: [{ text: activeSystemPrompt }]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 150
    }
  };

  const modelsToTry = [model, 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  const uniqueModels = [...new Set(modelsToTry)];
  let lastError = null;

  for (const mod of uniqueModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        const json = await res.json();
        const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) return candidate.trim();
      }

      // If system_instruction wasn't supported by this model, try standard contents format
      const fallbackBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `[System Prompt: ${activeSystemPrompt}]\n\nUser Question: ${userText}` }]
          }
        ]
      };

      const fallbackRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackBody)
      });

      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) return candidate.trim();
      }

      const errJson = await res.json().catch(() => ({}));
      lastError = errJson.error?.message || `Google API error (Status ${res.status})`;
    } catch (e) {
      lastError = e.message;
    }
  }

  throw new Error(lastError || 'Failed to generate content with Gemini models');
}

async function handleSendMessage(e) {
  if (e) e.preventDefault();
  const text = DOM.chatInput ? DOM.chatInput.value.trim() : '';
  if (!text) return;

  DOM.chatInput.value = '';
  sfx.playClick();

  appendMessage('user', text);
  STATE.chatHistory.push({ role: 'user', text });
  persistCurrentSession();

  showTypingIndicator();

  // 1. Get live Gemini API Key from window.ENV or localStorage
  const apiKey = (window.ENV && window.ENV.GEMINI_API_KEY && window.ENV.GEMINI_API_KEY !== 'your_gemini_api_key_here')
    ? window.ENV.GEMINI_API_KEY.trim()
    : (localStorage.getItem('gemini_api_key') || '').trim();

  // 2. Try direct browser Gemini API call first if key is present
  if (apiKey) {
    try {
      const liveReply = await callBrowserGeminiAPI(apiKey, text, STATE.chatHistory.slice(-8));
      removeTypingIndicator();
      appendMessage('model', liveReply);
      STATE.chatHistory.push({ role: 'model', text: liveReply });
      persistCurrentSession();
      return;
    } catch (err) {
      console.warn("Direct browser Gemini API failed, attempting /api/chat fallback:", err);
    }
  }

  // 3. Fallback to local FastAPI backend server /api/chat
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: STATE.chatHistory.slice(-8),
        mode: STATE.roastMode,
        context: {
          entry_reason: STATE.entryReason,
          attempts: STATE.attempts,
          despair: STATE.despairScore
        }
      })
    });

    removeTypingIndicator();

    if (response.ok) {
      const data = await response.json();
      appendMessage('model', data.reply);
      STATE.chatHistory.push({ role: 'model', text: data.reply });
      persistCurrentSession();
      return;
    } else {
      const errData = await response.json().catch(() => ({ detail: 'API request failed' }));
      const errorMsg = `⚠️ [Error]: ${errData.detail || 'API key missing in .env'}`;
      appendMessage('model', errorMsg);
      STATE.chatHistory.push({ role: 'model', text: errorMsg });
      persistCurrentSession();
      return;
    }
  } catch (err) {
    removeTypingIndicator();
    const errorMsg = "⚠️ [API Key Required]: Please paste your GEMINI_API_KEY in the .env file or click the Key button to talk to the live AI!";
    appendMessage('model', errorMsg);
    STATE.chatHistory.push({ role: 'model', text: errorMsg });
    persistCurrentSession();
  }
}

// ----------------------------------------------------------------------------
// Event Listeners
// ----------------------------------------------------------------------------
function initEvents() {
  if (DOM.captchaForm) DOM.captchaForm.addEventListener('submit', handleVerify);
  
  if (DOM.captchaInput) {
    DOM.captchaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && STATE.level === 3 && !STATE.focusedViaTab) {
        e.preventDefault();
        showFeedback("Enter key disabled! You must manually chase and click Verify.");
        sfx.playError();
        triggerScreenShake();
        if (DOM.submitBtn) {
          runAcrossScreen(DOM.submitBtn);
        }
      }
    });
  }

  if (DOM.clearInputBtn) {
    DOM.clearInputBtn.addEventListener('click', () => {
      if (DOM.captchaInput) {
        DOM.captchaInput.value = '';
        DOM.captchaInput.focus();
      }
    });
  }

  if (DOM.refreshBtn) {
    DOM.refreshBtn.addEventListener('click', () => {
      sfx.playClick();
      loadNewChallenge(STATE.level);
    });
  }

  if (DOM.audioBtn) {
    DOM.audioBtn.addEventListener('click', () => {
      sfx.speakAudioChallenge(STATE.currentAudioScript || "Please solve the security challenge to verify.");
    });
  }

  if (DOM.infoBtn) {
    DOM.infoBtn.addEventListener('click', () => {
      showFeedback("Please type the characters displayed in the challenge box.");
    });
  }

  if (DOM.tttProceedBtn) DOM.tttProceedBtn.addEventListener('click', proceedToStage3);
  if (DOM.botSurrenderBtn) DOM.botSurrenderBtn.addEventListener('click', handleSurrenderBot);
  if (DOM.enterChatFromBotBtn) DOM.enterChatFromBotBtn.addEventListener('click', enterChatFromSurrender);

  // Chatbot Event Listeners
  if (DOM.chatForm) DOM.chatForm.addEventListener('submit', handleSendMessage);
  if (DOM.relockCaptchaBtn) DOM.relockCaptchaBtn.addEventListener('click', relockWithCaptcha);
  if (DOM.newChatBtn) DOM.newChatBtn.addEventListener('click', () => startNewChat(true));
  
  if (DOM.toggleHistoryBtn) {
    DOM.toggleHistoryBtn.addEventListener('click', () => {
      if (DOM.historyDrawer) {
        DOM.historyDrawer.classList.toggle('hidden');
        renderSessionsList();
      }
    });
  }

  if (DOM.closeDrawerBtn) {
    DOM.closeDrawerBtn.addEventListener('click', () => {
      if (DOM.historyDrawer) DOM.historyDrawer.classList.add('hidden');
    });
  }

  // Roast Mode selector pills
  if (DOM.roastModePills) {
    DOM.roastModePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const mode = pill.dataset.mode;
        if (!mode) return;
        STATE.roastMode = mode;
        DOM.roastModePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        sfx.playClick();
        updateSuggestionChips();
      });
    });
  }

  // TTS Voice Toggle
  if (DOM.toggleTtsBtn) {
    DOM.toggleTtsBtn.addEventListener('click', () => {
      STATE.ttsEnabled = !STATE.ttsEnabled;
      DOM.toggleTtsBtn.classList.toggle('tts-active', STATE.ttsEnabled);
      if (DOM.ttsStatusLabel) {
        DOM.ttsStatusLabel.textContent = STATE.ttsEnabled ? 'Voice: ON' : 'Voice: OFF';
      }
      sfx.playClick();
      if (STATE.ttsEnabled) {
        speakText("Voice synthesizer activated. Prepare for acoustic humiliation.");
      } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    });
  }

  if (DOM.setApiKeyBtn) {
    DOM.setApiKeyBtn.addEventListener('click', () => {
      const current = (window.ENV?.GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '').trim();
      const newKey = prompt("Paste your Google Gemini API Key below:", current);
      if (newKey !== null) {
        const cleaned = newKey.trim();
        localStorage.setItem('gemini_api_key', cleaned);
        if (window.ENV) window.ENV.GEMINI_API_KEY = cleaned;
        cachedGeminiModel = null; // Reset cached model
        alert("API Key saved! RatioBot is now connected to live Gemini AI.");
      }
    });
  }

  if (DOM.suggestionTray) {
    updateSuggestionChips();
  }
}

// Bootstrapping
function bootstrap() {
  initDOM();
  initEvents();
  initEvasivePhysics();
  initGlitchCanvas();
  loadNewChallenge(1);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

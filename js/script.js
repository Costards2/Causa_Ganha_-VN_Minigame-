/* ========================================
   VISUAL NOVEL ENGINE
   "Isso é Causa Ganha, Doutor?"
   ======================================== */

// ========================================
// ESTADO GLOBAL
// ========================================
let gameData = null;
let currentQuestionIndex = 0;
let currentDialogueIndex = 0;
let currentDialogueSet = [];
let dialogueMode = '';
let score = 0;
let selectedAnswer = null;

// Timer
const TOTAL_TIME = 1620; // 15 min = 900 segundos
let remainingTime = TOTAL_TIME;
let timerIntervalId = null;

// ========================================
// REFERÊNCIAS DOM
// ========================================
const menuScreen = document.getElementById('menu-screen');
const sceneBg = document.getElementById('scene-bg');
const charactersContainer = document.getElementById('characters-container');
const dialogueBox = document.getElementById('dialogue-box');
const speakerName = document.getElementById('speaker-name');
const dialogueText = document.getElementById('dialogue-text');
const continueIndicator = document.getElementById('continue-indicator');
const quizPanel = document.getElementById('quiz-panel');
const quizContext = document.getElementById('quiz-context');
const quizOptions = document.getElementById('quiz-options');
const endPanel = document.getElementById('end-panel');
const timerDiv = document.getElementById('timer');
const scoreDiv = document.getElementById('score');

// ========================================
// ÁUDIO
// ========================================
const clickSound = new Audio('audio/click.mp3');
const acertoSound = new Audio('audio/acerto.mp3');
const erroSound = new Audio('audio/erro.mp3');
clickSound.volume = 0.3;
acertoSound.volume = 0.6;
erroSound.volume = 0.6;

// ========================================
// INICIALIZAÇÃO
// ========================================
async function startGame() {
    clickSound.play().catch(() => {});
    
    try {
        const response = await fetch('data/questions.json');
        gameData = await response.json();
        
        currentQuestionIndex = 0;
        score = 0;
        remainingTime = TOTAL_TIME;
        
        menuScreen.classList.add('hidden');
        document.querySelector('.hud').classList.remove('hidden');
        dialogueBox.classList.remove('hidden');
        setupScene();
        updateHUD();
        startTimer();
        
        initBothSprites();
        loadQuestion(0);
        
    } catch (error) {
        console.error('Erro ao carregar questions.json:', error);
        alert('Erro ao carregar o jogo. Verifique o arquivo data/questions.json.');
    }
}

// ========================================
// CONFIGURAÇÃO CENÁRIO
// ========================================
function setupScene() {
    sceneBg.className = 'scene-background escritorio';
}

// ========================================
// HUD
// ========================================
function updateHUD() {
    scoreDiv.textContent = `Pontos: ${score} / ${gameData.length}`;
}

function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
}

function updateTimer() {
    timerDiv.textContent = `Tempo: ${formatTime(remainingTime)}`;
}

function startTimer() {
    updateTimer();
    if (timerIntervalId) clearInterval(timerIntervalId);
    
    timerIntervalId = setInterval(() => {
        remainingTime--;
        updateTimer();
        if (remainingTime <= 0) {
            endGame('timeout');
        }
    }, 1000);
}

function stopTimer() {
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
}

// ========================================
// SPRITES DUPLOS - SEMPRE NA TELA
// Estagiário (esquerda) | Advogado (direita)
// ========================================

function initBothSprites() {
    charactersContainer.innerHTML = '';
    charactersContainer.classList.remove('hidden-sprites');

    // Estagiário (esquerda, espelhado via CSS)
    const estagiarioDiv = document.createElement('div');
    estagiarioDiv.id = 'sprite-estagiario';
    estagiarioDiv.className = 'sprite-wrapper left';

    const estagiarioImg = document.createElement('img');
    estagiarioImg.src = 'img/stg sprites/estagiario_neutro.png';
    estagiarioImg.alt = 'Estagiário';
    estagiarioImg.className = 'character-sprite';
    estagiarioImg.onerror = function() { this.style.visibility = 'hidden'; };

    estagiarioDiv.appendChild(estagiarioImg);
    charactersContainer.appendChild(estagiarioDiv);

    // Advogado (direita)
    const advogadoDiv = document.createElement('div');
    advogadoDiv.id = 'sprite-advogado';
    advogadoDiv.className = 'sprite-wrapper right';

    const advogadoImg = document.createElement('img');
    advogadoImg.src = 'img/adv sprites/advogado_neutro.png';
    advogadoImg.alt = 'Advogado Sênior';
    advogadoImg.className = 'character-sprite';
    advogadoImg.onerror = function() { this.style.visibility = 'hidden'; };

    advogadoDiv.appendChild(advogadoImg);
    charactersContainer.appendChild(advogadoDiv);
}

function updateCharacterSprites(speaker, sprite) {
    const estagiarioWrapper = document.getElementById('sprite-estagiario');
    const advogadoWrapper = document.getElementById('sprite-advogado');

    if (!estagiarioWrapper || !advogadoWrapper) {
        initBothSprites();
        updateCharacterSprites(speaker, sprite);
        return;
    }

    const estagiarioImg = estagiarioWrapper.querySelector('img');
    const advogadoImg = advogadoWrapper.querySelector('img');

    if (speaker === 'Estagiário') {
        if (estagiarioImg) {
            estagiarioImg.src = `img/stg sprites/estagiario_${sprite}.png`;
            estagiarioImg.style.visibility = 'visible';
        }
        estagiarioWrapper.classList.add('speaking');
        advogadoWrapper.classList.remove('speaking');

    } else if (speaker === 'Advogado') {
        if (advogadoImg) {
            advogadoImg.src = `img/adv sprites/advogado_${sprite}.png`;
            advogadoImg.style.visibility = 'visible';
        }
        advogadoWrapper.classList.add('speaking');
        estagiarioWrapper.classList.remove('speaking');
    }
}

// Esconde os sprites com fade durante o quiz
function hideSprites() {
    charactersContainer.classList.add('hidden-sprites');
}

// Mostra os sprites com fade ao voltar para o diálogo
function showSprites() {
    charactersContainer.classList.remove('hidden-sprites');
}

// ========================================
// CARREGAMENTO QUESTÃO
// ========================================
function loadQuestion(index) {
    currentQuestionIndex = index;
    const question = gameData[index];

    currentDialogueSet = question.dialogues.intro;
    currentDialogueIndex = 0;
    dialogueMode = 'intro';

    showDialogue();
}

// ========================================
// SISTEMA DE DIÁLOGO
// ========================================
function showDialogue() {
    const line = currentDialogueSet[currentDialogueIndex];

    if (!line) {
        advanceDialoguePhase();
        return;
    }

    speakerName.textContent = line.speaker;
    dialogueText.textContent = line.text;

    updateCharacterSprites(line.speaker, line.sprite || 'neutro');

    continueIndicator.classList.remove('hidden');
}

function nextDialogue() {
    clickSound.play().catch(() => {});

    currentDialogueIndex++;

    if (currentDialogueIndex < currentDialogueSet.length) {
        showDialogue();
    } else {
        advanceDialoguePhase();
    }
}

function advanceDialoguePhase() {
    if (dialogueMode === 'intro') {
        dialogueMode = 'quiz';
        showQuiz();
    } else if (dialogueMode === 'correct' || dialogueMode === 'wrong') {
        currentQuestionIndex++;

        if (currentQuestionIndex < gameData.length) {
            loadQuestion(currentQuestionIndex);
        } else {
            endGame('completed');
        }
    }
}

// ========================================
// SISTEMA QUIZ
// ========================================
function showQuiz() {
    const question = gameData[currentQuestionIndex];

    // Sprites somem com fade
    hideSprites();

    dialogueBox.style.display = 'none';
    quizPanel.classList.remove('hidden');

    quizContext.innerHTML = `<strong>Cliente ${question.client}:</strong><br>${question.dialogue}`;

    quizOptions.innerHTML = '';
    question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.textContent = option;
        btn.onclick = () => selectAnswer(index);
        quizOptions.appendChild(btn);
    });
}

function selectAnswer(index) {
    const question = gameData[currentQuestionIndex];
    selectedAnswer = index;

    const buttons = quizOptions.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);

    buttons[question.correct].classList.add('correct');
    if (index !== question.correct) {
        buttons[index].classList.add('incorrect');
    }

    const isCorrect = (index === question.correct);
    if (isCorrect) {
        score++;
        updateHUD();
        acertoSound.play().catch(() => {});
    } else {
        erroSound.play().catch(() => {});
    }

    setTimeout(() => {
        showFeedbackDialogue(isCorrect);
    }, 1500);
}

function showFeedbackDialogue(isCorrect) {
    const question = gameData[currentQuestionIndex];

    quizPanel.classList.add('hidden');
    dialogueBox.style.display = 'block';

    // Sprites voltam com fade
    showSprites();

    if (isCorrect) {
        currentDialogueSet = question.dialogues.correct;
        dialogueMode = 'correct';
    } else {
        currentDialogueSet = question.dialogues.wrong;
        dialogueMode = 'wrong';
    }

    currentDialogueIndex = 0;
    showDialogue();
}

// ========================================
// FIM DE JOGO
// ========================================
function endGame(reason) {
    stopTimer();

    // Esconde elementos do jogo
    dialogueBox.classList.add('hidden');
    quizPanel.classList.add('hidden');
    charactersContainer.innerHTML = '';

    // Mostra o painel final
    endPanel.classList.remove('hidden');

    let message = '';

    if (reason === 'completed') {
        message = `
            <h1 style="color: #ffd700"; >Parabéns!</h1>
            <p style="color: #ffffff; font-size: 20px; margin: 20px 0;">
                Você completou todas as questões.
            </p>
            <p style="color: #ffffff; font-size: 24px;">
                Pontuação final: <strong>${score} / ${gameData.length}</strong>
            </p>
        `;
    } else if (reason === 'timeout') {
        message = `
            <h1 style="color: #ffd700";>Tempo esgotado!</h1>
            <p style="color: #ffffff; font-size: 20px; margin: 20px 0;">
                Você não conseguiu completar a tempo.
            </p>
            <p style="color: #ffffff; font-size: 24px;">
                Pontuação obtida: <strong>${score} / ${gameData.length}</strong>
            </p>
        `;
    }

    // Preenche o painel final
    endPanel.innerHTML = `
        ${message}
        <button class="start-button" onclick="location.reload()">Jogar Novamente</button>
    `;
}

// ========================================
// EVENT LISTENERS
// ========================================
dialogueBox.addEventListener('click', () => {
    if (!quizPanel.classList.contains('hidden')) return;
    nextDialogue();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        if (quizPanel.classList.contains('hidden')) {
            e.preventDefault();
            nextDialogue();
        }
    }
});
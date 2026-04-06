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
const TOTAL_TIME = 720;
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
        setupScene();
        updateHUD();
        startTimer();
        
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
    const question = gameData[currentQuestionIndex];
    
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
// CONTROLE VISUAL DOS SPRITES
// ========================================
function hideCharacters() {
    charactersContainer.style.visibility = 'hidden';
}

function showCharacters() {
    charactersContainer.style.visibility = 'visible';
}

// ========================================
// ATUALIZAÇÃO SPRITES
// ========================================
function updateCharacterSprites(speaker, sprite) {
    charactersContainer.innerHTML = '';
    
    if (speaker === 'Advogado') {
        const advogadoImg = document.createElement('img');
        advogadoImg.src = `img/adv sprites/advogado_${sprite}.png`;
        advogadoImg.alt = 'Advogado Sênior';
        advogadoImg.className = 'character-sprite speaking';
        advogadoImg.onerror = function() {
            this.style.display = 'none';
        };
        charactersContainer.appendChild(advogadoImg);
    }
    else if(speaker == 'Estagiário'){
        const estagiarioImg = document.createElement('img');
        estagiarioImg.src = `img/stg sprites/estagiario_${sprite}.png`;
        estagiarioImg.alt = 'Estagiário';
        estagiarioImg.className = 'character-sprite speaking';
        estagiarioImg.onerror = function() {
            this.style.display = 'none';
        };
        charactersContainer.appendChild(estagiarioImg);
    }
}

// ========================================
// SISTEMA QUIZ
// ========================================
function showQuiz() {
    const question = gameData[currentQuestionIndex];
    
    hideCharacters();
    
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
    
    showCharacters();
    
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
    
    dialogueBox.style.display = 'none';
    quizPanel.classList.add('hidden');
    charactersContainer.innerHTML = '';
    
    let message = '';
    if (reason === 'completed') {
        message = `<h1>Parabéns!</h1><p style="color: #ffd700; font-size: 20px; margin: 20px 0;">Você completou todas as questões.</p><p style="color: #ffd700; font-size: 24px;">Pontuação final: <strong>${score} / ${gameData.length}</strong></p>`;
    } else if (reason === 'timeout') {
        message = `<h1>Tempo esgotado!</h1><p style="color: #ffd700; font-size: 20px; margin: 20px 0;">Você não conseguiu completar a tempo.</p><p style="color: #ffd700; font-size: 24px;">Pontuação obtida: <strong>${score} / ${gameData.length}</strong></p>`;
    }
    
    menuScreen.innerHTML = message + '<button class="start-button" onclick="location.reload()">Jogar Novamente</button>';
    menuScreen.classList.remove('hidden');
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
// ====== ESTADO GLOBAL ======
let questions = [];
let currentQuestion = 0;
let score = 0;
let introIndex = 0;

// Timer (em segundos) – 5 minutos = 300 s
const TOTAL_TIME = 300;
let remainingTime = TOTAL_TIME;
let timerIntervalId = null;

// Referências de DOM
const scoreDiv = document.getElementById('score');
const timerDiv = document.getElementById('timer');
const gameDiv = document.getElementById('game');
const officeWrapper = document.getElementById('office-wrapper');

// Áudio (todos os sons do jogo)
const clickSound = new Audio('audio/click.mp3');
const acertoSound = new Audio('audio/acerto.mp3');      // Som de acerto
const erroSound = new Audio('audio/erro.mp3');          // Som de erro
clickSound.volume = 0.4;
correctSound.volume = 0.7;
acertoSound.volume = 0.6;
erroSound.volume = 0.6;

// ====== HUD ======
function updateScore() {
    if (questions.length === 0) {
        scoreDiv.textContent = 'Pontos: 0 / 0';
    } else {
        scoreDiv.textContent = `Pontos: ${score} / ${questions.length}`;
    }
}

function formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
}

function updateTimerDisplay() {
    timerDiv.textContent = `Tempo: ${formatTime(remainingTime)}`;
}

function startTimer() {
    remainingTime = TOTAL_TIME;
    updateTimerDisplay();

    if (timerIntervalId !== null) {
        clearInterval(timerIntervalId);
    }

    timerIntervalId = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        if (remainingTime <= 0) {
            clearInterval(timerIntervalId);
            endGameTimeUp();
        }
    }, 1000);
}

function stopTimer() {
    if (timerIntervalId !== null) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
}

// ====== CENÁRIO ======
function applyBackground() {
    officeWrapper.className = 'office';
    const q = questions[currentQuestion];
    const bgClass = q.bgClass || 'bg-default';
    officeWrapper.classList.add(bgClass);
}

// ====== INICIALIZAÇÃO ======
async function initGame() {
    clickSound.play().catch(() => {});

    try {
        const res = await fetch('data/questions.json');
        questions = await res.json();
        score = 0;
        currentQuestion = 0;
        updateScore();
        startTimer();
        loadQuestion();
    } catch (e) {
        console.error('Erro ao carregar questions.json', e);
        gameDiv.innerHTML = '<p>Erro ao carregar questões. Verifique o arquivo questions.json.</p>';
    }
}

// ====== FLUXO DE QUESTÕES ======
function loadQuestion() {
    introIndex = 0;
    applyBackground();
    renderIntro();
}

// Layout da INTRO no formato do seu desenho
function renderIntro() {
    const q = questions[currentQuestion];

    const spriteHtml = q.spriteIntro
        ? `<img src="${q.spriteIntro}" alt="Estagiário" class="character-sprite">`
        : 'Estagiário';

    gameDiv.innerHTML = `
        <div class="dialogue-row">
            <div class="dialogue-area">
                <div class="speaker-name-box">Estagiário</div>
                <div class="speech-big-box">
                    "Isso é causa ganha, doutor!"<br><br>
                    ${q.internLines[introIndex]}
                </div>
            </div>

            <div class="character">
                <!-- Sprite do estagiário na intro -->
                ${spriteHtml}
            </div>
        </div>

        <div style="margin-top: 20px; text-align: right;">
            <button class="next" onclick="advanceIntro()">
                Avançar
            </button>
        </div>
    `;
}

function advanceIntro() {
    clickSound.play().catch(() => {});
    const q = questions[currentQuestion];
    introIndex++;
    if (introIndex < q.internLines.length) {
        renderIntro();
    } else {
        renderQuestion();
    }
}

// Layout da PERGUNTA no mesmo formato
function renderQuestion() {
    const q = questions[currentQuestion];

    const spriteHtml = q.spriteCase
        ? `<img src="${q.spriteCase}" alt="Estagiário" class="character-sprite">`
        : 'Estagiário';

    gameDiv.innerHTML = `
        <div class="dialogue-row">
            <div class="dialogue-area">
                <div class="speaker-name-box">Estagiário</div>
                <div class="speech-big-box">
                    Pronto, doutor, veja o caso do(a) ${q.client}.
                </div>
            </div>

            <div class="character">
                <!-- Sprite do estagiário apresentando o caso -->
                ${spriteHtml}
            </div>
        </div>

        <div class="client-dialogue">
            <strong>Cliente ${q.client} diz:</strong><br>
            ${q.dialogue}
        </div>

        <div class="options"></div>
    `;

    const optionsDiv = gameDiv.querySelector('.options');
    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.onclick = () => selectAnswer(i);
        optionsDiv.appendChild(btn);
    });
}

function selectAnswer(selectedIndex) {
    clickSound.play().catch(() => {});

    const q = questions[currentQuestion];
    const buttons = document.querySelectorAll('.options button');

    buttons.forEach(btn => btn.disabled = true);

    buttons[q.correct].classList.add('correct');
    if (selectedIndex !== q.correct) {
        buttons[selectedIndex].classList.add('incorrect');
    }

    const isCorrect = selectedIndex === q.correct;
    
    // ====== TOCA SOM DE ACERTO OU ERRO ======
    if (isCorrect) {
        score++;
        updateScore();
        acertoSound.play().catch(() => {});      // Som de acerto
    } else {
        erroSound.play().catch(() => {});        // Som de erro
    }

    // Troca sprite conforme reação (feliz x preocupado)
    const characterDiv = document.querySelector('.character');
    if (characterDiv) {
        if (isCorrect && q.spriteCorrect) {
            characterDiv.innerHTML = `
                <!-- Sprite do estagiário feliz (acerto) -->
                <img src="${q.spriteCorrect}" alt="Estagiário feliz" class="character-sprite">
            `;
        } else if (!isCorrect && q.spriteWrong) {
            characterDiv.innerHTML = `
                <!-- Sprite do estagiário preocupado (erro) -->
                <img src="${q.spriteWrong}" alt="Estagiário preocupado" class="character-sprite">
            `;
        } else {
            characterDiv.textContent = 'Estagiário';
        }
    }

    setTimeout(() => {
        showFeedback(isCorrect, q.explanation);
    }, 1200);
}

function showFeedback(isCorrect, explanation) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${isCorrect ? 'success' : 'error'}`;
    feedback.innerHTML = `
        <strong>${isCorrect ? 'Acertou!' : 'Errou!'}</strong><br>
        ${explanation}
        <br>
        <button class="next" onclick="nextQuestion()">
            Próxima fase
        </button>
    `;
    gameDiv.appendChild(feedback);
}

function nextQuestion() {
    clickSound.play().catch(() => {});
    currentQuestion++;
    if (currentQuestion < questions.length) {
        loadQuestion();
    } else {
        endGameNormal();
    }
}

// ====== FIM DE JOGO ======
function endGameNormal() {
    stopTimer();
    officeWrapper.className = 'office bg-default';
    gameDiv.innerHTML = `
        <h2>Fim do jogo!</h2>
        <p>Você atendeu todos os clientes.</p>
        <p>Pontuação final: <strong>${score} / ${questions.length}</strong></p>
        <button class="start-button" onclick="initGame()">
            Jogar novamente
        </button>
    `;
}

function endGameTimeUp() {
    stopTimer();
    officeWrapper.className = 'office bg-default';
    gameDiv.innerHTML = `
        <h2>Tempo esgotado!</h2>
        <p>Você não conseguiu atender todos os clientes dentro do tempo.</p>
        <p>Pontuação obtida até agora: <strong>${score} / ${questions.length}</strong></p>
        <button class="start-button" onclick="initGame()">
            Tentar novamente
        </button>
    `;
}

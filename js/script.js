// ========================================
// VISUAL NOVEL ENGINE
// "Isso é Causa Ganha, Doutor?"
// SCRIPT.JS - PARTE 1/3
// ========================================


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


// ========================================
// TIMER
// ========================================

// 15 minutos
const TOTAL_TIME = 900;

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
// INICIAR JOGO
// ========================================

async function startGame(){

    clickSound.play().catch(()=>{});


    try{

        const response = await fetch('data/questions.json');

        gameData = await response.json();



        currentQuestionIndex = 0;

        currentDialogueIndex = 0;

        score = 0;

        remainingTime = TOTAL_TIME;



        // Esconde menu inicial

        menuScreen.classList.add('hidden');


        // Troca cenário

        setupScene();



        // Mostra elementos do jogo

        document.querySelector('.hud')
            .classList.remove('hidden');


        dialogueBox.classList.remove('hidden');


        charactersContainer.classList.remove('hidden-sprites');



        updateHUD();


        startTimer();



        initBothSprites();


        loadQuestion(0);



    }catch(error){

        console.error(
            'Erro ao carregar questions.json:',
            error
        );


        alert(
            'Erro ao carregar o jogo. Verifique o arquivo data/questions.json.'
        );

    }

}



// ========================================
// CONFIGURAÇÃO DO CENÁRIO
// ========================================

function setupScene(){

    sceneBg.className =
        'scene-background escritorio';

}



// ========================================
// HUD
// ========================================

function updateHUD(){

    if(!gameData)
        return;


    scoreDiv.textContent =
        `Pontos: ${score} / ${gameData.length}`;

}



function formatTime(seconds){

    const minutes =
        String(
            Math.floor(seconds / 60)
        ).padStart(2,'0');


    const secs =
        String(
            seconds % 60
        ).padStart(2,'0');


    return `${minutes}:${secs}`;

}



function updateTimer(){

    timerDiv.textContent =
        `Tempo: ${formatTime(remainingTime)}`;

}



function startTimer(){

    updateTimer();


    if(timerIntervalId){

        clearInterval(timerIntervalId);

    }



    timerIntervalId =
        setInterval(()=>{


            remainingTime--;


            updateTimer();



            if(remainingTime <= 0){

                endGame('timeout');

            }


        },1000);

}



function stopTimer(){

    if(timerIntervalId){

        clearInterval(timerIntervalId);

        timerIntervalId = null;

    }

}



// ========================================
// CARREGAR QUESTÃO
// ========================================

function loadQuestion(index){

    currentQuestionIndex = index;


    const question =
        gameData[index];


    currentDialogueSet =
        question.dialogues.intro;


    currentDialogueIndex = 0;


    dialogueMode = 'intro';


    showDialogue();

}

// ========================================
// SCRIPT.JS - PARTE 2/3
// SPRITES + SISTEMA DE DIÁLOGO
// ========================================


// ========================================
// SPRITES DOS PERSONAGENS
// ========================================

function initBothSprites(){

    charactersContainer.innerHTML = '';

    charactersContainer.classList.remove(
        'hidden-sprites'
    );


    // ------------------------------
    // ESTAGIÁRIO
    // ------------------------------

    const estagiarioDiv =
        document.createElement('div');


    estagiarioDiv.id =
        'sprite-estagiario';


    estagiarioDiv.className =
        'sprite-wrapper left';



    const estagiarioImg =
        document.createElement('img');


    // O pacote nao possui "estagiario_neutro.png"; usa o sprite falando como
    // padrao para o estagiario nao sumir (e nao gerar 404) antes da 1a fala.
    estagiarioImg.src =
        'img/stg sprites/estagiario_falando.png';


    estagiarioImg.alt =
        'Estagiário';


    estagiarioImg.className =
        'character-sprite';


    estagiarioImg.onerror =
        function(){

            this.style.visibility = 'hidden';

        };



    estagiarioDiv.appendChild(
        estagiarioImg
    );


    charactersContainer.appendChild(
        estagiarioDiv
    );



    // ------------------------------
    // ADVOGADO
    // ------------------------------

    const advogadoDiv =
        document.createElement('div');


    advogadoDiv.id =
        'sprite-advogado';


    advogadoDiv.className =
        'sprite-wrapper right';



    const advogadoImg =
        document.createElement('img');


    advogadoImg.src =
        'img/adv sprites/advogado_neutro.png';


    advogadoImg.alt =
        'Advogado';


    advogadoImg.className =
        'character-sprite';



    advogadoImg.onerror =
        function(){

            this.style.visibility = 'hidden';

        };



    advogadoDiv.appendChild(
        advogadoImg
    );


    charactersContainer.appendChild(
        advogadoDiv
    );

}



// ========================================
// ATUALIZAR EXPRESSÃO DO PERSONAGEM
// ========================================

function updateCharacterSprites(
    speaker,
    sprite
){


    const estagiarioWrapper =
        document.getElementById(
            'sprite-estagiario'
        );


    const advogadoWrapper =
        document.getElementById(
            'sprite-advogado'
        );



    if(
        !estagiarioWrapper ||
        !advogadoWrapper
    ){

        initBothSprites();

        updateCharacterSprites(
            speaker,
            sprite
        );

        return;

    }



    const estagiarioImg =
        estagiarioWrapper.querySelector(
            'img'
        );


    const advogadoImg =
        advogadoWrapper.querySelector(
            'img'
        );



    if(
        speaker === 'Estagiário'
    ){


        if(estagiarioImg){

            estagiarioImg.src =
            `img/stg sprites/estagiario_${sprite}.png`;


            estagiarioImg.style.visibility =
            'visible';

        }



        estagiarioWrapper.classList.add(
            'speaking'
        );


        advogadoWrapper.classList.remove(
            'speaking'
        );

    }



    else if(
        speaker === 'Advogado'
    ){


        if(advogadoImg){

            advogadoImg.src =
            `img/adv sprites/advogado_${sprite}.png`;


            advogadoImg.style.visibility =
            'visible';

        }



        advogadoWrapper.classList.add(
            'speaking'
        );


        estagiarioWrapper.classList.remove(
            'speaking'
        );

    }

}



// ========================================
// ESCONDER / MOSTRAR SPRITES
// ========================================

function hideSprites(){

    charactersContainer.classList.add(
        'hidden-sprites'
    );

}



function showSprites(){

    charactersContainer.classList.remove(
        'hidden-sprites'
    );

}



// ========================================
// SISTEMA DE DIÁLOGO
// ========================================

function showDialogue(){


    const line =
        currentDialogueSet[
            currentDialogueIndex
        ];



    if(!line){

        advanceDialoguePhase();

        return;

    }



    speakerName.textContent =
        line.speaker;



    dialogueText.textContent =
        line.text;



    updateCharacterSprites(
        line.speaker,
        line.sprite || 'neutro'
    );



    continueIndicator.classList.remove(
        'hidden'
    );

}



// Avançar diálogo

function nextDialogue(){

    clickSound.play()
        .catch(()=>{});



    currentDialogueIndex++;



    if(
        currentDialogueIndex <
        currentDialogueSet.length
    ){

        showDialogue();

    }

    else{

        advanceDialoguePhase();

    }

}



// Próxima etapa

function advanceDialoguePhase(){


    if(dialogueMode === 'intro'){


        dialogueMode =
            'quiz';


        showQuiz();


    }


    else if(
        dialogueMode === 'correct' ||
        dialogueMode === 'wrong'
    ){


        currentQuestionIndex++;



        if(
            currentQuestionIndex <
            gameData.length
        ){

            loadQuestion(
                currentQuestionIndex
            );

        }

        else{

            endGame(
                'completed'
            );

        }

    }

}

// ========================================
// SCRIPT.JS - PARTE 3/3
// QUIZ + FINAL + EVENTOS
// ========================================


// ========================================
// SISTEMA DE QUIZ
// ========================================

function showQuiz(){

    const question =
        gameData[currentQuestionIndex];


    // Esconde personagens

    hideSprites();



    dialogueBox.style.display =
        'none';



    quizPanel.classList.remove(
        'hidden'
    );



    quizContext.innerHTML =
        `
        <strong>
            Cliente ${question.client}:
        </strong>
        <br>
        ${question.dialogue}
        `;



    quizOptions.innerHTML = '';



    question.options.forEach(
        (option,index)=>{


            const button =
                document.createElement(
                    'button'
                );


            button.textContent =
                option;



            button.onclick =
                ()=>selectAnswer(index);



            quizOptions.appendChild(
                button
            );


        }
    );

}



// ========================================
// RESPOSTA DO JOGADOR
// ========================================

function selectAnswer(index){


    const question =
        gameData[currentQuestionIndex];


    selectedAnswer = index;



    const buttons =
        quizOptions.querySelectorAll(
            'button'
        );



    buttons.forEach(
        button=>{

            button.disabled = true;

        }
    );



    buttons[
        question.correct
    ].classList.add(
        'correct'
    );



    if(
        index !== question.correct
    ){

        buttons[index]
            .classList.add(
                'incorrect'
            );

    }



    const isCorrect =
        index === question.correct;



    if(isCorrect){


        score++;


        updateHUD();


        acertoSound.play()
            .catch(()=>{});


    }

    else{


        erroSound.play()
            .catch(()=>{});


    }



    // Salva o progresso parcial na plataforma (questoes respondidas / total)

    if(window.Cayres){

        Cayres.progresso(
            ((currentQuestionIndex + 1) / gameData.length) * 100
        );

    }



    setTimeout(
        ()=>{

            showFeedbackDialogue(
                isCorrect
            );

        },
        1500
    );

}



// ========================================
// FEEDBACK APÓS RESPOSTA
// ========================================

function showFeedbackDialogue(
    isCorrect
){


    const question =
        gameData[currentQuestionIndex];



    quizPanel.classList.add(
        'hidden'
    );



    dialogueBox.style.display =
        'block';



    showSprites();



    if(isCorrect){


        currentDialogueSet =
            question.dialogues.correct;


        dialogueMode =
            'correct';


    }

    else{


        currentDialogueSet =
            question.dialogues.wrong;


        dialogueMode =
            'wrong';


    }



    currentDialogueIndex = 0;



    showDialogue();

}



// ========================================
// FINAL DO JOGO
// ========================================

function endGame(reason){


    stopTimer();



    // Conclui a etapa na plataforma com a nota convertida para 0-100
    // (vale tanto para 'completed' quanto para 'timeout')

    if(window.Cayres){

        Cayres.concluir(
            (score / gameData.length) * 100
        );

    }



    dialogueBox.classList.add(
        'hidden'
    );


    quizPanel.classList.add(
        'hidden'
    );


    charactersContainer.innerHTML =
        '';



    endPanel.classList.remove(
        'hidden'
    );



    let content = '';



    if(reason === 'completed'){


        content =
        `
        <h1>
            Parabéns!
        </h1>

        <p>
            Você completou todas as questões.
        </p>

        <p>
            Pontuação final:
            <strong>
                ${score}/${gameData.length}
            </strong>
        </p>

        `;


    }



    else if(reason === 'timeout'){


        content =
        `
        <h1>
            Tempo esgotado!
        </h1>

        <p>
            Você não conseguiu completar a tempo.
        </p>

        <p>
            Pontuação:
            <strong>
                ${score}/${gameData.length}
            </strong>
        </p>

        `;


    }



    endPanel.innerHTML =
    `

    ${content}


    <button
        class="start-button"
        onclick="location.reload()">

        Jogar Novamente

    </button>

    `;


}



// ========================================
// EVENTOS
// ========================================


dialogueBox.addEventListener(
    'click',
    ()=>{


        if(
            !quizPanel.classList.contains(
                'hidden'
            )
        ){

            return;

        }


        nextDialogue();


    }
);



document.addEventListener(
    'keydown',
    (event)=>{


        if(
            event.key === 'Enter' ||
            event.key === ' '
        ){


            if(
                quizPanel.classList.contains(
                    'hidden'
                )
            ){


                event.preventDefault();


                nextDialogue();


            }

        }


    }
);
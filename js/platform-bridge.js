/**
 * Ponte com a plataforma Cayres (Platform SDK v1.1.0).
 *
 * Expoe window.Cayres com duas funcoes usadas pelo jogo:
 *   Cayres.progresso(pct)  -> salva o progresso parcial do aluno (0 a 100)
 *   Cayres.concluir(pct)   -> conclui a etapa e libera as recompensas (0 a 100)
 *
 * Fora da plataforma (Live Server, abrir o arquivo direto) o PLATFORM_INIT
 * nunca chega: o bridge entra em modo standalone e as chamadas viram no-op,
 * de modo que o jogo continua funcionando normalmente.
 */
(function (global) {
    "use strict";

    var pronto = false;
    var concluido = false;
    var inicio = Date.now();

    function limitar(valor) {
        var n = Math.round(Number(valor) || 0);
        return Math.max(0, Math.min(100, n));
    }

    function iniciar() {
        if (!global.platform || typeof global.platform.init !== "function") {
            console.info("[Cayres] Platform SDK ausente - modo standalone.");
            return;
        }
        global.platform.init().then(function () {
            pronto = true;
            console.info("[Cayres] Sessao iniciada, SDK pronto.");
        }).catch(function (erro) {
            console.info("[Cayres] Modo standalone: " + erro.message);
        });
    }

    function progresso(pct) {
        if (!pronto || concluido) return;
        global.platform.progress.update({ progress: limitar(pct) }).catch(function (erro) {
            console.warn("[Cayres] Falha ao salvar progresso:", erro.message);
        });
    }

    function concluir(pct) {
        if (!pronto || concluido) return;
        concluido = true;
        global.platform.completion.complete({
            score: limitar(pct),
            timeSpent: Math.round((Date.now() - inicio) / 1000)
        }).then(function () {
            console.info("[Cayres] Etapa concluida com nota " + limitar(pct) + ".");
        }).catch(function (erro) {
            concluido = false;
            console.warn("[Cayres] Falha ao concluir:", erro.message);
        });
    }

    global.Cayres = { progresso: progresso, concluir: concluir };

    iniciar();
})(window);

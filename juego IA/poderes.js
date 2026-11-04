
"use strict";

/* =====================================================
   IA CHALLENGE — SISTEMA DE PODERES Y DESVENTAJAS
   Versión corregida
   ===================================================== */

window.IAChallengePowers = (() => {

    // ================================================
    // 1. ESTADO DEL SISTEMA
    // ================================================

    let escudos = 1;
    let pistas = 2;
    let dobles = 1;
    let reinicios = 1;

    let escudoActivo = false;
    let dobleActivo = false;
    let sobrecargaActiva = false;

    let eventoActual = "";
    let callbacks = {};
    let panel = null;

    let eventoTimeout = null;
    let efectoTimeout = null;

    const $ = id => document.getElementById(id);

    // ================================================
    // 2. INICIALIZAR SISTEMA
    // ================================================

    function iniciar(config = {}) {

        callbacks = config || {};

        escudos = 1;
        pistas = 2;
        dobles = 1;
        reinicios = 1;

        escudoActivo = false;
        dobleActivo = false;
        sobrecargaActiva = false;
        eventoActual = "";

        if (eventoTimeout) clearTimeout(eventoTimeout);
        if (efectoTimeout) clearTimeout(efectoTimeout);

        document.body.classList.remove(
            "neural-interference",
            "shield-effect"
        );

        crearPanel();
        actualizarPanel();
    }

    // ================================================
    // 3. CREAR PANEL DE PODERES
    // ================================================

    function crearPanel() {

        const panelAnterior = $("powers-panel");

        if (panelAnterior) {
            panelAnterior.remove();
        }

        panel = document.createElement("section");

        panel.id = "powers-panel";
        panel.className = "powers-panel";

        panel.innerHTML = `
            <div class="powers-heading">
                <span class="powers-eyebrow">
                    SISTEMA DE COMBATE
                </span>

                <h3>Habilidades especiales</h3>

                <p>
                    Activa tus recursos estratégicamente.
                </p>
            </div>

            <div class="powers-grid">

                <button type="button"
                    class="power-card"
                    data-power="shield">

                    <span class="power-icon">🛡️</span>
                    <span class="power-name">Escudo</span>

                    <span class="power-description">
                        Bloquea una pérdida de vida.
                    </span>

                    <span class="power-count"
                        id="power-shield-count">1</span>
                </button>

                <button type="button"
                    class="power-card"
                    data-power="hint">

                    <span class="power-icon">💡</span>
                    <span class="power-name">Pista táctica</span>

                    <span class="power-description">
                        Obtén una ayuda para resolver el reto.
                    </span>

                    <span class="power-count"
                        id="power-hint-count">2</span>
                </button>

                <button type="button"
                    class="power-card"
                    data-power="double">

                    <span class="power-icon">⚡</span>
                    <span class="power-name">Doble puntos</span>

                    <span class="power-description">
                        Duplica los puntos del próximo acierto.
                    </span>

                    <span class="power-count"
                        id="power-double-count">1</span>
                </button>

                <button type="button"
                    class="power-card"
                    data-power="restart">

                    <span class="power-icon">🔄</span>
                    <span class="power-name">Segunda oportunidad</span>

                    <span class="power-description">
                        Recupera una vida perdida.
                    </span>

                    <span class="power-count"
                        id="power-restart-count">1</span>
                </button>

            </div>

            <div id="power-notice"
                class="power-notice"
                aria-live="polite">
                Sistema de habilidades preparado.
            </div>

            <div id="power-event"
                class="power-event"
                aria-live="polite">
            </div>
        `;

        // Buscar un lugar donde insertar el panel.
        const referencia = document.querySelector(
            "#challenge-container, " +
            "#challenge-content, " +
            "#game-interface, " +
            "#game-area, " +
            ".game-interface, " +
            ".game-container, " +
            "main"
        );

        if (referencia && referencia.parentNode) {

            referencia.parentNode.insertBefore(
                panel,
                referencia
            );

        } else {

            // Evita que el panel desaparezca si no encuentra
            // los identificadores habituales.
            document.body.appendChild(panel);

        }

        // Delegación de eventos para todos los poderes.
        panel.addEventListener("click", event => {

            const button = event.target.closest?.("[data-power]");

            if (!button || button.disabled) return;

            usar(button.dataset.power);

        });

    }

    // ================================================
    // 4. NOTIFICACIONES
    // ================================================

    function aviso(mensaje, tipo = "normal") {

        const notice = $("power-notice");

        if (!notice) return;

        notice.textContent = mensaje;
        notice.className = `power-notice ${tipo}`;

        notice.classList.remove("power-pop");

        void notice.offsetWidth;

        notice.classList.add("power-pop");

    }

    // ================================================
    // 5. ACTUALIZAR INTERFAZ
    // ================================================

    function actualizarPanel() {

        if (!panel || !panel.isConnected) {
            panel = $("powers-panel");
        }

        if (!panel) return;

        const valores = {
            "power-shield-count": escudos,
            "power-hint-count": pistas,
            "power-double-count": dobles,
            "power-restart-count": reinicios
        };

        Object.entries(valores).forEach(([id, cantidad]) => {

            const elemento = $(id);

            if (elemento) {
                elemento.textContent = cantidad;
            }

        });

        panel.querySelectorAll("[data-power]").forEach(button => {

            const tipo = button.dataset.power;

            const agotado = {

                shield: escudos <= 0 || escudoActivo,

                hint: pistas <= 0 ||
                    typeof callbacks.onHint !== "function",

                double: dobles <= 0 || dobleActivo,

                restart: reinicios <= 0 ||
                    typeof callbacks.onRestoreLife !== "function"

            }[tipo];

            button.disabled = Boolean(agotado);

            button.classList.toggle(
                "power-disabled",
                Boolean(agotado)
            );

        });

    }

    // ================================================
    // 6. UTILIZAR PODERES
    // ================================================

    function usar(tipo) {

        switch (tipo) {

            // ----------------------------------------
            // ESCUDO
            // ----------------------------------------

            case "shield":

                if (escudos <= 0 || escudoActivo) return;

                escudos--;

                escudoActivo = true;

                aviso(
                    "¡ESCUDO ACTIVADO! La próxima pérdida de vida será bloqueada.",
                    "success"
                );

                efecto("shield");

                break;

            // ----------------------------------------
            // PISTA TÁCTICA
            // ----------------------------------------

            case "hint":

                if (pistas <= 0) return;

                if (typeof callbacks.onHint !== "function") {

                    aviso(
                        "La función de pistas no está conectada.",
                        "warning"
                    );

                    return;

                }

                pistas--;

                callbacks.onHint();

                aviso(
                    "Pista táctica activada.",
                    "success"
                );

                efecto("hint");

                break;

            // ----------------------------------------
            // DOBLE PUNTOS
            // ----------------------------------------

            case "double":

                if (dobles <= 0 || dobleActivo) return;

                dobles--;

                dobleActivo = true;

                aviso(
                    "¡DOBLE PUNTOS! Tu próximo acierto valdrá el doble.",
                    "success"
                );

                efecto("double");

                break;

            // ----------------------------------------
            // SEGUNDA OPORTUNIDAD
            // ----------------------------------------

            case "restart":

                if (reinicios <= 0) return;

                if (typeof callbacks.onRestoreLife !== "function") {

                    aviso(
                        "La recuperación de vida no está conectada.",
                        "warning"
                    );

                    return;

                }

                // Solo consume el poder si la recuperación
                // realmente se ha realizado.
                if (callbacks.onRestoreLife() === false) {

                    aviso(
                        "No puedes recuperar más vidas.",
                        "warning"
                    );

                    return;

                }

                reinicios--;

                aviso(
                    "¡Segunda oportunidad! Has recuperado una vida.",
                    "success"
                );

                efecto("restart");

                break;

            default:

                return;

        }

        actualizarPanel();

    }

    // ================================================
    // 7. BLOQUEAR PÉRDIDA DE VIDA
    // ================================================

    function bloquearPerdida() {

        if (!escudoActivo) return false;

        escudoActivo = false;

        aviso(
            "¡ESCUDO! Has evitado perder una vida.",
            "success"
        );

        efecto("shield-break");

        actualizarPanel();

        return true;

    }

    // ================================================
    // 8. MULTIPLICADOR DE PUNTOS
    // ================================================

    function consumirMultiplicador() {

        if (!dobleActivo) return 1;

        dobleActivo = false;

        aviso(
            "¡PUNTUACIÓN DUPLICADA!",
            "success"
        );

        actualizarPanel();

        return 2;

    }

    // ================================================
    // 9. DESVENTAJAS ALEATORIAS
    // ================================================

    function activarDesventaja() {

        // Evitar desventajas si no existe una partida activa.
        if (!panel || !panel.isConnected) return;

        // 20 % de probabilidad sin evento.
        // 80 % de probabilidad de desventaja.
        const azar = Math.random();

        if (azar < 0.20) {

            eventoActual = "";

            return;

        }

        let evento;

        if (azar < 0.45) {

            evento = "interferencia";

        } else if (azar < 0.80) {

            evento = "sobrecarga";

        } else {

            evento = "drenaje";

        }

        eventoActual = evento;

        const eventBox = $("power-event");

        if (!eventBox) return;

        // ----------------------------------------
        // INTERFERENCIA NEURAL
        // ----------------------------------------

        if (evento === "interferencia") {

            eventBox.textContent =
                "⚠ INTERFERENCIA NEURAL: ¡Mantén la concentración!";

            document.body.classList.add(
                "neural-interference"
            );

            setTimeout(() => {

                document.body.classList.remove(
                    "neural-interference"
                );

            }, 1800);

            aviso(
                "Interferencia neural detectada. ¡Concéntrate!",
                "warning"
            );

        }

        // ----------------------------------------
        // SOBRECARGA
        // ----------------------------------------

        if (evento === "sobrecarga") {

            sobrecargaActiva = true;

            eventBox.textContent =
                "⚠ SOBRECARGA: tu próximo acierto tendrá una penalización.";

            aviso(
                "Sobrecarga activada: tu próximo acierto dará menos puntos.",
                "warning"
            );

        }

        // ----------------------------------------
        // DRENAJE ENERGÉTICO
        // ----------------------------------------

        if (evento === "drenaje") {

            eventBox.textContent =
                "⚠ DRENAJE: el sistema intenta consumir una vida.";

            if (!bloquearPerdida()) {

                if (typeof callbacks.onLoseLife === "function") {

                    callbacks.onLoseLife();

                }

            }

            aviso(
                "¡Drenaje energético! El sistema ha atacado.",
                "warning"
            );

        }

        // Animación del evento.
        eventBox.classList.remove("event-show");

        void eventBox.offsetWidth;

        eventBox.classList.add("event-show");

    }

    // ================================================
    // 10. CONSUMIR PENALIZACIÓN
    // ================================================

    function consumirPenalizacion() {

        if (!sobrecargaActiva) return 1;

        sobrecargaActiva = false;

        aviso(
            "Sobrecarga: recompensa reducida.",
            "warning"
        );

        return 0.5;

    }

    // ================================================
    // 11. EFECTOS VISUALES
    // ================================================

    function efecto(tipo) {

        if (!panel) return;

        panel.classList.remove("power-effect");

        void panel.offsetWidth;

        panel.classList.add("power-effect");

        if (
            tipo === "shield" ||
            tipo === "shield-break"
        ) {

            document.body.classList.add("shield-effect");

            if (efectoTimeout) {
                clearTimeout(efectoTimeout);
            }

            efectoTimeout = setTimeout(() => {

                document.body.classList.remove(
                    "shield-effect"
                );

            }, 900);

        }

    }

    // ================================================
    // 12. REINICIAR PARTIDA
    // ================================================

    function nuevaPartida() {

        iniciar(callbacks);

    }

    // ================================================
    // 13. EXPORTAR FUNCIONES
    // ================================================

    return {

        iniciar,

        usar,

        bloquearPerdida,

        consumirMultiplicador,

        activarDesventaja,

        consumirPenalizacion,

        actualizarPanel,

        nuevaPartida

    };

})();

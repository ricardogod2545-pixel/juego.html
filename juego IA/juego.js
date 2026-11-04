
"use strict";

/* =========================================================
   IA CHALLENGE — MOTOR PRINCIPAL
   60 RETOS | 3 NIVELES | 4 MODALIDADES
   RETROALIMENTACIÓN | XP | RECOMPENSAS | PODERES
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // 1. CONEXIÓN CON EL HTML
    // =====================================================

    const $ = id => document.getElementById(id);

    const elementos = {
        intro: $("game-intro"),
        game: $("game-interface"),
        final: $("final-screen"),

        start: $("start-game"),
        restart: $("restart-game"),
        submit: $("submit-answer"),
        next: $("next-challenge"),

        title: $("challenge-title"),
        category: $("challenge-category"),
        description: $("challenge-description"),
        content: $("challenge-content"),
        number: $("challenge-number"),
        feedback: $("feedback-message"),

        score: $("score"),
        lives: $("lives"),
        experience: $("experience"),
        mode: $("mode-label"),
        level: $("level-name"),

        progressLabel: $("progress-label"),
        progressPercent: $("progress-percent"),
        progressFill: $("progress-fill"),
        progressTrack: $("progress-track"),

        finalTitle: $("final-title"),
        finalDescription: $("final-description"),
        finalScore: $("final-score"),
        finalCorrect: $("final-correct"),
        finalAccuracy: $("final-accuracy")
    };

    const obligatorios = Object.entries(elementos)
        .filter(([nombre]) => nombre !== "progressTrack");

    const faltantes = obligatorios
        .filter(([, elemento]) => !elemento)
        .map(([nombre]) => nombre);

    if (faltantes.length > 0) {
        console.error(
            "IA CHALLENGE: faltan elementos HTML:",
            faltantes
        );
        return;
    }

    // =====================================================
    // 2. CONFIGURACIÓN
    // =====================================================

    const bancoPreguntas = window.preguntas;

    const TOTAL = 60;

    const NIVELES = [
        "Básico",
        "Intermedio",
        "Avanzado"
    ];

    const TIPOS = [
        "trivia",
        "decision",
        "memory",
        "escape"
    ];

    const LETRAS = ["A", "B", "C", "D"];

    const PUNTOS = {
        "Básico": 100,
        "Intermedio": 150,
        "Avanzado": 200
    };

    let preguntasPartida = [];

    // =====================================================
    // 3. VISIBILIDAD
    // =====================================================

    function mostrar(elemento) {
        if (!elemento) return;

        elemento.hidden = false;
        elemento.classList.remove("hidden");
    }

    function ocultar(elemento) {
        if (!elemento) return;

        elemento.hidden = true;
        elemento.classList.add("hidden");
    }

    // =====================================================
    // 4. ANIMACIONES
    // =====================================================

    function animar(elemento, clase) {
        if (!elemento) return;

        elemento.classList.remove(clase);

        void elemento.offsetWidth;

        elemento.classList.add(clase);

        elemento.addEventListener("animationend", () => {
            elemento.classList.remove(clase);
        }, { once: true });
    }

    function animarCambioReto() {
        animar(elementos.content, "challenge-enter");
        animar(elementos.title, "challenge-enter");
    }

    // =====================================================
    // 5. ALEATORIEDAD
    // =====================================================

    function mezclar(array) {
        const copia = [...array];

        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [copia[i], copia[j]] = [
                copia[j],
                copia[i]
            ];
        }

        return copia;
    }

    // =====================================================
    // 6. VALIDAR BANCO DE PREGUNTAS
    // =====================================================

    function validarBanco() {

        if (!Array.isArray(bancoPreguntas)) {
            console.error(
                "No se encontró window.preguntas. Revisa preguntas.js."
            );
            return false;
        }

        if (bancoPreguntas.length !== TOTAL) {
            console.error(
                `Se necesitan ${TOTAL} retos. Encontrados: ${bancoPreguntas.length}`
            );
            return false;
        }

        const conteoNiveles = {
            "Básico": 0,
            "Intermedio": 0,
            "Avanzado": 0
        };

        const conteoTipos = {
            trivia: 0,
            decision: 0,
            memory: 0,
            escape: 0
        };

        for (const reto of bancoPreguntas) {

            if (
                !reto ||
                !reto.titulo ||
                !reto.concepto ||
                !reto.explicacion ||
                !reto.categoria ||
                !reto.descripcion ||
                !NIVELES.includes(reto.nivel) ||
                !TIPOS.includes(reto.tipo)
            ) {
                console.error(
                    "Reto con información incompleta:",
                    reto
                );
                return false;
            }

            conteoNiveles[reto.nivel]++;
            conteoTipos[reto.tipo]++;

            if (
                reto.tipo === "trivia" ||
                reto.tipo === "decision"
            ) {
                if (
                    !Array.isArray(reto.opciones) ||
                    reto.opciones.length < 2 ||
                    !Number.isInteger(reto.respuesta) ||
                    reto.respuesta < 0 ||
                    reto.respuesta >= reto.opciones.length
                ) {
                    console.error("Opciones inválidas:", reto);
                    return false;
                }

                if (
                    reto.tipo === "decision" &&
                    (!reto.escenario || !reto.accion)
                ) {
                    console.error(
                        "Caso práctico incompleto:",
                        reto
                    );
                    return false;
                }
            }

            if (reto.tipo === "memory") {

                if (
                    !Array.isArray(reto.pares) ||
                    reto.pares.length !== 4 ||
                    !reto.pares.every(par =>
                        par.termino && par.definicion
                    )
                ) {
                    console.error(
                        "Reto de memoria inválido:",
                        reto
                    );
                    return false;
                }
            }

            if (reto.tipo === "escape") {

                if (
                    !reto.pista ||
                    !reto.respuesta ||
                    (
                        Array.isArray(reto.respuesta) &&
                        reto.respuesta.length === 0
                    )
                ) {
                    console.error(
                        "Reto Escape inválido:",
                        reto
                    );
                    return false;
                }
            }
        }

        const nivelesCorrectos = NIVELES.every(
            nivel => conteoNiveles[nivel] === 20
        );

        const tiposCorrectos = TIPOS.every(
            tipo => conteoTipos[tipo] === 15
        );

        console.table(conteoNiveles);
        console.table(conteoTipos);

        if (!nivelesCorrectos) {
            console.error(
                "El banco debe tener 20 retos por nivel."
            );
        }

        if (!tiposCorrectos) {
            console.error(
                "El banco debe tener 15 retos por modalidad."
            );
        }

        return nivelesCorrectos && tiposCorrectos;
    }

    if (!validarBanco()) {
        elementos.start.disabled = true;
        elementos.start.textContent = "REVISAR BANCO DE RETOS";
        return;
    }

    // =====================================================
    // 7. PREPARAR RETOS ALEATORIOS
    // =====================================================

    function prepararPreguntasPartida() {

        const nuevaPartida = [];

        NIVELES.forEach(nivel => {

            const retosNivel = bancoPreguntas.filter(
                reto => reto.nivel === nivel
            );

            mezclar(retosNivel).forEach(original => {

                const reto = { ...original };

                if (
                    reto.tipo === "trivia" ||
                    reto.tipo === "decision"
                ) {

                    const opciones = reto.opciones.map(
                        (texto, index) => ({
                            texto,
                            correcta: index === reto.respuesta
                        })
                    );

                    const mezcladas = mezclar(opciones);

                    reto.opciones = mezcladas.map(
                        opcion => opcion.texto
                    );

                    reto.respuesta = mezcladas.findIndex(
                        opcion => opcion.correcta
                    );
                }

                if (reto.tipo === "memory") {
                    reto.pares = mezclar(
                        reto.pares.map(par => ({ ...par }))
                    );
                }

                nuevaPartida.push(reto);
            });
        });

        preguntasPartida = nuevaPartida;

        console.log(
            "Nueva partida aleatoria preparada."
        );
    }

    // =====================================================
    // 8. SISTEMA DE RECOMPENSAS
    // =====================================================

    function obtenerSistemaRecompensas() {
        return window.IARewards || null;
    }

    function iniciarRecompensas() {

        const sistema = obtenerSistemaRecompensas();

        if (typeof sistema?.iniciarPartida === "function") {
            sistema.iniciarPartida();
        }
    }

    function registrarXP(reto) {

        const sistema = obtenerSistemaRecompensas();

        if (typeof sistema?.registrarAcierto === "function") {
            sistema.registrarAcierto(
                reto.tipo,
                reto.nivel
            );
        }
    }

    function registrarErrorXP() {

        const sistema = obtenerSistemaRecompensas();

        if (typeof sistema?.registrarError === "function") {
            sistema.registrarError();
        }
    }

    function finalizarRecompensas() {

        const sistema = obtenerSistemaRecompensas();

        if (typeof sistema?.finalizarPartida === "function") {
            sistema.finalizarPartida();
        }
    }

    function obtenerXP() {

        const sistema = obtenerSistemaRecompensas();

        if (typeof sistema?.obtenerResumen === "function") {

            const resumen = sistema.obtenerResumen();

            if (
                resumen &&
                Number.isFinite(Number(resumen.xp))
            ) {
                return Number(resumen.xp);
            }
        }

        return 0;
    }

    // =====================================================
    // 9. ESTADO DEL JUEGO
    // =====================================================

    let indice = 0;
    let puntuacion = 0;
    let vidas = 3;
    let correctas = 0;

    let retosJugados = 0;

    let respondido = false;
    let juegoFinalizado = false;
    let retoRegistrado = false;

    let seleccionTrivia = null;
    let seleccionMemoria = [];

    let parejasEncontradas = 0;
    let bloqueandoMemoria = false;

    let temporizadorMemoria = null;

    // =====================================================
    // 10. PODERES
    // =====================================================

    function poderesDisponibles() {

        return Boolean(
            window.IAChallengePowers &&
            typeof window.IAChallengePowers.bloquearPerdida === "function"
        );
    }

    function mostrarAvisoPoder(mensaje) {

        const aviso = $("power-notice");

        if (!aviso) return;

        aviso.textContent = mensaje;
        aviso.classList.add("power-pop");

        setTimeout(() => {
            aviso.classList.remove("power-pop");
        }, 2500);
    }

    // Pérdida normal de vida.
    // Comprueba primero si hay escudo.

    function perderVida() {

        if (juegoFinalizado) return false;

        if (
            poderesDisponibles() &&
            window.IAChallengePowers.bloquearPerdida()
        ) {
            mostrarAvisoPoder(
                "¡Escudo activado! No has perdido una vida."
            );

            actualizarEstado();
            return false;
        }

        vidas = Math.max(0, vidas - 1);

        animar(elementos.lives, "life-lost");

        actualizarEstado();

        return true;
    }

    // Pérdida directa para desventajas:
    // el módulo de poderes ya comprueba el escudo.

    function perderVidaPorDesventaja() {

        if (juegoFinalizado) return;

        vidas = Math.max(0, vidas - 1);

        animar(elementos.lives, "life-lost");

        actualizarEstado();

        if (vidas <= 0 && respondido) {
            elementos.next.textContent = "VER RESULTADOS ↗";
        }
    }

    function recuperarVida() {

        if (juegoFinalizado || vidas >= 3) {
            mostrarAvisoPoder(
                "Ya tienes el máximo de vidas."
            );

            return false;
        }

        vidas++;

        animar(elementos.lives, "life-restored");

        actualizarEstado();

        return true;
    }

    // =====================================================
    // 11. PISTAS POR MODALIDAD
    // =====================================================

    function aplicarPista() {

        if (respondido || juegoFinalizado) return;

        const reto = preguntasPartida[indice];

        if (!reto) return;

        // TRIVIA Y DECISIÓN

        if (
            reto.tipo === "trivia" ||
            reto.tipo === "decision"
        ) {

            const opciones = [
                ...elementos.content.querySelectorAll(
                    ".answer-option"
                )
            ];

            const incorrectas = opciones.filter(
                (boton, index) =>
                    index !== reto.respuesta &&
                    !boton.disabled
            );

            if (incorrectas.length === 0) {
                mostrarAvisoPoder(
                    "Ya no hay opciones que eliminar."
                );
                return;
            }

            const elegida = mezclar(incorrectas)[0];

            const indiceEliminado = opciones.indexOf(elegida);

            elegida.disabled = true;
            elegida.classList.add("hint-eliminated");

            if (seleccionTrivia === indiceEliminado) {
                seleccionTrivia = null;
                elegida.classList.remove("selected");
            }

            if (seleccionTrivia === null) {
                ocultar(elementos.submit);
            }

            mostrarAvisoPoder(
                "Pista táctica: una opción incorrecta ha sido eliminada."
            );

            return;
        }

        // MEMORIA

        if (reto.tipo === "memory") {

            const tarjetas = [
                ...elementos.content.querySelectorAll(
                    ".memory-card"
                )
            ];

            const disponibles = tarjetas.filter(
                tarjeta =>
                    !tarjeta.classList.contains("matched")
            );

            if (disponibles.length === 0) return;

            const pareja = disponibles[0].dataset.pair;

            tarjetas.forEach(tarjeta => {

                if (tarjeta.dataset.pair === pareja) {
                    tarjeta.classList.add(
                        "power-hint-highlight"
                    );
                }
            });

            setTimeout(() => {

                tarjetas.forEach(tarjeta => {
                    tarjeta.classList.remove(
                        "power-hint-highlight"
                    );
                });

            }, 2500);

            mostrarAvisoPoder(
                "Pista táctica: observa las dos tarjetas resaltadas."
            );

            return;
        }

        // ESCAPE IA

        if (reto.tipo === "escape") {

            const respuestas = Array.isArray(reto.respuesta)
                ? reto.respuesta
                : [reto.respuesta];

            const respuesta = String(
                respuestas[0]
            ).trim();

            const caja = elementos.content.querySelector(
                ".escape-box"
            );

            if (!caja) return;

            if (
                caja.querySelector(".escape-extra-hint")
            ) {
                mostrarAvisoPoder(
                    "Ya tienes una pista adicional."
                );
                return;
            }

            const pistaExtra = document.createElement("p");

            pistaExtra.className = "escape-extra-hint";

            pistaExtra.textContent =
                `Pista adicional: comienza por "${respuesta.charAt(0).toUpperCase()}" y tiene ${respuesta.length} caracteres.`;

            caja.appendChild(pistaExtra);

            mostrarAvisoPoder(
                "Pista táctica desbloqueada."
            );
        }
    }

    function inicializarPoderes() {

        if (!window.IAChallengePowers) {

            console.warn(
                "Poderes no cargados. El juego funcionará sin ellos."
            );

            return;
        }

        if (
            typeof window.IAChallengePowers.iniciar !== "function"
        ) {
            console.warn(
                "El módulo de poderes no tiene una función iniciar válida."
            );

            return;
        }

        window.IAChallengePowers.iniciar({

            onHint: aplicarPista,

            onRestoreLife: recuperarVida,

            // El módulo ya verifica el escudo antes
            // de ejecutar esta función.

            onLoseLife: perderVidaPorDesventaja
        });
    }

    function reiniciarPoderes() {

        if (
            poderesDisponibles() &&
            typeof window.IAChallengePowers.nuevaPartida === "function"
        ) {
            window.IAChallengePowers.nuevaPartida();
        }
    }

    function activarDesventajaProgramada() {

        if (
            retosJugados > 0 &&
            retosJugados % 4 === 0 &&
            retosJugados < TOTAL &&
            poderesDisponibles() &&
            typeof window.IAChallengePowers.activarDesventaja === "function"
        ) {
            window.IAChallengePowers.activarDesventaja();
        }
    }

    function obtenerMultiplicador() {

        if (
            poderesDisponibles() &&
            typeof window.IAChallengePowers.consumirMultiplicador === "function"
        ) {
            return window.IAChallengePowers.consumirMultiplicador();
        }

        return 1;
    }

    function obtenerPenalizacion() {

        if (
            poderesDisponibles() &&
            typeof window.IAChallengePowers.consumirPenalizacion === "function"
        ) {
            return window.IAChallengePowers.consumirPenalizacion();
        }

        return 1;
    }

    // =====================================================
    // 12. REGISTRO DE RETOS COMPLETADOS
    // =====================================================

    function registrarRetoCompletado() {

        if (retoRegistrado) return false;

        retoRegistrado = true;

        retosJugados++;

        activarDesventajaProgramada();

        return true;
    }

    // =====================================================
    // 13. INICIAR PARTIDA
    // =====================================================

    function iniciarJuego() {

        if (temporizadorMemoria) {
            clearTimeout(temporizadorMemoria);
            temporizadorMemoria = null;
        }

        indice = 0;
        puntuacion = 0;
        vidas = 3;
        correctas = 0;
        retosJugados = 0;

        respondido = false;
        juegoFinalizado = false;
        retoRegistrado = false;

        seleccionTrivia = null;
        seleccionMemoria = [];

        parejasEncontradas = 0;
        bloqueandoMemoria = false;

        prepararPreguntasPartida();

        iniciarRecompensas();
        reiniciarPoderes();

        ocultar(elementos.intro);
        ocultar(elementos.final);

        mostrar(elementos.game);

        cargarReto();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        console.log(
            "Partida iniciada correctamente."
        );
    }

    elementos.start.addEventListener(
        "click",
        iniciarJuego
    );

    elementos.restart.addEventListener(
        "click",
        iniciarJuego
    );

    // =====================================================
    // 14. ACTUALIZAR ESTADÍSTICAS
    // =====================================================

    function actualizarEstado() {

        elementos.score.textContent =
            String(puntuacion).padStart(3, "0");

        elementos.lives.textContent = vidas;

        elementos.experience.textContent =
            obtenerXP() + " XP";

        const porcentaje = Math.round(
            (retosJugados / TOTAL) * 100
        );

        elementos.progressLabel.textContent =
            `${retosJugados}/${TOTAL}`;

        elementos.progressPercent.textContent =
            porcentaje + "%";

        elementos.progressFill.style.width =
            porcentaje + "%";

        if (elementos.progressTrack) {

            elementos.progressTrack.setAttribute(
                "aria-valuenow",
                porcentaje
            );
        }

        const reto = preguntasPartida[indice];

        if (reto) {
            elementos.level.textContent = reto.nivel;
        }
    }

    // =====================================================
    // 15. CARGAR RETO
    // =====================================================

    function cargarReto() {

        if (juegoFinalizado) return;

        if (indice >= TOTAL || vidas <= 0) {
            finalizarJuego();
            return;
        }

        const reto = preguntasPartida[indice];

        if (!reto) {
            finalizarJuego();
            return;
        }

        respondido = false;
        retoRegistrado = false;

        seleccionTrivia = null;
        seleccionMemoria = [];

        parejasEncontradas = 0;
        bloqueandoMemoria = false;

        elementos.title.textContent = reto.titulo;

        elementos.category.textContent =
            reto.categoria.toUpperCase();

        elementos.description.textContent =
            reto.descripcion;

        elementos.number.textContent =
            `RETO ${indice + 1} DE ${TOTAL}`;

        elementos.mode.textContent =
            obtenerNombreModo(reto.tipo);

        elementos.feedback.textContent = "";

        elementos.feedback.className =
            "feedback-message";

        elementos.content.innerHTML = "";

        ocultar(elementos.submit);
        ocultar(elementos.next);

        elementos.submit.onclick = null;

        elementos.next.textContent =
            "SIGUIENTE DESAFÍO ↗";

        if (reto.tipo === "trivia") {
            mostrarTrivia(reto);
        }

        if (reto.tipo === "decision") {
            mostrarDecision(reto);
        }

        if (reto.tipo === "memory") {
            mostrarMemoria(reto);
        }

        if (reto.tipo === "escape") {
            mostrarEscape(reto);
        }

        actualizarEstado();
        actualizarTemaNivel();
        animarCambioReto();
    }

    function obtenerNombreModo(tipo) {

        const nombres = {
            trivia: "TRIVIA",
            decision: "CASO PRÁCTICO",
            memory: "MEMORIA",
            escape: "ESCAPE IA"
        };

        return nombres[tipo] || "DESAFÍO";
    }

    // =====================================================
    // 16. CREAR OPCIONES
    // =====================================================

    function crearOpciones(reto) {

        const contenedor = document.createElement("div");

        contenedor.className = "answer-options";

        reto.opciones.forEach((opcion, index) => {

            const boton = document.createElement("button");

            boton.type = "button";
            boton.className = "answer-option";

            const letra = document.createElement("span");

            letra.className = "option-letter";

            letra.textContent =
                LETRAS[index] || (index + 1);

            const texto = document.createElement("span");

            texto.textContent = opcion;

            boton.append(letra, texto);

            boton.addEventListener("click", () => {

                if (respondido || boton.disabled) return;

                seleccionTrivia = index;

                contenedor
                    .querySelectorAll(".answer-option")
                    .forEach(opcionBoton => {
                        opcionBoton.classList.remove("selected");
                    });

                boton.classList.add("selected");

                mostrar(elementos.submit);
            });

            contenedor.appendChild(boton);
        });

        return contenedor;
    }

    // =====================================================
    // 17. TRIVIA
    // =====================================================

    function mostrarTrivia(reto) {

        const pregunta = document.createElement("p");

        pregunta.className = "challenge-question";

        pregunta.textContent = reto.pregunta;

        elementos.content.append(
            pregunta,
            crearOpciones(reto)
        );

        elementos.submit.textContent =
            "COMPROBAR RESPUESTA ↗";

        elementos.submit.onclick = comprobarTrivia;
    }

    // =====================================================
    // 18. DECISIÓN
    // =====================================================

    function mostrarDecision(reto) {

        const caso = document.createElement("div");

        caso.className = "decision-case";

        const etiqueta = document.createElement("span");

        etiqueta.className = "decision-label";

        etiqueta.textContent =
            "ANÁLISIS DE SITUACIÓN";

        const escenario = document.createElement("p");

        escenario.className = "decision-scenario";

        escenario.textContent = reto.escenario;

        const accion = document.createElement("p");

        accion.className = "decision-action";

        accion.textContent = reto.accion;

        caso.append(
            etiqueta,
            escenario,
            accion
        );

        elementos.content.append(
            caso,
            crearOpciones(reto)
        );

        elementos.submit.textContent =
            "CONFIRMAR DECISIÓN ↗";

        elementos.submit.onclick = comprobarTrivia;
    }

    // =====================================================
    // 19. COMPROBAR TRIVIA Y DECISIÓN
    // =====================================================

    function comprobarTrivia() {

        if (
            respondido ||
            seleccionTrivia === null
        ) {
            return;
        }

        const reto = preguntasPartida[indice];

        respondido = true;

        const opciones =
            elementos.content.querySelectorAll(
                ".answer-option"
            );

        opciones.forEach((boton, index) => {

            boton.disabled = true;

            if (index === reto.respuesta) {
                boton.classList.add("correct");
            } else if (index === seleccionTrivia) {
                boton.classList.add("incorrect");
            }
        });

        if (seleccionTrivia === reto.respuesta) {
            respuestaCorrecta(reto);
        } else {
            respuestaIncorrecta(reto);
        }
    }

    // =====================================================
    // 20. MEMORIA
    // =====================================================

    function mostrarMemoria(reto) {

        const instruccion = document.createElement("p");

        instruccion.className = "memory-instruction";

        instruccion.textContent =
            "Selecciona dos tarjetas y encuentra la relación entre concepto y definición.";

        const tablero = document.createElement("div");

        tablero.className = "memory-grid";

        const tarjetas = [];

        reto.pares.forEach((par, index) => {

            tarjetas.push({
                texto: par.termino,
                pareja: index,
                tipo: "termino"
            });

            tarjetas.push({
                texto: par.definicion,
                pareja: index,
                tipo: "definicion"
            });
        });

        const tarjetasMezcladas = mezclar(tarjetas);

        tarjetasMezcladas.forEach(tarjeta => {

            const boton = document.createElement("button");

            boton.type = "button";
            boton.className = "memory-card";

            boton.textContent = tarjeta.texto;

            boton.dataset.pair = tarjeta.pareja;
            boton.dataset.type = tarjeta.tipo;

            boton.addEventListener("click", () => {
                seleccionarMemoria(boton);
            });

            tablero.appendChild(boton);
        });

        elementos.content.append(
            instruccion,
            tablero
        );
    }

    function seleccionarMemoria(boton) {

        if (
            respondido ||
            bloqueandoMemoria ||
            boton.disabled ||
            boton.classList.contains("selected") ||
            boton.classList.contains("matched")
        ) {
            return;
        }

        boton.classList.add("selected");

        seleccionMemoria.push(boton);

        if (seleccionMemoria.length === 2) {
            comprobarPareja();
        }
    }

    function comprobarPareja() {

        const primera = seleccionMemoria[0];
        const segunda = seleccionMemoria[1];

        const coincide =
            primera.dataset.pair === segunda.dataset.pair &&
            primera.dataset.type !== segunda.dataset.type;

        if (coincide) {

            primera.classList.remove("selected");
            segunda.classList.remove("selected");

            primera.classList.add("matched");
            segunda.classList.add("matched");

            primera.disabled = true;
            segunda.disabled = true;

            parejasEncontradas++;

            seleccionMemoria = [];

            elementos.feedback.textContent =
                "✓ ¡Excelente! Has relacionado correctamente un concepto.";

            elementos.feedback.className =
                "feedback-message success show";

            if (
                parejasEncontradas ===
                preguntasPartida[indice].pares.length
            ) {

                respondido = true;

                respuestaCorrecta(
                    preguntasPartida[indice]
                );
            }

        } else {

            bloqueandoMemoria = true;

            perderVida();

            registrarErrorXP();

            const reto = preguntasPartida[indice];

            mostrarFeedback(
                "✕ PAREJA INCORRECTA",
                reto.explicacion,
                reto.concepto,
                "error"
            );

            const incorrectas = [...seleccionMemoria];

            temporizadorMemoria = setTimeout(() => {

                incorrectas.forEach(tarjeta => {
                    tarjeta.classList.remove("selected");
                });

                seleccionMemoria = [];

                bloqueandoMemoria = false;

                temporizadorMemoria = null;

                if (vidas <= 0) {
                    terminarMemoriaPorAgotamiento();
                }

                actualizarEstado();

            }, 1000);
        }
    }

    function terminarMemoriaPorAgotamiento() {

        if (respondido || juegoFinalizado) return;

        respondido = true;

        const reto = preguntasPartida[indice];

        registrarRetoCompletado();

        mostrarFeedback(
            "✕ VIDAS AGOTADAS",
            reto.explicacion,
            reto.concepto,
            "error"
        );

        const respuesta = document.createElement("p");

        respuesta.className = "correct-answer-text";

        respuesta.textContent =
            "Debías relacionar correctamente todos los conceptos y definiciones.";

        elementos.feedback.appendChild(respuesta);

        mostrarSiguiente();

        actualizarEstado();

        if (vidas <= 0) {
            elementos.next.textContent = "VER RESULTADOS ↗";
        }
    }

    // =====================================================
    // 21. ESCAPE IA
    // =====================================================

    function mostrarEscape(reto) {

        const caja = document.createElement("div");

        caja.className = "escape-box";

        const codigo = document.createElement("div");

        codigo.className = "escape-code";

        codigo.textContent =
            "ACCESO RESTRINGIDO // DESCIFRA LA CLAVE";

        const pista = document.createElement("p");

        pista.className = "escape-hint";

        pista.textContent = reto.pista;

        const input = document.createElement("input");

        input.type = "text";
        input.className = "escape-input";
        input.id = "escape-answer";

        input.placeholder =
            "Escribe aquí la palabra clave...";

        input.autocomplete = "off";

        input.addEventListener("keydown", evento => {

            if (evento.key === "Enter") {
                comprobarEscape();
            }
        });

        caja.append(
            codigo,
            pista,
            input
        );

        elementos.content.appendChild(caja);

        elementos.submit.textContent =
            "DESBLOQUEAR ACCESO ↗";

        elementos.submit.onclick = comprobarEscape;

        mostrar(elementos.submit);

        setTimeout(() => {
            input.focus();
        }, 100);
    }

    function normalizar(texto) {

        return String(texto)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
    }

    function comprobarEscape() {

        if (respondido) return;

        const reto = preguntasPartida[indice];

        const input = $("escape-answer");

        if (!input || !input.value.trim()) {

            input?.focus();

            return;
        }

        const respuestaUsuario = normalizar(
            input.value
        );

        const respuestasEsperadas =
            Array.isArray(reto.respuesta)
                ? reto.respuesta
                : [reto.respuesta];

        const coincide = respuestasEsperadas.some(
            respuesta =>
                normalizar(respuesta) === respuestaUsuario
        );

        respondido = true;

        input.disabled = true;

        if (coincide) {
            respuestaCorrecta(reto);
        } else {
            respuestaIncorrecta(reto);
        }
    }

    // =====================================================
    // 22. RESPUESTA CORRECTA
    // =====================================================

    function respuestaCorrecta(reto) {

        if (juegoFinalizado || retoRegistrado) return;

        respondido = true;

        correctas++;

        const puntosBase = PUNTOS[reto.nivel] || 100;

        const multiplicador = obtenerMultiplicador();

        const penalizacion = obtenerPenalizacion();

        const puntosGanados = Math.round(
            puntosBase * multiplicador * penalizacion
        );

        puntuacion += puntosGanados;

        registrarXP(reto);

        registrarRetoCompletado();

        mostrarFeedback(
            `✓ ¡RESPUESTA CORRECTA! +${puntosGanados} PUNTOS`,
            reto.explicacion,
            reto.concepto,
            "success"
        );

        animar(elementos.feedback, "feedback-correct");

        ocultar(elementos.submit);

        mostrarSiguiente();

        actualizarEstado();

        animar(elementos.score, "score-pop");

        if (vidas <= 0) {
            elementos.next.textContent =
                "VER RESULTADOS ↗";
        }
    }

    // =====================================================
    // 23. RESPUESTA INCORRECTA
    // =====================================================

    function respuestaIncorrecta(reto) {

        if (juegoFinalizado || retoRegistrado) return;

        respondido = true;

        perderVida();

        registrarErrorXP();

        registrarRetoCompletado();

        mostrarFeedback(
            "✕ RESPUESTA INCORRECTA",
            reto.explicacion,
            reto.concepto,
            "error"
        );

        animar(elementos.feedback, "feedback-error");

        const respuesta = obtenerRespuestaCorrecta(reto);

        const respuestaTexto = document.createElement("p");

        respuestaTexto.className = "correct-answer-text";

        const etiqueta = document.createElement("strong");

        etiqueta.textContent = "Respuesta correcta: ";

        respuestaTexto.append(
            etiqueta,
            document.createTextNode(respuesta)
        );

        elementos.feedback.appendChild(respuestaTexto);

        ocultar(elementos.submit);

        mostrarSiguiente();

        actualizarEstado();

        if (vidas <= 0) {
            elementos.next.textContent =
                "VER RESULTADOS ↗";
        }
    }

    // =====================================================
    // 24. RETROALIMENTACIÓN EDUCATIVA
    // =====================================================

    function mostrarFeedback(
        titulo,
        explicacion,
        concepto,
        tipo
    ) {

        elementos.feedback.innerHTML = "";

        const encabezado = document.createElement("strong");

        encabezado.textContent = titulo;

        const texto = document.createElement("p");

        texto.textContent = explicacion;

        const conceptoTexto = document.createElement("p");

        const etiqueta = document.createElement("strong");

        etiqueta.textContent =
            "Concepto relacionado: ";

        conceptoTexto.append(
            etiqueta,
            document.createTextNode(concepto)
        );

        elementos.feedback.append(
            encabezado,
            texto,
            conceptoTexto
        );

        elementos.feedback.className =
            `feedback-message ${tipo} show`;
    }

    function obtenerRespuestaCorrecta(reto) {

        if (
            reto.tipo === "trivia" ||
            reto.tipo === "decision"
        ) {
            return reto.opciones[reto.respuesta];
        }

        if (reto.tipo === "escape") {

            return Array.isArray(reto.respuesta)
                ? reto.respuesta[0]
                : reto.respuesta;
        }

        return "Relacionar correctamente todos los pares.";
    }

    // =====================================================
    // 25. SIGUIENTE RETO
    // =====================================================

    function mostrarSiguiente() {

        mostrar(elementos.next);

        elementos.next.textContent =
            vidas <= 0
                ? "VER RESULTADOS ↗"
                : "SIGUIENTE DESAFÍO ↗";
    }

    elementos.next.addEventListener("click", () => {

        if (!respondido || juegoFinalizado) return;

        if (temporizadorMemoria) {
            clearTimeout(temporizadorMemoria);
            temporizadorMemoria = null;
        }

        indice++;

        if (indice >= TOTAL || vidas <= 0) {
            finalizarJuego();
        } else {
            cargarReto();
        }
    });

    // =====================================================
    // 26. RESULTADOS FINALES
    // =====================================================

    function finalizarJuego() {

        if (juegoFinalizado) return;

        juegoFinalizado = true;

        if (temporizadorMemoria) {
            clearTimeout(temporizadorMemoria);
            temporizadorMemoria = null;
        }

        finalizarRecompensas();

        ocultar(elementos.game);
        ocultar(elementos.intro);

        mostrar(elementos.final);

        const precision = retosJugados > 0
            ? Math.round(
                (correctas / retosJugados) * 100
            )
            : 0;

        let titulo = "¡Buen intento!";

        let descripcion =
            "Has finalizado tu recorrido. Sigue practicando para fortalecer tus conocimientos sobre inteligencia artificial.";

        if (
            correctas === TOTAL &&
            retosJugados === TOTAL
        ) {

            titulo = "¡DOMINIO TOTAL DE LA IA!";

            descripcion =
                "Superaste los 60 desafíos y demostraste un excelente dominio de los conceptos de inteligencia artificial.";

        } else if (precision >= 90) {

            titulo = "¡EXCELENTE TRABAJO!";

            descripcion =
                "Tienes una gran comprensión de los conceptos de inteligencia artificial.";

        } else if (precision >= 70) {

            titulo = "¡VAS POR BUEN CAMINO!";

            descripcion =
                "Has demostrado conocimientos importantes. Continúa practicando para alcanzar el dominio completo.";
        }

        elementos.finalTitle.textContent = titulo;

        elementos.finalDescription.textContent =
            descripcion;

        elementos.finalScore.textContent =
            puntuacion + " PUNTOS";

        elementos.finalCorrect.textContent =
            `${correctas}/${retosJugados}`;

        elementos.finalAccuracy.textContent =
            precision + "%";

        // ESTADÍSTICAS ADICIONALES

        const estadisticas = document.querySelector(
            ".final-stats"
        );

        if (estadisticas) {

            let extra = $("final-extra-stats");

            if (!extra) {

                extra = document.createElement("div");

                extra.id = "final-extra-stats";

                extra.className = "final-extra-stats";

                estadisticas.insertAdjacentElement(
                    "afterend",
                    extra
                );
            }

            let nivelAlcanzado = "Sin nivel";

            if (retosJugados > 0) {

                if (retosJugados <= 20) {
                    nivelAlcanzado = "Básico";
                } else if (retosJugados <= 40) {
                    nivelAlcanzado = "Intermedio";
                } else {
                    nivelAlcanzado = "Avanzado";
                }
            }

            extra.innerHTML = "";

            const datos = [
                [
                    "RETOS COMPLETADOS",
                    `${retosJugados}/${TOTAL}`
                ],
                [
                    "NIVEL ALCANZADO",
                    nivelAlcanzado
                ],
                [
                    "EXPERIENCIA TOTAL",
                    `${obtenerXP()} XP`
                ],
                [
                    "VIDAS RESTANTES",
                    `${vidas}/3`
                ]
            ];

            datos.forEach(([etiqueta, valor]) => {

                const tarjeta = document.createElement("div");

                tarjeta.className = "final-extra-card";

                const tituloDato =
                    document.createElement("span");

                tituloDato.textContent = etiqueta;

                const valorDato =
                    document.createElement("strong");

                valorDato.textContent = valor;

                tarjeta.append(
                    tituloDato,
                    valorDato
                );

                extra.appendChild(tarjeta);
            });
        }

        // RESUMEN DE RECOMPENSAS

        const descripcionRecompensas = $(
            "final-rewards-description"
        );

        if (descripcionRecompensas) {

            descripcionRecompensas.textContent =
                `Experiencia acumulada: ${obtenerXP()} XP. Has obtenido ${puntuacion} puntos en tu misión.`;
        }

        console.log("==================================");
        console.log("PARTIDA FINALIZADA");
        console.log("Puntuación:", puntuacion);
        console.log("Respuestas correctas:", correctas);
        console.log("Retos completados:", retosJugados);
        console.log("Precisión:", precision + "%");
        console.log("Experiencia:", obtenerXP());
        console.log("==================================");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    // =====================================================
    // 27. TEMA VISUAL SEGÚN EL NIVEL
    // =====================================================

    function actualizarTemaNivel() {

        const nivel = elementos.level.textContent
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        document.body.classList.remove(
            "level-basic",
            "level-intermediate",
            "level-advanced"
        );

        if (nivel.includes("basico")) {

            document.body.classList.add(
                "level-basic"
            );

        } else if (nivel.includes("intermedio")) {

            document.body.classList.add(
                "level-intermediate"
            );

        } else if (nivel.includes("avanzado")) {

            document.body.classList.add(
                "level-advanced"
            );
        }
    }

    const observadorNivel = new MutationObserver(
        actualizarTemaNivel
    );

    observadorNivel.observe(elementos.level, {
        childList: true,
        characterData: true,
        subtree: true
    });

    // =====================================================
    // 28. ESTADO INICIAL
    // =====================================================

    inicializarPoderes();

    ocultar(elementos.game);
    ocultar(elementos.final);

    mostrar(elementos.intro);

    ocultar(elementos.submit);
    ocultar(elementos.next);

    elementos.start.disabled = false;

    actualizarTemaNivel();

    console.log("==================================");
    console.log("IA CHALLENGE PREPARADO");
    console.log("Retos:", TOTAL);
    console.log("Niveles:", NIVELES.join(", "));
    console.log("Modalidades:", TIPOS.join(", "));
    console.log("Aleatoriedad: ACTIVADA");
    console.log("Retroalimentación: ACTIVADA");
    console.log("Estadísticas: ACTIVADAS");
    console.log(
        "Poderes:",
        poderesDisponibles()
            ? "CONECTADOS"
            : "NO CARGADOS"
    );
    console.log("==================================");

});


"use strict";

/* =====================================================
   IA CHALLENGE — RECOMPENSAS POR JUGADOR
   XP | RANGOS | INSIGNIAS | PERFILES INDIVIDUALES
   Integración con juego.js
   ===================================================== */

(() => {

    // ==========================================
    // 1. CONFIGURACIÓN
    // ==========================================

    const STORAGE_PREFIX = "iaChallengeRewards_v2_";

    const TOTAL_RETOS = 60;

    const TIPOS_VALIDOS = [
        "trivia",
        "decision",
        "memory",
        "escape"
    ];

    const RANGOS = [
        { nombre: "Cadete IA", xp: 0 },
        { nombre: "Explorador IA", xp: 150 },
        { nombre: "Analista IA", xp: 400 },
        { nombre: "Estratega IA", xp: 800 },
        { nombre: "Maestro IA", xp: 1400 },
        { nombre: "Leyenda IA", xp: 2200 }
    ];

    const INSIGNIAS = [
        {
            id: "primer_acierto",
            nombre: "Primer contacto",
            icono: "🎯",
            descripcion: "Consigue tu primera respuesta correcta.",
            condicion: p => p.correctas >= 1
        },
        {
            id: "racha_5",
            nombre: "Imparable",
            icono: "🔥",
            descripcion: "Consigue cinco aciertos consecutivos.",
            condicion: p => p.mejorRacha >= 5
        },
        {
            id: "diez_aciertos",
            nombre: "Mente brillante",
            icono: "🧠",
            descripcion: "Acumula diez respuestas correctas.",
            condicion: p => p.correctas >= 10
        },
        {
            id: "veinte_aciertos",
            nombre: "Experto IA",
            icono: "⚡",
            descripcion: "Acumula veinte respuestas correctas.",
            condicion: p => p.correctas >= 20
        },
        {
            id: "todas_modalidades",
            nombre: "Multimodal",
            icono: "🌐",
            descripcion: "Consigue aciertos en las cuatro modalidades.",
            condicion: p =>
                TIPOS_VALIDOS.every(tipo =>
                    p.modalidades.includes(tipo)
                )
        },
        {
            id: "partida_perfecta",
            nombre: "Precisión absoluta",
            icono: "💎",
            descripcion: "Completa los 60 retos sin cometer errores.",
            condicion: p => p.partidasPerfectas >= 1
        },
        {
            id: "sesenta_retos",
            nombre: "Leyenda del conocimiento",
            icono: "👑",
            descripcion: "Consigue 60 respuestas correctas.",
            condicion: p => p.correctas >= 60
        },
        {
            id: "cinco_partidas",
            nombre: "Veterano",
            icono: "🏅",
            descripcion: "Termina cinco partidas.",
            condicion: p => p.partidas >= 5
        }
    ];

    // ==========================================
    // 2. ESTADO GENERAL
    // ==========================================

    let jugadorActual = "";
    let claveJugador = "";

    let perfil = perfilInicial();

    let rachaActual = 0;
    let correctasPartida = 0;
    let erroresPartida = 0;
    let xpPartida = 0;

    let partidaFinalizada = false;

    // ==========================================
    // 3. PERFIL INICIAL
    // ==========================================

    function perfilInicial() {

        return {
            xp: 0,
            correctas: 0,
            errores: 0,
            partidas: 0,
            partidasPerfectas: 0,
            mejorRacha: 0,
            modalidades: [],
            insignias: [],
            ultimaActualizacion: null
        };

    }

    // ==========================================
    // 4. NORMALIZAR NOMBRE DEL JUGADOR
    // ==========================================

    function normalizarNombre(nombre) {

        return nombre
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "")
            .slice(0, 35);

    }

    // ==========================================
    // 5. CARGAR PERFIL INDIVIDUAL
    // ==========================================

    function cargarPerfil(nombre) {

        const clave = STORAGE_PREFIX + claveJugador;

        try {

            const guardado = localStorage.getItem(clave);

            if (!guardado) {
                return perfilInicial();
            }

            const datos = JSON.parse(guardado);

            if (
                !datos ||
                typeof datos !== "object" ||
                Array.isArray(datos)
            ) {
                return perfilInicial();
            }

            const base = perfilInicial();

            const numeroSeguro = valor => {

                const numero = Number(valor);

                return Number.isFinite(numero) && numero >= 0
                    ? numero
                    : 0;

            };

            return {

                ...base,

                xp: numeroSeguro(datos.xp),

                correctas: numeroSeguro(datos.correctas),

                errores: numeroSeguro(datos.errores),

                partidas: numeroSeguro(datos.partidas),

                partidasPerfectas: numeroSeguro(
                    datos.partidasPerfectas
                ),

                mejorRacha: numeroSeguro(
                    datos.mejorRacha
                ),

                modalidades: Array.isArray(datos.modalidades)
                    ? [...new Set(
                        datos.modalidades.filter(tipo =>
                            TIPOS_VALIDOS.includes(tipo)
                        )
                    )]
                    : [],

                insignias: Array.isArray(datos.insignias)
                    ? [...new Set(
                        datos.insignias.filter(id =>
                            INSIGNIAS.some(insignia =>
                                insignia.id === id
                            )
                        )
                    )]
                    : [],

                ultimaActualizacion:
                    datos.ultimaActualizacion || null

            };

        } catch (error) {

            console.error(
                "Error al cargar el perfil:",
                error
            );

            return perfilInicial();

        }

    }

    // ==========================================
    // 6. GUARDAR PERFIL INDIVIDUAL
    // ==========================================

    function guardarPerfil() {

        if (!jugadorActual || !claveJugador) return;

        perfil.ultimaActualizacion =
            new Date().toISOString();

        try {

            localStorage.setItem(
                STORAGE_PREFIX + claveJugador,
                JSON.stringify(perfil)
            );

        } catch (error) {

            console.error(
                "No se pudo guardar el progreso:",
                error
            );

            mostrarNotificacion(
                "No se pudo guardar el progreso en este navegador."
            );

        }

    }

    // ==========================================
    // 7. SELECTOR DE JUGADOR
    // ==========================================

    function crearSelectorJugador() {

        const anterior = document.getElementById(
            "reward-player-overlay"
        );

        if (anterior) anterior.remove();

        // Estilos del selector.
        if (!document.getElementById("reward-player-styles")) {

            const estilos = document.createElement("style");

            estilos.id = "reward-player-styles";

            estilos.textContent = `
                #reward-player-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(5, 7, 20, .94);
                    backdrop-filter: blur(14px);
                    font-family: Arial, sans-serif;
                }

                .reward-player-card {
                    width: 100%;
                    max-width: 440px;
                    padding: 35px 28px;
                    text-align: center;
                    color: #fff;
                    background: linear-gradient(145deg, #17152d, #101827);
                    border: 1px solid rgba(115, 105, 255, .5);
                    border-radius: 22px;
                    box-shadow: 0 0 45px rgba(91, 75, 255, .2);
                    animation: rewardPlayerEnter .45s ease;
                }

                .reward-player-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                }

                .reward-player-card h2 {
                    margin: 0 0 12px;
                    font-size: 25px;
                    letter-spacing: 1px;
                }

                .reward-player-card p {
                    color: #b9bfd2;
                    line-height: 1.6;
                    font-size: 14px;
                }

                #reward-player-form {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    margin-top: 24px;
                }

                #reward-player-name {
                    box-sizing: border-box;
                    width: 100%;
                    padding: 15px;
                    color: #fff;
                    background: #0c1020;
                    border: 1px solid #6559d9;
                    border-radius: 10px;
                    outline: none;
                    font-size: 16px;
                    text-align: center;
                }

                #reward-player-name:focus {
                    border-color: #55d9ff;
                    box-shadow: 0 0 12px rgba(85, 217, 255, .2);
                }

                #reward-player-form button {
                    padding: 15px;
                    color: #fff;
                    background: linear-gradient(100deg, #6654e8, #277fbd);
                    border: none;
                    border-radius: 10px;
                    font-weight: bold;
                    font-size: 14px;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: transform .2s, filter .2s;
                }

                #reward-player-form button:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.15);
                }

                #reward-player-error {
                    min-height: 18px;
                    color: #ff7185 !important;
                    font-size: 12px !important;
                }

                @keyframes rewardPlayerEnter {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `;

            document.head.appendChild(estilos);

        }

        const overlay = document.createElement("div");

        overlay.id = "reward-player-overlay";

        overlay.innerHTML = `
            <div class="reward-player-card">

                <div class="reward-player-icon">🧑‍🚀</div>

                <h2>IDENTIFÍCATE, AGENTE</h2>

                <p>
                    Escribe tu nombre para acceder a tu perfil
                    personal de IA CHALLENGE.
                </p>

                <form id="reward-player-form">

                    <input
                        type="text"
                        id="reward-player-name"
                        placeholder="Escribe tu nombre"
                        maxlength="35"
                        autocomplete="off"
                        required
                    >

                    <button type="submit">
                        ENTRAR AL SISTEMA
                    </button>

                    <p id="reward-player-error"></p>

                </form>

                <p>
                    Tus XP, insignias y rangos se guardarán
                    de manera independiente.
                </p>

            </div>
        `;

        document.body.appendChild(overlay);

        const input = document.getElementById(
            "reward-player-name"
        );

        input.focus();

        const form = document.getElementById(
            "reward-player-form"
        );

        form.addEventListener("submit", event => {

            event.preventDefault();

            const nombre = input.value.trim();

            const error = document.getElementById(
                "reward-player-error"
            );

            if (nombre.length < 2) {

                error.textContent =
                    "Escribe un nombre de al menos 2 caracteres.";

                input.focus();

                return;

            }

            seleccionarJugador(nombre);

        });

    }

    // ==========================================
    // 8. SELECCIONAR JUGADOR
    // ==========================================

    function seleccionarJugador(nombre) {

        const clave = normalizarNombre(nombre);

        if (!clave) return;

        jugadorActual = nombre.trim();
        claveJugador = clave;

        perfil = cargarPerfil(jugadorActual);

        // Reiniciar estadísticas de la partida actual.
        rachaActual = 0;
        correctasPartida = 0;
        erroresPartida = 0;
        xpPartida = 0;
        partidaFinalizada = false;

        const overlay = document.getElementById(
            "reward-player-overlay"
        );

        if (overlay) {

            overlay.style.opacity = "0";
            overlay.style.transition = "opacity .25s";

            setTimeout(() => overlay.remove(), 250);

        }

        actualizarPantalla();

        console.log(
            "Perfil cargado:",
            jugadorActual,
            obtenerResumen()
        );

        mostrarNotificacion(
            `¡Bienvenido, ${jugadorActual}! Tu perfil está listo.`
        );

    }

    // ==========================================
    // 9. CAMBIAR DE JUGADOR
    // ==========================================

    function cambiarJugador() {

        guardarPerfil();

        crearSelectorJugador();

    }

    // ==========================================
    // 10. SISTEMA DE RANGOS
    // ==========================================

    function obtenerRango(xp = perfil.xp) {

        let actual = RANGOS[0];

        let siguiente = null;

        for (let i = 0; i < RANGOS.length; i++) {

            if (xp >= RANGOS[i].xp) {

                actual = RANGOS[i];

                siguiente = RANGOS[i + 1] || null;

            }

        }

        return {
            actual,
            siguiente
        };

    }

    // ==========================================
    // 11. NOTIFICACIONES
    // ==========================================

    function mostrarNotificacion(mensaje) {

        const caja = document.getElementById(
            "reward-notice"
        );

        if (!caja) return;

        caja.innerHTML = mensaje;

        caja.classList.remove("visible");

        void caja.offsetWidth;

        caja.classList.add("visible");

        clearTimeout(caja._rewardTimer);

        caja._rewardTimer = setTimeout(() => {

            caja.classList.remove("visible");

        }, 3200);

    }

    // ==========================================
    // 12. COMPROBAR INSIGNIAS
    // ==========================================

    function comprobarInsignias() {

        const nuevas = [];

        INSIGNIAS.forEach(insignia => {

            const yaLaTiene =
                perfil.insignias.includes(insignia.id);

            if (
                !yaLaTiene &&
                insignia.condicion(perfil)
            ) {

                perfil.insignias.push(insignia.id);

                nuevas.push(insignia);

            }

        });

        nuevas.forEach(insignia => {

            mostrarNotificacion(
                `🏆 <strong>¡Nueva insignia!</strong> ${insignia.icono} ${insignia.nombre}`
            );

        });

        if (nuevas.length > 0) {

            guardarPerfil();

        }

        return nuevas;

    }

    // ==========================================
    // 13. ACTUALIZAR INTERFAZ
    // ==========================================

    function actualizarPantalla() {

        const { actual, siguiente } =
            obtenerRango();

        const totalXP = document.getElementById(
            "reward-total-xp"
        );

        const rango = document.getElementById(
            "reward-rank"
        );

        const proximo = document.getElementById(
            "reward-next-rank"
        );

        const faltante = document.getElementById(
            "reward-xp-needed"
        );

        const barra = document.getElementById(
            "reward-progress-fill"
        );

        const experienciaJuego = document.getElementById(
            "experience"
        );

        if (totalXP) {

            totalXP.textContent = `${perfil.xp} XP`;

        }

        if (experienciaJuego) {

            experienciaJuego.textContent = `${perfil.xp} XP`;

        }

        if (rango) {

            rango.textContent = actual.nombre;

        }

        let porcentaje = 100;

        if (siguiente) {

            const tramo =
                siguiente.xp - actual.xp;

            const progreso =
                perfil.xp - actual.xp;

            porcentaje = Math.min(
                100,
                Math.max(0, (progreso / tramo) * 100)
            );

            if (proximo) {

                proximo.textContent =
                    `Próximo rango: ${siguiente.nombre}`;

            }

            if (faltante) {

                faltante.textContent =
                    `${Math.max(0, siguiente.xp - perfil.xp)} XP restantes`;

            }

        } else {

            if (proximo) {

                proximo.textContent =
                    "¡Rango máximo alcanzado!";

            }

            if (faltante) {

                faltante.textContent =
                    "Eres una Leyenda IA";

            }

        }

        if (barra) {

            barra.style.width = `${porcentaje}%`;

            barra.setAttribute(
                "aria-valuenow",
                String(Math.round(porcentaje))
            );

        }

        dibujarInsignias();

    }

    // ==========================================
    // 14. MOSTRAR INSIGNIAS
    // ==========================================

    function dibujarInsignias() {

        const contenedor = document.getElementById(
            "rewards-badges"
        );

        if (!contenedor) return;

        contenedor.replaceChildren();

        INSIGNIAS.forEach(insignia => {

            const desbloqueada =
                perfil.insignias.includes(insignia.id);

            const tarjeta = document.createElement("div");

            tarjeta.className =
                `reward-badge ${
                    desbloqueada ? "unlocked" : "locked"
                }`;

            const icono = document.createElement("span");

            icono.className = "reward-badge-icon";

            icono.textContent =
                desbloqueada ? insignia.icono : "🔒";

            const nombre = document.createElement("span");

            nombre.className = "reward-badge-name";

            nombre.textContent = insignia.nombre;

            const descripcion = document.createElement("span");

            descripcion.className =
                "reward-badge-description";

            descripcion.textContent =
                desbloqueada
                    ? insignia.descripcion
                    : "Insignia bloqueada";

            tarjeta.append(
                icono,
                nombre,
                descripcion
            );

            contenedor.appendChild(tarjeta);

        });

    }

    // ==========================================
    // 15. SUMAR EXPERIENCIA
    // ==========================================

    function sumarXP(cantidad, motivo) {

        if (!jugadorActual) return;

        cantidad = Math.max(
            0,
            Math.round(Number(cantidad) || 0)
        );

        if (cantidad === 0) return;

        const rangoAnterior =
            obtenerRango().actual.nombre;

        perfil.xp += cantidad;

        xpPartida += cantidad;

        const rangoNuevo =
            obtenerRango().actual.nombre;

        guardarPerfil();

        comprobarInsignias();

        actualizarPantalla();

        if (rangoNuevo !== rangoAnterior) {

            mostrarNotificacion(
                `🚀 <strong>¡Ascendiste de rango!</strong> Ahora eres ${rangoNuevo}.`
            );

        } else if (motivo) {

            mostrarNotificacion(
                `✨ <strong>+${cantidad} XP</strong> · ${motivo}`
            );

        }

    }

    // ==========================================
    // 16. INICIAR PARTIDA
    // ==========================================

    function iniciarPartida() {

        if (!jugadorActual) {

            crearSelectorJugador();

            return;

        }

        rachaActual = 0;

        correctasPartida = 0;

        erroresPartida = 0;

        xpPartida = 0;

        partidaFinalizada = false;

        actualizarPantalla();

        console.log(
            `Nueva partida para ${jugadorActual}.`
        );

    }

    // ==========================================
    // 17. REGISTRAR ACIERTO
    // ==========================================

    function registrarAcierto(tipo, nivel) {

        if (!jugadorActual || partidaFinalizada) return;

        perfil.correctas++;

        correctasPartida++;

        rachaActual++;

        perfil.mejorRacha = Math.max(
            perfil.mejorRacha,
            rachaActual
        );

        if (
            tipo &&
            TIPOS_VALIDOS.includes(tipo) &&
            !perfil.modalidades.includes(tipo)
        ) {

            perfil.modalidades.push(tipo);

        }

        const multiplicadores = {

            "Básico": 1,

            "Intermedio": 1.2,

            "Avanzado": 1.5

        };

        const multiplicador =
            multiplicadores[nivel] || 1;

        const base = Math.round(
            25 * multiplicador
        );

        sumarXP(
            base,
            "Respuesta correcta"
        );

        if (rachaActual === 3) {

            sumarXP(
                10,
                "Racha de 3 aciertos"
            );

        }

        if (rachaActual === 5) {

            sumarXP(
                25,
                "Racha de 5 aciertos"
            );

        }

        comprobarInsignias();

        guardarPerfil();

        actualizarPantalla();

    }

    // ==========================================
    // 18. REGISTRAR ERROR
    // ==========================================

    function registrarError() {

        if (!jugadorActual || partidaFinalizada) return;

        perfil.errores++;

        erroresPartida++;

        rachaActual = 0;

        guardarPerfil();

        comprobarInsignias();

        actualizarPantalla();

    }

    // ==========================================
    // 19. FINALIZAR PARTIDA
    // ==========================================

    function finalizarPartida() {

        if (
            !jugadorActual ||
            partidaFinalizada
        ) return;

        partidaFinalizada = true;

        perfil.partidas++;

        sumarXP(
            50,
            "Misión completada"
        );

        const partidaPerfecta =
            correctasPartida === TOTAL_RETOS &&
            erroresPartida === 0;

        if (partidaPerfecta) {

            perfil.partidasPerfectas++;

            sumarXP(
                100,
                "Partida perfecta"
            );

        }

        const resumen = document.getElementById(
            "final-rewards-description"
        );

        if (resumen) {

            resumen.textContent =
                `${jugadorActual}: ganaste ${xpPartida} XP en esta partida. ` +
                `Aciertos: ${correctasPartida}. ` +
                `Errores: ${erroresPartida}. ` +
                `Rango actual: ${obtenerRango().actual.nombre}.`;

        }

        comprobarInsignias();

        guardarPerfil();

        actualizarPantalla();

        console.log("================================");

        console.log("RECOMPENSAS DE LA PARTIDA");

        console.log("Jugador:", jugadorActual);

        console.log("XP obtenida:", xpPartida);

        console.log("Aciertos:", correctasPartida);

        console.log("Errores:", erroresPartida);

        console.log("Partida perfecta:", partidaPerfecta);

        console.log("Rango:", obtenerRango().actual.nombre);

        console.log("================================");

    }

    // ==========================================
    // 20. OBTENER RESUMEN DEL JUGADOR
    // ==========================================

    function obtenerResumen() {

        return {

            jugador: jugadorActual,

            xp: perfil.xp,

            xpPartida: xpPartida,

            correctas: perfil.correctas,

            errores: perfil.errores,

            partidas: perfil.partidas,

            partidasPerfectas:
                perfil.partidasPerfectas,

            mejorRacha:
                perfil.mejorRacha,

            modalidades: [
                ...perfil.modalidades
            ],

            insignias: [
                ...perfil.insignias
            ],

            rango: obtenerRango().actual.nombre

        };

    }

    // ==========================================
    // 21. EXPONER FUNCIONES AL JUEGO
    // ==========================================

    window.IARewards = {

        iniciarPartida,

        registrarAcierto,

        registrarError,

        finalizarPartida,

        actualizarPantalla,

        obtenerResumen,

        cambiarJugador

    };

    // ==========================================
    // 22. INICIAR SELECTOR
    // ==========================================

    crearSelectorJugador();

    console.log(
        "IA CHALLENGE — SISTEMA DE PERFILES INDIVIDUALES ACTIVADO"
    );

})();

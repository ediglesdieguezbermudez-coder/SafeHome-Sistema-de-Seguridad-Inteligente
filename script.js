/*****************************************************************
 *
 *  SafeHouse v1.0
 *  script.js
 *
 *  PARTE 1
 *
 *****************************************************************/

/***************************************************************
    Variables globales
****************************************************************/

const STATUS_INTERVAL = 1000;      // 1 segundo

let timerStatus = null;

/***************************************************************
    Referencias del DOM
****************************************************************/

const statusIndicator = document.getElementById("statusIndicator");
const statusText      = document.getElementById("statusText");
const statusDetail    = document.getElementById("statusDetail");
const timerText       = document.getElementById("timerText");

const clockTime       = document.getElementById("clockTime");
const clockDate       = document.getElementById("clockDate");

const wifiStatus      = document.getElementById("wifiStatus");
const wifiEstado      = document.getElementById("wifiEstado");

const sensor1         = document.getElementById("sensor1");
const sensor2         = document.getElementById("sensor2");

const contadorMov     = document.getElementById("contadorMov");
const contadorDisparos= document.getElementById("contadorDisparos");

const ipDisplay       = document.getElementById("ipDisplay");

/***************************************************************
    Botones
****************************************************************/

const btnArmar      = document.getElementById("btnArmar");
const btnDesarmar   = document.getElementById("btnDesarmar");
const btnVigilia    = document.getElementById("btnVigilia");
const btnPanico     = document.getElementById("btnPanico");
const btnSilenciar  = document.getElementById("btnSilenciar");
const btnReiniciar  = document.getElementById("btnReiniciar");

/***************************************************************
    Reloj
****************************************************************/

function updateClock()
{
    const now = new Date();

    clockTime.textContent = now.toLocaleTimeString(
        "es-ES",
        {
            hour12:false
        }
    );

    clockDate.textContent = now.toLocaleDateString(
        "es-ES"
    );
}

/***************************************************************
    Cambiar color del indicador principal
****************************************************************/

function setIndicator(cssClass)
{
    statusIndicator.className = "status-indicator";

    statusIndicator.classList.add(cssClass);
}

/***************************************************************
    Actualizar estado principal
****************************************************************/

function updateAlarmState(state)
{
    switch(state)
    {

        case "DESARMADO":

            setIndicator("status-disarmed");

            statusText.textContent = "Estado: DESARMADO";

            break;


        case "ARMADO":

            setIndicator("status-armed");

            statusText.textContent = "Estado: ARMADO";

            break;


        case "RETARDO_SALIDA":

            setIndicator("status-delay");

            statusText.textContent =
                "Estado: RETARDO SALIDA";

            break;


        case "RETARDO_ENTRADA":

            setIndicator("status-delay");

            statusText.textContent =
                "Estado: RETARDO ENTRADA";

            break;


        case "ALARMA":

            setIndicator("status-alarm");

            statusText.textContent = "Estado: ALARMA";

            break;


        case "VIGILIA":

            setIndicator("status-night");

            statusText.textContent = "Estado: VIGILIA";

            break;


        default:

            setIndicator("status-disarmed");

            statusText.textContent = "Estado: ---";

            break;

    }

}

/***************************************************************
    Estado sensores
****************************************************************/

function updateSensor(sensor, active)
{
    if(active)
    {
        sensor.className = "sensor-badge sensor-on";
        sensor.innerHTML = "● Activo";
    }
    else
    {
        sensor.className = "sensor-badge sensor-off";
        sensor.innerHTML = "● Inactivo";
    }
}

/***************************************************************
    Estado WiFi
****************************************************************/

function updateWiFi(online)
{

    if(online)
    {
        wifiStatus.innerHTML = "📡 Conectado";
        wifiEstado.innerHTML = "🟢 Conectado";

        wifiStatus.className = "wifi-online";
        wifiEstado.className = "wifi-online";
    }
    else
    {
        wifiStatus.innerHTML = "📡 Desconectado";
        wifiEstado.innerHTML = "🔴 Desconectado";

        wifiStatus.className = "wifi-offline";
        wifiEstado.className = "wifi-offline";
    }

}
/*****************************************************************
 *
 *  SafeHouse v1.0
 *  script.js
 *
 *  PARTE 2
 *
 *****************************************************************/

/***************************************************************
    Actualizar interfaz desde JSON
****************************************************************/

function updateInterface(data)
{
    updateAlarmState(data.state);

    statusDetail.textContent = data.detail;

    timerText.textContent = data.timer;

    updateSensor(sensor1, data.pir1);

    updateSensor(sensor2, data.pir2);

    updateWiFi(data.wifi);

    contadorMov.textContent = data.movements;

    contadorDisparos.textContent = data.triggers;

    ipDisplay.textContent = "IP : " + data.ip;
}

/***************************************************************
    Solicitar estado al ESP8266
****************************************************************/

async function requestStatus()
{
    try
    {

        const response = await fetch("/status",
        {
            cache:"no-store"
        });

        if(!response.ok)
        {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        updateInterface(data);

    }
    catch(error)
    {

        console.error(error);

        statusDetail.textContent = "Sin comunicación";

        updateWiFi(false);

    }

}

/***************************************************************
    Iniciar consulta periódica
****************************************************************/

function startStatusTimer()
{

    if(timerStatus !== null)
    {
        clearInterval(timerStatus);
    }

    requestStatus();

    timerStatus = setInterval(
        requestStatus,
        STATUS_INTERVAL
    );

}

/***************************************************************
    Detener consulta
****************************************************************/

function stopStatusTimer()
{

    if(timerStatus !== null)
    {
        clearInterval(timerStatus);

        timerStatus = null;
    }

}

/***************************************************************
    Enviar comando al ESP8266
****************************************************************/

async function sendCommand(command)
{

    try
    {

        const response = await fetch("/" + command,
        {
            method:"GET",
            cache:"no-store"
        });

        if(!response.ok)
        {
            throw new Error("Error HTTP");
        }

        requestStatus();

    }
    catch(error)
    {
        console.error(error);
    }

}

/***************************************************************
    Actualización manual
****************************************************************/

function refreshNow()
{
    requestStatus();
}

/***************************************************************
    Comprobación de conexión
****************************************************************/

window.addEventListener("online", function()
{
    requestStatus();
});

window.addEventListener("offline", function()
{
    updateWiFi(false);
});

/***************************************************************
    Mantener reloj actualizado
****************************************************************/

setInterval(updateClock,1000);

/*****************************************************************
 *
 *  SafeHouse v1.0
 *  script.js
 *
 *  PARTE 3
 *
 *****************************************************************/

/***************************************************************
    Eventos de botones
****************************************************************/

btnArmar.addEventListener("click", function ()
{
    sendCommand("arm");
});

btnDesarmar.addEventListener("click", function ()
{
    sendCommand("disarm");
});

btnVigilia.addEventListener("click", function ()
{
    sendCommand("night");
});

btnPanico.addEventListener("click", function ()
{
    if(confirm("¿Activar alarma de pánico?"))
    {
        sendCommand("panic");
    }
});

btnSilenciar.addEventListener("click", function ()
{
    sendCommand("silence");
});

btnReiniciar.addEventListener("click", function ()
{
    if(confirm("¿Reiniciar el sistema?"))
    {
        sendCommand("restart");
    }
});

/***************************************************************
    Inicialización
****************************************************************/

function initialize()
{
    console.log("--------------------------------");
    console.log(" SafeHouse v1.0");
    console.log("--------------------------------");

    updateClock();

    requestStatus();

    startStatusTimer();

    console.log("Interfaz inicializada");
}

/***************************************************************
    Preparación para WebSocket
    (Etapa 2)
****************************************************************/

let websocket = null;

function startWebSocket()
{
    /*
        Esta función será implementada
        en la Etapa 2.

        Sustituirá la consulta periódica
        por comunicación en tiempo real.

        websocket = new WebSocket(
            "ws://" + location.hostname + ":81/"
        );
    */
}

/***************************************************************
    Finalización
****************************************************************/

window.addEventListener("load", initialize);

/***************************************************************
    Utilidades
****************************************************************/

function formatCounter(value)
{
    return Number(value).toLocaleString("es-ES");
}

function setMovementCounter(value)
{
    contadorMov.textContent = formatCounter(value);
}

function setTriggerCounter(value)
{
    contadorDisparos.textContent = formatCounter(value);
}

/***************************************************************
    Funciones futuras (Etapa 2)

    onWebSocketOpen()
    onWebSocketClose()
    onWebSocketMessage()
    broadcastStatus()

    No modificar este archivo.
****************************************************************/
/*****************************************************************
 *
 *  SafeHouse v2.0
 *---------------------------------------------------------------
 *  Archivo : script.js
 *---------------------------------------------------------------
 *  PARTE 1
 *
 *  Comunicación híbrida
 *      - HTTP (respaldo)
 *      - WebSocket (tiempo real)
 *
 *****************************************************************/

/***************************************************************
    Configuración
****************************************************************/
/***************************************************************
    Variables globales
****************************************************************/

//let timerStatus = null;

let websocket = null;

let websocketConnected = false;

let reconnectTimer = null;

/***************************************************************
    Referencias del DOM
****************************************************************/

const statusIndicator = document.getElementById("statusIndicator");
const statusText      = document.getElementById("statusText");
const statusDetail    = document.getElementById("statusDetail");
const timerText       = document.getElementById("timerText");

const clockTime       = document.getElementById("clockTime");
const clockDate       = document.getElementById("clockDate");

const wifiStatus      = document.getElementById("wifiStatus");
const wifiEstado      = document.getElementById("wifiEstado");

const sensor1         = document.getElementById("sensor1");
const sensor2         = document.getElementById("sensor2");

const contadorMov      = document.getElementById("contadorMov");
const contadorDisparos = document.getElementById("contadorDisparos");

const ipDisplay = document.getElementById("ipDisplay");

/***************************************************************
    Botones
****************************************************************/

const btnArmar     = document.getElementById("btnArmar");
const btnDesarmar  = document.getElementById("btnDesarmar");
const btnVigilia   = document.getElementById("btnVigilia");
const btnPanico    = document.getElementById("btnPanico");
const btnSilenciar = document.getElementById("btnSilenciar");
const btnReiniciar = document.getElementById("btnReiniciar");

/***************************************************************
    WebSocket
****************************************************************/

function connectWebSocket()
{

    if(websocketConnected)
        return;

    if(websocket !== null)
    {
        websocket.close();
        websocket = null;
    }

    console.log("Conectando WebSocket...");

    websocket = new WebSocket(
        "ws://" + location.hostname + ":81"
    );

    websocket.onopen = onWebSocketOpen;

    websocket.onclose = onWebSocketClose;

    websocket.onerror = onWebSocketError;

    websocket.onmessage = onWebSocketMessage;

}

/***************************************************************
    Cerrar WebSocket
****************************************************************/

function disconnectWebSocket()
{

    if(websocket !== null)
    {
        websocket.close();
        websocket = null;
    }

    websocketConnected = false;

}

/***************************************************************
    Programar reconexión
****************************************************************/

function scheduleReconnect()
{

    if(reconnectTimer !== null)
        return;

    reconnectTimer = setTimeout(function()
    {

        reconnectTimer = null;

        console.log("Intentando reconectar...");

        connectWebSocket();

    }, WS_RECONNECT_TIME);

}

/***************************************************************
    Cancelar reconexión
****************************************************************/

function clearReconnectTimer()
{

    if(reconnectTimer === null)
        return;

    clearTimeout(reconnectTimer);

    reconnectTimer = null;

}

/***************************************************************
    Eventos WebSocket
****************************************************************/

function onWebSocketOpen(event)
{

    console.log("WebSocket conectado");

    websocketConnected = true;

    clearReconnectTimer();

    stopStatusTimer();

    updateWiFi(true);

}

function onWebSocketClose(event)
{

    console.log("WebSocket desconectado");

    websocketConnected = false;

    startStatusTimer();

    scheduleReconnect();

}

function onWebSocketError(event)
{

    console.log("Error WebSocket");

}

function onWebSocketMessage(event)
{

    try
    {

        const data = JSON.parse(event.data);

        processStatus(data);

    }
    catch(error)
    {

        console.error(error);

    }

}

/*****************************************************************
 *
 *  SafeHouse v2.0
 *---------------------------------------------------------------
 *  Archivo : script.js
 *---------------------------------------------------------------
 *  PARTE 2
 *
 *****************************************************************/

/***************************************************************
    Procesar estado recibido
    (HTTP o WebSocket)
****************************************************************/

function processStatus(data)
{
    updateAlarmState(data.state);

    statusDetail.textContent = data.detail;

    timerText.textContent = data.timer;

    updateSensor(sensor1, data.pir1);

    updateSensor(sensor2, data.pir2);

    updateWiFi(data.wifi);

    contadorMov.textContent = data.movements;

    contadorDisparos.textContent = data.triggers;

    ipDisplay.textContent = "IP : " + data.ip;
}

/***************************************************************
    Compatibilidad con versión anterior
****************************************************************/

function updateInterface(data)
{
    processStatus(data);
}

/***************************************************************
    Solicitar estado mediante HTTP
****************************************************************/

async function requestStatus()
{

    if(websocketConnected)
        return;

    try
    {

        const response = await fetch("/status",
        {
            cache:"no-store"
        });

        if(!response.ok)
            throw new Error("HTTP " + response.status);

        const data = await response.json();

        processStatus(data);

    }
    catch(error)
    {

        console.error(error);

        updateWiFi(false);

        statusDetail.textContent = "Sin comunicación";

    }

}

/***************************************************************
    Iniciar consulta periódica
****************************************************************/

function startStatusTimer()
{

    if(websocketConnected)
        return;

    if(timerStatus !== null)
        clearInterval(timerStatus);

    requestStatus();

    timerStatus = setInterval(function()
    {

        if(!websocketConnected)
        {
            requestStatus();
        }

    }, STATUS_INTERVAL);

}

/***************************************************************
    Detener consulta periódica
****************************************************************/

function stopStatusTimer()
{

    if(timerStatus === null)
        return;

    clearInterval(timerStatus);

    timerStatus = null;

}

/***************************************************************
    Enviar comando
****************************************************************/

async function sendCommand(command)
{

    try
    {

        const response = await fetch("/" + command,
        {
            method:"GET",
            cache:"no-store"
        });

        if(!response.ok)
            throw new Error("HTTP");

        if(!websocketConnected)
        {
            requestStatus();
        }

    }
    catch(error)
    {

        console.error(error);

    }

}

/***************************************************************
    Actualización manual
****************************************************************/

function refreshNow()
{

    if(websocketConnected)
        return;

    requestStatus();

}

/***************************************************************
    Eventos del navegador
****************************************************************/

window.addEventListener("online", function()
{

    if(!websocketConnected)
        requestStatus();

});

window.addEventListener("offline", function()
{

    updateWiFi(false);

});

/***************************************************************
    Mantener reloj
****************************************************************/

setInterval(updateClock,1000);

/*****************************************************************
 *
 *  SafeHouse v2.0
 *---------------------------------------------------------------
 *  Archivo : script.js
 *---------------------------------------------------------------
 *  PARTE 3
 *
 *****************************************************************/

/***************************************************************
    Eventos de botones
****************************************************************/

btnArmar.addEventListener("click", function ()
{
    sendCommand("arm");
});

btnDesarmar.addEventListener("click", function ()
{
    sendCommand("disarm");
});

btnVigilia.addEventListener("click", function ()
{
    sendCommand("night");
});

btnPanico.addEventListener("click", function ()
{
    if(confirm("¿Activar alarma de pánico?"))
    {
        sendCommand("panic");
    }
});

btnSilenciar.addEventListener("click", function ()
{
    sendCommand("silence");
});

btnReiniciar.addEventListener("click", function ()
{
    if(confirm("¿Reiniciar el sistema?"))
    {
        sendCommand("restart");
    }
});

/***************************************************************
    Inicialización
****************************************************************/

function initialize()
{

    console.log("--------------------------------");

    console.log(" SafeHouse v2.0");

    console.log("--------------------------------");

    updateClock();

    /***************************************************
        Intentar WebSocket
    ****************************************************/

    connectWebSocket();

    /***************************************************
        Iniciar respaldo HTTP

        Si el WebSocket conecta,
        automáticamente será detenido.
    ****************************************************/

    startStatusTimer();

}

/***************************************************************
    Supervisión de conexión
****************************************************************/

setInterval(function()
{

    if(websocketConnected)
        return;

    if(websocket === null)
    {
        connectWebSocket();
        return;
    }

    if(websocket.readyState === WebSocket.CLOSED)
    {
        connectWebSocket();
    }

},5000);

/***************************************************************
    Funciones auxiliares
****************************************************************/

function formatCounter(value)
{
    return Number(value).toLocaleString("es-ES");
}

function setMovementCounter(value)
{
    contadorMov.textContent = formatCounter(value);
}

function setTriggerCounter(value)
{
    contadorDisparos.textContent = formatCounter(value);
}

/***************************************************************
    Cierre de página
****************************************************************/

window.addEventListener("beforeunload", function()
{

    disconnectWebSocket();

});

/***************************************************************
    Inicio
****************************************************************/

window.addEventListener("load", initialize);

/***************************************************************
    Información
****************************************************************/

console.log("script.js v2.0 cargado");

console.log("Modo híbrido HTTP + WebSocket activo");

/***************************************************************
    FIN
****************************************************************/
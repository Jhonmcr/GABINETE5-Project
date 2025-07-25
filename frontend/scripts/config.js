// frontend_dist/scripts/config.js

/**
 * @file frontend_dist/scripts/config.js
 * @description Proporciona funciones para obtener la configuración de la aplicación desde el backend,
 * como los tokens de roles y la URL base de la API.
 */

// Variable para almacenar en caché la configuración una vez obtenida.
let apiConfigCache = null;

// Fallback para la configuración en caso de que el backend no esté disponible
const fallbackConfig = {
    ROLES_TOKENS: {
        SUPER_ADMIN_TOKEN: "super_admin_token_placeholder",
        ADMIN_TOKEN: "admin_token_placeholder",
        USER_TOKEN: "user_token_placeholder"
    },
    API_BASE_URL: "http://localhost:3000/api" // URL de fallback
};

/**
 * Obtiene la configuración completa desde el endpoint /api/config del backend.
 * Utiliza una caché simple para evitar múltiples llamadas si la configuración ya fue obtenida.
 * @async
 * @private
 * @returns {Promise<Object>} Una promesa que se resuelve con el objeto de configuración del backend.
 * @throws {Error} Si la petición al backend falla o la respuesta no es la esperada.
 */
async function _fetchApiConfig() {
    if (apiConfigCache) {
        return apiConfigCache;
    }

    // Determinar la URL del backend para /api/config dinámicamente
    let configApiUrl;
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
        configApiUrl = 'http://localhost:3000/api/config'; // URL para desarrollo local
    } else {
        configApiUrl = 'https://gabinete5-backend.onrender.com/api/config'; // URL para producción/despliegue
    }
    //console.log(`[config.js] Usando URL para /api/config: ${configApiUrl}`);

    try {
        const response = await fetch(configApiUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al obtener la configuración del servidor desde ${configApiUrl}: ${response.status} ${response.statusText}. ${errorText}`);
        }
        apiConfigCache = await response.json();
        if (!apiConfigCache || !apiConfigCache.ROLES_TOKENS || !apiConfigCache.API_BASE_URL) {
            console.error('Configuración inválida recibida:', apiConfigCache); // Mantener el console.error si la validación falla
            throw new Error('La configuración recibida del servidor es inválida o incompleta.');
        }
        //console.log('[config.js] _fetchApiConfig: apiConfigCache después de fetch y parse:', JSON.stringify(apiConfigCache));
        return apiConfigCache;
    } catch (error) {
        console.warn("[config.js] Error crítico en _fetchApiConfig al obtener la configuración de la API. Usando configuración de fallback.", error);
        apiConfigCache = fallbackConfig; // Usar fallback
        return apiConfigCache;
    }
}

/**
 * Obtiene los tokens de roles desde la configuración del backend.
 * @export
 * @async
 * @returns {Promise<Object>} Una promesa que se resuelve con el objeto ROLES_TOKENS.
 *                            Ej: { SUPER_ADMIN_TOKEN: "...", ADMIN_TOKEN: "...", USER_TOKEN: "..." }
 * @throws {Error} Si no se puede obtener la configuración de roles.
 */
export async function getRolesTokensAsync() {
    try {
        const config = await _fetchApiConfig();
        return config.ROLES_TOKENS;
    } catch (error) {
        console.error("Error al intentar obtener los ROLES_TOKENS:", error.message);
        // Es importante propagar el error para que el llamador sepa que la operación falló.
        throw new Error("No se pudieron cargar los tokens de roles desde el backend.");
    }
}

/**
 * Obtiene la URL base de la API desde la configuración del backend.
 * @export
 * @async
 * @returns {Promise<string>} Una promesa que se resuelve con la cadena de la URL base de la API.
 * @throws {Error} Si no se puede obtener la URL base de la API.
 */
export async function getApiBaseUrlAsync() {
    try {
        const config = await _fetchApiConfig();
        //console.log('[config.js] getApiBaseUrlAsync: Configuración recibida en getApiBaseUrlAsync:', JSON.stringify(config));
        if (config && config.API_BASE_URL) {
            //console.log('[config.js] getApiBaseUrlAsync: Devolviendo API_BASE_URL:', config.API_BASE_URL);
            return config.API_BASE_URL;
        } else {
            //console.error('[config.js] getApiBaseUrlAsync: API_BASE_URL no encontrada en la configuración.');
            throw new Error("API_BASE_URL no encontrada en la configuración del backend.");
        }
    } catch (error) {
        console.error("[config.js] Error en getApiBaseUrlAsync al intentar obtener la API_BASE_URL:", error.message);
        // Propaga el error.
        throw new Error("No se pudo cargar la URL base de la API desde el backend (error en getApiBaseUrlAsync).");
    }
}
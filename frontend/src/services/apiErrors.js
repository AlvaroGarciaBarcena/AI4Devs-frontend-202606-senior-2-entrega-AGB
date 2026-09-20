// Distingue un fallo de red real (el backend no respondió en absoluto --
// caído, red cortada, bloqueado por CORS) de un error con respuesta del
// servidor. axios documenta esta forma: si hubo respuesta, `error.response`
// existe; si la petición se llegó a enviar pero no volvió ninguna
// respuesta, `error.request` existe pero `error.response` no
// (https://axios-http.com/docs/handling_errors).
//
// Sirve para que quien muestre el error pueda dar un mensaje claro y
// traducido en vez de "Network Error" -- el texto que pone axios en
// `error.message` en este caso, siempre en inglés, sin traducir, y sin
// decir nada accionable (¿mi conexión? ¿el servidor? ¿un permiso?).
export const isNetworkError = (error) => !error.response && !!error.request;

// Envuelve el Error que ya construye cada servicio (mismo mensaje/causa de
// siempre) y le añade `isNetworkError` cuando corresponda, sin cambiar el
// resto del comportamiento -- quien no compruebe esa propiedad sigue
// viendo exactamente lo mismo que antes.
export const tagNetworkError = (builtError, originalError) => {
    if (isNetworkError(originalError)) {
        builtError.isNetworkError = true;
    }
    return builtError;
};

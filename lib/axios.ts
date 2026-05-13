import axios, {
  AxiosError,
  AxiosResponse,
} from "axios";

/* =========================
 * ENV VALIDATION
 * ========================= */

const API_BASE =
  process.env
    .NEXT_PUBLIC_API_BASE;

const API_TOKEN =
  process.env
    .NEXT_PUBLIC_API_TOKEN;

/* =========================
 * VALIDATE BASE URL
 * ========================= */

if (!API_BASE) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE no está definido en el archivo .env"
  );
}

/* =========================
 * AXIOS INSTANCE
 * ========================= */

const api = axios.create({
  baseURL: API_BASE,

  timeout: 30000,

  withCredentials: false,

  headers: {
    Accept: "application/json",

    "Content-Type":
      "application/json",
  },
});

/* =========================
 * REQUEST INTERCEPTOR
 * ========================= */

api.interceptors.request.use(
  (config) => {
    /* =========================
     * ADD TOKEN ONLY IF EXISTS
     * ========================= */

    if (API_TOKEN) {
      config.headers.Authorization =
        `Bearer ${API_TOKEN}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

/* =========================
 * RESPONSE INTERCEPTOR
 * ========================= */

api.interceptors.response.use(
  (
    response: AxiosResponse
  ) => response,

  (
    error: AxiosError<any>
  ) => {
    /* =========================
     * DEVELOPMENT LOGS
     * ========================= */

    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      console.error(
        "[API ERROR]",
        {
          url:
            error.config?.url,

          method:
            error.config?.method,

          status:
            error.response
              ?.status,

          data:
            error.response
              ?.data,

          message:
            error.message,
        }
      );
    }

    /* =========================
     * CUSTOM ERROR HANDLING
     * ========================= */

    if (
      error.response?.status ===
      401
    ) {
      console.warn(
        "No autorizado"
      );
    }

    if (
      error.response?.status ===
      403
    ) {
      console.warn(
        "Acceso prohibido"
      );
    }

    if (
      error.response?.status ===
      404
    ) {
      console.warn(
        "Recurso no encontrado"
      );
    }

    if (
      error.code ===
      "ECONNABORTED"
    ) {
      console.warn(
        "Timeout de conexión"
      );
    }

    if (
      error.message ===
      "Network Error"
    ) {
      console.warn(
        "Error de red o backend caído"
      );
    }

    return Promise.reject(error);
  }
);

export default api;
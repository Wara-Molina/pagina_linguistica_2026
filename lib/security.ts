import DOMPurify from "isomorphic-dompurify";

/* =========================
 * HTML SANITIZATION
 * ========================= */

export const sanitizeHTML = (
  html: string
): string => {
  if (
    !html ||
    typeof html !== "string"
  ) {
    return "";
  }

  try {
    return DOMPurify.sanitize(
      html,
      {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "em",
          "u",
          "ul",
          "ol",
          "li",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "span",
          "div",
        ],

        ALLOWED_ATTR: [],

        FORBID_TAGS: [
          "script",
          "style",
          "iframe",
          "object",
          "embed",
          "form",
          "svg",
          "math",
        ],

        FORBID_ATTR: [
  "style",
  "srcdoc",
  "srcset",
  "onload",
  "onerror",
  "onclick",
  "onmouseover",
        ],

        ALLOW_DATA_ATTR: false,

        SAFE_FOR_TEMPLATES: true,
      }
    );
  } catch (error) {
    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      console.error(
        "sanitizeHTML error:",
        error
      );
    }

    return "";
  }
};

/* =========================
 * NUMERIC IDS
 * ========================= */

export const validateNumericId =
  (
    id:
      | string
      | string[]
      | undefined
  ): number | null => {
    if (
      !id ||
      Array.isArray(id)
    ) {
      return null;
    }

    const parsed =
      Number(id);

    if (
      !Number.isInteger(
        parsed
      ) ||
      parsed <= 0 ||
      parsed >=
        Number.MAX_SAFE_INTEGER
    ) {
      return null;
    }

    return parsed;
  };

/* =========================
 * TEXT SANITIZATION
 * ========================= */

export const sanitizeText = (
  text: string,

  maxLength = 500
): string => {
  if (
    !text ||
    typeof text !== "string"
  ) {
    return "";
  }

  return text
    .replace(
      /<[^>]*>/g,
      ""
    )
    .replace(
      /javascript:/gi,
      ""
    )
    .replace(
      /data:/gi,
      ""
    )
    .replace(
      /vbscript:/gi,
      ""
    )
    .replace(
      /on\w+=/gi,
      ""
    )
    .replace(
      /[<>{}]/g,
      ""
    )
    .trim()
    .slice(0, maxLength);
};

/* =========================
 * QUERY PARAMS
 * ========================= */

export const sanitizeQueryParam =
  (
    param:
      | string
      | null,

    maxLength = 100
  ): string => {
    if (
      !param ||
      typeof param !==
        "string"
    ) {
      return "";
    }

    return param
      .replace(
        /[^a-zA-Z0-9\s\-_]/g,
        ""
      )
      .trim()
      .slice(0, maxLength);
  };

/* =========================
 * EXTERNAL URL VALIDATION
 * ========================= */

export const sanitizeExternalUrl =
  (
    url:
      | string
      | null
      | undefined,

    allowedDomains: string[] =
      []
  ): string | null => {
    if (
      !url ||
      typeof url !== "string"
    ) {
      return null;
    }

    try {
      const parsed =
        new URL(
          url.trim()
        );

      /* =========================
       * HTTPS ONLY
       * ========================= */

      if (
        parsed.protocol !==
        "https:"
      ) {
        if (
          process.env
            .NODE_ENV ===
            "development" &&
          parsed.hostname ===
            "localhost"
        ) {
          return parsed.href;
        }

        return null;
      }

      /* =========================
       * DOMAIN WHITELIST
       * ========================= */

      if (
        allowedDomains.length >
        0
      ) {
        const hostname =
          parsed.hostname.toLowerCase();

        const isAllowed =
          allowedDomains.some(
            (domain) =>
              hostname ===
                domain ||
              hostname.endsWith(
                `.${domain}`
              )
          );

        if (!isAllowed) {
          return null;
        }
      }

      return parsed.href;
    } catch {
      return null;
    }
  };

/* =========================
 * GOOGLE MAPS VALIDATION
 * ========================= */

export const validateGoogleMapsUrl =
  (
    url:
      | string
      | null
      | undefined
  ): string | null => {
    if (
      !url ||
      typeof url !== "string"
    ) {
      return null;
    }

    try {
      const parsed =
        new URL(
          url.trim()
        );

      if (
        parsed.protocol !==
        "https:"
      ) {
        return null;
      }

      const allowedHosts =
        [
          "google.com",
          "www.google.com",
          "maps.google.com",
          "google.com.bo",
          "www.google.com.bo",
        ];

      const hostname =
        parsed.hostname.toLowerCase();

      const validHost =
        allowedHosts.some(
          (host) =>
            hostname ===
              host ||
            hostname.endsWith(
              `.${host}`
            )
        );

      if (!validHost) {
        return null;
      }

      return parsed.href;
    } catch {
      return null;
    }
  };

/* =========================
 * FORM INPUTS
 * ========================= */

export const sanitizeFormInput =
  (
    value: string,

    maxLength = 1000
  ): string => {
    return sanitizeText(
      value,
      maxLength
    );
  };

/* =========================
 * CLIENT RATE LIMITER
 * ========================= */

export class ClientRateLimiter {
  private static timestamps =
    new Map<
      string,
      number[]
    >();

  static allow(
    key: string,

    maxRequests: number,

    windowMs: number
  ): boolean {
    const now =
      Date.now();

    const timestamps =
      this.timestamps.get(
        key
      ) || [];

    const valid =
      timestamps.filter(
        (ts) =>
          now - ts <
          windowMs
      );

    if (
      valid.length >=
      maxRequests
    ) {
      this.timestamps.set(
        key,
        valid
      );

      return false;
    }

    valid.push(now);

    this.timestamps.set(
      key,
      valid
    );

    return true;
  }

  static reset(
    key: string
  ): void {
    this.timestamps.delete(
      key
    );
  }
}
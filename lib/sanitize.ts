import DOMPurify from "isomorphic-dompurify";

/* =========================
 * TYPES
 * ========================= */

interface SanitizeOptions {
  allowLinks?: boolean;

  forceBlankTarget?: boolean;

  allowAria?: boolean;
}

/* =========================
 * CONSTANTS
 * ========================= */

const DEFAULT_ALLOWED_TAGS = [
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
  "a",
  "span",
  "div",
  "section",
  "article",
  "blockquote",
  "code",
  "pre",
  "small",
  "sub",
  "sup",
];

const DEFAULT_ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "title",
  "datetime",
  "cite",
  "lang",
  "dir",
];

const FORBID_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "link",
  "meta",
  "base",
  "svg",
  "math",
  "template",
];

const FORBID_ATTR = [
  "style",
  "srcdoc",
  "srcset",
  "formaction",
  "onerror",
  "onclick",
  "onload",
  "onmouseover",
  "onfocus",
  "onmouseenter",
];

/* =========================
 * SANITIZE HTML
 * ========================= */

export const sanitizeHTML = (
  html: string,
  options: SanitizeOptions = {}
): string => {
  if (
    !html ||
    typeof html !== "string"
  ) {
    return "";
  }

  try {
    const config = {
      ALLOWED_TAGS:
        options.allowLinks === false
          ? DEFAULT_ALLOWED_TAGS.filter(
              (tag) => tag !== "a"
            )
          : DEFAULT_ALLOWED_TAGS,

      ALLOWED_ATTR:
        options.allowLinks === false
          ? DEFAULT_ALLOWED_ATTR.filter(
              (attr) =>
                attr !== "href"
            )
          : DEFAULT_ALLOWED_ATTR,

      FORBID_TAGS,

      FORBID_ATTR,

      ALLOW_ARIA_ATTR:
        options.allowAria ?? false,

      ALLOW_DATA_ATTR: false,

      KEEP_CONTENT: true,

      SAFE_FOR_TEMPLATES: true,

      ALLOWED_URI_REGEXP:
        /^(?:(?:https?|mailto|tel):|\/|#)/i,
    };

    let sanitized =
      DOMPurify.sanitize(
        html,
        config
      );

    sanitized =
      typeof sanitized ===
      "string"
        ? sanitized
        : String(sanitized);

    /* =========================
     * FORCE SAFE LINKS
     * ========================= */

    if (
      options.forceBlankTarget &&
      typeof window !==
        "undefined"
    ) {
      const parser =
        new DOMParser();

      const doc =
        parser.parseFromString(
          sanitized,
          "text/html"
        );

      const links =
        doc.querySelectorAll(
          "a"
        );

      links.forEach((link) => {
        const href =
          link.getAttribute(
            "href"
          );

        const safeHref =
          sanitizeHref(href);

        if (!safeHref) {
          link.remove();
          return;
        }

        link.setAttribute(
          "href",
          safeHref
        );

        link.setAttribute(
          "target",
          "_blank"
        );

        link.setAttribute(
          "rel",
          "noopener noreferrer nofollow"
        );
      });

      return doc.body.innerHTML;
    }

    return sanitized;
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
 * STRICT HTML
 * ========================= */

export const sanitizeHTMLStrict =
  (
    html: string
  ): string => {
    return sanitizeHTML(
      html,
      {
        allowLinks: false,

        forceBlankTarget: false,

        allowAria: false,
      }
    );
  };

/* =========================
 * USER CONTENT
 * ========================= */

export const sanitizeUserContent =
  (
    html: string
  ): string => {
    return sanitizeHTML(
      html,
      {
        allowLinks: true,

        forceBlankTarget: true,

        allowAria: false,
      }
    );
  };

/* =========================
 * SANITIZE TEXT
 * ========================= */

export const sanitizeText = (
  text:
    | string
    | undefined
    | null,

  maxLength = 500
): string => {
  if (
    !text ||
    typeof text !== "string"
  ) {
    return "";
  }

  return text
    .replace(/<[^>]*>/g, "")
    .replace(
      /javascript:/gi,
      ""
    )
    .replace(
      /vbscript:/gi,
      ""
    )
    .replace(
      /data:/gi,
      ""
    )
    .replace(
      /on\w+=/gi,
      ""
    )
    .replace(
      /[<>]/g,
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
      | undefined
      | null,

    maxLength = 200
  ): string => {
    if (
      !param ||
      typeof param !== "string"
    ) {
      return "";
    }

    return param
      .replace(
        /[<>"'{}|\\^`\[\]]/g,
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
      .trim()
      .slice(0, maxLength);
  };

/* =========================
 * NUMERIC IDS
 * ========================= */

export const validateNumericId =
  (
    id: unknown
  ): number | null => {
    const num =
      Number(id);

    if (
      Number.isInteger(num) &&
      num > 0 &&
      num < 10000000
    ) {
      return num;
    }

    return null;
  };

/* =========================
 * EXTRACT TEXT
 * ========================= */

export const extractPlainText =
  (
    html: string
  ): string => {
    if (
      typeof window ===
      "undefined"
    ) {
      return html
        .replace(
          /<[^>]*>/g,
          ""
        )
        .trim();
    }

    const temp =
      document.createElement(
        "div"
      );

    temp.innerHTML = html;

    return (
      temp.textContent ||
      temp.innerText ||
      ""
    );
  };

/* =========================
 * HTML DETECTION
 * ========================= */

export const isHTML = (
  str: string
): boolean => {
  return /<[a-z][\s\S]*>/i.test(
    str
  );
};

/* =========================
 * SANITIZE URL
 * ========================= */

export const sanitizeHref = (
  href:
    | string
    | null
    | undefined
): string => {
  if (!href) {
    return "";
  }

  const trimmed =
    href.trim();

  const allowedProtocols =
    [
      "http://",
      "https://",
      "mailto:",
      "tel:",
      "/",
      "#",
    ];

  const isAllowed =
    allowedProtocols.some(
      (protocol) =>
        trimmed
          .toLowerCase()
          .startsWith(
            protocol
          )
    );

  if (!isAllowed) {
    return "";
  }

  const dangerousPatterns =
    [
      /javascript:/i,
      /vbscript:/i,
      /data:/i,
      /livescript:/i,
      /expression\(/i,
    ];

  if (
    dangerousPatterns.some(
      (pattern) =>
        pattern.test(trimmed)
    )
  ) {
    return "";
  }

  return trimmed;
};

/* =========================
 * FORM INPUTS
 * ========================= */

export const sanitizeFormInput =
  (
    value: string,
    maxLength = 255
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
  private static attempts =
    new Map<
      string,
      number[]
    >();

  static allow(
    key: string,

    maxAttempts: number,

    windowMs: number
  ): boolean {
    const now =
      Date.now();

    const attempts =
      this.attempts.get(
        key
      ) || [];

    const validAttempts =
      attempts.filter(
        (time) =>
          now - time <
          windowMs
      );

    if (
      validAttempts.length >=
      maxAttempts
    ) {
      return false;
    }

    validAttempts.push(now);

    this.attempts.set(
      key,
      validAttempts
    );

    return true;
  }

  static reset(
    key: string
  ): void {
    this.attempts.delete(
      key
    );
  }
};

export const sanitizeExternalUrl = (
  url?: string | null,
  allowedDomains: string[] = []
): string | null => {
  if (
    !url ||
    typeof url !== "string"
  ) {
    return null;
  }

  try {
    const parsed = new URL(
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
        process.env.NODE_ENV ===
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
      allowedDomains.length > 0
    ) {
      const hostname =
        parsed.hostname.toLowerCase();

      const isAllowed =
        allowedDomains.some(
          (domain) =>
            hostname === domain ||
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



export default sanitizeHTML;
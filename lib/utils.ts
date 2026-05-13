import { clsx, type ClassValue } from "clsx";

import { twMerge } from "tailwind-merge";

import DOMPurify from "isomorphic-dompurify";

/* =========================
 * CLASS MERGE
 * ========================= */

export function cn(
  ...inputs: ClassValue[]
) {
  return twMerge(
    clsx(inputs)
  );
}

/* =========================
 * STORAGE URL
 * ========================= */

export function getStorageUrl(
  path?: string | null
): string {
  if (
    !path ||
    typeof path !== "string"
  ) {
    return "/placeholder.svg";
  }

  const trimmed =
    path.trim();

  /* =========================
   * BLOCK DANGEROUS URLS
   * ========================= */

  const dangerousProtocols =
    [
      "javascript:",
      "data:",
      "vbscript:",
      "file:",
    ];

  const lower =
    trimmed.toLowerCase();

  if (
    dangerousProtocols.some(
      (protocol) =>
        lower.startsWith(
          protocol
        )
    )
  ) {
    return "/placeholder.svg";
  }

  /* =========================
   * FULL URL
   * ========================= */

  if (
    trimmed.startsWith(
      "http://"
    ) ||
    trimmed.startsWith(
      "https://"
    )
  ) {
    return trimmed;
  }

  /* =========================
   * STORAGE BASE
   * ========================= */

  const storage =
    process.env
      .NEXT_PUBLIC_STORAGE_URL;

  if (!storage) {
    console.warn(
      "NEXT_PUBLIC_STORAGE_URL no definido"
    );

    return `/placeholder.svg`;
  }

  return `${storage.replace(
    /\/$/,
    ""
  )}/${trimmed.replace(
    /^\//,
    ""
  )}`;
}

/* =========================
 * HEX COLOR VALIDATION
 * ========================= */

export function isValidHexColor(
  color?: string | null
): boolean {
  if (
    !color ||
    typeof color !== "string"
  ) {
    return false;
  }

  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(
    color.trim()
  );
}

/* =========================
 * SAFE COLOR
 * ========================= */

export function getSafeColor(
  color:
    | string
    | undefined
    | null,

  fallback: string
): string {
  return isValidHexColor(
    color
  )
    ? color!
    : fallback;
}

/* =========================
 * HEX TO RGBA
 * ========================= */

export function hexToRgba(
  hex: string,

  alpha = 1
): string {
  if (
    !isValidHexColor(hex)
  ) {
    return `rgba(0,0,0,${alpha})`;
  }

  let normalized =
    hex.replace("#", "");

  /* =========================
   * SHORT HEX (#FFF)
   * ========================= */

  if (
    normalized.length === 3
  ) {
    normalized =
      normalized
        .split("")
        .map(
          (char) =>
            char + char
        )
        .join("");
  }

  const bigint =
    parseInt(
      normalized,
      16
    );

  const r =
    (bigint >> 16) & 255;

  const g =
    (bigint >> 8) & 255;

  const b =
    bigint & 255;

  const safeAlpha =
    Math.min(
      1,
      Math.max(0, alpha)
    );

  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

/* =========================
 * SANITIZE HTML
 * ========================= */

export function sanitizeHTML(
  html?: string | null
): string {
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
          "a",
          "blockquote",
          "code",
          "pre",
        ],

        ALLOWED_ATTR: [
          "href",
          "target",
          "rel",
        ],

        FORBID_TAGS: [
          "script",
          "style",
          "iframe",
          "object",
          "embed",
          "svg",
          "math",
          "form",
        ],

        FORBID_ATTR: [
          "style",
          "srcdoc",
          "srcset",
        ],

        ALLOW_DATA_ATTR: false,

        SAFE_FOR_TEMPLATES: true,
      }
    );
  } catch (
    error
  ) {
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
}
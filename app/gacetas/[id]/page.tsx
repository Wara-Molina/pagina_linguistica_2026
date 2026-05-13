"use client";

import {
  useEffect,
  useMemo,
  useState,
  Suspense,
} from "react";

import {
  useParams,
} from "next/navigation";

import Link from "next/link";

import {
  ArrowLeft,
  Calendar,
  Download,
  ExternalLink,
  FileText,
  Maximize2,
  X,
} from "lucide-react";

import api from "@/lib/axios";

import {
  getStorageUrl,
} from "@/lib/utils";

import {
  sanitizeText,
} from "@/lib/sanitize";

import { Navbar } from "@/components/navbar";

import { Footer } from "@/components/footer";

/* =========================
 * TYPES
 * ========================= */

interface GacetaDetalle {
  gaceta_id: number;

  gaceta_titulo: string;

  gaceta_fecha: string;

  gaceta_tipo?: string;

  gaceta_documento?: string;
}

/* =========================
 * SECURITY
 * ========================= */

const isValidHexColor = (
  color?: string
): boolean => {
  if (
    typeof color !==
    "string"
  ) {
    return false;
  }

  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(
    color.trim()
  );
};

const getSafeColor = (
  color: string | undefined,
  fallback: string
): string => {
  if (
    color &&
    isValidHexColor(color)
  ) {
    return color;
  }

  return fallback;
};

const hexToRgba = (
  hex: string,
  alpha: number
): string => {
  const cleanHex =
    hex.replace("#", "");

  const bigint = parseInt(
    cleanHex,
    16
  );

  const r =
    (bigint >> 16) & 255;

  const g =
    (bigint >> 8) & 255;

  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const isValidDocumentUrl = (
  url?: string
): boolean => {
  if (!url) {
    return false;
  }

  try {
    const parsed =
      new URL(url);

    const validProtocol =
      parsed.protocol ===
        "https:" ||
      parsed.protocol ===
        "http:";

    const allowedDomains =
      [
        "upea.bo",
        "archivosminio.upea.bo",
        "localhost",
        "127.0.0.1",
      ];

    const validDomain =
      allowedDomains.some(
        (
          domain
        ) =>
          parsed.hostname ===
            domain ||
          parsed.hostname.endsWith(
            `.${domain}`
          )
      );

    return (
      validProtocol &&
      validDomain
    );
  } catch {
    return false;
  }
};

/* =========================
 * PAGE
 * ========================= */

function GacetaDetalleContent() {
  const params =
    useParams();

  const rawId =
    Number(
      params.id
    );

  const gacetaId =
    Number.isInteger(
      rawId
    ) &&
    rawId > 0
      ? rawId
      : null;

  const [
    gaceta,
    setGaceta,
  ] =
    useState<GacetaDetalle | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<
      string | null
    >(null);

  const [pdfOpen, setPdfOpen] =
    useState(false);

  const [primaryColor, setPrimaryColor] =
    useState("#04246C");

  const [
    secondaryColor,
    setSecondaryColor,
  ] = useState("#FC0102");

  const [
    tertiaryColor,
    setTertiaryColor,
  ] = useState("#020733");

  /* =========================
   * FETCH
   * ========================= */

  useEffect(() => {
    let mounted = true;

    const fetchData =
      async () => {
        try {
          setLoading(true);

          const institucionId =
            Math.max(
              1,
              Number(
                process.env
                  .NEXT_PUBLIC_INSTITUCION_ID
              ) || 32
            );

          const [
            gacetasRes,
            institucionRes,
          ] =
            await Promise.all([
              api.get(
                `/institucion/${institucionId}/gacetaEventos`
              ),

              api.get(
                `/institucionesPrincipal/${institucionId}`
              ),
            ]);

          if (
            !mounted
          ) {
            return;
          }

          const gacetas =
            gacetasRes.data
              ?.upea_gaceta_universitaria;

          if (
            !Array.isArray(
              gacetas
            )
          ) {
            setError(
              "No existen gacetas"
            );

            return;
          }

          const found =
            gacetas.find(
              (
                item: any
              ) =>
                Number(
                  item.gaceta_id
                ) ===
                gacetaId
            );

          if (
            !found
          ) {
            setError(
              "Gaceta no encontrada"
            );

            return;
          }

          const documento =
            found.gaceta_archivo_pdf ||
            found.gaceta_archivo ||
            found.archivo_gaceta ||
            found.gaceta_documento ||
            "";

          setGaceta({
            gaceta_id:
              Number(
                found.gaceta_id
              ) || 0,

            gaceta_titulo:
              sanitizeText(
                found.gaceta_titulo ||
                  "Documento",
                250
              ),

            gaceta_fecha:
              found.gaceta_fecha ||
              "",

            gaceta_tipo:
              sanitizeText(
                found.gaceta_tipo ||
                  "GACETA",
                80
              ),

            gaceta_documento:
              typeof documento ===
              "string"
                ? documento
                : "",
          });

          const colors =
            institucionRes.data
              ?.Descripcion
              ?.colorinstitucion?.[0];

          if (
            colors
          ) {
            setPrimaryColor(
              getSafeColor(
                colors.color_primario,
                "#04246C"
              )
            );

            setSecondaryColor(
              getSafeColor(
                colors.color_secundario,
                "#FC0102"
              )
            );

            setTertiaryColor(
              getSafeColor(
                colors.color_terciario,
                "#020733"
              )
            );
          }
        } catch (
          error
        ) {
          if (
            process.env.NODE_ENV !==
            "production"
          ) {
            console.error(
              error
            );
          }

          setError(
            "Error cargando la gaceta"
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [gacetaId]);

  /* =========================
   * ESC FULLSCREEN
   * ========================= */

  useEffect(() => {
    const handleEsc = (
      e: KeyboardEvent
    ) => {
      if (
        e.key ===
        "Escape"
      ) {
        setPdfOpen(
          false
        );
      }
    };

    if (
      pdfOpen
    ) {
      document.body.style.overflow =
        "hidden";

      window.addEventListener(
        "keydown",
        handleEsc
      );
    }

    return () => {
      document.body.style.overflow =
        "auto";

      window.removeEventListener(
        "keydown",
        handleEsc
      );
    };
  }, [pdfOpen]);

  /* =========================
   * PDF URL
   * ========================= */

  const pdfUrl =
    useMemo(() => {
      const documento =
        gaceta?.gaceta_documento;

      if (
        !documento ||
        typeof documento !==
          "string"
      ) {
        return "";
      }

      const clean =
        documento.trim();

      if (
        clean ===
          "" ||
        clean ===
          "Imagen" ||
        clean ===
          "null"
      ) {
        return "";
      }

      const finalUrl =
        getStorageUrl(
          clean
        );

      if (
        !isValidDocumentUrl(
          finalUrl
        )
      ) {
        return "";
      }

      const lower =
        finalUrl.toLowerCase();

      const isPdf =
        lower.endsWith(
          ".pdf"
        ) ||
        lower.includes(
          ".pdf?"
        );

      return isPdf
        ? finalUrl
        : "";
    }, [
      gaceta?.gaceta_documento,
    ]);

  /* =========================
   * DATE FORMAT
   * ========================= */

  const formatDate = (
    date?: string
  ): string => {
    if (!date)
      return "";

    const parsed =
      new Date(date);

    if (
      isNaN(
        parsed.getTime()
      )
    ) {
      return "";
    }

    return parsed.toLocaleDateString(
      "es-BO",
      {
        year:
          "numeric",

        month:
          "long",

        day: "numeric",
      }
    );
  };

  /* =========================
   * INVALID ID
   * ========================= */

  if (
    gacetaId ===
    null
  ) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-7xl mb-6">
              ⚠️
            </div>

            <h1 className="text-4xl font-bold mb-6">
              ID inválido
            </h1>

            <Link
              href="/gacetas"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-semibold"
              style={{
                background:
                  primaryColor,
              }}
            >
              <ArrowLeft className="w-5 h-5" />
              Volver
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  /* =========================
   * LOADING
   * ========================= */

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-16 h-16 rounded-full border-4 animate-spin"
            style={{
              borderColor:
                `${hexToRgba(primaryColor, 0.15)}`,

              borderTopColor:
                primaryColor,
            }}
          />
        </div>

        <Footer />
      </div>
    );
  }

  /* =========================
   * ERROR
   * ========================= */

  if (
    error ||
    !gaceta
  ) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-xl text-center">
            <div className="text-7xl mb-6">
              📄
            </div>

            <h1 className="text-4xl font-bold mb-4">
              {
                error
              }
            </h1>

            <p className="text-gray-600 mb-10">
              No se pudo
              cargar el
              documento.
            </p>

            <Link
              href="/gacetas"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-semibold"
              style={{
                background:
                  primaryColor,
              }}
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a
              gacetas
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  /* =========================
   * PAGE
   * ========================= */

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}

        <section
          className="relative overflow-hidden pt-36 pb-24"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${tertiaryColor} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)]" />

          <div className="relative max-w-7xl mx-auto px-6">
            <div className="inline-flex px-5 py-2 rounded-full bg-white/10 border border-white/10 text-white text-sm font-semibold mb-8 backdrop-blur-xl">
              {
                gaceta.gaceta_tipo
              }
            </div>

            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-[28px] bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center shrink-0">
                <FileText className="w-12 h-12 text-white" />
              </div>

              <div>
                <h1 className="text-4xl md:text-6xl font-bold text-white font-serif leading-tight mb-6">
                  {
                    gaceta.gaceta_titulo
                  }
                </h1>

                <div className="flex items-center gap-3 text-white/80">
                  <Calendar className="w-5 h-5" />

                  <span className="text-lg">
                    {formatDate(
                      gaceta.gaceta_fecha
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PDF */}

        <section className="max-w-7xl mx-auto px-6 py-16">
          {pdfUrl ? (
            <div className="bg-white rounded-[32px] border border-gray-200 overflow-hidden shadow-xl">
              <div className="p-6 border-b flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText
                    className="w-6 h-6"
                    style={{
                      color:
                        primaryColor,
                    }}
                  />

                  <span className="font-bold text-gray-900">
                    Vista previa
                    del PDF
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={
                      pdfUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 hover:bg-gray-50 font-semibold transition-all"
                    style={{
                      color:
                        primaryColor,
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir
                  </a>

                  <a
                    href={
                      pdfUrl
                    }
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 hover:bg-gray-50 font-semibold transition-all"
                    style={{
                      color:
                        primaryColor,
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </a>

                  <button
                    onClick={() =>
                      setPdfOpen(
                        true
                      )
                    }
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 hover:bg-gray-50 font-semibold transition-all"
                    style={{
                      color:
                        primaryColor,
                    }}
                  >
                    <Maximize2 className="w-4 h-4" />
                    Expandir
                  </button>
                </div>
              </div>

              <div className="h-[85vh] bg-gray-100">
                <iframe
                  src={
                    pdfUrl
                  }
                  className="w-full h-full border-0"
                  loading="lazy"
                  title={
                    gaceta.gaceta_titulo
                  }
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl p-16 text-center">
              <div
                className="w-28 h-28 rounded-full mx-auto flex items-center justify-center mb-8"
                style={{
                  background:
                    `${hexToRgba(primaryColor, 0.12)}`,
                }}
              >
                <FileText
                  className="w-14 h-14"
                  style={{
                    color:
                      primaryColor,
                  }}
                />
              </div>

              <h2 className="text-3xl font-bold mb-4">
                Documento no
                disponible
              </h2>

              <p className="text-gray-600 mb-10">
                Esta gaceta no
                tiene un PDF
                válido asociado.
              </p>

              <Link
                href="/gacetas"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-semibold"
                style={{
                  background:
                    primaryColor,
                }}
              >
                <ArrowLeft className="w-5 h-5" />
                Volver
              </Link>
            </div>
          )}
        </section>

        {/* FULLSCREEN PDF */}

        {pdfOpen &&
          pdfUrl && (
            <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md p-4">
              <button
                onClick={() =>
                  setPdfOpen(
                    false
                  )
                }
                className="absolute top-5 right-5 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center z-20"
              >
                <X className="w-7 h-7 text-white" />
              </button>

              <div className="w-full h-full bg-white rounded-[28px] overflow-hidden shadow-2xl">
                <iframe
                  src={
                    pdfUrl
                  }
                  className="w-full h-full border-0"
                  title={
                    gaceta.gaceta_titulo
                  }
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          )}
      </main>

      <Footer />
    </div>
  );
}

export default function GacetaDetallePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-[#04246C] animate-spin" />
        </div>
      }
    >
      <GacetaDetalleContent />
    </Suspense>
  );
}
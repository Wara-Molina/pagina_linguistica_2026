'use client';

import {
  useState,
  useEffect,
  Suspense,
  useMemo,
} from 'react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import Link from 'next/link';

import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  ExternalLink,
  Share2,
  Mail,
} from 'lucide-react';

import api from '@/lib/axios';

import {
  getStorageUrl,
} from '@/lib/utils';

import {
  sanitizeText,
} from '@/lib/sanitize';

import { Navbar } from '@/components/navbar';

import { Footer } from '@/components/footer';

// ==================== TYPES ====================

interface GacetaInvestigacion {
  gaceta_id: number;

  gaceta_titulo: string;

  gaceta_fecha: string;

  gaceta_documento?: string;

  gaceta_tipo: string;
}

interface InstitucionData {
  institucion_nombre?: string;

  institucion_correo1?: string;

  colorinstitucion?: Array<{
    color_primario?: string;

    color_secundario?: string;

    color_terciario?: string;
  }>;
}

// ==================== SECURITY ====================

const isValidHexColor = (
  color?: string
): boolean => {
  if (
    typeof color !==
    'string'
  ) {
    return false;
  }

  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(
    color.trim()
  );
};

const getSafeColor = (
  color: string | undefined,
  fallback: string
): string => {
  if (
    typeof color ===
      'string' &&
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
    hex.replace('#', '');

  const r = parseInt(
    cleanHex.substring(0, 2),
    16
  );

  const g = parseInt(
    cleanHex.substring(2, 4),
    16
  );

  const b = parseInt(
    cleanHex.substring(4, 6),
    16
  );

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

    const allowedDomains =
      [
        'upea.bo',
        'archivosminio.upea.bo',
        'apiadministrador.upea.bo',
        'localhost',
        '127.0.0.1',
      ];

    return (
      parsed.protocol ===
        'https:' &&
      allowedDomains.some(
        (domain) =>
          parsed.hostname.includes(
            domain
          )
      )
    );
  } catch {
    return false;
  }
};

// ==================== COMPONENT ====================

function GacetaDetalleContent() {
  const params =
    useParams();

  const router =
    useRouter();

  const rawId =
    Number(params.id);

  const gacetaId =
    Number.isInteger(
      rawId
    ) && rawId > 0
      ? rawId
      : null;

  const [gaceta, setGaceta] =
    useState<GacetaInvestigacion | null>(
      null
    );

  const [
    institucion,
    setInstitucion,
  ] =
    useState<InstitucionData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [primaryColor, setPrimaryColor] =
    useState('#04246C');

  const [
    secondaryColor,
    setSecondaryColor,
  ] = useState('#0A174E');

  const [
    tertiaryColor,
    setTertiaryColor,
  ] = useState('#020733');

  // ==================== FETCH ====================

  useEffect(() => {
    if (
      gacetaId ===
      null
    ) {
      setError(
        'ID inválido'
      );

      setLoading(false);

      return;
    }

    let mounted = true;

    const institucionId =
      Number(
        process.env
          .NEXT_PUBLIC_INSTITUCION_ID
      ) || 41;

    const fetchData =
      async () => {
        try {
          setLoading(true);

          const [
            gacetaRes,
            instRes,
          ] =
            await Promise.all([
              api.get(
                `/institucion/${institucionId}/gacetaEventos`
              ),

              api.get(
                `/institucionesPrincipal/${institucionId}`
              ),
            ]);

          if (!mounted)
            return;

          const gacetaFound =
            gacetaRes.data?.upea_gaceta_universitaria?.find(
              (
                g: any
              ) =>
                Number(
                  g.gaceta_id
                ) ===
                gacetaId
            );

          if (
            !gacetaFound
          ) {
            setError(
              'Gaceta no encontrada'
            );

            return;
          }

          setGaceta({
            gaceta_id:
              Number(
                gacetaFound.gaceta_id
              ),

            gaceta_titulo:
              sanitizeText(
                gacetaFound.gaceta_titulo,
                200
              ),

            gaceta_fecha:
              gacetaFound.gaceta_fecha,

            gaceta_documento:
              gacetaFound.gaceta_documento,

            gaceta_tipo:
              sanitizeText(
                gacetaFound.gaceta_tipo,
                50
              ),
          });

          setInstitucion(
            instRes.data
              ?.Descripcion ||
              null
          );

          const colors =
            instRes.data
              ?.Descripcion
              ?.colorinstitucion?.[0];

          if (colors) {
            setPrimaryColor(
              getSafeColor(
                colors.color_primario,
                '#04246C'
              )
            );

            setSecondaryColor(
              getSafeColor(
                colors.color_secundario,
                '#0A174E'
              )
            );

            setTertiaryColor(
              getSafeColor(
                colors.color_terciario,
                '#020733'
              )
            );
          }
        } catch (
          error
        ) {
          console.error(
            error
          );

          setError(
            'Error cargando gaceta'
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

  // ==================== HELPERS ====================

  const documentUrl =
    useMemo(() => {
      if (
        !gaceta?.gaceta_documento
      ) {
        return '';
      }

      const url =
        getStorageUrl(
          gaceta.gaceta_documento
        );

      return isValidDocumentUrl(
        url
      )
        ? url
        : '';
    }, [
      gaceta?.gaceta_documento,
    ]);

  const formatDate = (
    value?: string
  ) => {
    if (!value)
      return 'Sin fecha';

    const date =
      new Date(value);

    if (
      isNaN(
        date.getTime()
      )
    ) {
      return 'Fecha inválida';
    }

    return date.toLocaleDateString(
      'es-BO',
      {
        year:
          'numeric',

        month:
          'long',

        day: 'numeric',
      }
    );
  };

  const handleShare =
    async () => {
      try {
        if (
          navigator.share
        ) {
          await navigator.share(
            {
              title:
                gaceta?.gaceta_titulo,

              url: window.location.href,
            }
          );
        } else {
          await navigator.clipboard.writeText(
            window.location.href
          );

          alert(
            'Enlace copiado'
          );
        }
      } catch (
        error
      ) {
        console.error(
          error
        );
      }
    };

  // ==================== LOADING ====================

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-16 h-16 border-4 rounded-full animate-spin"
            style={{
              borderColor:
                `${hexToRgba(primaryColor, 0.2)}`,

              borderTopColor:
                primaryColor,
            }}
          />
        </div>

        <Footer />
      </div>
    );
  }

  // ==================== ERROR ====================

  if (
    error ||
    !gaceta
  ) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-7xl mb-6">
              📄
            </div>

            <h2 className="text-3xl font-bold mb-4">
              {error}
            </h2>

            <Link
              href="/institutoInvestigacion"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-semibold"
              style={{
                background:
                  primaryColor,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-1">
        {/* ELEGANT HERO */}

        <section
          className="relative overflow-hidden py-24"
          style={{
            background:
              primaryColor,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />

          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 bg-white" />

          <div className="relative max-w-7xl mx-auto px-6">
            <button
              onClick={() =>
                router.back()
              }
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-10"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>

            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 mb-8">
                <FileText className="w-5 h-5 text-white" />

                <span className="text-sm font-medium text-white">
                  Gaceta Institucional
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight font-serif">
                {gaceta.gaceta_titulo}
              </h1>

              <div className="flex flex-wrap items-center gap-6 mt-8 text-white/80">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />

                  <span>
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
          <div className="grid lg:grid-cols-3 gap-10">
            {/* VIEWER */}

            <div className="lg:col-span-2">
              <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
                {documentUrl ? (
                  <>
                    <div className="flex items-center justify-between p-6 border-b">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{
                            background:
                              `${hexToRgba(primaryColor, 0.1)}`,
                          }}
                        >
                          <FileText
                            className="w-6 h-6"
                            style={{
                              color:
                                primaryColor,
                            }}
                          />
                        </div>

                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            Documento PDF
                          </h3>

                          <p className="text-sm text-gray-500">
                            Vista previa
                          </p>
                        </div>
                      </div>

                      <a
                        href={
                          documentUrl
                        }
                        download
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold"
                        style={{
                          background:
                            primaryColor,
                        }}
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </a>
                    </div>

                    <div className="h-[80vh]">
                      <iframe
                        src={`${documentUrl}#toolbar=1`}
                        className="w-full h-full"
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        title={
                          gaceta.gaceta_titulo
                        }
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-20 text-center">
                    <div
                      className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6"
                      style={{
                        background:
                          `${hexToRgba(primaryColor, 0.1)}`,
                      }}
                    >
                      <FileText
                        className="w-10 h-10"
                        style={{
                          color:
                            primaryColor,
                        }}
                      />
                    </div>

                    <h3 className="text-2xl font-bold mb-4 text-gray-900">
                      Documento no disponible
                    </h3>

                    <p className="text-gray-600">
                      Esta gaceta no tiene un PDF adjunto.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SIDEBAR */}

            <div>
              <div className="bg-white rounded-[32px] border shadow-sm p-8 sticky top-24">
                <div className="flex items-center gap-3 mb-8">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background:
                        `${hexToRgba(primaryColor, 0.1)}`,
                    }}
                  >
                    <FileText
                      className="w-7 h-7"
                      style={{
                        color:
                          primaryColor,
                      }}
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-xl text-gray-900">
                      Información
                    </h3>

                    <p className="text-sm text-gray-500">
                      Gaceta
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs uppercase font-semibold tracking-wider text-gray-500 mb-2">
                      Tipo
                    </p>

                    <p className="font-semibold text-gray-900">
                      {
                        gaceta.gaceta_tipo
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase font-semibold tracking-wider text-gray-500 mb-2">
                      Fecha
                    </p>

                    <p className="font-semibold text-gray-900">
                      {formatDate(
                        gaceta.gaceta_fecha
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase font-semibold tracking-wider text-gray-500 mb-2">
                      Institución
                    </p>

                    <p className="font-semibold text-gray-900">
                      {
                        institucion?.institucion_nombre
                      }
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="space-y-4 mt-10">
                  {documentUrl && (
                    <>
                      <a
                        href={
                          documentUrl
                        }
                        download
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white font-semibold"
                        style={{
                          background:
                            primaryColor,
                        }}
                      >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                      </a>

                      <a
                        href={
                          documentUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 font-semibold"
                        style={{
                          borderColor:
                            primaryColor,

                          color:
                            primaryColor,
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir PDF
                      </a>
                    </>
                  )}

                  <button
                    onClick={
                      handleShare
                    }
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 font-semibold"
                    style={{
                      borderColor:
                        secondaryColor,

                      color:
                        secondaryColor,
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir
                  </button>

                  {institucion?.institucion_correo1 && (
                    <a
                      href={`mailto:${institucion.institucion_correo1}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 font-semibold"
                      style={{
                        borderColor:
                          tertiaryColor,

                        color:
                          tertiaryColor,
                      }}
                    >
                      <Mail className="w-4 h-4" />
                      Contactar
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
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
          <div className="w-16 h-16 border-4 border-gray-300 border-t-[#04246C] rounded-full animate-spin" />
        </div>
      }
    >
      <GacetaDetalleContent />
    </Suspense>
  );
}
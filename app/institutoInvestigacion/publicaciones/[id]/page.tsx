'use client';

import {
  useState,
  useEffect,
  Suspense,
  useMemo,
} from 'react';

import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Download,
  Share2,
  ExternalLink,
  User,
  FileText,
  X,
  ZoomIn,
  Mail,
} from 'lucide-react';

import Link from 'next/link';

import Image from 'next/image';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import api from '@/lib/axios';

import {
  getStorageUrl,
} from '@/lib/utils';

import {
  sanitizeHTML,
  sanitizeText,
} from '@/lib/sanitize';

import { Navbar } from '@/components/navbar';

import { Footer } from '@/components/footer';

// ==================== TYPES ====================

interface PublicacionInvestigacion {
  publicaciones_id: number;

  publicaciones_titulo: string;

  publicaciones_imagen?: string;

  publicaciones_descripcion?: string;

  publicaciones_documento?: string;

  publicaciones_fecha: string;

  publicaciones_autor?: string;

  publicaciones_tipo: string;
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

const isValidResourceUrl = (
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

    const validProtocol =
      parsed.protocol ===
      'https:';

    const validDomain =
      allowedDomains.some(
        (domain) =>
          parsed.hostname.includes(
            domain
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

// ==================== COMPONENT ====================

function PublicacionDetalleContent() {
  const params =
    useParams();

  const router =
    useRouter();

  const rawId =
    Number(params.id);

  const publicacionId =
    Number.isInteger(
      rawId
    ) && rawId > 0
      ? rawId
      : null;

  const [
    publicacion,
    setPublicacion,
  ] =
    useState<PublicacionInvestigacion | null>(
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

  const [imageOpen, setImageOpen] =
    useState(false);

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
      publicacionId ===
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
            publiRes,
            instRes,
          ] =
            await Promise.all([
              api.get(
                `/institucion/${institucionId}/recursos`
              ),

              api.get(
                `/institucionesPrincipal/${institucionId}`
              ),
            ]);

          if (!mounted)
            return;

          const publication =
            publiRes.data?.upea_publicaciones?.find(
              (
                p: any
              ) =>
                Number(
                  p.publicaciones_id
                ) ===
                publicacionId
            );

          if (
            !publication
          ) {
            setError(
              'Publicación no encontrada'
            );

            return;
          }

          setPublicacion({
            publicaciones_id:
              Number(
                publication.publicaciones_id
              ),

            publicaciones_titulo:
              sanitizeText(
                publication.publicaciones_titulo,
                200
              ),

            publicaciones_imagen:
              publication.publicaciones_imagen,

            publicaciones_descripcion:
              publication.publicaciones_descripcion,

            publicaciones_documento:
              publication.publicaciones_documento,

            publicaciones_fecha:
              publication.publicaciones_fecha,

            publicaciones_autor:
              sanitizeText(
                publication.publicaciones_autor,
                100
              ),

            publicaciones_tipo:
              sanitizeText(
                publication.publicaciones_tipo,
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
            'Error cargando publicación'
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
  }, [
    publicacionId,
  ]);

  // ==================== ESC MODAL ====================

  useEffect(() => {
    const handleEsc =
      (
        e: KeyboardEvent
      ) => {
        if (
          e.key ===
          'Escape'
        ) {
          setImageOpen(
            false
          );
        }
      };

    if (imageOpen) {
      document.body.style.overflow =
        'hidden';

      window.addEventListener(
        'keydown',
        handleEsc
      );
    }

    return () => {
      document.body.style.overflow =
        'unset';

      window.removeEventListener(
        'keydown',
        handleEsc
      );
    };
  }, [imageOpen]);

  // ==================== HELPERS ====================

  const imageUrl =
    useMemo(() => {
      if (
        !publicacion?.publicaciones_imagen
      ) {
        return '';
      }

      const url =
        getStorageUrl(
          publicacion.publicaciones_imagen
        );

      return isValidResourceUrl(
        url
      )
        ? url
        : '';
    }, [
      publicacion?.publicaciones_imagen,
    ]);

  const documentUrl =
    useMemo(() => {
      if (
        !publicacion?.publicaciones_documento
      ) {
        return '';
      }

      const url =
        getStorageUrl(
          publicacion.publicaciones_documento
        );

      return isValidResourceUrl(
        url
      )
        ? url
        : '';
    }, [
      publicacion?.publicaciones_documento,
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
                publicacion?.publicaciones_titulo,

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
    !publicacion
  ) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-7xl mb-6">
              📚
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
        {/* ELEGANT INSTITUTIONAL BANNER */}

        <section
          className="relative overflow-hidden py-24"
          style={{
            background:
              primaryColor,
          }}
        >
          {/* Elegant overlay */}

          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />

          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 bg-white" />

          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-3xl opacity-10 bg-white" />

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
                <BookOpen className="w-5 h-5 text-white" />

                <span className="text-sm font-medium text-white">
                  Publicación Académica
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight font-serif">
                {
                  publicacion.publicaciones_titulo
                }
              </h1>

              <div className="flex flex-wrap items-center gap-6 mt-8 text-white/80">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />

                  <span>
                    {formatDate(
                      publicacion.publicaciones_fecha
                    )}
                  </span>
                </div>

                {publicacion.publicaciones_autor && (
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" />

                    <span>
                      {
                        publicacion.publicaciones_autor
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}

        <section className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* MAIN */}

            <div className="lg:col-span-2">
              <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
                {/* IMAGE */}

                {imageUrl && (
                  <div
                    className="relative h-[420px] cursor-pointer group"
                    onClick={() =>
                      setImageOpen(
                        true
                      )
                    }
                  >
                    <Image
                      src={
                        imageUrl
                      }
                      alt={
                        publicacion.publicaciones_titulo
                      }
                      fill
                      priority
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-black/20" />

                    <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-xl rounded-full p-4 shadow-xl">
                      <ZoomIn
                        className="w-5 h-5"
                        style={{
                          color:
                            primaryColor,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* BODY */}

                <div className="p-8 md:p-10">
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          sanitizeHTML(
                            publicacion.publicaciones_descripcion ||
                              '<p>Sin descripción</p>'
                          ),
                      }}
                    />
                  </div>

                  {/* DOCUMENT */}

                  {documentUrl && (
                    <div
                      className="mt-10 p-6 rounded-3xl border"
                      style={{
                        borderColor:
                          `${hexToRgba(primaryColor, 0.15)}`,

                        background:
                          `${hexToRgba(primaryColor, 0.03)}`,
                      }}
                    >
                      <div className="flex flex-wrap gap-4">
                        <a
                          href={
                            documentUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-all hover:scale-[1.02]"
                          style={{
                            background:
                              primaryColor,
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver documento
                        </a>

                        <a
                          href={
                            documentUrl
                          }
                          download
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 font-semibold transition-all hover:bg-gray-50"
                          style={{
                            borderColor:
                              primaryColor,

                            color:
                              primaryColor,
                          }}
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </a>
                      </div>
                    </div>
                  )}

                  {/* ACTIONS */}

                  <div className="flex flex-wrap gap-4 mt-10">
                    <button
                      onClick={
                        handleShare
                      }
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 font-semibold transition-all"
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
                        href={`mailto:${institucion.institucion_correo1}?subject=${encodeURIComponent(
                          publicacion.publicaciones_titulo
                        )}`}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 font-semibold transition-all"
                        style={{
                          borderColor:
                            primaryColor,

                          color:
                            primaryColor,
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
                      Publicación
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
                        publicacion.publicaciones_tipo
                      }
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

                  <div>
                    <p className="text-xs uppercase font-semibold tracking-wider text-gray-500 mb-2">
                      Estado
                    </p>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Publicado
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <Link
                    href="/institutoInvestigacion"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-[1.01]"
                    style={{
                      background:
                        primaryColor,
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al instituto
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* IMAGE MODAL */}

        {imageOpen &&
          imageUrl && (
            <div
              className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6"
              onClick={() =>
                setImageOpen(
                  false
                )
              }
            >
              <button
                className="absolute top-6 right-6 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center"
                onClick={() =>
                  setImageOpen(
                    false
                  )
                }
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <div
                className="relative max-w-6xl w-full h-[90vh]"
                onClick={(
                  e
                ) =>
                  e.stopPropagation()
                }
              >
                <Image
                  src={
                    imageUrl
                  }
                  alt={
                    publicacion.publicaciones_titulo
                  }
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
      </main>

      <Footer />
    </div>
  );
}

export default function PublicacionDetallePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-[#04246C] rounded-full animate-spin" />
        </div>
      }
    >
      <PublicacionDetalleContent />
    </Suspense>
  );
}
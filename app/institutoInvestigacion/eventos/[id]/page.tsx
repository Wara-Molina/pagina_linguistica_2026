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

import Image from 'next/image';

import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Share2,
  Mail,
  ZoomIn,
  X,
  Target,
} from 'lucide-react';

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

interface EventoInvestigacion {
  evento_id: number;

  evento_titulo: string;

  evento_imagen?: string;

  evento_descripcion?: string;

  evento_fecha: string;

  evento_hora?: string;

  evento_lugar?: string;

  tipo_evento: string;
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

const isValidImageUrl = (
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

function EventoDetalleContent() {
  const params =
    useParams();

  const router =
    useRouter();

  const rawId =
    Number(params.id);

  const eventoId =
    Number.isInteger(
      rawId
    ) && rawId > 0
      ? rawId
      : null;

  const [evento, setEvento] =
    useState<EventoInvestigacion | null>(
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

  const [
    imageModalOpen,
    setImageModalOpen,
  ] = useState(false);

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
      eventoId ===
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
            eventoRes,
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

          const eventoFound =
            eventoRes.data?.upea_evento?.find(
              (
                e: any
              ) =>
                Number(
                  e.evento_id
                ) ===
                eventoId
            );

          if (
            !eventoFound
          ) {
            setError(
              'Evento no encontrado'
            );

            return;
          }

          setEvento({
            evento_id:
              Number(
                eventoFound.evento_id
              ),

            evento_titulo:
              sanitizeText(
                eventoFound.evento_titulo,
                200
              ),

            evento_imagen:
              eventoFound.evento_imagen,

            evento_descripcion:
              eventoFound.evento_descripcion,

            evento_fecha:
              eventoFound.evento_fecha,

            evento_hora:
              eventoFound.evento_hora?.substring(
                0,
                5
              ) || '',

            evento_lugar:
              sanitizeText(
                eventoFound.evento_lugar,
                150
              ),

            tipo_evento:
              sanitizeText(
                eventoFound.tipo_evento,
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
            'Error cargando evento'
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
  }, [eventoId]);

  // ==================== MODAL ====================

  useEffect(() => {
    const handleEsc =
      (
        e: KeyboardEvent
      ) => {
        if (
          e.key ===
          'Escape'
        ) {
          setImageModalOpen(
            false
          );
        }
      };

    if (
      imageModalOpen
    ) {
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
  }, [
    imageModalOpen,
  ]);

  // ==================== HELPERS ====================

  const imageUrl =
    useMemo(() => {
      if (
        !evento?.evento_imagen
      ) {
        return '';
      }

      const url =
        getStorageUrl(
          evento.evento_imagen
        );

      return isValidImageUrl(
        url
      )
        ? url
        : '';
    }, [
      evento?.evento_imagen,
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
        weekday:
          'long',

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
                evento?.evento_titulo,

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
    !evento
  ) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-7xl mb-6">
              📅
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
        {/* HERO IMAGE */}

        {imageUrl ? (
          <section
            className="relative h-[500px] overflow-hidden group cursor-pointer"
            onClick={() =>
              setImageModalOpen(
                true
              )
            }
          >
            <Image
              src={
                imageUrl
              }
              alt={
                evento.evento_titulo
              }
              fill
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, ${hexToRgba(
                  tertiaryColor,
                  0.5
                )} 0%, ${hexToRgba(
                  primaryColor,
                  0.9
                )} 100%)`,
              }}
            />

            {/* BUTTONS */}

            <button
              onClick={(
                e
              ) => {
                e.stopPropagation();

                router.back();
              }}
              className="absolute top-8 left-8 z-20 flex items-center gap-2 px-5 py-3 rounded-full bg-white/90 backdrop-blur-xl font-semibold shadow-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>

            <button
              onClick={(
                e
              ) => {
                e.stopPropagation();

                handleShare();
              }}
              className="absolute top-8 right-8 z-20 w-14 h-14 rounded-full bg-white/90 backdrop-blur-xl flex items-center justify-center shadow-xl"
            >
              <Share2
                className="w-5 h-5"
                style={{
                  color:
                    primaryColor,
                }}
              />
            </button>

            {/* CONTENT */}

            <div className="absolute bottom-0 left-0 right-0 z-10 max-w-7xl mx-auto px-6 pb-14">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 mb-6">
                  <Calendar className="w-5 h-5 text-white" />

                  <span className="text-white text-sm font-medium">
                    Evento Académico
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold text-white font-serif leading-tight">
                  {
                    evento.evento_titulo
                  }
                </h1>
              </div>
            </div>
          </section>
        ) : (
          <section
            className="relative py-28"
            style={{
              background:
                primaryColor,
            }}
          >
            <div className="max-w-7xl mx-auto px-6">
              <button
                onClick={() =>
                  router.back()
                }
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-10"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              <h1 className="text-4xl md:text-6xl font-bold text-white font-serif leading-tight max-w-5xl">
                {
                  evento.evento_titulo
                }
              </h1>
            </div>
          </section>
        )}

        {/* CONTENT */}

        <section className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* MAIN */}

            <div className="lg:col-span-2">
              <div className="bg-white rounded-[32px] border shadow-sm p-8 md:p-10">
                {/* INFO CARDS */}

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                  <div
                    className="p-5 rounded-2xl border"
                    style={{
                      background:
                        `${hexToRgba(primaryColor, 0.04)}`,

                      borderColor:
                        `${hexToRgba(primaryColor, 0.15)}`,
                    }}
                  >
                    <Calendar
                      className="w-6 h-6 mb-4"
                      style={{
                        color:
                          primaryColor,
                      }}
                    />

                    <p className="text-xs uppercase font-semibold text-gray-500 mb-2">
                      Fecha
                    </p>

                    <p className="font-semibold text-gray-900">
                      {formatDate(
                        evento.evento_fecha
                      )}
                    </p>
                  </div>

                  {evento.evento_hora && (
                    <div
                      className="p-5 rounded-2xl border"
                      style={{
                        background:
                          `${hexToRgba(secondaryColor, 0.04)}`,

                        borderColor:
                          `${hexToRgba(secondaryColor, 0.15)}`,
                      }}
                    >
                      <Clock
                        className="w-6 h-6 mb-4"
                        style={{
                          color:
                            secondaryColor,
                        }}
                      />

                      <p className="text-xs uppercase font-semibold text-gray-500 mb-2">
                        Hora
                      </p>

                      <p className="font-semibold text-gray-900">
                        {
                          evento.evento_hora
                        }
                      </p>
                    </div>
                  )}

                  {evento.evento_lugar && (
                    <div
                      className="p-5 rounded-2xl border"
                      style={{
                        background:
                          `${hexToRgba(tertiaryColor, 0.04)}`,

                        borderColor:
                          `${hexToRgba(tertiaryColor, 0.15)}`,
                      }}
                    >
                      <MapPin
                        className="w-6 h-6 mb-4"
                        style={{
                          color:
                            tertiaryColor,
                        }}
                      />

                      <p className="text-xs uppercase font-semibold text-gray-500 mb-2">
                        Lugar
                      </p>

                      <p className="font-semibold text-gray-900">
                        {
                          evento.evento_lugar
                        }
                      </p>
                    </div>
                  )}

                  <div
                    className="p-5 rounded-2xl border"
                    style={{
                      background:
                        `${hexToRgba(primaryColor, 0.04)}`,

                      borderColor:
                        `${hexToRgba(primaryColor, 0.15)}`,
                    }}
                  >
                    <Target
                      className="w-6 h-6 mb-4"
                      style={{
                        color:
                          primaryColor,
                      }}
                    />

                    <p className="text-xs uppercase font-semibold text-gray-500 mb-2">
                      Tipo
                    </p>

                    <p className="font-semibold text-gray-900">
                      {
                        evento.tipo_evento
                      }
                    </p>
                  </div>
                </div>

                {/* DESCRIPTION */}

                {evento.evento_descripcion && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Descripción
                    </h2>

                    <div
                      className="prose prose-lg max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html:
                          sanitizeHTML(
                            evento.evento_descripcion
                          ),
                      }}
                    />
                  </div>
                )}

                {/* ACTIONS */}

                <div className="flex flex-wrap gap-4 mt-10 pt-8 border-t">
                  <button
                    onClick={
                      handleShare
                    }
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold"
                    style={{
                      background:
                        primaryColor,
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir
                  </button>

                  {institucion?.institucion_correo1 && (
                    <a
                      href={`mailto:${institucion.institucion_correo1}?subject=${encodeURIComponent(
                        evento.evento_titulo
                      )}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 font-semibold"
                      style={{
                        borderColor:
                          secondaryColor,

                        color:
                          secondaryColor,
                      }}
                    >
                      <Mail className="w-4 h-4" />
                      Consultar
                    </a>
                  )}
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
                    <Calendar
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
                      Evento
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
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
                      Categoría
                    </p>

                    <p className="font-semibold text-gray-900">
                      {
                        evento.tipo_evento
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase font-semibold tracking-wider text-gray-500 mb-2">
                      Estado
                    </p>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Activo
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <Link
                    href="/institutoInvestigacion"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 font-semibold"
                    style={{
                      borderColor:
                        primaryColor,

                      color:
                        primaryColor,
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* IMAGE MODAL */}

        {imageModalOpen &&
          imageUrl && (
            <div
              className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6"
              onClick={() =>
                setImageModalOpen(
                  false
                )
              }
            >
              <button
                className="absolute top-6 right-6 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center"
                onClick={() =>
                  setImageModalOpen(
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
                    evento.evento_titulo
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

export default function EventoDetallePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-[#04246C] rounded-full animate-spin" />
        </div>
      }
    >
      <EventoDetalleContent />
    </Suspense>
  );
}
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

import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Share2,
  X,
  ZoomIn,
  Mail,
  ExternalLink,
} from 'lucide-react';

import Link from 'next/link';

import Image from 'next/image';

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

interface Evento {
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

    const safeDomain =
      parsed.hostname.includes(
        'upea.bo'
      ) ||
      parsed.hostname.includes(
        'localhost'
      ) ||
      parsed.hostname.includes(
        '127.0.0.1'
      );

    return (
      parsed.protocol ===
        'https:' &&
      safeDomain &&
      !parsed.pathname.includes(
        'javascript:'
      ) &&
      !parsed.pathname.includes(
        '<'
      ) &&
      !parsed.pathname.includes(
        '>'
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
    Number(
      params.id
    );

  const eventoId =
    Number.isInteger(
      rawId
    ) &&
    rawId > 0 &&
    rawId < 99999999
      ? rawId
      : null;

  const [evento, setEvento] =
    useState<Evento | null>(
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
    useState<
      string | null
    >(null);

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

  // ==================== INVALID ID ====================

  if (
    eventoId ===
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

            <h1 className="text-4xl font-bold mb-4">
              ID inválido
            </h1>

            <Link
              href="/eventos"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-semibold bg-[#04246C]"
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

  // ==================== FETCH ====================

  useEffect(() => {
    let mounted = true;

    const fetchData =
      async () => {
        try {
          setLoading(true);

          const institucionId =
            Number(
              process.env
                .NEXT_PUBLIC_INSTITUCION_ID
            ) || 41;

          const [
            eventosRes,
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

          if (
            !mounted
          )
            return;

          const found =
            eventosRes.data?.upea_evento?.find(
              (
                e: any
              ) =>
                Number(
                  e.evento_id
                ) ===
                eventoId
            );

          if (
            !found
          ) {
            setError(
              'Evento no encontrado'
            );

            return;
          }

          setEvento({
            evento_id:
              found.evento_id,

            evento_titulo:
              sanitizeText(
                found.evento_titulo,
                220
              ),

            evento_imagen:
              found.evento_imagen,

            evento_descripcion:
              sanitizeHTML(
                found.evento_descripcion ||
                  ''
              ),

            evento_fecha:
              found.evento_fecha,

            evento_hora:
              sanitizeText(
                found.evento_hora,
                20
              ),

            evento_lugar:
              sanitizeText(
                found.evento_lugar,
                120
              ),

            tipo_evento:
              sanitizeText(
                found.tipo_evento,
                60
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

          if (
            colors
          ) {
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
            'No se pudo cargar el evento'
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

  // ==================== ESC ====================

  useEffect(() => {
    const handleEsc = (
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

    if (
      imageOpen
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
  }, [imageOpen]);

  // ==================== IMAGE ====================

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

  // ==================== DATE ====================

  const formatDate = (
    value?: string
  ) => {
    if (!value)
      return '';

    const date =
      new Date(value);

    if (
      isNaN(
        date.getTime()
      )
    ) {
      return '';
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

  // ==================== SHARE ====================

  const handleShare =
    async () => {
      if (
        !evento
      )
        return;

      try {
        if (
          navigator.share
        ) {
          await navigator.share(
            {
              title:
                evento.evento_titulo,

              text: sanitizeText(
                evento.evento_descripcion,
                180
              ),

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
          <div className="text-center max-w-xl">
            <div className="text-7xl mb-6">
              📅
            </div>

            <h1 className="text-4xl font-bold mb-4">
              {
                error
              }
            </h1>

            <p className="text-gray-600 mb-10">
              El evento no
              existe o fue
              eliminado.
            </p>

            <Link
              href="/eventos"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-semibold"
              style={{
                background:
                  primaryColor,
              }}
            >
              <ArrowLeft className="w-5 h-5" />
              Ver eventos
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
        {/* HERO */}

        <section className="relative min-h-[520px] overflow-hidden">
          {imageUrl ? (
            <>
              <Image
                src={
                  imageUrl
                }
                alt={
                  evento.evento_titulo
                }
                fill
                priority
                className="object-cover"
              />

              <div className="absolute inset-0 bg-black/60" />

              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(
                    135deg,
                    ${hexToRgba(
                      tertiaryColor,
                      0.88
                    )} 0%,
                    ${hexToRgba(
                      primaryColor,
                      0.72
                    )} 45%,
                    rgba(0,0,0,0.55) 100%
                  )`,
                }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(
                  135deg,
                  ${primaryColor},
                  ${tertiaryColor}
                )`,
              }}
            />
          )}

          <div className="relative z-10">
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
              {/* TOP */}

              <div className="flex flex-wrap items-center gap-3 mb-10">
                <button
                  onClick={() =>
                    router.back()
                  }
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/95 text-gray-900 font-semibold shadow-lg hover:scale-105 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </button>

                <button
                  onClick={
                    handleShare
                  }
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-semibold backdrop-blur-xl hover:bg-white/20 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>

                {imageUrl && (
                  <button
                    onClick={() =>
                      setImageOpen(
                        true
                      )
                    }
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-semibold backdrop-blur-xl hover:bg-white/20 transition-all"
                  >
                    <ZoomIn className="w-4 h-4" />
                    Ver imagen
                  </button>
                )}
              </div>

              {/* TYPE */}

              <div className="inline-flex px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white text-sm font-semibold mb-8">
                {
                  evento.tipo_evento
                }
              </div>

              {/* TITLE */}

              <div className="max-w-5xl">
                <h1 className="font-serif text-5xl md:text-7xl font-semibold text-white leading-[0.95] mb-8 drop-shadow-2xl">
                  {
                    evento.evento_titulo
                  }
                </h1>

                {evento.evento_descripcion && (
                  <p className="text-xl text-white/85 leading-relaxed max-w-3xl line-clamp-3">
                    {sanitizeText(
                      evento.evento_descripcion,
                      250
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}

        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* MAIN */}

            <div className="lg:col-span-2">
              {/* IMAGE */}

              {imageUrl && (
                <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden mb-10">
                  <div className="relative aspect-[16/9]">
                    <Image
                      src={
                        imageUrl
                      }
                      alt={
                        evento.evento_titulo
                      }
                      fill
                      className="object-cover"
                    />

                    <button
                      onClick={() =>
                        setImageOpen(
                          true
                        )
                      }
                      className="absolute top-6 right-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black/60 backdrop-blur-xl text-white hover:bg-black/80 transition-all"
                    >
                      <ZoomIn className="w-5 h-5" />
                      Ampliar
                    </button>
                  </div>
                </div>
              )}

              {/* DESCRIPTION */}

              <div className="bg-white rounded-[32px] border shadow-sm p-8 md:p-10">
                <h2 className="text-3xl font-bold text-gray-900 font-serif mb-8">
                  Detalles del evento
                </h2>

                {evento.evento_descripcion ? (
                  <div
                    className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900"
                    dangerouslySetInnerHTML={{
                      __html:
                        sanitizeHTML(
                          evento.evento_descripcion
                        ),
                    }}
                  />
                ) : (
                  <p className="text-gray-600 leading-relaxed">
                    No existe una descripción disponible para este evento.
                  </p>
                )}

                <div className="flex flex-wrap gap-4 mt-12 pt-8 border-t">
                  <button
                    onClick={
                      handleShare
                    }
                    className="inline-flex items-center gap-3 px-7 py-4 rounded-full text-white font-semibold shadow-lg hover:scale-105 transition-all"
                    style={{
                      background:
                        primaryColor,
                    }}
                  >
                    <Share2 className="w-5 h-5" />
                    Compartir
                  </button>

                  {institucion?.institucion_correo1 && (
                    <a
                      href={`mailto:${institucion.institucion_correo1}`}
                      className="inline-flex items-center gap-3 px-7 py-4 rounded-full border-2 font-semibold hover:bg-gray-50 transition-all"
                      style={{
                        borderColor:
                          primaryColor,
                        color:
                          primaryColor,
                      }}
                    >
                      <Mail className="w-5 h-5" />
                      Contactar
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* SIDEBAR */}

            <div>
              <div className="sticky top-24 bg-white rounded-[32px] border shadow-sm p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 font-serif">
                  Información
                </h3>

                <div className="space-y-8">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                      Categoría
                    </p>

                    <p className="font-semibold text-gray-900">
                      {
                        evento.tipo_evento
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                      Institución
                    </p>

                    <p className="font-semibold text-gray-900">
                      {institucion?.institucion_nombre ||
                        'UPEA'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                      Fecha
                    </p>

                    <p className="font-semibold text-gray-900">
                      {formatDate(
                        evento.evento_fecha
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                      Hora
                    </p>

                    <p className="font-semibold text-gray-900">
                      {evento.evento_hora ||
                        'Por confirmar'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                      Lugar
                    </p>

                    <p className="font-semibold text-gray-900">
                      {evento.evento_lugar ||
                        'Por confirmar'}
                    </p>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t space-y-4">
                  <Link
                    href="/eventos"
                    className="inline-flex items-center justify-center gap-3 w-full px-6 py-4 rounded-full text-white font-semibold shadow-lg hover:scale-[1.02] transition-all"
                    style={{
                      background:
                        primaryColor,
                    }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Ver eventos
                  </Link>

                  {imageUrl && (
                    <button
                      onClick={() =>
                        setImageOpen(
                          true
                        )
                      }
                      className="inline-flex items-center justify-center gap-3 w-full px-6 py-4 rounded-full border-2 font-semibold hover:bg-gray-50 transition-all"
                      style={{
                        borderColor:
                          secondaryColor,
                        color:
                          secondaryColor,
                      }}
                    >
                      <ExternalLink className="w-5 h-5" />
                      Ver imagen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MODAL */}

        {imageOpen &&
          imageUrl && (
            <div
              className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
              role="dialog"
              aria-modal="true"
              onClick={() =>
                setImageOpen(
                  false
                )
              }
            >
              <button
                onClick={() =>
                  setImageOpen(
                    false
                  )
                }
                className="absolute top-4 right-4 md:top-6 md:right-6 w-12 h-12 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-all flex items-center justify-center z-50"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <div
                className="relative w-full h-full flex items-center justify-center"
                onClick={(e) =>
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
                  width={1400}
                  height={900}
                  unoptimized
                  className="
                    object-contain
                    rounded-2xl
                    shadow-2xl
                    max-w-[95vw]
                    md:max-w-[85vw]
                    lg:max-w-[75vw]
                    max-h-[85vh]
                    w-auto
                    h-auto
                  "
                />
              </div>
            </div>
          )}
      </main>

      <Footer />
    </div>
  );
}

// ==================== EXPORT ====================

export default function EventoDetallePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-14 h-14 border-4 border-gray-300 border-t-[#04246C] rounded-full animate-spin" />
        </div>
      }
    >
      <EventoDetalleContent />
    </Suspense>
  );
}
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
  Clock,
  FileText,
  Share2,
  Bell,
  X,
  ZoomIn,
  Mail,
  Megaphone,
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
  validateNumericId,
} from '@/lib/security';

import { Navbar } from '@/components/navbar';

import { Footer } from '@/components/footer';

// ================= TYPES =================

interface Comunicado {
  idconvocatorias: number;

  con_foto_portada?: string;

  con_titulo: string;

  con_descripcion?: string;

  con_estado: string;

  con_fecha_inicio?: string;

  con_fecha_fin?: string;

  tipo_conv_comun?: {
    idtipo_conv_comun: number;

    tipo_conv_comun_titulo: string;

    tipo_conv_comun_estado: string;
  };
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

// ================= SECURITY =================

const isValidHexColor = (
  color?: string
): boolean => {
  if (!color) {
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

    const safeProtocol =
      parsed.protocol ===
      'https:';

    const safeHost =
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
      safeProtocol &&
      safeHost
    );
  } catch {
    return false;
  }
};

// ================= COMPONENT =================

function ComunicadoDetalleContent() {
  const params =
    useParams();

  const router =
    useRouter();

  const [
    comunicado,
    setComunicado,
  ] =
    useState<Comunicado | null>(
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

  const [
    imageModalOpen,
    setImageModalOpen,
  ] =
    useState(false);

  // COLORS

  const [primaryColor, setPrimaryColor] =
    useState('#04246C');

  const [
    secondaryColor,
    setSecondaryColor,
  ] = useState('#FC0102');

  const [
    tertiaryColor,
    setTertiaryColor,
  ] = useState('#020733');

  // ================= FETCH =================

  useEffect(() => {
    let mounted =
      true;

    const fetchData =
      async () => {
        try {
          const safeId =
            validateNumericId(
              params.id
            );

          if (
            !safeId
          ) {
            setError(
              'ID inválido'
            );

            setLoading(
              false
            );

            return;
          }

          const institucionId =
            Number(
              process.env
                .NEXT_PUBLIC_INSTITUCION_ID
            ) || 41;

          const [
            comunicadosRes,
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

          const comunicadoEncontrado =
            comunicadosRes.data?.convocatorias?.find(
              (
                c: Comunicado
              ) =>
                c.idconvocatorias ===
                safeId
            );

          if (
            !comunicadoEncontrado
          ) {
            setError(
              'Comunicado no encontrado'
            );

            return;
          }

          setComunicado(
            comunicadoEncontrado
          );

          setInstitucion(
            institucionRes
              .data
              ?.Descripcion ||
              null
          );

          const colors =
            institucionRes
              .data
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
                '#FC0102'
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
            'No se pudo cargar el comunicado'
          );
        } finally {
          if (
            mounted
          ) {
            setLoading(
              false
            );
          }
        }
      };

    fetchData();

    return () => {
      mounted =
        false;
    };
  }, [params.id]);

  // ================= ESC MODAL =================

  useEffect(() => {
    const handleEsc =
      (
        event: KeyboardEvent
      ) => {
        if (
          event.key ===
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

  // ================= HELPERS =================

  const formatDate = (
    date?: string
  ) => {
    if (
      !date
    ) {
      return 'Por definir';
    }

    try {
      return new Date(
        date
      ).toLocaleDateString(
        'es-BO',
        {
          year:
            'numeric',

          month:
            'long',

          day: 'numeric',
        }
      );
    } catch {
      return 'Por definir';
    }
  };

  const imageUrl =
    useMemo(() => {
      if (
        !comunicado?.con_foto_portada
      ) {
        return '';
      }

      const url =
        getStorageUrl(
          comunicado.con_foto_portada
        );

      return isValidImageUrl(
        url
      )
        ? url
        : '';
    }, [
      comunicado?.con_foto_portada,
    ]);

  const tipo =
    comunicado
      ?.tipo_conv_comun
      ?.tipo_conv_comun_titulo ||
    'COMUNICADO';

  const tipoColor =
    tipo ===
    'CONVOCATORIAS'
      ? primaryColor
      : tipo ===
        'AVISOS'
      ? '#f59e0b'
      : secondaryColor;

  // ================= SHARE =================

  const handleShare =
    async () => {
      if (
        !comunicado
      ) {
        return;
      }

      const title =
        sanitizeText(
          comunicado.con_titulo,
          150
        );

      const text =
        sanitizeText(
          comunicado.con_descripcion?.replace(
            /<[^>]*>/g,
            ''
          ) || '',
          200
        );

      try {
        if (
          navigator.share
        ) {
          await navigator.share(
            {
              title,
              text,

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

  // ================= LOADING =================

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

  // ================= ERROR =================

  if (
    error ||
    !comunicado
  ) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-lg">
            <div className="text-7xl mb-8">
              📭
            </div>

            <h1 className="text-4xl font-bold mb-4">
              {error}
            </h1>

            <p className="text-gray-600 mb-10">
              El comunicado
              solicitado no
              existe o fue
              eliminado.
            </p>

            <Link
              href="/comunicados"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-semibold shadow-lg"
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

  // ================= PAGE =================

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}

        <section
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${tertiaryColor} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_30%)]" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
            <button
              onClick={() =>
                router.back()
              }
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-10"
            >
              <ArrowLeft className="w-5 h-5" />

              Volver
            </button>

            <div className="max-w-4xl">
              <span
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold mb-8"
                style={{
                  background:
                    'rgba(255,255,255,0.12)',

                  color:
                    '#fff',
                }}
              >
                {tipo ===
                'CONVOCATORIAS' ? (
                  <Calendar className="w-4 h-4" />
                ) : tipo ===
                  'AVISOS' ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <Megaphone className="w-4 h-4" />
                )}

                {tipo}
              </span>

              <h1 className="text-4xl md:text-6xl font-bold text-white font-serif leading-tight mb-8">
                {sanitizeText(
                  comunicado.con_titulo,
                  200
                )}
              </h1>

              <div className="flex flex-wrap gap-5 text-white/80">
                {comunicado.con_fecha_inicio && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />

                    <span>
                      {formatDate(
                        comunicado.con_fecha_inicio
                      )}
                    </span>
                  </div>
                )}

                {comunicado.con_fecha_fin && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />

                    <span>
                      {formatDate(
                        comunicado.con_fecha_fin
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}

        <section className="relative z-20 -mt-14 pb-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-10">
              {/* MAIN */}

              <div className="lg:col-span-2">
                <div className="bg-white rounded-[32px] shadow-xl border overflow-hidden">
                  {/* IMAGE */}

                  {imageUrl && (
                    <div
                      className="relative h-[260px] md:h-[420px] cursor-pointer group"
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
                        alt={sanitizeText(
                          comunicado.con_titulo,
                          150
                        )}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        priority
                      />

                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <div className="bg-white/90 backdrop-blur-xl rounded-full px-6 py-3 flex items-center gap-2 shadow-xl">
                          <ZoomIn
                            className="w-5 h-5"
                            style={{
                              color:
                                primaryColor,
                            }}
                          />

                          <span className="font-semibold text-gray-900">
                            Ver
                            imagen
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BODY */}

                  <div className="p-8 md:p-10">
                    <div
                      className="prose prose-lg max-w-none prose-img:rounded-2xl"
                      dangerouslySetInnerHTML={{
                        __html:
                          sanitizeHTML(
                            comunicado.con_descripcion ||
                              '<p>Sin descripción disponible.</p>'
                          ),
                      }}
                    />

                    {/* ACTIONS */}

                    <div
                      className="flex flex-wrap gap-4 mt-12 pt-8 border-t"
                      style={{
                        borderColor:
                          `${hexToRgba(primaryColor, 0.12)}`,
                      }}
                    >
                      <button
                        onClick={
                          handleShare
                        }
                        className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 font-semibold transition-all hover:scale-105"
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
                            comunicado.con_titulo
                          )}`}
                          className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 font-semibold transition-all hover:scale-105"
                          style={{
                            borderColor:
                              primaryColor,

                            color:
                              primaryColor,
                          }}
                        >
                          <Mail className="w-4 h-4" />

                          Consultar
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SIDEBAR */}

              <div>
                <div className="bg-white rounded-[32px] border shadow-lg p-8 sticky top-24">
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
                      <h3 className="text-2xl font-bold text-gray-900 font-serif">
                        Información
                      </h3>

                      <p className="text-sm text-gray-500">
                        Detalles del
                        comunicado
                      </p>
                    </div>
                  </div>

                  <div className="space-y-7">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-2">
                        Categoría
                      </p>

                      <span
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                        style={{
                          background:
                            `${hexToRgba(tipoColor, 0.12)}`,

                          color:
                            tipoColor,
                        }}
                      >
                        {tipo}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-2">
                        Institución
                      </p>

                      <p className="font-semibold text-gray-900">
                        {sanitizeText(
                          institucion?.institucion_nombre ||
                            'UPEA',
                          120
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-2">
                        Estado
                      </p>

                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

                        Publicado
                      </span>
                    </div>
                  </div>

                  <div
                    className="mt-10 pt-8 border-t"
                    style={{
                      borderColor:
                        `${hexToRgba(primaryColor, 0.12)}`,
                    }}
                  >
                    <Link
                      href="/comunicados"
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full border-2 font-semibold transition-all hover:scale-[1.02]"
                      style={{
                        borderColor:
                          primaryColor,

                        color:
                          primaryColor,
                      }}
                    >
                      <ArrowLeft className="w-4 h-4" />

                      Ver todos
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

{/* IMAGE MODAL */}

{imageModalOpen &&
  imageUrl && (
    <div
      className="
        fixed
        inset-0
        z-[999]
        bg-black/95
        backdrop-blur-md
        flex
        items-center
        justify-center
        p-4
        md:p-8
      "
      onClick={() =>
        setImageModalOpen(
          false
        )
      }
    >
      {/* CLOSE */}

      <button
        onClick={() =>
          setImageModalOpen(
            false
          )
        }
        className="
          absolute
          top-4
          right-4
          md:top-6
          md:right-6
          w-12
          h-12
          md:w-14
          md:h-14
          rounded-full
          bg-white/10
          hover:bg-white/20
          border
          border-white/10
          transition-all
          flex
          items-center
          justify-center
          z-50
        "
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* IMAGE */}

      <div
        className="
          relative
          w-full
          h-full
          flex
          items-center
          justify-center
        "
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <Image
          src={imageUrl}
          alt={sanitizeText(
            comunicado.con_titulo,
            150
          )}
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

// ================= PAGE =================

export default function ComunicadoDetallePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <Navbar />

          <div className="flex-1 flex items-center justify-center">
            <div className="w-14 h-14 border-4 border-gray-300 border-t-[#04246C] rounded-full animate-spin" />
          </div>

          <Footer />
        </div>
      }
    >
      <ComunicadoDetalleContent />
    </Suspense>
  );
}
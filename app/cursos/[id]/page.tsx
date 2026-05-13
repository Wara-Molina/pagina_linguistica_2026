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
  Clock,
  Users,
  CalendarDays,
  MapPin,
  CheckCircle,
  Share2,
  X,
  ZoomIn,
  Mail,
  GraduationCap,
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

interface Curso {
  iddetalle_cursos_academicos: number;

  det_img_portada?: string;

  det_titulo: string;

  det_descripcion?: string;

  det_costo: number;

  det_costo_ext?: number;

  det_cupo_max: number;

  det_carga_horaria?: number;

  det_lugar_curso?: string;

  det_modalidad: string;

  det_fecha_ini?: string;

  det_fecha_fin?: string;

  det_hora_ini?: string;

  det_codigo?: string;

  det_version?: string;

  det_estado: string;

  tipo_curso_otro?: {
    tipo_conv_curso_nombre: string;
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

const isSafeImageUrl = (
  url?: string
): boolean => {
  if (!url) {
    return false;
  }

  try {
    const parsed =
      new URL(url);

    return (
      parsed.protocol ===
        'https:' &&
      (parsed.hostname.includes(
        'upea.bo'
      ) ||
        parsed.hostname.includes(
          'localhost'
        ))
    );
  } catch {
    return false;
  }
};

// ================= COMPONENT =================

function CursoDetalleContent() {
  const params =
    useParams();

  const router =
    useRouter();

  const [curso, setCurso] =
    useState<Curso | null>(
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

  // ================= FETCH =================

  useEffect(() => {
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
              'Curso inválido'
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

          const cursoEncontrado =
            gacetaRes.data?.cursos?.find(
              (
                c: Curso
              ) =>
                c.iddetalle_cursos_academicos ===
                safeId
            );

          if (
            !cursoEncontrado
          ) {
            setError(
              'Curso no encontrado'
            );

            return;
          }

          setCurso(
            cursoEncontrado
          );

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
            'No se pudo cargar el curso'
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    if (
      params.id
    ) {
      fetchData();
    }
  }, [params.id]);

  // ================= ESC MODAL =================

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

  // ================= IMAGE =================

  const imageUrl =
    useMemo(() => {
      if (
        !curso?.det_img_portada
      ) {
        return '';
      }

      const url =
        getStorageUrl(
          curso.det_img_portada
        );

      return isSafeImageUrl(
        url
      )
        ? url
        : '';
    }, [
      curso?.det_img_portada,
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

  const handleShare =
    async () => {
      if (
        !curso
      ) {
        return;
      }

      try {
        if (
          navigator.share
        ) {
          await navigator.share(
            {
              title:
                sanitizeText(
                  curso.det_titulo,
                  120
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
    !curso
  ) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="text-7xl mb-8">
              📚
            </div>

            <h1 className="text-4xl font-bold mb-4">
              {error}
            </h1>

            <p className="text-gray-600 mb-10">
              No pudimos
              encontrar
              este curso
            </p>

            <Link
              href="/cursos"
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

  // ================= VALUES =================

  const tipoCurso =
    sanitizeText(
      curso
        .tipo_curso_otro
        ?.tipo_conv_curso_nombre ||
        'Curso',
      50
    );

  const institucionNombre =
    sanitizeText(
      institucion?.institucion_nombre ||
        'UPEA',
      120
    );

  // ================= RENDER =================

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
          {imageUrl ? (
            <div
              className="
                relative
                h-[520px]
                md:h-[680px]
                overflow-hidden
                cursor-pointer
                group
              "
              onClick={() =>
                setImageOpen(
                  true
                )
              }
            >
              {/* IMAGE */}

              <Image
                src={
                  imageUrl
                }
                alt={sanitizeText(
                  curso.det_titulo,
                  120
                )}
                fill
                priority
                className="
                  object-cover
                  object-center
                  group-hover:scale-105
                  transition-transform
                  duration-700
                "
              />

              {/* OVERLAY */}

              <div
                className="
                  absolute
                  inset-0
                  bg-gradient-to-t
                  from-[#020733]/95
                  via-[#020733]/70
                  to-[#020733]/30
                "
              />

              {/* EXTRA DARK */}

              <div className="absolute inset-0 bg-black/20" />

              {/* ZOOM */}

              <div
                className="
                  absolute
                  top-8
                  right-8
                  opacity-0
                  group-hover:opacity-100
                  transition-all
                  duration-300
                "
              >
                <div
                  className="
                    bg-white/10
                    backdrop-blur-xl
                    border
                    border-white/20
                    rounded-full
                    px-5
                    py-3
                    flex
                    items-center
                    gap-3
                    text-white
                    shadow-2xl
                  "
                >
                  <ZoomIn className="w-5 h-5" />

                  <span className="font-medium">
                    Ampliar
                  </span>
                </div>
              </div>

              {/* CONTENT */}

              <div className="absolute bottom-0 left-0 right-0">
                <div className="max-w-7xl mx-auto px-6 pb-32 md:pb-40">
                  {/* BACK */}

                  <button
                    onClick={(
                      e
                    ) => {
                      e.stopPropagation();

                      router.back();
                    }}
                    className="
                      mb-10
                      inline-flex
                      items-center
                      gap-3
                      text-white/80
                      hover:text-white
                      transition-colors
                    "
                  >
                    <ArrowLeft className="w-5 h-5" />

                    Volver
                  </button>

                  {/* TEXT */}

                  <div className="max-w-4xl">
                    <span
                      className="
                        inline-flex
                        items-center
                        gap-2
                        px-5
                        py-2
                        rounded-full
                        bg-white/10
                        backdrop-blur-xl
                        border
                        border-white/10
                        text-white
                        text-sm
                        uppercase
                        tracking-[0.25em]
                        font-semibold
                        mb-8
                      "
                    >
                      <GraduationCap className="w-4 h-4" />

                      {
                        tipoCurso
                      }
                    </span>

                    <h1
                      className="
                        text-4xl
                        md:text-6xl
                        font-bold
                        text-white
                        leading-tight
                        font-serif
                        mb-6
                        drop-shadow-2xl
                      "
                    >
                      {sanitizeText(
                        curso.det_titulo,
                        180
                      )}
                    </h1>

                    <p
                      className="
                        text-lg
                        md:text-xl
                        text-white/90
                        leading-relaxed
                        max-w-3xl
                      "
                    >
                      Formación
                      académica
                      especializada
                      de{' '}
                      <span className="font-semibold text-white">
                        {
                          institucionNombre
                        }
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24">
              <div className="max-w-7xl mx-auto px-6">
                <button
                  onClick={() =>
                    router.back()
                  }
                  className="mb-10 inline-flex items-center gap-3 text-white/80 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />

                  Volver
                </button>

                <div className="max-w-4xl">
                  <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white text-sm uppercase tracking-[0.25em] font-semibold mb-8">
                    <GraduationCap className="w-4 h-4" />

                    {
                      tipoCurso
                    }
                  </span>

                  <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight font-serif">
                    {sanitizeText(
                      curso.det_titulo,
                      180
                    )}
                  </h1>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* CONTENT */}

        <section className="relative -mt-6 md:-mt-14 lg:-mt-20 pb-24 z-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-10">
              {/* MAIN */}

              <div className="lg:col-span-2 space-y-8">
                {/* INFO */}

                <div className="bg-white rounded-[32px] border shadow-xl overflow-hidden">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                    <div className="p-8 border-b lg:border-b-0 lg:border-r">
                      <Clock
                        className="w-8 h-8 mb-5"
                        style={{
                          color:
                            primaryColor,
                        }}
                      />

                      <p className="text-sm uppercase tracking-widest text-gray-500 font-semibold mb-2">
                        Duración
                      </p>

                      <p className="font-bold text-lg text-gray-900">
                        {curso.det_carga_horaria ||
                          'Por definir'}{' '}
                        horas
                      </p>
                    </div>

                    <div className="p-8 border-b lg:border-b-0 lg:border-r">
                      <Users
                        className="w-8 h-8 mb-5"
                        style={{
                          color:
                            secondaryColor,
                        }}
                      />

                      <p className="text-sm uppercase tracking-widest text-gray-500 font-semibold mb-2">
                        Cupos
                      </p>

                      <p className="font-bold text-lg text-gray-900">
                        {
                          curso.det_cupo_max
                        }
                      </p>
                    </div>

                    <div className="p-8 border-b sm:border-b-0 lg:border-r">
                      <CalendarDays
                        className="w-8 h-8 mb-5"
                        style={{
                          color:
                            tertiaryColor,
                        }}
                      />

                      <p className="text-sm uppercase tracking-widest text-gray-500 font-semibold mb-2">
                        Inicio
                      </p>

                      <p className="font-bold text-lg text-gray-900">
                        {formatDate(
                          curso.det_fecha_ini
                        )}
                      </p>
                    </div>

                    <div className="p-8">
                      <MapPin
                        className="w-8 h-8 mb-5"
                        style={{
                          color:
                            primaryColor,
                        }}
                      />

                      <p className="text-sm uppercase tracking-widest text-gray-500 font-semibold mb-2">
                        Modalidad
                      </p>

                      <p className="font-bold text-lg text-gray-900">
                        {sanitizeText(
                          curso.det_modalidad ||
                            'Presencial',
                          50
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DESCRIPTION */}

                {curso.det_descripcion && (
                  <div className="bg-white rounded-[32px] border shadow-sm p-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 font-serif">
                      Descripción
                    </h2>

                    <div
                      className="prose prose-lg max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html:
                          sanitizeHTML(
                            curso.det_descripcion
                          ),
                      }}
                    />
                  </div>
                )}
              </div>

              {/* SIDEBAR */}

              <div className="space-y-8">
                <div className="bg-white rounded-[32px] border shadow-xl p-8 lg:sticky lg:top-24">
                  <div className="mb-10">
                    <p className="text-sm uppercase tracking-widest text-gray-500 font-semibold mb-4">
                      Inversión
                    </p>

                    {curso.det_costo >
                    0 ? (
                      <>
                        <h2
                          className="text-5xl font-bold mb-3"
                          style={{
                            color:
                              primaryColor,
                          }}
                        >
                          Bs.{' '}
                          {
                            curso.det_costo
                          }
                        </h2>

                        {curso.det_costo_ext &&
                          curso.det_costo_ext !==
                            curso.det_costo && (
                            <p className="text-gray-500">
                              Externos:{' '}
                              Bs.{' '}
                              {
                                curso.det_costo_ext
                              }
                            </p>
                          )}
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-10 h-10 text-green-500" />

                        <span className="text-4xl font-bold text-green-600">
                          Gratuito
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ACTIONS */}

                  <div className="space-y-4">
                    <button
                      onClick={
                        handleShare
                      }
                      className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-full text-white font-semibold shadow-lg hover:shadow-2xl transition-all"
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
                        className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-full border-2 font-semibold transition-all"
                        style={{
                          borderColor:
                            secondaryColor,

                          color:
                            secondaryColor,
                        }}
                      >
                        <Mail className="w-5 h-5" />

                        Consultar
                      </a>
                    )}

                    <Link
                      href="/cursos"
                      className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-full border font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <ArrowLeft className="w-5 h-5" />

                      Volver a
                      cursos
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MODAL */}

        {imageOpen &&
          imageUrl && (
            <div
              className="
                fixed
                inset-0
                z-[100]
                bg-black/95
                backdrop-blur-xl
                flex
                items-center
                justify-center
                p-4
                md:p-10
              "
              onClick={() =>
                setImageOpen(
                  false
                )
              }
            >
              {/* CLOSE */}

              <button
                onClick={() =>
                  setImageOpen(
                    false
                  )
                }
                className="
                  absolute
                  top-5
                  right-5
                  md:top-8
                  md:right-8
                  w-14
                  h-14
                  rounded-full
                  bg-white/10
                  border
                  border-white/10
                  flex
                  items-center
                  justify-center
                  text-white
                  hover:bg-white/20
                  transition-all
                  z-50
                "
              >
                <X className="w-7 h-7" />
              </button>

              {/* IMAGE CONTAINER */}

              <div
                className="
                  relative
                  w-full
                  h-full
                  max-w-7xl
                  max-h-[92vh]
                  flex
                  items-center
                  justify-center
                "
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <Image
                  src={
                    imageUrl
                  }
                  alt={sanitizeText(
                    curso.det_titulo,
                    120
                  )}
                  width={
                    1800
                  }
                  height={
                    1200
                  }
                  className="
                    max-h-[92vh]
                    w-auto
                    h-auto
                    object-contain
                    rounded-3xl
                    shadow-[0_20px_100px_rgba(0,0,0,0.6)]
                  "
                  unoptimized
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

export default function CursoDetallePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <Navbar />

          <div className="flex-1 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-[#04246C] rounded-full animate-spin" />
          </div>

          <Footer />
        </div>
      }
    >
      <CursoDetalleContent />
    </Suspense>
  );
}
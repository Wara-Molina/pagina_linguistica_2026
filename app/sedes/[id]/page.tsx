'use client';

import {
  useState,
  useEffect,
  Suspense,
} from 'react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import Link from 'next/link';

import Image from 'next/image';

import {
  motion,
} from 'framer-motion';

import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowLeft,
  Building2,
  User,
  Navigation,
  GraduationCap,
} from 'lucide-react';

import api from '@/lib/axios';

import {
  getStorageUrl,
} from '@/lib/utils';

import {
  sanitizeHTML,
} from '@/lib/sanitize';

import {
  Navbar,
} from '@/components/navbar';

import {
  Footer,
} from '@/components/footer';

import {
  useLanguage,
} from '@/lib/language-context';

interface Sede {
  sede_id: number;

  sede_nombre: string;

  sede_direccion?: string;

  sede_telefono?: string;

  sede_coordinador?: string;

  sede_imagen?: string;
}

interface InstitucionData {
  institucion_correo1?: string;

  institucion_direccion?: string;

  institucion_celular1?: string;

  institucion_logo?: string;

  colorinstitucion?: Array<{
    color_primario?: string;

    color_secundario?: string;

    color_terciario?: string;
  }>;
}

const isValidEmail = (
  email?: string
): boolean => {
  if (!email) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
};

const sanitizeEmail = (
  email?: string
): string => {
  if (!email) {
    return '';
  }

  return email.replace(
    /[<>\"'&]/g,
    ''
  );
};

const isValidHexColor = (
  color?: string
): boolean => {
  if (!color) {
    return false;
  }

  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(
    color
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

function SedeDetalleContent() {
  const params =
    useParams();

  const router =
    useRouter();

  const { language } =
    useLanguage();

  const rawSedeId =
    Number(params.id);

  const sedeId =
    Number.isInteger(
      rawSedeId
    ) &&
    rawSedeId >= 0 &&
    rawSedeId < 10000000
      ? rawSedeId
      : null;

  const [sede, setSede] =
    useState<Sede | null>(
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

  const [primaryColor, setPrimaryColor] =
    useState('#04246C');

  const [
    secondaryColor,
    setSecondaryColor,
  ] =
    useState('#FC0102');

  const [
    tertiaryColor,
    setTertiaryColor,
  ] =
    useState('#020733');

  useEffect(() => {
    if (sedeId === null) {
      setLoading(false);

      return;
    }

    let mounted = true;

    const fetchSede =
      async (): Promise<void> => {
        try {
          setLoading(true);

          const institucionId =
            Number(
              process.env
                .NEXT_PUBLIC_INSTITUCION_ID
            ) || 41;

          const [
            recursosRes,
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

          if (!mounted) {
            return;
          }

          const institucionData =
            instRes.data
              ?.Descripcion;

          setInstitucion(
            institucionData
          );

          if (sedeId === 0) {
            setSede({
              sede_id: 0,

              sede_nombre:
                language ===
                'es'
                  ? 'Sede Central'
                  : 'Main Campus',

              sede_direccion:
                sanitizeHTML(
                  institucionData?.institucion_direccion ||
                    ''
                ),

              sede_telefono:
                institucionData?.institucion_celular1?.toString() ||
                '',

              sede_coordinador:
                language ===
                'es'
                  ? 'Dirección General'
                  : 'General Direction',

              sede_imagen:
                institucionData?.institucion_logo,
            });
          } else {
            const publicacion =
              recursosRes.data?.upea_publicaciones?.find(
                (
                  p: any
                ) =>
                  Number(
                    p.publicaciones_id
                  ) ===
                    sedeId &&
                  p.publicaciones_tipo ===
                    'SEDES'
              );

            if (
              publicacion
            ) {
              setSede({
                sede_id:
                  Number(
                    publicacion.publicaciones_id
                  ) || 0,

                sede_nombre:
                  sanitizeHTML(
                    publicacion.publicaciones_titulo ||
                      ''
                  )
                    .replace(
                      /<[^>]*>/g,
                      ''
                    )
                    .replace(
                      'Sede Academica de ',
                      ''
                    )
                    .replace(
                      'Sede Academica ',
                      ''
                    ),

                sede_direccion:
                  sanitizeHTML(
                    publicacion.publicaciones_descripcion ||
                      ''
                  ).replace(
                    /<[^>]*>/g,
                    ''
                  ),

                sede_telefono:
                  '',

                sede_coordinador:
                  sanitizeHTML(
                    publicacion.publicaciones_autor ||
                      ''
                  ).replace(
                    /<[^>]*>/g,
                    ''
                  ),

                sede_imagen:
                  publicacion.publicaciones_imagen,
              });
            }
          }

          const colors =
            institucionData?.colorinstitucion?.[0];

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
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    fetchSede();

    return () => {
      mounted = false;
    };
  }, [
    sedeId,
    language,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-5"
              style={{
                borderColor:
                  `${hexToRgba(primaryColor, 0.15)}`,

                borderTopColor:
                  primaryColor,
              }}
            />

            <p className="text-slate-700 font-medium">
              {language ===
              'es'
                ? 'Cargando sede...'
                : 'Loading campus...'}
            </p>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  if (
    !sede ||
    sedeId === null
  ) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-xl">
            <div className="text-7xl mb-8">
              🏛️
            </div>

            <h1 className="font-serif text-5xl font-semibold text-slate-900 mb-6">
              {language ===
              'es'
                ? 'Sede no encontrada'
                : 'Campus not found'}
            </h1>

            <p className="text-slate-600 text-lg mb-10">
              {language ===
              'es'
                ? 'La sede que buscas no existe o fue eliminada.'
                : 'The campus you are looking for does not exist.'}
            </p>

            <Link
              href="/sedes"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold shadow-xl"
              style={{
                background:
                  primaryColor,
              }}
            >
              <ArrowLeft className="w-5 h-5" />

              {language ===
              'es'
                ? 'Volver'
                : 'Go back'}
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative h-[520px] overflow-hidden">
          {sede.sede_imagen ? (
            <Image
              src={getStorageUrl(
                sede.sede_imagen
              )}
              alt={
                sede.sede_nombre
              }
              fill
              priority
              className="object-cover"
              sizes="100vw"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            />
          )}

          <div className="absolute inset-0 bg-black/55" />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl" />

          <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-between py-10">
            <button
              onClick={() =>
                router.back()
              }
              className="
              inline-flex
              items-center
              gap-2
              px-5
              py-3
              rounded-full
              bg-white/90
              backdrop-blur-xl
              text-slate-900
              font-medium
              shadow-xl
              hover:scale-105
              transition-all
              w-fit
              "
            >
              <ArrowLeft className="w-4 h-4" />

              {language ===
              'es'
                ? 'Volver'
                : 'Back'}
            </button>

            <motion.div
              initial={{
                opacity: 0,
                y: 40,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
              }}
              className="pb-10"
            >
              {sede.sede_id ===
                0 && (
                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/90 backdrop-blur-xl text-sm font-semibold mb-6 shadow-xl">
                  <GraduationCap
                    className="w-4 h-4"
                    style={{
                      color:
                        primaryColor,
                    }}
                  />

                  {language ===
                  'es'
                    ? 'Sede Principal'
                    : 'Main Campus'}
                </span>
              )}

              <h1 className="font-serif text-5xl md:text-7xl font-semibold text-white leading-tight max-w-5xl">
                {
                  sede.sede_nombre
                }
              </h1>

              {sede.sede_direccion && (
                <div className="flex items-center gap-3 mt-8 text-white/85 text-lg">
                  <MapPin className="w-5 h-5" />

                  <span>
                    {
                      sede.sede_direccion
                    }
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="relative -mt-10 z-10 pb-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-10">
              {/* LEFT */}
              <motion.div
                initial={{
                  opacity: 0,
                  y: 30,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                className="lg:col-span-2"
              >
                <div
                  className="
                  bg-white/95
                  backdrop-blur-xl
                  rounded-[2rem]
                  p-8 md:p-10
                  shadow-[0_15px_60px_rgba(0,0,0,0.08)]
                  border
                  "
                  style={{
                    borderColor:
                      `${hexToRgba(primaryColor, 0.12)}`,
                  }}
                >
                  <div className="flex items-center gap-4 mb-10">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{
                        background:
                          `${hexToRgba(primaryColor, 0.1)}`,
                      }}
                    >
                      <Building2
                        className="w-8 h-8"
                        style={{
                          color:
                            primaryColor,
                        }}
                      />
                    </div>

                    <div>
                      <h2 className="font-serif text-4xl font-semibold text-slate-900">
                        {language ===
                        'es'
                          ? 'Información'
                          : 'Information'}
                      </h2>

                      <p className="text-slate-600 mt-1">
                        {language ===
                        'es'
                          ? 'Detalles de la sede académica'
                          : 'Campus details'}
                      </p>
                    </div>
                  </div>

                  {/* Coordinador */}
                  {sede.sede_coordinador && (
                    <div
                      className="rounded-3xl p-6 mb-8"
                      style={{
                        background:
                          `${hexToRgba(primaryColor, 0.06)}`,
                      }}
                    >
                      <div className="flex gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{
                            background:
                              `${hexToRgba(primaryColor, 0.12)}`,
                          }}
                        >
                          <User
                            className="w-6 h-6"
                            style={{
                              color:
                                primaryColor,
                            }}
                          />
                        </div>

                        <div>
                          <p
                            className="text-sm font-semibold uppercase tracking-wider mb-2"
                            style={{
                              color:
                                primaryColor,
                            }}
                          >
                            {language ===
                            'es'
                              ? 'Coordinación'
                              : 'Coordination'}
                          </p>

                          <h3 className="text-xl font-semibold text-slate-900">
                            {
                              sede.sede_coordinador
                            }
                          </h3>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {sede.sede_direccion && (
                    <div
                      className="rounded-3xl p-6 border mb-6"
                      style={{
                        borderColor:
                          `${hexToRgba(primaryColor, 0.12)}`,
                      }}
                    >
                      <div className="flex gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{
                            background:
                              `${hexToRgba(primaryColor, 0.12)}`,
                          }}
                        >
                          <MapPin
                            className="w-6 h-6"
                            style={{
                              color:
                                primaryColor,
                            }}
                          />
                        </div>

                        <div className="flex-1">
                          <p
                            className="text-sm font-semibold uppercase tracking-wider mb-2"
                            style={{
                              color:
                                primaryColor,
                            }}
                          >
                            {language ===
                            'es'
                              ? 'Ubicación'
                              : 'Location'}
                          </p>

                          <p className="text-slate-700 leading-relaxed">
                            {
                              sede.sede_direccion
                            }
                          </p>

                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sede.sede_direccion)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-5 font-medium hover:underline"
                            style={{
                              color:
                                primaryColor,
                            }}
                          >
                            <Navigation className="w-4 h-4" />

                            {language ===
                            'es'
                              ? 'Abrir en Google Maps'
                              : 'Open in Google Maps'}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EMAIL */}
                  {institucion?.institucion_correo1 &&
                    isValidEmail(
                      institucion.institucion_correo1
                    ) && (
                      <div
                        className="rounded-3xl p-6 border mb-6"
                        style={{
                          borderColor:
                            `${hexToRgba(secondaryColor, 0.12)}`,
                        }}
                      >
                        <div className="flex gap-4">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{
                              background:
                                `${hexToRgba(secondaryColor, 0.12)}`,
                            }}
                          >
                            <Mail
                              className="w-6 h-6"
                              style={{
                                color:
                                  secondaryColor,
                              }}
                            />
                          </div>

                          <div>
                            <p
                              className="text-sm font-semibold uppercase tracking-wider mb-2"
                              style={{
                                color:
                                  secondaryColor,
                              }}
                            >
                              Email
                            </p>

                            <a
                              href={`mailto:${sanitizeEmail(institucion.institucion_correo1)}`}
                              className="text-slate-700 hover:underline"
                            >
                              {
                                institucion.institucion_correo1
                              }
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* HOURS */}
                  <div
                    className="rounded-3xl p-6 border"
                    style={{
                      borderColor:
                        `${hexToRgba(tertiaryColor, 0.12)}`,
                    }}
                  >
                    <div className="flex gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{
                          background:
                            `${hexToRgba(tertiaryColor, 0.12)}`,
                        }}
                      >
                        <Clock
                          className="w-6 h-6"
                          style={{
                            color:
                              tertiaryColor,
                          }}
                        />
                      </div>

                      <div>
                        <p
                          className="text-sm font-semibold uppercase tracking-wider mb-2"
                          style={{
                            color:
                              tertiaryColor,
                            }}
                        >
                          {language ===
                          'es'
                            ? 'Horario'
                            : 'Schedule'}
                        </p>

                        <p className="text-slate-700">
                          {language ===
                          'es'
                            ? 'Lunes a Viernes'
                            : 'Monday to Friday'}
                        </p>

                        <p className="text-slate-700 font-medium">
                          08:00 - 18:00
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* SIDEBAR */}
              <motion.div
                initial={{
                  opacity: 0,
                  y: 30,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
              >
                <div
                  className="
                  bg-white/95
                  backdrop-blur-xl
                  rounded-[2rem]
                  p-8
                  border
                  shadow-[0_15px_60px_rgba(0,0,0,0.08)]
                  sticky
                  top-24
                  "
                  style={{
                    borderColor:
                      `${hexToRgba(primaryColor, 0.12)}`,
                  }}
                >
                  <h3
                    className="font-serif text-3xl font-semibold mb-8"
                    style={{
                      color:
                        primaryColor,
                    }}
                  >
                    {language ===
                    'es'
                      ? 'Resumen'
                      : 'Summary'}
                  </h3>

                  <div className="space-y-8">
                    <div>
                      <p className="text-sm uppercase tracking-widest text-slate-500 mb-2">
                        {language ===
                        'es'
                          ? 'Estado'
                          : 'Status'}
                      </p>

                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

                        {language ===
                        'es'
                          ? 'Activa'
                          : 'Active'}
                      </div>
                    </div>

                    {sede.sede_telefono && (
                      <div>
                        <p className="text-sm uppercase tracking-widest text-slate-500 mb-2">
                          {language ===
                          'es'
                            ? 'Teléfono'
                            : 'Phone'}
                        </p>

                        <a
                          href={`tel:${sede.sede_telefono}`}
                          className="inline-flex items-center gap-2 hover:underline"
                          style={{
                            color:
                              primaryColor,
                          }}
                        >
                          <Phone className="w-4 h-4" />

                          {
                            sede.sede_telefono
                          }
                        </a>
                      </div>
                    )}

                    <div className="pt-8 border-t border-slate-200">
                      <Link
                        href="/sedes"
                        className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-white font-semibold shadow-xl hover:scale-[1.02] transition-all"
                        style={{
                          background:
                            primaryColor,
                        }}
                      >
                        <ArrowLeft className="w-5 h-5" />

                        {language ===
                        'es'
                          ? 'Todas las sedes'
                          : 'All campuses'}
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function SedeDetallePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-white">
          <Navbar />

          <div className="flex-1 flex items-center justify-center">
            <div className="w-14 h-14 border-4 border-slate-300 border-t-[#04246C] rounded-full animate-spin" />
          </div>

          <Footer />
        </div>
      }
    >
      <SedeDetalleContent />
    </Suspense>
  );
}
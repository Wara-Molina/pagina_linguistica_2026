'use client';

import {
  useState,
  useEffect,
  Suspense,
  useMemo,
} from 'react';

import {
  useSearchParams,
  useRouter,
} from 'next/navigation';

import Link from 'next/link';

import Image from 'next/image';

import {
  Target,
  Eye,
  Users,
  BookOpen,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Navigation,
  ArrowLeft,
  ChevronRight,
  Globe,
  Trophy,
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

interface ColorInstitucion {
  color_primario?: string;

  color_secundario?: string;

  color_terciario?: string;
}

interface InstitucionData {
  institucion_id?: number;

  institucion_nombre?: string;

  institucion_iniciales?: string;

  institucion_mision?: string;

  institucion_vision?: string;

  institucion_historia?: string;

  institucion_objetivos?: string;

  institucion_direccion?: string;

  institucion_correo1?: string;

  institucion_celular1?: number;

  institucion_celular2?: number;

  institucion_api_google_map?: string;

  colorinstitucion?: ColorInstitucion[];
}

interface Autoridad {
  id_autoridad: number;

  foto_autoridad?: string;

  nombre_autoridad: string;

  cargo_autoridad: string;

  facebook_autoridad?: string;

  celular_autoridad?: string;

  twiter_autoridad?: string;
}

interface UbicacionData {
  ubicacion_imagen?: string;

  ubicacion_titulo?: string;

  ubicacion_descripcion?: string;

  ubicacion_latitud?: string;

  ubicacion_longitud?: string;
}

type SeccionInfo =
  | 'mision'
  | 'autoridades'
  | 'historia'
  | 'ubicacion';

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

const isValidExternalUrl = (
  url?: string
): boolean => {
  if (
    !url ||
    typeof url !== 'string'
  ) {
    return false;
  }

  try {
    const parsed =
      new URL(url);

    const allowedHosts = [
      'google.com',
      'www.google.com',
      'maps.google.com',
      'www.google.com.bo',
      'maps.googleapis.com',
    ];

    const isAllowed =
      allowedHosts.some(
        (
          host
        ) =>
          parsed.hostname ===
            host ||
          parsed.hostname.endsWith(
            `.${host}`
          )
      );

    return (
      (
        parsed.protocol ===
          'https:' ||
        parsed.protocol ===
          'http:'
      ) &&
      isAllowed
    );
  } catch {
    return false;
  }
};

// ==================== COMPONENT ====================

function InformacionContent() {
  const searchParams =
    useSearchParams();

  const router =
    useRouter();

  const initialSection =
    useMemo(() => {
      const section =
        searchParams.get(
          'section'
        );

      const allowed =
        [
          'mision',
          'autoridades',
          'historia',
          'ubicacion',
        ];

      return allowed.includes(
        section || ''
      )
        ? (section as SeccionInfo)
        : 'mision';
    }, [searchParams]);

  const [
    seccionActiva,
    setSeccionActiva,
  ] =
    useState<SeccionInfo>(
      initialSection
    );

  const [
    institucion,
    setInstitucion,
  ] =
    useState<InstitucionData | null>(
      null
    );

  const [
    autoridades,
    setAutoridades,
  ] = useState<
    Autoridad[]
  >([]);

  const [
    ubicacion,
    setUbicacion,
  ] =
    useState<UbicacionData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

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
            instRes,
            contenidoRes,
          ] =
            await Promise.all([
              api.get(
                `/institucionesPrincipal/${institucionId}`
              ),

              api.get(
                `/institucion/${institucionId}/contenido`
              ),
            ]);

          if (
            !mounted
          ) {
            return;
          }

          const inst =
            instRes.data
              ?.Descripcion;

          setInstitucion({
            ...inst,

            institucion_nombre:
              sanitizeText(
                inst?.institucion_nombre ||
                  '',
                150
              ),

            institucion_mision:
              inst?.institucion_mision,

            institucion_vision:
              inst?.institucion_vision,

            institucion_historia:
              inst?.institucion_historia,

            institucion_objetivos:
              inst?.institucion_objetivos,
          });

          const colors =
            inst?.colorinstitucion?.[0];

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

          setAutoridades(
            (
              contenidoRes
                .data
                ?.autoridad ||
              []
            ).map(
              (
                a: any
              ) => ({
                ...a,

                nombre_autoridad:
                  sanitizeText(
                    a.nombre_autoridad,
                    120
                  ),

                cargo_autoridad:
                  sanitizeText(
                    a.cargo_autoridad,
                    150
                  ),
              })
            )
          );

          setUbicacion(
            contenidoRes
              .data
              ?.ubicacion?.[0] ||
              null
          );
        } catch (
          error
        ) {
          if (
            process.env.NODE_ENV !==
            'production'
          ) {
            console.error(
              error
            );
          }
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
  }, []);

// ==================== URL STATE ====================

useEffect(() => {
  const currentSection =
    searchParams.get(
      'section'
    );

  if (
    currentSection ===
    seccionActiva
  ) {
    return;
  }

  const params =
    new URLSearchParams(
      searchParams.toString()
    );

  params.set(
    'section',
    seccionActiva
  );

  router.replace(
    `/informacion?${params.toString()}`,
    {
      scroll: false,
    }
  );
}, [
  seccionActiva,
  router,
  searchParams,
]);

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

  // ==================== TABS ====================

  const secciones = [
    {
      id: 'mision',

      label:
        'Misión, Visión y Objetivos',

      icon: Target,
    },

    {
      id: 'autoridades',

      label:
        'Autoridades',

      icon: Users,
    },

    {
      id: 'historia',

      label:
        'Historia',

      icon: BookOpen,
    },

    {
      id: 'ubicacion',

      label:
        'Ubicación',

      icon: MapPin,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}

        <section
          className="relative overflow-hidden py-28"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_35%)]" />

          <div className="relative max-w-7xl mx-auto px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-10"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Link>

            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 mb-8">
                <BookOpen className="w-5 h-5 text-white" />

                <span className="text-white text-sm font-medium">
                  Información Institucional
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-white font-serif leading-tight mb-6">
                {
                  institucion?.institucion_nombre
                }
              </h1>

              <p className="text-white/80 text-lg md:text-xl max-w-3xl leading-relaxed">
                Conoce nuestra
                misión, visión,
                objetivos,
                historia,
                autoridades y
                ubicación
                institucional.
              </p>
            </div>
          </div>
        </section>

        {/* NAVIGATION */}

        <section className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex flex-wrap gap-3">
              {secciones.map(
                (
                  section
                ) => {
                  const Icon =
                    section.icon;

                  const active =
                    seccionActiva ===
                    section.id;

                  return (
                    <button
                      key={
                        section.id
                      }
                      onClick={() =>
                        setSeccionActiva(
                          section.id as SeccionInfo
                        )
                      }
                      className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                        active
                          ? 'text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={
                        active
                          ? {
                              background:
                                primaryColor,
                            }
                          : {}
                      }
                    >
                      <Icon className="w-4 h-4" />
                      {
                        section.label
                      }
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* CONTENT */}

        <section className="max-w-7xl mx-auto px-6 py-16">
       
{/* MISION */}

{seccionActiva ===
  'mision' && (
  <div className="space-y-8">
    
    {/* FILA SUPERIOR */}

    <div className="grid lg:grid-cols-2 gap-8">
      
      {/* MISION */}

      <div className="bg-white rounded-[32px] border shadow-sm p-10 hover:shadow-xl transition-all duration-300">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
          style={{
            background:
              `${hexToRgba(primaryColor, 0.1)}`,
          }}
        >
          <Target
            className="w-8 h-8"
            style={{
              color:
                primaryColor,
            }}
          />
        </div>

        <h2
          className="text-4xl font-bold mb-8 font-serif"
          style={{
            color:
              primaryColor,
          }}
        >
          Misión
        </h2>

        <div
          className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html:
              sanitizeHTML(
                institucion?.institucion_mision ||
                  '<p>Información no disponible.</p>'
              ),
          }}
        />
      </div>

      {/* VISION */}

      <div className="bg-white rounded-[32px] border shadow-sm p-10 hover:shadow-xl transition-all duration-300">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
          style={{
            background:
              `${hexToRgba(secondaryColor, 0.1)}`,
          }}
        >
          <Eye
            className="w-8 h-8"
            style={{
              color:
                secondaryColor,
            }}
          />
        </div>

        <h2
          className="text-4xl font-bold mb-8 font-serif"
          style={{
            color:
              secondaryColor,
          }}
        >
          Visión
        </h2>

        <div
          className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html:
              sanitizeHTML(
                institucion?.institucion_vision ||
                  '<p>Información no disponible.</p>'
              ),
          }}
        />
      </div>
    </div>

    {/* OBJETIVOS */}

    <div className="bg-white rounded-[32px] border shadow-sm p-10 lg:p-14 hover:shadow-xl transition-all duration-300">
      
      <div className="flex items-center gap-6 mb-10">
        
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center flex-shrink-0"
          style={{
            background:
              `${hexToRgba(tertiaryColor, 0.1)}`,
          }}
        >
          <Trophy
            className="w-10 h-10"
            style={{
              color:
                tertiaryColor,
            }}
          />
        </div>

        <div>
          <h2
            className="text-4xl font-bold font-serif"
            style={{
              color:
                tertiaryColor,
            }}
          >
            Objetivos
          </h2>

          <p className="text-gray-500 mt-2 text-lg">
            Objetivos generales y específicos
          </p>
        </div>
      </div>

      <div
        className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{
          __html:
            sanitizeHTML(
              institucion?.institucion_objetivos ||
                '<p>Información no disponible.</p>'
            ),
        }}
      />
    </div>
  </div>
)}

{/* AUTORIDADES */}

{seccionActiva ===
  'autoridades' && (
  <div className="space-y-10">
    
    <div>
      <h2
        className="text-5xl font-bold font-serif mb-4"
        style={{
          color:
            primaryColor,
        }}
      >
        Autoridades
      </h2>

      <p className="text-gray-600 text-lg">
        Conoce nuestras autoridades institucionales.
      </p>
    </div>

    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
      {autoridades.map(
        (
          autoridad
        ) => (
          <div
            key={
              autoridad.id_autoridad
            }
            className="bg-white rounded-[32px] border shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-300"
          >
            <div className="relative h-80 bg-gray-100">
              <Image
                src={getStorageUrl(
                  autoridad.foto_autoridad
                )}
                alt={
                  autoridad.nombre_autoridad
                }
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {
                  autoridad.nombre_autoridad
                }
              </h3>

              <p
                className="font-semibold mb-6"
                style={{
                  color:
                    primaryColor,
                }}
              >
                {
                  autoridad.cargo_autoridad
                }
              </p>

              <div className="space-y-4 text-sm">
                {autoridad.celular_autoridad && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-4 h-4" />

                    {
                      autoridad.celular_autoridad
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  </div>
)}

{/* HISTORIA */}

{seccionActiva ===
  'historia' && (
  <div className="bg-white rounded-[32px] border shadow-sm p-10 lg:p-14">
    
    <div className="flex items-center gap-5 mb-10">
      
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{
          background:
            `${hexToRgba(primaryColor, 0.1)}`,
        }}
      >
        <BookOpen
          className="w-10 h-10"
          style={{
            color:
              primaryColor,
          }}
        />
      </div>

      <div>
        <h2
          className="text-5xl font-bold font-serif"
          style={{
            color:
              primaryColor,
          }}
        >
          Historia
        </h2>

        <p className="text-gray-500 mt-2 text-lg">
          Historia institucional
        </p>
      </div>
    </div>

    <div
      className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
      dangerouslySetInnerHTML={{
        __html:
          sanitizeHTML(
            institucion?.institucion_historia ||
              '<p>Información no disponible.</p>'
          ),
      }}
    />
  </div>
)}

{/* UBICACION */}

{seccionActiva ===
  'ubicacion' && (
  <div className="grid lg:grid-cols-2 gap-10">
    
    {/* INFO */}

    <div className="bg-white rounded-[32px] border shadow-sm p-10">
      
      <div className="flex items-center gap-5 mb-10">
        
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{
            background:
              `${hexToRgba(primaryColor, 0.1)}`,
          }}
        >
          <MapPin
            className="w-10 h-10"
            style={{
              color:
                primaryColor,
            }}
          />
        </div>

        <div>
          <h2
            className="text-5xl font-bold font-serif"
            style={{
              color:
                primaryColor,
            }}
          >
            Ubicación
          </h2>

          <p className="text-gray-500 mt-2 text-lg">
            Información de contacto y ubicación
          </p>
        </div>
      </div>

      <div className="space-y-8">
        
        {institucion?.institucion_direccion && (
          <div className="flex gap-4">
            <MapPin
              className="w-6 h-6 mt-1 flex-shrink-0"
              style={{
                color:
                  primaryColor,
              }}
            />

            <div>
              <h4 className="font-bold text-lg mb-2">
                Dirección
              </h4>

              <p className="text-gray-600">
                {
                  institucion.institucion_direccion
                }
              </p>
            </div>
          </div>
        )}

        {institucion?.institucion_correo1 && (
          <div className="flex gap-4">
            <Mail
              className="w-6 h-6 mt-1 flex-shrink-0"
              style={{
                color:
                  primaryColor,
              }}
            />

            <div>
              <h4 className="font-bold text-lg mb-2">
                Correo
              </h4>

              <p className="text-gray-600 break-all">
                {
                  institucion.institucion_correo1
                }
              </p>
            </div>
          </div>
        )}

        {(institucion?.institucion_celular1 ||
          institucion?.institucion_celular2) && (
          <div className="flex gap-4">
            <Phone
              className="w-6 h-6 mt-1 flex-shrink-0"
              style={{
                color:
                  primaryColor,
              }}
            />

            <div>
              <h4 className="font-bold text-lg mb-2">
                Teléfonos
              </h4>

              <div className="space-y-1 text-gray-600">
                {institucion?.institucion_celular1 && (
                  <p>
                    {
                      institucion.institucion_celular1
                    }
                  </p>
                )}

                {institucion?.institucion_celular2 && (
                  <p>
                    {
                      institucion.institucion_celular2
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

{/* MAPA */}

<div className="bg-white rounded-[32px] border shadow-sm overflow-hidden min-h-[500px]">
  
  {institucion?.institucion_api_google_map &&
  isValidExternalUrl(
    institucion.institucion_api_google_map
  ) ? (
    <iframe
      src={
        institucion.institucion_api_google_map
      }
      width="100%"
      height="100%"
      loading="lazy"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox="allow-scripts allow-same-origin allow-popups"
      className="w-full h-full min-h-[500px] border-0"
    />
  ) : (
    <div className="flex items-center justify-center h-full min-h-[500px] text-gray-500 text-lg">
      Mapa no disponible
    </div>
  )}
</div>
  </div>
)}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function InformacionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-[#04246C] rounded-full animate-spin" />
        </div>
      }
    >
      <InformacionContent />
    </Suspense>
  );
}
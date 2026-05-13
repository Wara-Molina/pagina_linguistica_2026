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
  User,
  Download,
  Share2,
  ExternalLink,
  BookOpen,
  FileText,
  Printer,
  Maximize2,
  X,
  ZoomIn,
  Mail,
} from 'lucide-react';

import Link from 'next/link';

import Image from 'next/image';

import api from '@/lib/axios';

import { sanitizeHTML } from '@/lib/sanitize';

import { Navbar } from '@/components/navbar';

import { Footer } from '@/components/footer';

interface Publicacion {
  publicaciones_id: number;

  publicaciones_titulo: string;

  publicaciones_imagen?: string;

  publicaciones_descripcion?: string;

  publicaciones_documento?: string;

  publicaciones_fecha: string;

  publicaciones_autor?: string;

  publicaciones_tipo?: string;
}

interface ApiPublicacion {
  publicaciones_id: number;

  publicaciones_titulo?: string;

  publicaciones_imagen?: string;

  publicaciones_descripcion?: string;

  publicaciones_documento?: string;

  publicaciones_fecha?: string;

  publicaciones_autor?: string;

  publicaciones_tipo?: string;
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

const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  '';

const isValidHexColor = (
  color?: string
): boolean => {
  if (
    typeof color !== 'string'
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
    typeof color === 'string' &&
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

const getStorageUrl = (
  path?: string
): string => {
  if (!path) {
    return '/placeholder.jpg';
  }

  if (
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }

  return `${STORAGE_URL}/${path}`;
};

const removeHtml = (
  html?: string
): string => {
  if (!html) return '';

  return sanitizeHTML(html)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const sanitizeText = (
  text?: string
): string => {
  if (!text) return '';

  return removeHtml(text).slice(
    0,
    5000
  );
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

    const allowedProtocols =
      ['https:'];

    const allowedDomains =
      [
        'upea.bo',
        'apiadministrador.upea.bo',
        'archivosminio.upea.bo',
        'localhost',
        '127.0.0.1',
      ];

    const validProtocol =
      allowedProtocols.includes(
        parsed.protocol
      );

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

function PublicacionDetalleContent() {
  const params =
    useParams();

  const router =
    useRouter();

  const rawId = Number(
    params.id
  );

  const publicacionId =
    Number.isInteger(
      rawId
    ) &&
    rawId > 0 &&
    rawId < 10000000
      ? rawId
      : null;

  const [
    publicacion,
    setPublicacion,
  ] =
    useState<Publicacion | null>(
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

  const [
    pdfModalOpen,
    setPdfModalOpen,
  ] = useState(false);

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

  useEffect(() => {
    if (
      publicacionId ===
      null
    ) {
      setError(
        'Publicación inválida'
      );

      setLoading(false);

      return;
    }

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

          const publicaciones =
            publiRes.data
              ?.upea_publicaciones;

          if (
            !Array.isArray(
              publicaciones
            )
          ) {
            setError(
              'No hay publicaciones'
            );

            return;
          }

          const encontrada =
            publicaciones.find(
              (
                p: ApiPublicacion
              ) =>
                Number(
                  p.publicaciones_id
                ) ===
                publicacionId
            );

          if (
            !encontrada
          ) {
            setError(
              'Publicación no encontrada'
            );

            return;
          }

          setPublicacion({
            publicaciones_id:
              encontrada.publicaciones_id,

            publicaciones_titulo:
              sanitizeText(
                encontrada.publicaciones_titulo
              ) ||
              'Sin título',

            publicaciones_imagen:
              encontrada.publicaciones_imagen,

            publicaciones_descripcion:
              sanitizeHTML(
                encontrada.publicaciones_descripcion ||
                  ''
              ),

            publicaciones_documento:
              encontrada.publicaciones_documento,

            publicaciones_fecha:
              encontrada.publicaciones_fecha ||
              '',

            publicaciones_autor:
              sanitizeText(
                encontrada.publicaciones_autor
              ),

            publicaciones_tipo:
              sanitizeText(
                encontrada.publicaciones_tipo
              ),
          });

          const inst =
            instRes.data
              ?.Descripcion;

          setInstitucion(
            inst
          );

          const colors =
            inst
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
            'Error cargando publicación'
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
      mounted = false;
    };
  }, [
    publicacionId,
  ]);

  useEffect(() => {
    const esc =
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

          setPdfModalOpen(
            false
          );
        }
      };

    window.addEventListener(
      'keydown',
      esc
    );

    return () => {
      window.removeEventListener(
        'keydown',
        esc
      );
    };
  }, []);

  const imageUrl =
    useMemo(() => {
      const url =
        getStorageUrl(
          publicacion?.publicaciones_imagen
        );

      return isValidDocumentUrl(
        url
      )
        ? url
        : '';
    }, [
      publicacion?.publicaciones_imagen,
    ]);

  const pdfUrl =
    useMemo(() => {
      const url =
        getStorageUrl(
          publicacion?.publicaciones_documento
        );

      return isValidDocumentUrl(
        url
      )
        ? url
        : '';
    }, [
      publicacion?.publicaciones_documento,
    ]);

  const formatDate = (
    date: string
  ) => {
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
      return 'Fecha inválida';
    }
  };

  const handleShare =
    async () => {
      if (
        !publicacion
      )
        return;

      try {
        if (
          navigator.share
        ) {
          await navigator.share(
            {
              title:
                publicacion.publicaciones_titulo,

              text: sanitizeText(
                publicacion.publicaciones_descripcion
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

  if (
    error ||
    !publicacion
  ) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-7xl mb-6">
              📭
            </div>

            <h2 className="text-3xl font-bold mb-4">
              {error}
            </h2>

            <Link
              href="/publicaciones"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold"
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
{/* HERO */}

<section className="relative min-h-[520px] lg:min-h-[620px] overflow-hidden">
  {/* BACKGROUND */}

  {imageUrl ? (
    <>
      <Image
        src={imageUrl}
        alt={
          publicacion.publicaciones_titulo
        }
        fill
        priority
        className="object-cover"
      />

      {/* DARK OVERLAY */}

      <div className="absolute inset-0 bg-black/65" />

      {/* GRADIENT */}

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
            rgba(0,0,0,0.45) 100%
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

  {/* CONTENT */}

  <div className="relative z-10">
    <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
      {/* TOP ACTIONS */}

      <div className="flex flex-wrap items-center gap-3 mb-10">
        <button
          onClick={() =>
            router.back()
          }
          className="
            inline-flex
            items-center
            gap-2
            px-6
            py-3
            rounded-full
            bg-white/95
            backdrop-blur-xl
            text-gray-900
            font-semibold
            shadow-lg
            hover:scale-105
            transition-all
          "
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        {publicacion.publicaciones_tipo && (
          <span
            className="
              inline-flex
              items-center
              px-5
              py-3
              rounded-full
              text-sm
              font-bold
              uppercase
              tracking-wider
              bg-white/90
              shadow-lg
            "
            style={{
              color:
                primaryColor,
            }}
          >
            {
              publicacion.publicaciones_tipo
            }
          </span>
        )}

        {/* MODAL BUTTON */}

        {imageUrl && (
          <button
            onClick={() =>
              setImageModalOpen(
                true
              )
            }
            className="
              inline-flex
              items-center
              gap-2
              px-6
              py-3
              rounded-full
              bg-white/10
              border
              border-white/20
              text-white
              font-semibold
              backdrop-blur-xl
              hover:bg-white/20
              transition-all
            "
          >
            <ZoomIn className="w-4 h-4" />
            Ver imagen
          </button>
        )}
      </div>

      {/* TITLE */}

      <div className="max-w-5xl">
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-[0.95] mb-8 drop-shadow-2xl">
          {
            publicacion.publicaciones_titulo
          }
        </h1>

        {/* DESCRIPTION */}

        {publicacion.publicaciones_descripcion && (
          <p className="text-xl text-white/85 leading-relaxed max-w-3xl line-clamp-3">
            {sanitizeText(
              publicacion.publicaciones_descripcion
            )}
          </p>
        )}
      </div>
    </div>
  </div>
</section>

        {/* CONTENT */}
        <section className="relative -mt-12 z-10 pb-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-10">
              {/* MAIN */}
              <div className="lg:col-span-2">
                <div
                  className="bg-white rounded-[2rem] shadow-2xl border p-8 md:p-10"
                  style={{
                    borderColor:
                      `${hexToRgba(primaryColor, 0.12)}`,
                  }}
                >
                  {/* META */}
                  <div
                    className="flex flex-wrap gap-6 pb-8 mb-8 border-b"
                    style={{
                      borderColor:
                        `${hexToRgba(primaryColor, 0.12)}`,
                    }}
                  >
                    {publicacion.publicaciones_autor && (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            background:
                              `${hexToRgba(primaryColor, 0.1)}`,
                          }}
                        >
                          <User
                            className="w-5 h-5"
                            style={{
                              color:
                                primaryColor,
                            }}
                          />
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">
                            Autor
                          </p>

                          <p className="font-semibold text-gray-900">
                            {
                              publicacion.publicaciones_autor
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background:
                            `${hexToRgba(secondaryColor, 0.1)}`,
                        }}
                      >
                        <Calendar
                          className="w-5 h-5"
                          style={{
                            color:
                              secondaryColor,
                          }}
                        />
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">
                          Fecha
                        </p>

                        <p className="font-semibold text-gray-900">
                          {formatDate(
                            publicacion.publicaciones_fecha
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  {publicacion.publicaciones_descripcion && (
                    <div
                      className="prose prose-lg max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html:
                          sanitizeHTML(
                            publicacion.publicaciones_descripcion
                          ),
                      }}
                    />
                  )}

                  {/* PDF */}
                  {pdfUrl && (
                    <div className="mt-10">
                      <button
                        onClick={() =>
                          setPdfModalOpen(
                            true
                          )
                        }
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold"
                        style={{
                          background:
                            secondaryColor,
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        Ver PDF
                      </button>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div
                    className="mt-10 pt-8 border-t flex flex-wrap gap-3"
                    style={{
                      borderColor:
                        `${hexToRgba(primaryColor, 0.12)}`,
                    }}
                  >
                    <button
                      onClick={() =>
                        window.print()
                      }
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold"
                      style={{
                        background:
                          primaryColor,
                      }}
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </button>

                    <button
                      onClick={
                        handleShare
                      }
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full border-2 font-semibold"
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

                    {pdfUrl && (
                      <a
                        href={
                          pdfUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full border-2 font-semibold"
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
                    )}
                  </div>
                </div>
              </div>

              {/* SIDEBAR */}
              <div>
                <div
                  className="bg-white rounded-[2rem] shadow-xl border p-8 sticky top-24"
                  style={{
                    borderColor:
                      `${hexToRgba(primaryColor, 0.12)}`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{
                        background:
                          `${hexToRgba(primaryColor, 0.1)}`,
                      }}
                    >
                      <BookOpen
                        className="w-7 h-7"
                        style={{
                          color:
                            primaryColor,
                        }}
                      />
                    </div>

                    <h3 className="font-serif text-3xl font-semibold">
                      Información
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                        Institución
                      </p>

                      <p className="font-semibold text-gray-900">
                        {institucion?.institucion_nombre ||
                          'UPEA'}
                      </p>
                    </div>

                    {institucion?.institucion_correo1 && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                          Contacto
                        </p>

                        <a
                          href={`mailto:${institucion.institucion_correo1}`}
                          className="inline-flex items-center gap-2 hover:underline"
                          style={{
                            color:
                              primaryColor,
                          }}
                        >
                          <Mail className="w-4 h-4" />

                          {
                            institucion.institucion_correo1
                          }
                        </a>
                      </div>
                    )}
                  </div>

                  <div
                    className="mt-8 pt-8 border-t"
                    style={{
                      borderColor:
                        `${hexToRgba(primaryColor, 0.12)}`,
                    }}
                  >
                    <Link
                      href="/publicaciones"
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 font-semibold"
                      style={{
                        borderColor:
                          primaryColor,

                        color:
                          primaryColor,
                      }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Todas las publicaciones
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
          rounded-full
          bg-white/10
          border
          border-white/10
          hover:bg-white/20
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
          alt={
            publicacion.publicaciones_titulo
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

        {/* PDF MODAL */}
        {pdfModalOpen &&
          pdfUrl && (
            <div
              className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6"
              onClick={() =>
                setPdfModalOpen(
                  false
                )
              }
            >
              <button
                onClick={() =>
                  setPdfModalOpen(
                    false
                  )
                }
                className="absolute top-6 right-6 z-10 p-3 rounded-full bg-white/20 hover:bg-white/30"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <div
                className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl overflow-hidden"
                onClick={(
                  e
                ) =>
                  e.stopPropagation()
                }
              >
                <iframe
                  src={`${pdfUrl}#toolbar=0`}
                  className="w-full h-full"
                  title={
                    publicacion.publicaciones_titulo
                  }
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
          <div className="w-14 h-14 border-4 border-gray-300 border-t-[#04246C] rounded-full animate-spin" />
        </div>
      }
    >
      <PublicacionDetalleContent />
    </Suspense>
  );
}
'use client';

import {
  useState,
  useEffect,
  Suspense,
} from 'react';

import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';

import api from '@/lib/axios';

import {
  sanitizeText,
  sanitizeExternalUrl,
  validateGoogleMapsUrl,
  sanitizeFormInput,
  ClientRateLimiter,
} from '@/lib/security';

import {
  hexToRgba,
  getSafeColor,
} from '@/lib/utils';

import { Navbar } from '@/components/navbar';

import { Footer } from '@/components/footer';

// ================= TYPES =================

interface ColorInstitucion {
  color_primario?: string;
  color_secundario?: string;
  color_terciario?: string;
}

interface InstitucionData {
  institucion_nombre?: string;

  institucion_iniciales?: string;

  institucion_direccion?: string;

  institucion_correo1?: string;

  institucion_correo2?: string;

  institucion_celular1?: number;

  institucion_celular2?: number;

  institucion_telefono1?: number;

  institucion_facebook?: string;

  institucion_twitter?: string;

  institucion_youtube?: string;

  institucion_api_google_map?: string;

  institucion_horario_atencion?: string;

  colorinstitucion?: ColorInstitucion[];
}

interface FormData {
  nombre: string;

  email: string;

  asunto: string;

  mensaje: string;

  website?: string;
}

interface FormErrors {
  nombre?: string;

  email?: string;

  asunto?: string;

  mensaje?: string;
}

// ================= HELPERS =================

const isValidEmail = (
  email: string
): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
};

// ================= CONTENT =================

function ContactoContent() {
  const institucionId =
    Number(
      process.env
        .NEXT_PUBLIC_INSTITUCION_ID
    ) || 41;

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
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    submitSuccess,
    setSubmitSuccess,
  ] = useState(false);

  const [formData, setFormData] =
    useState<FormData>({
      nombre: '',
      email: '',
      asunto: '',
      mensaje: '',
      website: '',
    });

  const [formErrors, setFormErrors] =
    useState<FormErrors>(
      {}
    );

  // COLORS

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
    let mounted =
      true;

    const fetchData =
      async () => {
        try {
          const response =
            await api.get(
              `/institucionesPrincipal/${institucionId}`
            );

          const data =
            response.data
              ?.Descripcion;

          if (
            !mounted
          ) {
            return;
          }

          setInstitucion(
            data
          );

          const colors =
            data?.colorinstitucion?.[0];

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

          if (
            mounted
          ) {
            setError(
              'No se pudo cargar la información'
            );
          }
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
  }, [
    institucionId,
  ]);

  // ================= FORM =================

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const {
      name,
      value,
    } = e.target;

    const clean =
      sanitizeFormInput(
        value,
        2000
      );

    setFormData(
      (
        prev
      ) => ({
        ...prev,

        [name]:
          clean,
      })
    );

    if (
      formErrors[
        name as keyof FormErrors
      ]
    ) {
      setFormErrors(
        (
          prev
        ) => ({
          ...prev,

          [name]:
            undefined,
        })
      );
    }
  };

  const validateForm =
    () => {
      const errors: FormErrors =
        {};

      if (
        formData.website &&
        formData.website.trim() !==
          ''
      ) {
        return false;
      }

      if (
        !formData.nombre.trim()
      ) {
        errors.nombre =
          'Ingresa tu nombre';
      }

      if (
        !isValidEmail(
          formData.email
        )
      ) {
        errors.email =
          'Email inválido';
      }

      if (
        !formData.asunto.trim()
      ) {
        errors.asunto =
          'Ingresa un asunto';
      }

      if (
        formData.mensaje.length <
        10
      ) {
        errors.mensaje =
          'El mensaje es muy corto';
      }

      setFormErrors(
        errors
      );

      return (
        Object.keys(
          errors
        ).length === 0
      );
    };

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      const rateKey =
        `contact_${institucionId}`;

      if (
        !ClientRateLimiter.allow(
          rateKey,
          1,
          10000
        )
      ) {
        setError(
          'Espera unos segundos antes de enviar otro mensaje.'
        );

        return;
      }

      if (
        !validateForm()
      ) {
        return;
      }

      setIsSubmitting(
        true
      );

      setError(
        null
      );

      try {
        await new Promise(
          (
            resolve
          ) =>
            setTimeout(
              resolve,
              1800
            )
        );

        setSubmitSuccess(
          true
        );

        setFormData({
          nombre:
            '',

          email:
            '',

          asunto:
            '',

          mensaje:
            '',

          website:
            '',
        });

        setTimeout(
          () =>
            setSubmitSuccess(
              false
            ),
          5000
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        setError(
          'No se pudo enviar el mensaje.'
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  // ================= SOCIAL =================

  const socialLinks =
    [
      {
        name: 'Facebook',

        icon:
          Facebook,

        url: institucion?.institucion_facebook,

        color:
          '#1877F2',
      },

      {
        name: 'Twitter',

        icon:
          Twitter,

        url: institucion?.institucion_twitter,

        color:
          '#1DA1F2',
      },

      {
        name: 'YouTube',

        icon:
          Youtube,

        url: institucion?.institucion_youtube,

        color:
          '#FF0000',
      },

      {
        name: 'Instagram',

        icon:
          Instagram,

        url: '',

        color:
          '#E4405F',
      },

      {
        name: 'LinkedIn',

        icon:
          Linkedin,

        url: '',

        color:
          '#0A66C2',
      },
    ]
      .filter(
        (
          item
        ) =>
          item.url &&
          item.url.trim() !==
            ''
      )
      .map(
        (
          item
        ) => ({
          ...item,

          safeUrl:
            sanitizeExternalUrl(
              item.url,
              [
                'facebook.com',
                'twitter.com',
                'x.com',
                'youtube.com',
                'instagram.com',
                'linkedin.com',
              ]
            ),
        })
      )
      .filter(
        (
          item
        ) =>
          item.safeUrl
      );

  const safeMapsUrl =
    validateGoogleMapsUrl(
      institucion?.institucion_api_google_map
    );

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

  // ================= PAGE =================

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}

        <section
          className="relative overflow-hidden py-24 lg:py-32"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${tertiaryColor} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_30%)]" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="max-w-4xl">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-xl text-white text-sm uppercase tracking-[0.25em] font-semibold mb-8">
                <Mail className="w-4 h-4" />

                Contacto
              </span>

              <h1 className="text-5xl md:text-7xl font-bold text-white font-serif leading-tight mb-8">
                Estamos para ayudarte
              </h1>

              <p className="text-xl text-white/80 leading-relaxed max-w-3xl">
                Ponte en contacto con{' '}
                <span className="font-semibold text-white">
                  {sanitizeText(
                    institucion?.institucion_nombre ||
                      'UPEA',
                    120
                  )}
                </span>{' '}
                para consultas,
                información académica y
                atención institucional.
              </p>
            </div>
          </div>
        </section>

        {/* SUCCESS */}

        {submitSuccess && (
          <div className="max-w-7xl mx-auto px-6 mt-8">
            <div className="bg-green-50 border border-green-200 rounded-3xl p-6 flex items-center gap-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />

              <div>
                <h3 className="font-bold text-green-900">
                  Mensaje enviado
                </h3>

                <p className="text-green-700">
                  Nos pondremos en
                  contacto contigo
                  pronto.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CONTENT */}

 <section className="py-20">
  <div className="max-w-7xl mx-auto px-6">
    <div className="grid lg:grid-cols-2 gap-12 items-start">
      
      {/* IZQUIERDA */}
      <div className="space-y-8">
        <div className="bg-white rounded-[32px] border shadow-sm p-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 font-serif">
            Información institucional
          </h2>

          <div className="space-y-8">
            
            {/* DIRECCIÓN */}
            {institucion?.institucion_direccion && (
              <div className="flex items-start gap-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${hexToRgba(primaryColor, 0.12)}`,
                  }}
                >
                  <MapPin
                    className="w-6 h-6"
                    style={{
                      color: primaryColor,
                    }}
                  />
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Dirección
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {sanitizeText(
                      institucion.institucion_direccion,
                      250
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* TELÉFONOS */}
            {(institucion?.institucion_celular1 ||
              institucion?.institucion_telefono1) && (
              <div className="flex items-start gap-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${hexToRgba(
                      secondaryColor,
                      0.12
                    )}`,
                  }}
                >
                  <Phone
                    className="w-6 h-6"
                    style={{
                      color: secondaryColor,
                    }}
                  />
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Teléfonos
                  </h3>

                  <div className="space-y-2">
                    {institucion.institucion_celular1 && (
                      <a
                        href={`tel:+591${institucion.institucion_celular1}`}
                        className="block text-gray-600 hover:text-black transition-colors"
                      >
                        +591{' '}
                        {institucion.institucion_celular1}
                      </a>
                    )}

                    {institucion.institucion_telefono1 && (
                      <p className="text-gray-600">
                        {institucion.institucion_telefono1}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CORREO */}
            {institucion?.institucion_correo1 && (
              <div className="flex items-start gap-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${hexToRgba(primaryColor, 0.12)}`,
                  }}
                >
                  <Mail
                    className="w-6 h-6"
                    style={{
                      color: primaryColor,
                    }}
                  />
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Correo
                  </h3>

                  <a
                    href={`mailto:${institucion.institucion_correo1}`}
                    className="text-gray-600 hover:text-black transition-colors"
                  >
                    {sanitizeText(
                      institucion.institucion_correo1,
                      150
                    )}
                  </a>
                </div>
              </div>
            )}

            {/* HORARIO */}
            <div className="flex items-start gap-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${hexToRgba(
                    tertiaryColor,
                    0.12
                  )}`,
                }}
              >
                <Clock
                  className="w-6 h-6"
                  style={{
                    color: tertiaryColor,
                  }}
                />
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Horario
                </h3>

                <p className="text-gray-600 leading-relaxed">
                  {sanitizeText(
                    institucion?.institucion_horario_atencion ||
                      'Lunes a Viernes de 08:00 a 18:00',
                    200
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DERECHA - UBICACIÓN */}
      {safeMapsUrl && (
        <div className="lg:sticky lg:top-32">
          <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
            
            <div className="p-8 border-b">
              <h2 className="text-2xl font-bold text-gray-900 font-serif">
                Ubicación
              </h2>
            </div>

            <iframe
              src={safeMapsUrl}
              width="100%"
              height="650"
              style={{
                border: 0,
              }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-scripts allow-same-origin"
            />

            <div className="p-6">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  sanitizeText(
                    institucion?.institucion_direccion || '',
                    200
                  )
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full text-white font-semibold"
                style={{
                  background: primaryColor,
                }}
              >
                <MapPin className="w-5 h-5" />

                Ver en Google Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</section>
      </main>

      <Footer />
    </div>
  );
}

// ================= PAGE =================

export default function ContactoPage() {
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
      <ContactoContent />
    </Suspense>
  );
}
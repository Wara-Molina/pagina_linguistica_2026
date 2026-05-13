"use client";

import Image from "next/image";

import {
  Facebook,
  Youtube,
  Send,
  Globe,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

import { useMemo } from "react";

import { useLanguage } from "@/lib/language-context";

import { useInstitucion } from "@/context/InstitucionContext";

import {
  sanitizeText,
  sanitizeExternalUrl,
} from "@/lib/sanitize";

import {
  getStorageUrl,
  getSafeColor,
} from "@/lib/utils";

export function Footer() {
  const { language } =
    useLanguage();

  const { institucion } =
    useInstitucion();

  /*
   * COLORES API
   */

  const primaryColor =
    getSafeColor(
      institucion
        ?.colorinstitucion?.[0]
        ?.color_primario,
      "#04246C"
    );

  const secondaryColor =
    getSafeColor(
      institucion
        ?.colorinstitucion?.[0]
        ?.color_secundario,
      "#FC0102"
    );

  /*
   * LOGO SEGURO
   */

  const logoUrl =
    useMemo(() => {
      const logo =
        institucion?.institucion_logo;

      if (!logo) {
        return "/placeholder.svg";
      }

      return getStorageUrl(
        logo
      );
    }, [
      institucion?.institucion_logo,
    ]);

  /*
   * NOMBRE SEGURO
   */

  const safeName =
    sanitizeText(
      institucion?.institucion_nombre ||
        "Institución",
      120
    );

  /*
   * LINKS SEGUROS
   */

  const links =
    useMemo(() => {
      return (
        institucion?.links ||
        []
      )
        .filter(
          (link) =>
            !!sanitizeExternalUrl(
              link?.url_link
            )
        )
        .map((link) => ({
          id:
            link.id_link,

          nombre:
            sanitizeText(
              link.nombre ||
                "Enlace",
              120
            ),

          url:
            sanitizeExternalUrl(
              link.url_link
            ) || "#",
        }));
    }, [institucion?.links]);

  /*
   * REDES SEGURAS
   */

  const facebookUrl =
    sanitizeExternalUrl(
      institucion?.institucion_facebook
    );

  const youtubeUrl =
    sanitizeExternalUrl(
      institucion?.institucion_youtube
    );

  const twitterUrl =
    sanitizeExternalUrl(
      institucion?.institucion_twitter
    );

  const mapsUrl =
    sanitizeExternalUrl(
      institucion?.institucion_api_google_map
    );

  return (
    <footer
      className="
        relative
        overflow-hidden
        text-white
      "
      style={{
        background: `
          linear-gradient(
            135deg,
            ${primaryColor},
            ${secondaryColor}
          )
        `,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div
          className="
            grid
            lg:grid-cols-4
            gap-14
          "
        >
          {/* ================= LOGO ================= */}
          <div>
<div className="relative flex items-center justify-center">
  {/* Glow */}

  <div
    className="
      absolute
      inset-0
      rounded-full
      blur-3xl
      opacity-30
      scale-125
    "
    style={{
      backgroundColor:
        primaryColor,
    }}
  />

  {/* Logo */}

  <div
    className="
      relative
      w-20
      h-20
      md:w-24
      md:h-24
      rounded-full
      overflow-hidden
      bg-white
      p-2
      shadow-[0_10px_40px_rgba(0,0,0,0.45)]
      border
      border-white/20
      flex
      items-center
      justify-center
    "
  >
    <Image
      src={logoUrl}
      alt={safeName}
      fill
      priority
      sizes="96px"
      className="
        object-contain
      "
    />
  </div>
</div>

            <p className="text-white/70 leading-relaxed">
              Formación académica,
              investigación y compromiso
              social al servicio de la
              comunidad universitaria.
            </p>
          </div>

          {/* ================= LINKS ================= */}
          <div>
            <h3
              className="
                text-xl
                font-semibold
                mb-6
              "
            >
              Enlaces
            </h3>

            <div className="space-y-4">
              {links.map(
                (link) => (
                  <a
                    key={
                      link.id
                    }
                    href={
                      link.url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      flex
                      items-center
                      gap-3
                      text-white/70
                      hover:text-white
                      transition-colors
                      break-all
                    "
                  >
                    <Globe className="w-4 h-4 shrink-0" />

                    <span>
                      {
                        link.nombre
                      }
                    </span>
                  </a>
                )
              )}
            </div>
          </div>

          {/* ================= CONTACTO ================= */}
          <div>
            <h3
              className="
                text-xl
                font-semibold
                mb-6
              "
            >
              Contacto
            </h3>

            <div className="space-y-5 text-white/70">
              {institucion?.institucion_direccion && (
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 mt-1 shrink-0" />

                  <span>
                    {sanitizeText(
                      institucion?.institucion_direccion,
                      250
                    )}
                  </span>
                </div>
              )}

              {(institucion?.institucion_telefono1 ||
                institucion?.institucion_telefono2) && (
                <div className="flex gap-3">
                  <Phone className="w-5 h-5 mt-1 shrink-0" />

                  <div>
                    {institucion?.institucion_telefono1 && (
                      <p>
                        {
                          institucion.institucion_telefono1
                        }
                      </p>
                    )}

                    {institucion?.institucion_telefono2 && (
                      <p>
                        {
                          institucion.institucion_telefono2
                        }
                      </p>
                    )}
                  </div>
                </div>
              )}

              {(institucion?.institucion_correo1 ||
                institucion?.institucion_correo2) && (
                <div className="flex gap-3">
                  <Mail className="w-5 h-5 mt-1 shrink-0" />

                  <div className="break-all">
                    {institucion?.institucion_correo1 && (
                      <p>
                        {sanitizeText(
                          institucion?.institucion_correo1,
                          120
                        )}
                      </p>
                    )}

                    {institucion?.institucion_correo2 && (
                      <p>
                        {sanitizeText(
                          institucion?.institucion_correo2,
                          120
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= REDES ================= */}
          <div>
            <h3
              className="
                text-xl
                font-semibold
                mb-6
              "
            >
              Redes Sociales
            </h3>

            <div className="flex gap-4 mb-8">
              {facebookUrl && (
                <a
                  href={
                    facebookUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-white/10
                    flex
                    items-center
                    justify-center
                    hover:bg-white/20
                    transition-all
                  "
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}

              {youtubeUrl && (
                <a
                  href={
                    youtubeUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-white/10
                    flex
                    items-center
                    justify-center
                    hover:bg-white/20
                    transition-all
                  "
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}

              {twitterUrl && (
                <a
                  href={
                    twitterUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-white/10
                    flex
                    items-center
                    justify-center
                    hover:bg-white/20
                    transition-all
                  "
                >
                  <Send className="w-5 h-5" />
                </a>
              )}
            </div>

            {mapsUrl && (
              <a
                href={
                  mapsUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-5
                  py-3
                  rounded-2xl
                  bg-white
                  text-black
                  font-medium
                  hover:scale-105
                  transition-transform
                "
              >
                <MapPin className="w-4 h-4" />

                Ver ubicación
              </a>
            )}
          </div>
        </div>

        {/* ================= BOTTOM ================= */}
        <div
          className="
            border-t
            border-white/10
            mt-16
            pt-8
            flex
            flex-col
            md:flex-row
            justify-between
            gap-4
            text-white/50
            text-sm
          "
        >
          <p>
            © 2026 {safeName}. Todos los
            derechos reservados.
          </p>

          <p>
            Universidad Pública de El Alto
          </p>
        </div>
      </div>
    </footer>
  );
}
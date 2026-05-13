"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";

import {
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  LogIn,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { useInstitucion } from "@/context/InstitucionContext";

import {
  sanitizeText,
  sanitizeExternalUrl,
} from "@/lib/sanitize";

import {
  getSafeColor,
  getStorageUrl,
} from "@/lib/utils";

/* ================= TYPES ================= */

type NavItem = {
  label: string;

  href?: string;

  external?: boolean;

  separator?: boolean;
};

interface NavDropdownProps {
  title: string;

  items: NavItem[];

  dark?: boolean;
}

/* ================= DROPDOWN ================= */

function NavDropdown({
  title,
  items,
  dark = true,
}: NavDropdownProps) {
  const [open, setOpen] =
    useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() =>
        setOpen(true)
      }
      onMouseLeave={() =>
        setOpen(false)
      }
    >
      <button
        className={cn(
          "group flex items-center gap-1 rounded-2xl px-3 py-3 transition-all duration-300",
          dark
            ? "text-white/80 hover:text-white hover:bg-white/10"
            : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
        )}
      >
        <span className="text-sm font-medium tracking-wide">
          {title}
        </span>

        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-300",
            open &&
              "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 12,
            }}
            transition={{
              duration: 0.2,
            }}
            className={cn(
              "absolute left-0 top-full z-[999] mt-4 w-72 overflow-hidden rounded-3xl border shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-3xl",
              dark
                ? "border-white/10 bg-black/90"
                : "border-slate-200 bg-white/95"
            )}
          >
            <div className="p-3">
              {items.map(
                (item) => {
                  if (
                    item.separator
                  ) {
                    return (
                      <div
                        key={
                          item.label
                        }
                        className={cn(
                          "my-2 border-t",
                          dark
                            ? "border-white/10"
                            : "border-slate-200"
                        )}
                      />
                    );
                  }

                  return (
                    <Link
                      key={
                        item.label
                      }
                      href={
                        item.href &&
                        item.href.trim() !==
                          ""
                          ? item.href
                          : "/"
                      }
                      onClick={() =>
                        setOpen(
                          false
                        )
                      }
                      target={
                        item.external
                          ? "_blank"
                          : undefined
                      }
                      rel={
                        item.external
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className={cn(
                        "group flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition-all duration-300",
                        dark
                          ? "text-white/75 hover:bg-white/10 hover:text-white"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                      )}
                    >
                      <span>
                        {
                          item.label
                        }
                      </span>

                      {item.external && (
                        <ExternalLink className="h-4 w-4 opacity-60 group-hover:opacity-100" />
                      )}
                    </Link>
                  );
                }
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================= NAVBAR ================= */

export function Navbar() {
  const [isOpen, setIsOpen] =
    useState(false);

  const [mounted, setMounted] =
    useState(false);

  const {
    institucion,
  } = useInstitucion();

  const { scrollY } =
    useScroll();

  useEffect(() => {
    setMounted(true);
  }, []);

  const backgroundColor =
    useTransform(
      scrollY,
      [0, 100],
      [
        "rgba(0,0,0,0.25)",
        "rgba(3,7,18,0.92)",
      ]
    );

  const borderOpacity =
    useTransform(
      scrollY,
      [0, 100],
      [0, 1]
    );

  /* ================= DATA ================= */

  const rawLogo =
    institucion?.institucion_logo;

  const logo =
    rawLogo
      ? getStorageUrl(
          rawLogo
        )
      : null;

  const institutionName =
    sanitizeText(
      institucion?.institucion_nombre ||
        "Lingüística e Idiomas",
      60
    );

  const institutionInitials =
    sanitizeText(
      institucion?.institucion_iniciales ||
        "LINIDI",
      20
    );

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

  /* ================= MENU ITEMS ================= */

  const infoItems: NavItem[] =
    useMemo(
      () => [
        {
          label:
            "Misión y Visión",

          href:
            "/informacion",
        },

        {
          label:
            "Autoridades",

          href:
            "/informacion?section=autoridades",
        },

        {
          label:
            "Historia",

          href:
            "/informacion?section=historia",
        },

        {
          label:
            "Ubicación",

          href:
            "/contacto",
        },
      ],
      []
    );

  const comunicadosItems: NavItem[] =
    useMemo(
      () => [
        {
          label:
            "Convocatorias",

          href:
            "/comunicados?tipo=convocatorias",
        },

        {
          label:
            "Avisos",

          href:
            "/comunicados?tipo=avisos",
        },

        {
          label:
            "Comunicados",

          href:
            "/comunicados",
        },
      ],
      []
    );

  const externalLinks =
    useMemo(() => {
      return [
        ...(
          institucion?.linksExternoInterno ||
          []
        ),

        ...(
          institucion?.links ||
          []
        ),
      ]
        .filter(
          (
            link: {
              estado?: number;

              url_link?: string;
            }
          ) =>
            link.estado ===
              1 &&
            !!sanitizeExternalUrl(
              link.url_link
            )
        )
        .map(
          (
            link: {
              nombre?: string;

              url_link?: string;
            }
          ) => ({
            label:
              sanitizeText(
                link.nombre ||
                  "Enlace",
                80
              ),

            href:
              sanitizeExternalUrl(
                link.url_link
              ) || "/",

            external: true,
          })
        );
    }, [
      institucion?.links,
      institucion?.linksExternoInterno,
    ]);

  const moreItems: NavItem[] =
    useMemo(
      () => [
        {
          label:
            "Publicaciones",

          href:
            "/publicaciones",
        },

        {
          label:
            "Eventos",

          href:
            "/eventos",
        },

        {
          label:
            "Gacetas",

          href:
            "/gacetas",
        },

        {
          label:
            "Videos",

          href:
            "/videos",
        },

        {
          label:
            "Sedes",

          href:
            "/sedes",
        },

        {
          label:
            "Contacto",

          href:
            "/contacto",
        },

        {
          label:
            "separator",

          separator: true,
        },

        ...externalLinks,
      ],
      [externalLinks]
    );

  /* ================= SSR FIX ================= */

  if (!mounted) {
    return null;
  }

  return (
    <>
      <motion.header
        style={{
          backgroundColor,
        }}
        className="
          fixed
          left-0
          right-0
          top-0
          z-50
          backdrop-blur-3xl
        "
      >
        <motion.div
          className="
            absolute
            bottom-0
            left-0
            right-0
            h-px
            bg-white/10
          "
          style={{
            opacity:
              borderOpacity,
          }}
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between">
            
            {/* LOGO */}

            <Link
              href="/"
              className="group flex items-center gap-4"
            >
              {logo ? (
                <div className="relative flex items-center justify-center">
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

                  <div
                    className="
                      relative
                      flex
                      items-center
                      justify-center
                      rounded-full
                      bg-white
                      shadow-[0_10px_40px_rgba(0,0,0,0.45)]
                      border
                      border-white/20
                      overflow-hidden
                      w-16
                      h-16
                      md:w-20
                      md:h-20
                      p-2
                    "
                  >
                    <img
                      src={logo}
                      alt="Logo institucional"
                      loading="eager"
                      referrerPolicy="no-referrer"
                      className="
                        w-full
                        h-full
                        object-contain
                      "
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="
                    flex
                    h-20
                    w-20
                    items-center
                    justify-center
                    rounded-[2rem]
                    border
                    border-white/10
                    bg-white/10
                  "
                >
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
              )}

              <div className="hidden md:block max-w-[280px]">
                <h1
                  className="
                    font-serif
                    text-lg
                    lg:text-xl
                    xl:text-2xl
                    font-semibold
                    italic
                    leading-tight
                    text-white
                    line-clamp-2
                  "
                >
                  {
                    institutionName
                  }
                </h1>

                <p
                  className="
                    mt-1
                    text-[10px]
                    uppercase
                    tracking-[0.30em]
                    text-white/45
                  "
                >
                  {
                    institutionInitials
                  }
                </p>
              </div>
            </Link>

            {/* DESKTOP */}

            <nav className="hidden xl:flex items-center gap-1 2xl:gap-2">
              <Link
                href="/"
                className="
                  rounded-2xl
                  px-4
                  py-3
                  text-sm
                  font-medium
                  tracking-wide
                  text-white/80
                  transition-all
                  duration-300
                  hover:bg-white/10
                  hover:text-white
                "
              >
                Inicio
              </Link>

              <NavDropdown
                title="Información"
                items={infoItems}
              />

              <Link
                href="/cursos"
                className="
                  rounded-2xl
                  px-4
                  py-3
                  text-sm
                  font-medium
                  tracking-wide
                  text-white/80
                  transition-all
                  duration-300
                  hover:bg-white/10
                  hover:text-white
                "
              >
                Cursos
              </Link>

              <NavDropdown
                title="Comunicados"
                items={comunicadosItems}
              />

              {/* INSTITUTO */}

              <Link
                href="/institutoInvestigacion"
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-2xl
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  tracking-wide
                  text-white
                  transition-all
                  duration-300
                  hover:scale-[1.02]
                "
                style={{
                  background:
                    "rgba(255,255,255,0.06)",

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  backdropFilter:
                    "blur(14px)",
                }}
              >
                <div
                  className="
                    absolute
                    inset-0
                    opacity-0
                    group-hover:opacity-100
                    transition-opacity
                    duration-300
                  "
                  style={{
                    background: `
                      linear-gradient(
                        135deg,
                        ${secondaryColor}30,
                        transparent
                      )
                    `,
                  }}
                />

                <span className="relative z-10 whitespace-nowrap">
                  Instituto de Investigación
                </span>
              </Link>

              {/* MÁS */}

              <div className="ml-1">
                <NavDropdown
                  title="Más"
                  items={moreItems}
                />
              </div>
            </nav>

            {/* RIGHT */}

            <div className="flex items-center gap-3">
              <a
                href="https://servicioadministrador.upea.bo"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  className="
                    hidden
                    md:flex
                    items-center
                    rounded-2xl
                    px-7
                    py-6
                    font-semibold
                    text-white
                    shadow-[0_10px_40px_rgba(0,0,0,0.35)]
                    transition-all
                    duration-300
                    hover:scale-[1.03]
                    border-0
                  "
                  style={{
                    background: `
                      linear-gradient(
                        135deg,
                        ${secondaryColor},
                        #c400ff
                      )
                    `,
                  }}
                >
                  <LogIn className="mr-2 h-4 w-4" />

                  Iniciar Sesión
                </Button>
              </a>

              {/* MOBILE BUTTON */}

              <button
                onClick={() =>
                  setIsOpen(!isOpen)
                }
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/10
                  text-white
                  transition-all
                  duration-300
                  hover:bg-white/15
                  xl:hidden
                "
                aria-label="menu"
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
}
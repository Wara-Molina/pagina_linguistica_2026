"use client";

import {
  motion,
  useInView,
} from "framer-motion";

import {
  useRef,
  useState,
  useMemo,
} from "react";

import {
  PlayCircle,
  Calendar,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { useLanguage } from "@/lib/language-context";

import {
  useInstitucion,
  type VideoItem,
} from "@/context/InstitucionContext";

import {
  sanitizeText,
  sanitizeExternalUrl,
} from "@/lib/sanitize";

export function VideoSection() {
  const ref = useRef(null);

  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
  });

  const [activeVideo, setActiveVideo] =
    useState(0);

  const { language } =
    useLanguage();

  const { institucion } =
    useInstitucion();

  /*
   * COLORES API
   */

  const institutionColors =
    institucion
      ?.colorinstitucion?.[0];

  const primaryColor =
    institutionColors
      ?.color_primario ||
    "#0596CE";

  const secondaryColor =
    institutionColors
      ?.color_secundario ||
    "#b900d1";

  const tertiaryColor =
    institutionColors
      ?.color_terciario ||
    "#033011";

  /*
   * VIDEOS API
   */

  const videos: VideoItem[] =
    institucion?.videos || [];

  /*
   * VIDEO ACTIVO SEGURO
   */

  const featuredVideo =
    videos[
      Math.min(
        activeVideo,
        Math.max(
          videos.length - 1,
          0
        )
      )
    ] || videos[0];

  /*
   * URL YOUTUBE SEGURA
   */

  const safeVideoUrl =
    useMemo(() => {
      const rawUrl =
        featuredVideo?.video_enlace;

      if (
        !rawUrl ||
        typeof rawUrl !==
          "string"
      ) {
        return "";
      }

      const safeUrl =
        sanitizeExternalUrl(
          rawUrl
        );

      if (!safeUrl) {
        return "";
      }

      try {
        const parsed =
          new URL(
            safeUrl
          );

        const hostname =
          parsed.hostname.toLowerCase();

        const allowedHosts =
          [
            "youtube.com",
            "www.youtube.com",
            "youtu.be",
            "www.youtu.be",
            "youtube-nocookie.com",
            "www.youtube-nocookie.com",
          ];

        const isYoutube =
          allowedHosts.some(
            (host) =>
              hostname ===
                host ||
              hostname.endsWith(
                `.${host}`
              )
          );

        if (!isYoutube) {
          return "";
        }

        /*
         * youtu.be
         */

        if (
          hostname.includes(
            "youtu.be"
          )
        ) {
          const id =
            parsed.pathname.replace(
              "/",
              ""
            );

          if (!id) {
            return "";
          }

          return `https://www.youtube.com/embed/${id}`;
        }

        /*
         * embed directo
         */

        if (
          parsed.pathname.includes(
            "/embed/"
          )
        ) {
          return parsed.href;
        }

        /*
         * watch?v=
         */

        const videoId =
          parsed.searchParams.get(
            "v"
          );

        if (!videoId) {
          return "";
        }

        return `https://www.youtube.com/embed/${videoId}`;
      } catch {
        return "";
      }
    }, [featuredVideo]);

  /*
   * DESCRIPCIÓN SEGURA
   */

  const safeDescription =
    useMemo(() => {
      return sanitizeText(
        featuredVideo?.video_breve_descripcion ||
          "",
        2000
      );
    }, [featuredVideo]);

  return (
    <section
      ref={ref}
      id="videos"
      className="
        py-32
        bg-background
        relative
        overflow-hidden
      "
    >
      {/* Glow */}
      <div
        className="
          absolute
          top-0
          left-0
          w-[400px]
          h-[400px]
          blur-3xl
          rounded-full
        "
        style={{
          backgroundColor: `${primaryColor}15`,
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* HEADER */}
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={
            isInView
              ? {
                  opacity: 1,
                  y: 0,
                }
              : {}
          }
          transition={{
            duration: 0.8,
          }}
          className="
            text-center
            max-w-3xl
            mx-auto
            mb-20
          "
        >
          <span
            className="
              inline-block
              px-5
              py-2
              rounded-full
              uppercase
              tracking-[0.25em]
              text-xs
              font-semibold
              mb-6
              border
            "
            style={{
              borderColor: `${primaryColor}40`,
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
            }}
          >
            {language === "es"
              ? "Contenido Multimedia"
              : "Multimedia Content"}
          </span>

          <h2
            className="
              font-serif
              text-4xl
              md:text-5xl
              lg:text-6xl
              font-light
              mb-6
              text-foreground
              leading-tight
            "
          >
            {language === "es"
              ? "Videos Institucionales"
              : "Institutional Videos"}
          </h2>

          <p
            className="
              text-muted-foreground
              text-lg
              leading-relaxed
            "
          >
            {language === "es"
              ? "Explora actividades académicas, eventos y contenido institucional."
              : "Explore academic activities and institutional content."}
          </p>
        </motion.div>

        {/* EMPTY */}
        {videos.length === 0 && (
          <div
            className="
              text-center
              py-20
              text-muted-foreground
            "
          >
            {language === "es"
              ? "No existen videos disponibles."
              : "No videos available."}
          </div>
        )}

        {/* CONTENT */}
        {videos.length > 0 && (
          <>
            {/* TABS */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={
                isInView
                  ? {
                      opacity: 1,
                      y: 0,
                    }
                  : {}
              }
              transition={{
                duration: 0.6,
              }}
              className="
                flex
                flex-wrap
                justify-center
                gap-4
                mb-14
              "
            >
              {videos.map(
                (
                  video: VideoItem,
                  index: number
                ) => (
                  <button
                    key={`${video.video_id}-${index}`}
                    onClick={() =>
                      setActiveVideo(
                        index
                      )
                    }
                    type="button"
                    className={cn(
                      `
                        px-6
                        py-3
                        rounded-full
                        text-sm
                        font-medium
                        transition-all
                        duration-300
                        backdrop-blur-xl
                        border
                      `
                    )}
                    style={{
                      backgroundColor:
                        activeVideo ===
                        index
                          ? primaryColor
                          : `${secondaryColor}15`,

                      color:
                        activeVideo ===
                        index
                          ? "#ffffff"
                          : secondaryColor,

                      borderColor:
                        activeVideo ===
                        index
                          ? primaryColor
                          : `${secondaryColor}30`,
                    }}
                  >
                    {sanitizeText(
                      video.video_tipo ||
                        `Video ${
                          index + 1
                        }`,
                      100
                    )}
                  </button>
                )
              )}
            </motion.div>

            {/* MAIN CONTENT */}
            <motion.div
              key={activeVideo}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.4,
              }}
              className="
                grid
                lg:grid-cols-2
                gap-12
                items-center
              "
            >
              {/* VIDEO */}
              <div
                className="
                  relative
                  overflow-hidden
                  rounded-3xl
                  border
                  shadow-2xl
                  bg-black
                "
                style={{
                  borderColor: `${primaryColor}25`,
                }}
              >
                {safeVideoUrl ? (
                  <iframe
                    src={
                      safeVideoUrl
                    }
                    title={
                      sanitizeText(
                        featuredVideo?.video_titulo ||
                          "Video",
                        200
                      )
                    }
                    className="
                      w-full
                      aspect-video
                    "
                    allow="
                      accelerometer;
                      autoplay;
                      clipboard-write;
                      encrypted-media;
                      gyroscope;
                      picture-in-picture
                    "
                    sandbox="
                      allow-same-origin
                      allow-scripts
                      allow-presentation
                    "
                    allowFullScreen
                    loading={
                      activeVideo ===
                      0
                        ? "eager"
                        : "lazy"
                    }
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div
                    className="
                      aspect-video
                      flex
                      items-center
                      justify-center
                      text-white
                      text-center
                      p-6
                    "
                  >
                    {language === "es"
                      ? "Video no disponible"
                      : "Video unavailable"}
                  </div>
                )}

                <div
                  className="
                    absolute
                    inset-0
                    pointer-events-none
                    bg-gradient-to-t
                    from-black/40
                    via-transparent
                    to-transparent
                  "
                />
              </div>

              {/* INFO */}
              <div>
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    rounded-full
                    text-sm
                    font-medium
                    mb-6
                  "
                  style={{
                    backgroundColor: `${primaryColor}15`,
                    color: primaryColor,
                  }}
                >
                  <PlayCircle className="w-4 h-4" />

                  {sanitizeText(
                    featuredVideo?.video_tipo ||
                      "VIDEO",
                    100
                  )}
                </div>

                <h3
                  className="
                    font-serif
                    text-4xl
                    font-light
                    text-foreground
                    leading-tight
                    mb-6
                  "
                >
                  {sanitizeText(
                    featuredVideo?.video_titulo ||
                      "Video Institucional",
                    300
                  )}
                </h3>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-muted-foreground
                    mb-8
                  "
                >
                  <Calendar className="w-5 h-5" />

                  <span>
                    {language === "es"
                      ? "Contenido Académico"
                      : "Academic Content"}
                  </span>
                </div>

                <div
                  className="
                    border
                    rounded-3xl
                    p-8
                    shadow-lg
                    backdrop-blur-xl
                  "
                  style={{
                    borderColor: `${primaryColor}20`,
                    backgroundColor: `${tertiaryColor}08`,
                  }}
                >
                  <p
                    className="
                      text-muted-foreground
                      leading-relaxed
                      text-lg
                      whitespace-pre-line
                    "
                  >
                    {safeDescription ||
                      (language ===
                      "es"
                        ? "Contenido multimedia institucional."
                        : "Institutional multimedia content.")}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
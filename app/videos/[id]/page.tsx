"use client";

import {
  useState,
  useEffect,
  Suspense,
  useMemo,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { motion } from "framer-motion";

import {
  ArrowLeft,
  Share2,
  ExternalLink,
  Youtube,
  Info,
} from "lucide-react";

import Link from "next/link";

import api from "@/lib/axios";

import {
  sanitizeHTML,
  sanitizeText,
  sanitizeExternalUrl,
} from "@/lib/sanitize";

import { Navbar } from "@/components/navbar";

import { Footer } from "@/components/footer";

import { useLanguage } from "@/lib/language-context";

import {
  getSafeColor,
  hexToRgba,
} from "@/lib/utils";

interface Video {
  video_id: number;

  video_titulo: string;

  video_breve_descripcion?: string;

  video_enlace?: string;

  video_estado: number;

  video_tipo?: string;
}

interface InstitucionData {
  institucion_nombre: string;

  colorinstitucion: Array<{
    color_primario: string;

    color_secundario: string;

    color_terciario: string;
  }>;
}

/*
 * VALIDACIÓN YOUTUBE SEGURA
 */

const isValidYouTubeUrl = (
  url?: string
): boolean => {
  if (!url) return false;

  try {
    const parsed =
      new URL(url);

    const allowedHosts = [
      "youtube.com",
      "www.youtube.com",
      "youtu.be",
      "www.youtu.be",
    ];

    return allowedHosts.some(
      (host) =>
        parsed.hostname ===
          host ||
        parsed.hostname.endsWith(
          `.${host}`
        )
    );
  } catch {
    return false;
  }
};

const getYouTubeId = (
  url?: string
): string | null => {
  if (
    !url ||
    !isValidYouTubeUrl(url)
  ) {
    return null;
  }

  try {
    const parsed =
      new URL(url);

    /*
     * youtu.be
     */

    if (
      parsed.hostname.includes(
        "youtu.be"
      )
    ) {
      const id =
        parsed.pathname.replace(
          "/",
          ""
        );

      return /^[a-zA-Z0-9_-]{11}$/.test(
        id
      )
        ? id
        : null;
    }

    /*
     * embed
     */

    const embedMatch =
      parsed.pathname.match(
        /embed\/([a-zA-Z0-9_-]{11})/
      );

    if (embedMatch?.[1]) {
      return embedMatch[1];
    }

    /*
     * watch?v=
     */

    const videoId =
      parsed.searchParams.get(
        "v"
      );

    return videoId &&
      /^[a-zA-Z0-9_-]{11}$/.test(
        videoId
      )
      ? videoId
      : null;
  } catch {
    return null;
  }
};

function VideoDetalleContent() {
  const params =
    useParams();

  const router =
    useRouter();

  const { language } =
    useLanguage();

  /*
   * VALIDACIÓN ID
   */

  const rawVideoId =
    Number(params.id);

  const videoId =
    Number.isInteger(
      rawVideoId
    ) &&
    rawVideoId > 0 &&
    rawVideoId < 10000000
      ? rawVideoId
      : null;

  /*
   * STATES
   */

  const [video, setVideo] =
    useState<Video | null>(
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

  /*
   * COLORES
   */

  const [primaryColor] =
    useState("#04246C");

  const [
    secondaryColor,
    setSecondaryColor,
  ] =
    useState("#FC0102");

  /*
   * ENV SEGURA
   */

  const institucionId =
    Number(
      process.env
        .NEXT_PUBLIC_INSTITUCION_ID
    ) || 41;

  /*
   * FETCH
   */

  useEffect(() => {
    let isMounted = true;

    const fetchVideo =
      async (): Promise<void> => {
        try {
          setLoading(true);

          setError(null);

          if (!videoId) {
            setError(
              "ID inválido"
            );

            return;
          }

          const [
            videoRes,
            instRes,
          ] =
            await Promise.all([
              api.get(
                `/institucion/${institucionId}/contenido`
              ),

              api.get(
                `/institucionesPrincipal/${institucionId}`
              ),
            ]);

          if (!isMounted) {
            return;
          }

          /*
           * VIDEO SEGURO
           */

          const videoEncontrado =
            videoRes.data
              ?.upea_videos?.find(
                (
                  v: Video
                ) =>
                  Number(
                    v.video_id
                  ) ===
                    videoId &&
                  Number(
                    v.video_estado
                  ) === 1
              );

          if (
            !videoEncontrado
          ) {
            setError(
              "Video no encontrado"
            );

            return;
          }

          setVideo({
            video_id:
              Number(
                videoEncontrado.video_id
              ),

            video_titulo:
              sanitizeText(
                videoEncontrado.video_titulo ||
                  "Sin título",
                300
              ),

            video_breve_descripcion:
              sanitizeHTML(
                videoEncontrado.video_breve_descripcion ||
                  ""
              ),

            video_enlace:
              sanitizeExternalUrl(
                videoEncontrado.video_enlace
              ) || "",

            video_estado:
              Number(
                videoEncontrado.video_estado
              ),

            video_tipo:
              sanitizeText(
                videoEncontrado.video_tipo ||
                  "General",
                100
              ),
          });

          /*
           * INSTITUCIÓN
           */

          const institucionData =
            instRes.data
              ?.Descripcion;

          setInstitucion(
            institucionData ||
              null
          );

          /*
           * COLORES API
           */

          const colors =
            institucionData?.colorinstitucion?.[0];

          if (colors) {
            setSecondaryColor(
              getSafeColor(
                colors.color_secundario,
                "#FC0102"
              )
            );
          }
        } catch (
          fetchError
        ) {
          if (
            process.env
              .NODE_ENV ===
            "development"
          ) {
            console.error(
              fetchError
            );
          }

          setError(
            "Error al cargar el video"
          );
        } finally {
          if (isMounted) {
            setLoading(
              false
            );
          }
        }
      };

    fetchVideo();

    return () => {
      isMounted = false;
    };
  }, [
    videoId,
    institucionId,
  ]);

  /*
   * SHARE
   */

  const handleShare =
    async (): Promise<void> => {
      if (!video) {
        return;
      }

      const safeDescription =
        sanitizeText(
          video.video_breve_descripcion ||
            "",
          300
        );

      try {
        if (
          navigator.share
        ) {
          await navigator.share({
            title:
              video.video_titulo,

            text: safeDescription,

            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(
            window.location.href
          );

          alert(
            "Enlace copiado"
          );
        }
      } catch (
        shareError
      ) {
        if (
          process.env
            .NODE_ENV ===
          "development"
        ) {
          console.error(
            shareError
          );
        }
      }
    };

  /*
   * YOUTUBE
   */

  const youtubeId =
    useMemo(() => {
      return getYouTubeId(
        video?.video_enlace
      );
    }, [
      video?.video_enlace,
    ]);

  const embedUrl =
    youtubeId
      ? `https://www.youtube.com/embed/${youtubeId}?rel=0`
      : "";

  /*
   * LOADING
   */

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
        <Navbar />

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-5"
              style={{
                borderColor:
                  `${hexToRgba(primaryColor, 0.2)}`,

                borderTopColor:
                  primaryColor,
              }}
            />

            <p className="text-slate-700 font-medium">
              Cargando video...
            </p>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  /*
   * ERROR
   */

  if (error || !video) {
    return (
      <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
        <Navbar />

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-xl">
            <h2 className="font-serif text-4xl font-bold text-slate-900 mb-5">
              {error}
            </h2>

            <Link
              href="/videos"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-105"
              style={{
                background:
                  primaryColor,
              }}
            >
              <ArrowLeft className="w-5 h-5" />

              Volver a videos
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      <Navbar />

      <main className="flex-1 pt-36 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* BACK */}
          <button
            onClick={() =>
              router.back()
            }
            className="inline-flex items-center gap-2 mb-10 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />

            Volver
          </button>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* PLAYER */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="lg:col-span-2"
            >
              <div
                className="
                  bg-black
                  rounded-[2rem]
                  overflow-hidden
                  shadow-[0_25px_80px_rgba(0,0,0,0.35)]
                  border
                  border-white/10
                  aspect-video
                "
              >
                {youtubeId ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title={
                      video.video_titulo
                    }
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    Video no disponible
                  </div>
                )}
              </div>

              <div className="mt-10">
                {video.video_tipo && (
                  <span
                    className="inline-block px-5 py-2 rounded-full text-sm font-semibold mb-5"
                    style={{
                      background:
                        `${hexToRgba(primaryColor, 0.12)}`,

                      color:
                        primaryColor,
                    }}
                  >
                    {
                      video.video_tipo
                    }
                  </span>
                )}

                <h1 className="font-serif text-4xl md:text-5xl font-semibold leading-tight text-slate-900 break-words">
                  {
                    video.video_titulo
                  }
                </h1>

                {video.video_breve_descripcion && (
                  <div
                    className="
                      prose
                      prose-lg
                      max-w-none
                      mt-8
                      text-slate-700
                      break-words
                    "
                    dangerouslySetInnerHTML={{
                      __html:
                        sanitizeHTML(
                          video.video_breve_descripcion
                        ),
                    }}
                  />
                )}
              </div>
            </motion.div>

            {/* SIDEBAR */}
            <motion.div
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
            >
              <div
                className="
                  bg-white/95
                  backdrop-blur-xl
                  rounded-[2rem]
                  border
                  p-8
                  shadow-[0_10px_40px_rgba(0,0,0,0.08)]
                  sticky
                  top-32
                "
              >
                <div className="flex items-center gap-3 mb-8">
                  <div
                    className="p-3 rounded-2xl"
                    style={{
                      background:
                        `${hexToRgba(primaryColor, 0.12)}`,
                    }}
                  >
                    <Info
                      className="w-6 h-6"
                      style={{
                        color:
                          primaryColor,
                      }}
                    />
                  </div>

                  <h3 className="font-serif text-2xl font-semibold">
                    Información
                  </h3>
                </div>

                <div className="space-y-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">
                      Institución
                    </p>

                    <p className="font-semibold text-slate-900 break-words">
                      {sanitizeText(
                        institucion?.institucion_nombre ||
                          "",
                        200
                      )}
                    </p>
                  </div>

                  {video.video_tipo && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">
                        Categoría
                      </p>

                      <p className="font-semibold text-slate-900">
                        {
                          video.video_tipo
                        }
                      </p>
                    </div>
                  )}

                  <button
                    onClick={
                      handleShare
                    }
                    className="w-full inline-flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-[1.02]"
                    style={{
                      background:
                        primaryColor,
                    }}
                  >
                    <Share2 className="w-5 h-5" />

                    Compartir
                  </button>

                  {youtubeId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                    >
                      <Youtube className="w-5 h-5" />

                      YouTube

                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function VideoDetallePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-14 h-14 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      }
    >
      <VideoDetalleContent />
    </Suspense>
  );
}
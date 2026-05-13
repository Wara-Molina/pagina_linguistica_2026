"use client";

import { LanguageProvider } from "@/lib/language-context";

import { Navbar } from "@/components/navbar";

import { HeroSection } from "@/components/hero-section";

import { AboutSection } from "@/components/about-section";

import { AreasSection } from "@/components/areas-section";

import { VideoSection } from "@/components/video-section";

import { TestimonialsSection } from "@/components/testimonials-section";

import { CTASection } from "@/components/cta-section";

import { Footer } from "@/components/footer";

export default function LinguisticsPage() {
  return (
    <LanguageProvider>
      <main
        className="
          min-h-screen
          overflow-x-hidden
          bg-background
          text-foreground
        "
      >
        <Navbar />

        <HeroSection />

        <AboutSection />

        <AreasSection />

        <VideoSection />

        <CTASection />

        <TestimonialsSection />

        <Footer />
      </main>
    </LanguageProvider>
  );
}
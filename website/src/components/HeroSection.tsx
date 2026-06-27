"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import DownloadButton from "./DownloadButton";
import Button from "./Button";
import styles from "./HeroSection.module.css";

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Autoplay blocked or failed:", err);
      });
    }
  }, []);
  return (
    <section className={styles.hero}>
      <div className={`container ${styles.inner}`}>
        {/* LEFT — Text */}
        <div className={styles.left}>
          <div className={styles.fadeUp} style={{ animationDelay: "0ms" }}>
            <span className="badge">Now Available on Android</span>
          </div>

          <h1 className={`${styles.heading} ${styles.fadeUp}`} style={{ animationDelay: "60ms" }}>
            Food Delivery,{" "}
            <span className={styles.accentWord}>Reimagined</span>
            {" "}for India.
          </h1>

          <p className={`${styles.subtitle} ${styles.fadeUp}`} style={{ animationDelay: "120ms" }}>
            A complete end-to-end food delivery solution — for customers who want fast,
            fresh meals and restaurant owners who want total control.
            Built by <strong>Akanksha</strong>.
          </p>

          <div className={`${styles.actions} ${styles.fadeUp}`} style={{ animationDelay: "180ms" }}>
            <DownloadButton />
            <Button href="#features" id="hero-features-btn">
              See Features
            </Button>
          </div>

          <div className={`${styles.stats} ${styles.fadeUp}`} style={{ animationDelay: "240ms" }}>
            {[
              { value: "2", label: "App Roles" },
              { value: "Real-time", label: "Order Sync" },
              { value: "Supabase", label: "Backend" },
            ].map((s, i) => (
              <div key={s.label} className={styles.stat}>
                {i !== 0 && <div className={styles.statDivider} />}
                <span className={styles.statVal}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className={styles.scrollCue}>
        <div className={styles.scrollMouse}>
          <div className={styles.scrollWheel} />
        </div>
      </div>
    </section>
  );
}

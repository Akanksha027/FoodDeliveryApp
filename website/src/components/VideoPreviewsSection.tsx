"use client";
import React, { useEffect, useRef } from "react";
import styles from "./VideoPreviewsSection.module.css";

export default function VideoPreviewsSection() {
  const customerVideoRef = useRef<HTMLVideoElement>(null);
  const ownerVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (customerVideoRef.current) {
      customerVideoRef.current.play().catch((err) => {
        console.log("Autoplay blocked or failed for customer preview:", err);
      });
    }
    if (ownerVideoRef.current) {
      ownerVideoRef.current.play().catch((err) => {
        console.log("Autoplay blocked or failed for owner preview:", err);
      });
    }
  }, []);
  return (
    <section className={styles.section} id="preview">
      <div className="container">
        {/* Section Heading */}
        <h2 className={styles.sectionTitle}>Live App Previews</h2>

        {/* Previews Grid */}
        <div className={styles.grid}>
          {/* Column 1: Customer App */}
          <div className={styles.previewCard}>
            <h3 className={styles.cardTitle}>Customer App Preview</h3>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneNotch} />
              <div className={styles.phoneScreen}>
                <video
                  ref={customerVideoRef}
                  className={styles.videoPlayer}
                  src="/video/customerDash.mp4"
                  poster="/mockup-home.png"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                />
              </div>
              <div className={styles.phoneHomeBar} />
            </div>
          </div>

          {/* Column 2: Owner Dashboard */}
          <div className={styles.previewCard}>
            <h3 className={styles.cardTitle}>Owner Dashboard Preview</h3>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneNotch} />
              <div className={styles.phoneScreen}>
                <video
                  ref={ownerVideoRef}
                  className={styles.videoPlayer}
                  src="/video/adminDash.mp4"
                  poster="/mockup-dashboard.png"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                />
              </div>
              <div className={styles.phoneHomeBar} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import DownloadButton from "./DownloadButton";
import styles from "./Navbar.module.css";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Screenshots", href: "#screenshots" },
  { label: "Preview", href: "#preview" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={`container ${styles.nav}`}>
        <a href="#" className={styles.logo}>
          <span className={styles.logoIcon}></span>
          <span className={styles.logoText}>
            sandwiches<span className={styles.logoBrand}></span>
          </span>
        </a>

        <nav className={styles.links}>
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className={styles.link}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className={styles.right}>
          <ThemeToggle />
          <DownloadButton apkUrl="#" />
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className={`${styles.bar} ${menuOpen ? styles.open1 : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.open2 : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.open3 : ""}`} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
          <div style={{ padding: "8px 32px" }}>
            <DownloadButton apkUrl="#" />
          </div>
        </div>
      )}
    </header>
  );
}

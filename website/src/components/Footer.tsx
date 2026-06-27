"use client";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        {/* Top navigation columns */}
        <div className={styles.topRow}>
          <div className={styles.col}>
            <p className={styles.colHead}>Links</p>
            <a href="#features" className={styles.link}>Features</a>
            <a href="#screenshots" className={styles.link}>Screenshots</a>
            <a href="#preview" className={styles.link}>Preview</a>
          </div>

          <div className={styles.col}>
            <p className={styles.colHead}>© Links</p>
            <a href="https://github.com/Akanksha027" target="_blank" rel="noopener noreferrer" className={styles.link}>Github</a>
            <a href="https://www.linkedin.com/in/akanksha---singh/" target="_blank" rel="noopener noreferrer" className={styles.link}>Linkedin</a>
            <a href="https://akanksha-singh.vercel.app/" className={styles.link}>Portfolio</a>
          </div>
        </div>

        {/* Big centered name */}
        <div className={styles.bigName}>
          AKANKSHA<span className={styles.dot}>·</span>
        </div>

        {/* Bottom bar */}
        <div className={styles.bottomRow}>
          <p className={styles.copy}>©2026</p>
          <p className={styles.role}>
            <span className={styles.nameAccent}>Akanksha</span>
            &nbsp;&nbsp;·&nbsp;&nbsp;
            Full-Stack Developer
          </p>
        </div>
      </div>
    </footer>
  );
}

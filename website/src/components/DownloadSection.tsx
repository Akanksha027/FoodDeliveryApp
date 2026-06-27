"use client";
import styles from "./DownloadSection.module.css";

// Local APK file
const APK_LINK = "/video/apl.apk";

const specs = [
  { icon: "📦", label: "Platform", value: "Android (APK)" },
  { icon: "⚡", label: "Size", value: "~35 MB" },
  { icon: "🔒", label: "Security", value: "Signed & Safe" },
  { icon: "🆓", label: "Price", value: "Free Download" },
];

export default function DownloadSection() {
  return (
    <section className={styles.section} id="download">
      {/* Decorative orbs */}
      <div className={styles.orb} />

      <div className="container">
        <div className={styles.card}>
          {/* Left content */}
          <div className={styles.left}>
            <span className="badge">📲 Get the App</span>
            <h2 className={styles.title}>
              Download <span className="gradient-text">Sandwiches</span>
              <br />for free, right now.
            </h2>
            <p className={styles.desc}>
              No app store needed. Download the APK directly, install it on any Android
              device, and start ordering or managing your restaurant in minutes.
            </p>

            <div className={styles.btnRow}>
              <a
                href={APK_LINK}
                className="btn-primary"
                id="main-download-btn"
                download="sandwiches-app.apk"
              >
                <span>⬇️</span> Download APK
              </a>
              <a href="#contact" className="btn-secondary" id="request-custom-btn">
                Request Custom Build
              </a>
            </div>

            <p className={styles.note}>
              ⚠️ When installing, enable <strong>&quot;Install from unknown sources&quot;</strong> in Android settings.
            </p>
          </div>

          {/* Right specs */}
          <div className={styles.right}>
            <div className={styles.specs}>
              {specs.map((s) => (
                <div key={s.label} className={styles.spec}>
                  <span className={styles.specIcon}>{s.icon}</span>
                  <div>
                    <p className={styles.specLabel}>{s.label}</p>
                    <p className={styles.specValue}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* QR placeholder */}
            <div className={styles.qrWrap}>
              <div className={styles.qr}>
                <span className={styles.qrText}>QR Code</span>
                <span className={styles.qrSub}>Coming soon</span>
              </div>
              <p className={styles.qrCaption}>Scan to download on mobile</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
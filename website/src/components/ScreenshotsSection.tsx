"use client";
import Image from "next/image";
import styles from "./ScreenshotsSection.module.css";

export default function ScreenshotsSection() {
  return (
    <section className={styles.section} id="screenshots">
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>App Screenshots</h2>
          <p className={styles.subtitle}>
            A look at the polished screens across the customer and owner interfaces.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={`${styles.cell} ${styles.cellLarge}`}>
            <div className={styles.imgWrap}>
              <Image src="/video/food1.jpeg" alt="Browse Menu Screen" fill className={styles.img} />
            </div>
            <div className={styles.label}>
              <span className={styles.labelTitle}>Browse Menu</span>
              <span className={styles.labelSub}>Browse categories & discover fresh food</span>
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={`${styles.cell} ${styles.cellMedium}`}>
              <div className={styles.imgWrap}>
                <Image src="/video/food_2.jpeg" alt="Item Details Screen" fill className={styles.img} />
              </div>
              <div className={styles.label}>
                <span className={styles.labelTitle}>Item Details</span>
                <span className={styles.labelSub}>Select customize add-ons & options</span>
              </div>
            </div>
            <div className={`${styles.cell} ${styles.cellMedium}`}>
              <div className={styles.imgWrap}>
                <Image src="/video/food3_v2.jpeg" alt="Cart Screen" fill className={styles.img} />
              </div>
              <div className={styles.label}>
                <span className={styles.labelTitle}>Cart & Checkout</span>
                <span className={styles.labelSub}>Double-check items & quick checkout</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.strip}>
          <div className={`${styles.stripCell} ${styles.cellCombined}`}>
            <div className={styles.stripImgWrap}>
              <Image src="/video/food4.jpeg" alt="" fill className={styles.stripImg} />
            </div>
          </div>
          <div className={`${styles.stripCell} ${styles.cellCombined}`}>
            <div className={styles.stripImgWrap}>
              <Image src="/video/food_7.jpeg" alt="Special Combo" fill className={styles.stripImg} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

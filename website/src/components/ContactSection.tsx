"use client";
import { useState } from "react";
import Button from "./Button";
import styles from "./ContactSection.module.css";

const services = [
  "Custom Food Delivery App",
  "Restaurant Management System",
  "Menu & Order Management",
  "Payment Integration",
  "Admin Dashboard",
  "Other",
];

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", service: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className={styles.section} id="contact">
      <div className="container">
        <div className={styles.inner}>
          {/* Left */}
          <div className={styles.left}>
            <h2 className={styles.bigTitle}>
              Want this app<br />built for your<br />restaurant?
            </h2>
            <p className={styles.desc}>
              I&apos;m <strong>Akanksha</strong>, the developer behind Sandwiches.
              I build custom, production-ready food delivery apps tailored to your
              business — from menu to payment to live order tracking.
            </p>

            <div className={styles.devInfo}>
              <div className={styles.avatar}>A</div>
              <div>
                <p className={styles.devName}>Akanksha</p>
                <p className={styles.devRole}>Full-Stack Mobile Developer</p>
              </div>
              <span className={styles.available}>● Available</span>
            </div>

            <ul className={styles.perks}>
              {[
                "End-to-end development — design to deployment",
                "Android & iOS compatible (React Native)",
                "Custom UI tailored to your brand",
                "Supabase backend with real-time order tracking",
                "Post-launch support included",
              ].map((p) => (
                <li key={p} className={styles.perk}>
                  <span className={styles.perkDot} />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — form */}
          <div className={styles.right}>
            {submitted ? (
              <div className={styles.success}>
                <p className={styles.successMark}>✓</p>
                <h3>Message received</h3>
                <p>Akanksha will get back to you within 24 hours.</p>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit} id="contact-form">
                <h3 className={styles.formTitle}>Get in touch</h3>
                <p className={styles.formSub}>Fill in the details below and I&apos;ll get back to you shortly.</p>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Name</label>
                    <input type="text" id="contact-name" placeholder="Your name" required
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Email</label>
                    <input type="email" id="contact-email" placeholder="you@email.com" required
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>What do you need?</label>
                  <div className={styles.tags}>
                    {services.map((s) => (
                      <button key={s} type="button"
                        className={`${styles.tag} ${form.service === s ? styles.tagActive : ""}`}
                        onClick={() => setForm({ ...form, service: s })}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Tell me more</label>
                  <textarea id="contact-message" placeholder="Describe your business, expected user count, special requirements..."
                    required value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>

                <Button type="submit" id="contact-submit" fullWidth>
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

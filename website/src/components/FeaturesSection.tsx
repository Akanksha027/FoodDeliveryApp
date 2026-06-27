"use client";
import { useState } from "react";
import styles from "./FeaturesSection.module.css";

const tabs = [
  { id: "customer", label: "Customer App" },
  { id: "owner", label: "Owner Dashboard" },
  { id: "tech", label: "Tech Stack" },
  { id: "about", label: "About the App" },
];

const content: Record<string, { title: string; subtitle: string; sections: { heading: string; points: string[] }[] }> = {
  customer: {
    title: "Customer App — Complete Ordering Experience",
    subtitle:
      "A smooth, intuitive mobile interface for customers to browse menus, place orders, track status, and manage their food preferences — all in one place.",
    sections: [
      {
        heading: "Browsing & Discovery",
        points: [
          "Full restaurant menu with categories — Burgers, Pizza, Drinks, Fries",
          "Item detail pages with add-ons, images, and pricing in ₹",
          "Search and filter across the entire menu",
          "Favourites list for quick re-ordering",
        ],
      },
      {
        heading: "Ordering & Checkout",
        points: [
          "Cart management with item quantity controls",
          "Promo code entry with automatic discount calculation",
          "Multiple saved delivery addresses with Google Places autocomplete",
          "Order confirmation with itemised breakdown",
        ],
      },
      {
        heading: "Order Tracking & History",
        points: [
          "Real-time order status updates — Pending, Preparing, Ready, Delivered",
          "Complete order history with timestamps",
          "Re-order from past orders in one tap",
        ],
      },
    ],
  },
  owner: {
    title: "Owner Dashboard — Full Restaurant Control",
    subtitle:
      "Restaurant owners and kitchen staff get a dedicated management panel to handle everything — from menu to live orders — without leaving the app.",
    sections: [
      {
        heading: "Menu Management",
        points: [
          "Add, edit, and remove menu items with images and pricing",
          "Organise items into categories",
          "Toggle item availability on/off in real time",
          "Set add-on options (e.g. extra toppings, sizes)",
        ],
      },
      {
        heading: "Live Order Management",
        points: [
          "Incoming orders appear instantly via real-time sync",
          "Update order status — Accept, Preparing, Ready, Delivered",
          "View full order details including customer address and items",
          "Filter orders by status for kitchen efficiency",
        ],
      },
      {
        heading: "Revenue & Analytics",
        points: [
          "Total revenue tracking across all orders",
          "View daily and historical order volume",
          "See top-selling items at a glance",
        ],
      },
    ],
  },
  tech: {
    title: "Tech Stack — Built for Scale",
    subtitle:
      "QuickBite is built on a modern, production-grade stack — React Native for cross-platform mobile, Supabase for real-time backend, and Expo for easy distribution.",
    sections: [
      {
        heading: "Mobile App (Frontend)",
        points: [
          "React Native 0.81 + Expo SDK 54 — Android & iOS compatible",
          "TypeScript for type-safe codebase",
          "React Navigation (native stack) for screen management",
          "Poppins + Lora fonts via @expo-google-fonts",
          "Expo Location for GPS-based address detection",
        ],
      },
      {
        heading: "Backend & Database",
        points: [
          "Supabase (PostgreSQL) — hosted, managed, real-time capable",
          "Row-level security for customer and owner data isolation",
          "Supabase Auth — email/password + Google OAuth",
          "Real-time subscriptions for live order updates",
        ],
      },
      {
        heading: "Integrations & Infrastructure",
        points: [
          "Google Places Autocomplete API for smart address entry",
          "Expo EAS for APK/AAB build and distribution",
          "AsyncStorage for offline session persistence",
          "Next.js (API routes) for server-side business logic",
        ],
      },
    ],
  },
  about: {
    title: "About QuickBite",
    subtitle:
      "QuickBite started as a full-stack project to solve real problems faced by small restaurant businesses — building something production-ready rather than a prototype.",
    sections: [
      {
        heading: "Purpose",
        points: [
          "Enable any restaurant to digitise ordering without a costly POS system",
          "Give customers a seamless, app-native ordering experience",
          "Provide owners with real-time visibility into their operations",
          "Remove the dependency on third-party delivery platforms and their commissions",
        ],
      },
      {
        heading: "Who it is for",
        points: [
          "Small to medium restaurant businesses (QSR, cloud kitchens, cafes)",
          "Canteens, food courts, and campus dining",
          "Any food business wanting a branded, independent ordering app",
        ],
      },
      {
        heading: "Built by",
        points: [
          "Designed and developed by Akanksha — Full-Stack Mobile Developer",
          "End-to-end — UI design, mobile development, backend, deployment",
          "Available for custom builds tailored to your business",
        ],
      },
    ],
  },
};

export default function FeaturesSection() {
  const [active, setActive] = useState("customer");
  const data = content[active];

  return (
    <section className={styles.section} id="features">
      {/* Tab navigation */}
      <div className={styles.tabBar}>
        <div className="container">
          <div className={styles.tabs}>
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`${styles.tab} ${active === t.id ? styles.tabActive : ""}`}
                onClick={() => setActive(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`container ${styles.content}`}>
        <div className={styles.contentHeader}>
          <h2 className={styles.title}>{data.title}</h2>
          <p className={styles.subtitle}>{data.subtitle}</p>
        </div>

        <div className={styles.grid}>
          {data.sections.map((s) => (
            <div key={s.heading} className={styles.block}>
              <h3 className={styles.blockHeading}>{s.heading}</h3>
              <ul className={styles.list}>
                {s.points.map((p) => (
                  <li key={p} className={styles.listItem}>
                    <span className={styles.bullet} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

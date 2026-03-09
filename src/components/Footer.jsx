// src/components/Footer.jsx
import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import businessInfo from '../config/businessInfo.json'
import styles from './Footer.module.css'
import { getPagePath } from '../lib/seo'

function Footer() {
  const openingHoursLabel = businessInfo.openingHours
    .map((item) => `${item.label} ${item.opens} - ${item.closes}`)
    .join(' / ')

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <section className={styles.primary}>
          <h2 className={styles.heading}>{businessInfo.name}</h2>
          <address className={styles.address}>
            {businessInfo.displayAddress}
            <br />
            <a href={businessInfo.siteUrl} className={styles.link}>
              {businessInfo.siteUrl}
            </a>
          </address>
          {businessInfo.telephone && <p className={styles.meta}>電話: {businessInfo.telephone}</p>}
          {openingHoursLabel && (
            <p className={styles.meta}>
              営業時間: {openingHoursLabel} / {businessInfo.closedDayNote}
            </p>
          )}
        </section>

        <nav className={styles.nav} aria-label="フッターナビゲーション">
          <RouterLink to={getPagePath('menu')} className={styles.link}>
            メニュー
          </RouterLink>
          <RouterLink to={getPagePath('access')} className={styles.link}>
            アクセス・店舗情報
          </RouterLink>
          <RouterLink to={getPagePath('faq')} className={styles.link}>
            FAQ
          </RouterLink>
          <RouterLink to={getPagePath('reservation')} className={styles.link}>
            予約案内
          </RouterLink>
        </nav>

        <section className={styles.sns}>
          <h3 className={styles.subheading}>公式SNS・予約</h3>
          <a
            href={businessInfo.xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            X
          </a>
          <a
            href={businessInfo.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Instagram
          </a>
          <a
            href={businessInfo.lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            LINE予約
          </a>
        </section>
      </div>
      <p className={styles.copyright}>
        © {new Date().getFullYear()} {businessInfo.name}
      </p>
    </footer>
  )
}

export default Footer

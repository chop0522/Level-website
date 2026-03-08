import React from 'react'
import { Helmet } from 'react-helmet-async'
import businessInfo from '../config/businessInfo.json'
import { getPageSeo } from '../lib/seo'

function SeoHead({ pageKey, structuredData = [] }) {
  const page = getPageSeo(pageKey)

  return (
    <Helmet>
      <title>{page.title}</title>
      <link rel="canonical" href={page.canonical} />
      <meta name="description" content={page.description} />
      <meta name="format-detection" content="telephone=no" />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={businessInfo.name} />
      <meta property="og:title" content={page.title} />
      <meta property="og:description" content={page.description} />
      <meta property="og:url" content={page.canonical} />
      <meta property="og:image" content={page.image} />
      <meta property="og:locale" content="ja_JP" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={page.title} />
      <meta name="twitter:description" content={page.description} />
      <meta name="twitter:image" content={page.image} />

      {structuredData.map((item, index) => (
        <script key={`${pageKey}-jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  )
}

export default SeoHead

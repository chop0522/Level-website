import businessInfo from '../config/businessInfo.json'
import sitePages from '../config/sitePages.json'

export function trimTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export function absoluteUrl(path = '/') {
  const base = trimTrailingSlash(businessInfo.siteUrl)
  return path === '/' ? `${base}/` : `${base}${path}`
}

export function getPageSeo(pageKey) {
  const page = sitePages[pageKey]

  if (!page) {
    throw new Error(`Unknown page key: ${pageKey}`)
  }

  const canonical = absoluteUrl(page.path)
  const image = absoluteUrl(businessInfo.defaultOgImage)

  return {
    ...page,
    canonical,
    image,
    siteName: businessInfo.name,
  }
}

export function buildLocalBusinessJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${trimTrailingSlash(businessInfo.siteUrl)}/#localbusiness`,
    name: businessInfo.name,
    url: businessInfo.siteUrl,
    address: {
      '@type': 'PostalAddress',
      postalCode: businessInfo.address.postalCode,
      addressCountry: businessInfo.address.addressCountry,
      addressRegion: businessInfo.address.addressRegion,
      addressLocality: businessInfo.address.addressLocality,
      streetAddress: businessInfo.address.streetAddress,
    },
    sameAs: businessInfo.sameAs,
    description: businessInfo.description,
    menu: businessInfo.menuUrl,
  }

  if (businessInfo.telephone) {
    data.telephone = businessInfo.telephone
  }

  if (businessInfo.defaultOgImage) {
    data.image = absoluteUrl(businessInfo.defaultOgImage)
  }

  if (Array.isArray(businessInfo.openingHours) && businessInfo.openingHours.length > 0) {
    data.openingHoursSpecification = businessInfo.openingHours.map((item) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: item.schemaDays,
      opens: item.opens,
      closes: item.closes,
    }))
  }

  return data
}

export function buildOrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${trimTrailingSlash(businessInfo.siteUrl)}/#organization`,
    name: businessInfo.name,
    url: businessInfo.siteUrl,
    sameAs: businessInfo.sameAs,
    address: {
      '@type': 'PostalAddress',
      postalCode: businessInfo.address.postalCode,
      addressCountry: businessInfo.address.addressCountry,
      addressRegion: businessInfo.address.addressRegion,
      addressLocality: businessInfo.address.addressLocality,
      streetAddress: businessInfo.address.streetAddress,
    },
  }

  if (businessInfo.logoPath) {
    data.logo = absoluteUrl(businessInfo.logoPath)
  }

  return data
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${trimTrailingSlash(businessInfo.siteUrl)}/#website`,
    url: businessInfo.siteUrl,
    name: businessInfo.name,
    inLanguage: 'ja-JP',
  }
}

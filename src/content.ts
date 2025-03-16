
/**
 * Removes all script tags and their contents from HTML
 */
export function removeScripts(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}

/**
 * Removes all style tags and their contents from HTML
 */
export function removeStyles(html: string): string {
  return html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
}

/**
 * Removes all SVG elements from HTML
 */
export function removeSvgs(html: string): string {
  return html.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
}

/**
 * Removes all HTML tags from text
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ')
}

/**
 * Extracts image URLs from HTML content, excluding logos/icons and only including
 * images between header and footer when possible
 * @param html The HTML content to parse
 * @returns Array of unique image URLs found in the main content area
 */
function extractImageUrls(html: string): string[] {
  const imageUrls: Set<string> = new Set()

  // First try to isolate main content by removing header and footer
  let mainContent = html

  // Remove header if exists (handles various header tags)
  const headerMatch = html.match(/<\s*(header|nav|\.header|#header)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi)
  if (headerMatch) {
    mainContent = mainContent.replace(headerMatch[0], '')
  }

  // Remove footer if exists
  const footerMatch = html.match(/<\s*(footer|\.footer|#footer)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi)
  if (footerMatch) {
    mainContent = mainContent.replace(footerMatch[0], '')
  }

  // Match all img tags with src attributes
  const imgRegex = /<img[^>]+src=(['"])(.*?)\1/gi
  let match

  while ((match = imgRegex.exec(mainContent)) !== null) {
    if (match[2] &&
      !/logo|icon|badge|seal|google|getadmiral|intentiq|userway|misc|data:image|cookie|bot|svg/i.test(match[2]) && // Exclude logos and icons
      !match[2].includes('header') &&  // Additional safety checks
      !match[2].includes('footer')) {
      imageUrls.add(match[2].trim())
    }
  }

  // Match background-image styles
  const styleRegex = /background-image\s*:\s*url\(['"]?(.*?)['"]?\)/gi
  while ((match = styleRegex.exec(mainContent)) !== null) {
    if (match[1] &&
      !/logo|icon/i.test(match[1]) && // Exclude logos and icons
      !match[1].includes('header') &&  // Additional safety checks
      !match[1].includes('footer')) {
      imageUrls.add(match[1].trim())
    }
  }

  return Array.from(imageUrls)
}

/**
 * Extracts Links from HTML content.
 * @param html The HTML content to parse
 * @returns Array of unique link URLs found in the main content area
 */
export function extractLinks(html: string): string[] {
  const links: Set<string> = new Set()

  // First try to isolate main content by removing header and footer
  let mainContent = html

  // Remove header if exists (handles various header tags)
  const headerMatch = html.match(/<\s*(header|nav|\.header|#header)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi)
  if (headerMatch) {
    mainContent = mainContent.replace(headerMatch[0], '')
  }

  // Remove footer if exists
  const footerMatch = html.match(/<\s*(footer|\.footer|#footer)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi)
  if (footerMatch) {
    mainContent = mainContent.replace(footerMatch[0], '')
  }

  // Match all img tags with src attributes
  const linkRegex = /<a[^>]+href=(['"])(.*?)\1/gi
  let match

  while ((match = linkRegex.exec(mainContent)) !== null) {
    if (match[2] &&
      !/google|getadmiral|intentiq|userway|misc|cookie|bot|track|analy|pixel|user|account/i.test(match[2]) &&
      !match[2].includes('header') &&  // Additional safety checks
      !match[2].includes('footer')) {
      links.add(match[2].trim())
    }
  }

  return Array.from(links)
}

/**
 * Normalizes whitespace and newlines in text
 * - Preserves single spaces between words
 * - Ensures proper spacing around special characters
 * - Normalizes newlines for paragraph separation
 * - Maintains readability of text content
 */
export function normalizeWhitespace(input: string): string {
  // Replace all occurrences of "&nbsp;" (case-insensitive) with a normal space.
  let result = input.replace(/&nbsp;/gi, ' ')

  // Replace consecutive newline characters (or carriage returns) with a single newline.
  result = result.replace(/(?:\r?\n[\t ]*)+/g, "\n ")

  // Replace consecutive tab characters with a single tab.
  result = result.replace(/\t+/g, '\t')

  // Replace multiple spaces with a single space.
  result = result.replace(/ {2,}/g, ' ')

  // Trim any leading or trailing whitespace.
  return result.trim()
}


export interface Content {
  text: string
  links?: string[]
  images?: string[]
}

/**
 * Extracts and cleans the main content from HTML
 */
export async function extractCleanContent(html: string): Promise<Content> {
  // Get the HTML content
  // let html = await page.content()

  // Remove scripts, styles, and SVGs
  html = removeScripts(html)
  html = removeStyles(html)
  html = removeSvgs(html)

  const images = extractImageUrls(html)
  // const links = extractLinks(html)
  // Strip remaining HTML tags and get text content
  const text = stripHtmlTags(html)

  // Normalize whitespace
  return {
    text: normalizeWhitespace(text),
    links: [],
    images
  }
}
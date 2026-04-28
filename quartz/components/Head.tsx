import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../plugins/emitters/ogImage"
// ... 前面的 import 保持不變 ...

export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ??
        i18n(cfg.locale).propertyDefaults.title) + titleSuffix

    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(
        fileData.description?.trim() ??
          i18n(cfg.locale).propertyDefaults.description,
      )

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir =
      fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    // --- PWA 路徑 ---
    const manifestPath = joinSegments(baseDir, "static/manifest.json")
    const swPath = joinSegments(baseDir, "static/sw.js")

    // 社交分享 URL
    const socialUrl =
      fileData.slug === "404"
        ? url.toString()
        : joinSegments(url.toString(), fileData.slug!)

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )

    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />

        {/* ===== PWA 核心 ===== */}
        <link rel="manifest" href={manifestPath} />
        <meta name="theme-color" content="#ad83da" />

        {/* iOS 支援 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href={iconPath} />

        {/* Service Worker 註冊 */}
        <script nonce={crypto.randomUUID()}>
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('${swPath}', { scope: '${baseDir}' })
                  .then(() => console.log('[PWA] SW registered'))
                  .catch(err => console.error('[PWA] SW failed', err));
              });
            }
          `}
        </script>

        {/* ===== Fonts ===== */}
        {cfg.theme.cdnCaching &&
          cfg.theme.fontOrigin === "googleFonts" && (
            <>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
              />
              <link
                rel="stylesheet"
                href={googleFontHref(cfg.theme)}
              />
              {cfg.theme.typography.title && (
                <link
                  rel="stylesheet"
                  href={googleFontSubsetHref(
                    cfg.theme,
                    cfg.pageTitle,
                  )}
                />
              )}
            </>
          )}

        <link
          rel="preconnect"
          href="https://cdnjs.cloudflare.com"
          crossOrigin="anonymous"
        />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        {/* ===== SEO / Social ===== */}
        <meta name="og:site_name" content={cfg.pageTitle} />
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${
                getFileExtension(ogImageDefaultPath) ?? "png"
              }`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl} />
            <meta property="og:url" content={socialUrl} />
            <meta property="twitter:url" content={socialUrl} />
          </>
        )}

        {/* ===== 基本設定 ===== */}
        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {/* ===== CSS ===== */}
        {css.map((resource) =>
          CSSResourceToStyleElement(resource, true),
        )}

        {/* ===== JS (before DOM ready) ===== */}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) =>
            JSResourceToScriptElement(res, true),
          )}

        {/* ===== 額外 Head ===== */}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor

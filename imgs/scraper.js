// Robust image scraper for Kikuubo Online category pages
// Features: lazy-load attr support, srcset parsing, pagination, de-duplication,
// retries with backoff, timeouts, and controlled concurrency.

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

// ===================== Config =====================
const BASE_URL = "https://kikuuboonline.com";
const START_URL = "https://kikuuboonline.com/products?category=baby-products"; // target baby-products category

// Crawl scope: "category" (only paginate listing) or "site" (all internal links)
const CRAWL_SCOPE = "category"; // paginate the targeted category page

// Pagination config (used for category scope):
// crawler will try to follow a "next" link. If not found, it can try numeric pages ?page=2..
const MAX_PAGES = 50; // allow deeper pagination for the category
const TRY_NUMERIC_PAGINATION = true; // fallback to ?page=N if no explicit "next" link

// Site crawl limits (used for site scope)
const MAX_URLS = 1200; // unused in category mode, kept for site mode

// Download config
const INCLUDE_EXTS = [".jpg", ".jpeg", ".png", ".webp"]; // file types to save
const CONCURRENCY = 5; // simultaneous downloads
const TIMEOUT_MS = 60000; // request timeout
const MAX_RETRIES = 3; // per image
const BACKOFF_BASE_MS = 800; // retry backoff base

// Allow downloading images from any host (e.g., CDN)
const ALLOW_EXTERNAL_IMAGE_HOSTS = true;

// Render pages with JavaScript (via Puppeteer) to capture DB-injected images
const RENDER_JS = false; // set to true to use Puppeteer
const RENDER_SCROLL_STEPS = 8; // how many times to scroll to bottom
const RENDER_SCROLL_DELAY_MS = 350; // delay between scrolls

// Search support: specify search terms to fetch images from search results pages
// Example: ["nivea", "milk", "toothpaste"]
const SEARCH_TERMS = [
  "a","b","c","d","e","f","g","h","i","j","k","l","m",
  "n","o","p","q","r","s","t","u","v","w","x","y","z"
]; // broad coverage; adjust to your needs
const MAX_PAGES_PER_SEARCH = 3; // cap pages per search term to keep crawl bounded

// Whether to prioritize visiting product detail pages explicitly (recommended)
const FOLLOW_PRODUCT_LINKS = true;

// HTTP headers
const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: BASE_URL,
};

// Save directory
const saveDir = path.join(__dirname, "kikuubo_images");
// ==================================================

if (!fs.existsSync(saveDir)) {
  fs.mkdirSync(saveDir, { recursive: true });
}

function buildSearchUrls(terms) {
  const urls = [];
  const patterns = [
    (t) => `${BASE_URL}/search?q=${encodeURIComponent(t)}`,
    (t) => `${BASE_URL}/products?search=${encodeURIComponent(t)}`,
    (t) => `${BASE_URL}/products?keyword=${encodeURIComponent(t)}`,
  ];
  for (const term of terms || []) {
    for (const p of patterns) {
      urls.push(p(term));
      // Pre-seed a few paginated pages for each term
      for (let i = 2; i <= Math.max(2, Math.min(5, MAX_PAGES_PER_SEARCH)); i++) {
        urls.push(p(term) + `&page=${i}`);
      }
    }
  }
  // De-duplicate while preserving order
  const seen = new Set();
  return urls.filter((u) => (seen.has(u) ? false : (seen.add(u), true)));
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function extFromUrl(u) {
  try {
    const clean = u.split("?")[0].split("#")[0];
    const ext = path.extname(clean).toLowerCase();
    return ext;
  } catch {
    return "";
  }
}

function isWantedImage(u) {
  const ext = extFromUrl(u);
  return INCLUDE_EXTS.includes(ext);
}

function sanitizeFilename(name) {
  // Basic sanitization and dedupe on collisions handled later
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 200);
}

function normalizeUrl(raw, base = BASE_URL) {
  if (!raw) return null;
  try {
    // Handle protocol-relative //example.com/img.jpg
    if (raw.startsWith("//")) {
      return new URL("https:" + raw).toString();
    }
    // If already absolute
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return new URL(raw).toString();
    }
    // Relative to base
    return new URL(raw, base).toString();
  } catch {
    return null;
  }
}

function sameHost(targetUrl, base = BASE_URL) {
  try {
    const t = new URL(targetUrl);
    const b = new URL(base);
    return t.hostname === b.hostname || t.hostname.endsWith("." + b.hostname);
  } catch {
    return false;
  }
}

function selectLargestFromSrcset(srcset) {
  // Parse srcset and pick the largest width candidate
  // Example: "image1.jpg 300w, image2.jpg 600w"
  try {
    const parts = srcset
      .split(",")
      .map((p) => p.trim())
      .map((p) => {
        const [u, d] = p.split(/\s+/);
        const width = d && d.endsWith("w") ? parseInt(d.replace("w", ""), 10) : 0;
        return { url: u, width: isNaN(width) ? 0 : width };
      })
      .filter((x) => x.url);
    if (parts.length === 0) return null;
    parts.sort((a, b) => b.width - a.width);
    return parts[0].url || null;
  } catch {
    return null;
  }
}

function collectImageUrls($, pageUrl) {
  const urls = new Set();

  $("img").each((_, el) => {
    const $el = $(el);
    const candidates = new Set();

    // Common attributes
    const src = $el.attr("src");
    const dataSrc = $el.attr("data-src");
    const dataOriginal = $el.attr("data-original");
    const dataLazy = $el.attr("data-lazy");
    const srcset = $el.attr("srcset") || $el.attr("data-srcset");

    if (src) candidates.add(src);
    if (dataSrc) candidates.add(dataSrc);
    if (dataOriginal) candidates.add(dataOriginal);
    if (dataLazy) candidates.add(dataLazy);

    if (srcset) {
      const largest = selectLargestFromSrcset(srcset);
      if (largest) candidates.add(largest);
    }

    for (const c of candidates) {
      const abs = normalizeUrl(c, pageUrl || BASE_URL);
      if (!abs) continue;
      const hostOk = ALLOW_EXTERNAL_IMAGE_HOSTS || sameHost(abs, BASE_URL);
      if (hostOk && isWantedImage(abs)) {
        urls.add(abs);
      }
    }
  });

  // Also parse <source> tags (inside <picture>) for srcset
  $("source").each((_, el) => {
    const srcset = $(el).attr("srcset") || $(el).attr("data-srcset");
    if (srcset) {
      const largest = selectLargestFromSrcset(srcset);
      if (largest) {
        const abs = normalizeUrl(largest, pageUrl || BASE_URL);
        if (abs) {
          const hostOk = ALLOW_EXTERNAL_IMAGE_HOSTS || sameHost(abs, BASE_URL);
          if (hostOk && isWantedImage(abs)) urls.add(abs);
        }
      }
    }
  });

  // Background images from inline style attributes
  const urlRegex = /url\(("|')?(.*?)\1\)/gi;
  $('[style]').each((_, el) => {
    const style = ($(el).attr('style') || '').toString();
    let m;
    while ((m = urlRegex.exec(style)) !== null) {
      const raw = m[2];
      const abs = normalizeUrl(raw, pageUrl || BASE_URL);
      if (abs) {
        const hostOk = ALLOW_EXTERNAL_IMAGE_HOSTS || sameHost(abs, BASE_URL);
        if (hostOk && isWantedImage(abs)) urls.add(abs);
      }
    }
  });

  return urls;
}

async function fetchHtml(url) {
  const res = await axios.get(url, {
    headers: DEFAULT_HEADERS,
    timeout: TIMEOUT_MS,
    responseType: "text",
    validateStatus: (s) => s >= 200 && s < 400,
  });
  return res.data;
}

async function fetchHtmlRendered(url) {
  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch (e) {
    throw new Error("Puppeteer not installed. Run: npm install puppeteer (in frontend/imgs)");
  }
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent(DEFAULT_HEADERS["User-Agent"]);
  await page.setExtraHTTPHeaders({
    Accept: DEFAULT_HEADERS.Accept,
    "Accept-Language": DEFAULT_HEADERS["Accept-Language"],
    Referer: DEFAULT_HEADERS.Referer,
  });
  await page.goto(url, { waitUntil: "networkidle2", timeout: TIMEOUT_MS });
  // Smooth-scroll to bottom to trigger lazy-loading
  for (let i = 0; i < RENDER_SCROLL_STEPS; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight * 1.2);
    });
    await new Promise((r) => setTimeout(r, RENDER_SCROLL_DELAY_MS));
  }
  const html = await page.content();
  await page.close();
  await browser.close();
  return html;
}

async function fetchPageHtml(url) {
  if (RENDER_JS) {
    return await fetchHtmlRendered(url);
  }
  return await fetchHtml(url);
}

function findNextPageUrl($, currentUrl) {
  // 1) Try common rel=next
  let nextHref =
    $('a[rel="next"]').attr("href") ||
    $('link[rel="next"]').attr("href") ||
    null;

  // 2) Try a button or anchor with text "next" or "older"
  if (!nextHref) {
    const candidates = [];
    $("a").each((_, a) => {
      const txt = ($(a).text() || "").trim().toLowerCase();
      if (["next", "older", "»", "›"].some((w) => txt.includes(w))) {
        const href = $(a).attr("href");
        if (href) candidates.push(href);
      }
    });
    if (candidates.length > 0) {
      nextHref = candidates[0];
    }
  }

  if (nextHref) {
    return normalizeUrl(nextHref, currentUrl || BASE_URL);
  }

  // 3) Fallback: numeric pagination ?page=N
  if (TRY_NUMERIC_PAGINATION) {
    try {
      const urlObj = new URL(currentUrl);
      const currentPage = parseInt(urlObj.searchParams.get("page") || "1", 10);
      if (!isNaN(currentPage)) {
        urlObj.searchParams.set("page", String(currentPage + 1));
        return urlObj.toString();
      } else {
        // If there is no page param, start from 2
        urlObj.searchParams.set("page", "2");
        return urlObj.toString();
      }
    } catch {
      // ignore
    }
  }

  return null;
}

async function downloadWithRetries(url, targetPath) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await axios.get(url, {
        headers: DEFAULT_HEADERS,
        responseType: "arraybuffer",
        timeout: TIMEOUT_MS,
        validateStatus: (s) => s >= 200 && s < 400,
      });
      fs.writeFileSync(targetPath, res.data);
      return true;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        return false;
      }
      const backoff = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
      await sleep(backoff);
    }
  }
}

async function runWithConcurrency(tasks, concurrency) {
  let index = 0;
  let active = 0;
  let resolved = 0;

  return new Promise((resolve) => {
    const results = new Array(tasks.length);

    const next = () => {
      if (resolved === tasks.length) {
        return resolve(results);
      }
      while (active < concurrency && index < tasks.length) {
        const cur = index++;
        active++;
        tasks[cur]()
          .then((r) => {
            results[cur] = r;
          })
          .catch((e) => {
            results[cur] = { ok: false, error: e };
          })
          .finally(() => {
            active--;
            resolved++;
            next();
          });
      }
    };
    next();
  });
}

async function crawlCategoryPages(startUrl, maxPages) {
  const visited = new Set();
  const pages = [];

  let current = startUrl;
  for (let i = 0; i < maxPages && current; i++) {
    if (visited.has(current)) break;
    pages.push(current);
    visited.add(current);

    try {
      const html = await fetchPageHtml(current);
      const $ = cheerio.load(html);
      const nextUrl = findNextPageUrl($, current);

      if (!nextUrl || visited.has(nextUrl)) {
        break;
      }
      current = nextUrl;
    } catch {
      break;
    }
  }

  return pages;
}

function collectInternalLinks($, pageUrl) {
  const links = new Set();
  $("a[href]").each((_, a) => {
    const href = ($(a).attr("href") || "").trim();
    if (!href) return;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
    const abs = normalizeUrl(href, pageUrl || BASE_URL);
    if (!abs) return;
    if (!sameHost(abs, BASE_URL)) return;
    // Avoid fragments-only changes
    const noHash = abs.split('#')[0];
    links.add(noHash);
  });
  return links;
}

function collectProductLinks($, pageUrl) {
  const links = new Set();
  $("a[href]").each((_, a) => {
    const href = ($(a).attr("href") || "").trim();
    if (!href) return;
    const abs = normalizeUrl(href, pageUrl || BASE_URL);
    if (!abs) return;
    if (!sameHost(abs, BASE_URL)) return;
    try {
      const u = new URL(abs);
      const p = u.pathname || "";
      // Accept product detail pages
      // - /product/<slug>
      // - /products/<slug>
      // Exclude pure listings like /products or /products?category=...
      const isProduct = p.startsWith("/product/");
      const isProductsDetail = p.startsWith("/products/");
      const isProductsListing = p === "/products";
      if ((isProduct || isProductsDetail) && !isProductsListing) {
        links.add(u.toString().split('#')[0]);
      }
    } catch {
      // ignore bad urls
    }
  });
  return links;
}

async function crawlSite(startUrl, maxUrls) {
  // Seed queue with START_URL and any search URLs built from SEARCH_TERMS
  const seeds = [startUrl, ...buildSearchUrls(SEARCH_TERMS)];
  const queue = [...seeds];
  const visited = new Set();
  const pages = [];

  while (queue.length > 0 && pages.length < maxUrls) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    pages.push(current);

    try {
      const html = await fetchHtml(current);
      const $ = cheerio.load(html);

      // Prioritize product detail pages discovered here
      const productLinks = collectProductLinks($, current);
      for (const l of productLinks) {
        if (!visited.has(l) && queue.length + pages.length < maxUrls) {
          queue.unshift(l); // prioritize product pages next
        }
      }

      // Also enqueue general internal links (lower priority)
      const links = collectInternalLinks($, current);
      for (const l of links) {
        if (!visited.has(l) && queue.length + pages.length < maxUrls) {
          queue.push(l);
        }
      }
    } catch {
      // ignore page errors and continue
    }
  }
  return pages;
}

async function scrapeImages() {
  console.log("Starting scrape from:", START_URL);

  // 1) Determine pages to crawl
  let pages = [START_URL];
  try {
    if (CRAWL_SCOPE === "site") {
      pages = await crawlSite(START_URL, MAX_URLS);
    } else {
      const discovered = await crawlCategoryPages(START_URL, MAX_PAGES);
      if (discovered.length > 0) pages = discovered;
    }
  } catch (e) {
    // Fallback to just the start page
  }
  console.log(`Discovered ${pages.length} page(s) to scrape`);

  // 2) Collect image URLs across category pages and, optionally, product detail pages
  const allUrls = new Set();
  const productPageSet = new Set();

  for (const pageUrl of pages) {
    try {
      const html = await fetchPageHtml(pageUrl);
      const $ = cheerio.load(html);
      const urls = collectImageUrls($, pageUrl);
      urls.forEach((u) => allUrls.add(u));
      if (FOLLOW_PRODUCT_LINKS) {
        const prodLinks = collectProductLinks($, pageUrl);
        prodLinks.forEach((l) => productPageSet.add(l));
      }
      console.log(`Page: ${pageUrl} -> ${urls.size} image(s)`);
    } catch (err) {
      console.log(`Failed to read page: ${pageUrl} (${err.message})`);
    }
  }

  // Visit product pages and collect their images
  if (FOLLOW_PRODUCT_LINKS && productPageSet.size > 0) {
    console.log(`Discovered ${productPageSet.size} product page(s) from category pages`);
    for (const productUrl of productPageSet) {
      try {
        const html = await fetchPageHtml(productUrl);
        const $ = cheerio.load(html);
        const urls = collectImageUrls($, productUrl);
        urls.forEach((u) => allUrls.add(u));
        console.log(`Product: ${productUrl} -> ${urls.size} image(s)`);
      } catch (err) {
        console.log(`Failed to read product: ${productUrl} (${err.message})`);
      }
    }
  }

  console.log(`Total unique images found: ${allUrls.size}`);

  // 3) Prepare download tasks
  const tasks = [];
  const takenNames = new Set();

  for (const url of allUrls) {
    const baseName = sanitizeFilename(path.basename(url.split("?")[0]) || "image");
    let finalName = baseName;
    let counter = 1;
    while (takenNames.has(finalName)) {
      const ext = path.extname(baseName);
      const nameNoExt = baseName.slice(0, -ext.length) || "image";
      finalName = `${nameNoExt}-${counter}${ext}`;
      counter++;
    }
    takenNames.add(finalName);

    const targetPath = path.join(saveDir, finalName);

    tasks.push(async () => {
      const ok = await downloadWithRetries(url, targetPath);
      if (ok) {
        console.log("Downloaded:", finalName);
        return { ok: true, url, file: finalName };
      } else {
        console.log("Failed:", url);
        return { ok: false, url, file: finalName };
      }
    });
  }

  // 4) Execute with concurrency
  const results = await runWithConcurrency(tasks, CONCURRENCY);
  const okCount = results.filter((r) => r && r.ok).length;
  const failCount = results.length - okCount;

  console.log("======================================");
  console.log("Finished downloading.");
  console.log(`Success: ${okCount}, Failed: ${failCount}`);
  console.log(`Saved to: ${saveDir}`);
}

scrapeImages().catch((e) => {
  console.error("Fatal error:", e.message);
});
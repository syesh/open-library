import { NextRequest, NextResponse } from "next/server";

const ALLOWED_DOMAINS = [
  "gutenberg.org",
  "www.gutenberg.org",
  "aleph.gutenberg.org",
  "gutendex.com",
  "www.gutendex.com",
  "archive.org",
  "ia800000.us.archive.org",
  "ia600000.us.archive.org",
];

function isTrustedDomain(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

// Generate fast direct mirror URLs if possible (e.g. converting Gutenberg redirect links to direct aleph links)
function getFastMirrorUrls(originalUrl: string): string[] {
  const urls: string[] = [originalUrl];

  // Example match for Gutenberg book IDs like https://www.gutenberg.org/ebooks/1342.epub3.images or /1342.epub.images
  const idMatch = originalUrl.match(/\/ebooks\/(\d+)\.epub/);
  if (idMatch && idMatch[1]) {
    const id = idMatch[1];
    // Gutenberg direct aleph mirror path structure: /1/3/4/1342/1342-images.epub or /cache/epub/1342/pg1342.epub
    urls.unshift(`https://www.gutenberg.org/cache/epub/${id}/pg${id}.epub`);
    urls.unshift(`https://aleph.gutenberg.org/cache/epub/${id}/pg${id}.epub`);
  }

  return Array.from(new Set(urls));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const epubUrl = searchParams.get("url");

  if (!epubUrl) {
    return NextResponse.json(
      { error: "Missing 'url' query parameter" },
      { status: 400 }
    );
  }

  if (!isTrustedDomain(epubUrl)) {
    return NextResponse.json(
      { error: "Untrusted or invalid target domain." },
      { status: 400 }
    );
  }

  const candidateUrls = getFastMirrorUrls(epubUrl);

  try {
    // Race candidates for fastest response
    const fetchPromises = candidateUrls.map((targetUrl) =>
      fetch(targetUrl, {
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/epub+zip, application/octet-stream, */*",
        },
      }).then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        if (buf.byteLength < 500) throw new Error("Invalid EPUB payload size");
        return buf;
      })
    );

    const arrayBuffer = await Promise.any(fetchPromises);

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Length": arrayBuffer.byteLength.toString(),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("EPUB proxy speed race error:", error);
    return NextResponse.json(
      { error: "Failed to download EPUB file from Gutenberg mirrors." },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

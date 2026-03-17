import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import re

# ── Domain → (category, base_tags) ──────────────────────────────────────────
DOMAIN_TAG_MAP = {
    "github.com":              ("code",         ["github", "repository"]),
    "gitlab.com":              ("code",         ["gitlab", "repository"]),
    "stackoverflow.com":       ("code",         ["stackoverflow", "qa"]),
    "youtube.com":             ("video",        ["youtube"]),
    "youtu.be":                ("video",        ["youtube"]),
    "vimeo.com":               ("video",        ["vimeo"]),
    "twitter.com":             ("social",       ["twitter"]),
    "x.com":                   ("social",       ["twitter"]),
    "reddit.com":              ("social",       ["reddit"]),
    "medium.com":              ("article",      ["medium", "blog"]),
    "dev.to":                  ("article",      ["dev.to", "blog"]),
    "hashnode.com":            ("article",      ["blog"]),
    "substack.com":            ("article",      ["newsletter"]),
    "news.ycombinator.com":    ("article",      ["hackernews"]),
    "arxiv.org":               ("research",     ["paper", "arxiv"]),
    "scholar.google.com":      ("research",     ["paper"]),
    "npmjs.com":               ("code",         ["npm", "package"]),
    "pypi.org":                ("code",         ["python", "package"]),
    "docs.python.org":         ("docs",         ["docs", "python"]),
    "developer.mozilla.org":   ("docs",         ["docs", "mdn", "web"]),
    "reactjs.org":             ("docs",         ["docs", "react"]),
    "react.dev":               ("docs",         ["docs", "react"]),
    "figma.com":               ("design",       ["figma"]),
    "dribbble.com":            ("design",       ["dribbble"]),
    "notion.so":               ("productivity", ["notion"]),
    "wikipedia.org":           ("reference",    ["wikipedia"]),
    "udemy.com":               ("learning",     ["course", "udemy"]),
    "coursera.org":            ("learning",     ["course"]),
    "linkedin.com":            ("social",       ["linkedin"]),
    "instagram.com":           ("social",       ["instagram", "insta"]),
    "instagr.am":              ("social",       ["instagram", "insta"]),
    "anthropic.com":           ("article",      ["anthropic", "ai"]),
    "openai.com":              ("article",      ["openai", "ai"]),
    "roadmap.sh":              ("learning",     ["roadmap"]),
    "freecodecamp.org":        ("learning",     ["freecodecamp"]),
    "w3schools.com":           ("docs",         ["docs", "web"]),
    "geeksforgeeks.org":       ("article",      ["geeksforgeeks"]),
    "towardsdatascience.com":  ("article",      ["data-science", "blog"]),
}

# ── File extension → (category, tags) ────────────────────────────────────────
FILE_TYPE_TAGS = {
    ".pdf":  ("document", ["pdf", "document"]),
    ".doc":  ("document", ["doc", "document"]),
    ".docx": ("document", ["docx", "document"]),
    ".xls":  ("document", ["spreadsheet", "excel"]),
    ".xlsx": ("document", ["spreadsheet", "excel"]),
    ".ppt":  ("document", ["presentation", "powerpoint"]),
    ".pptx": ("document", ["presentation", "powerpoint"]),
    ".mp4":  ("video",    ["video", "mp4"]),
    ".mov":  ("video",    ["video", "mov"]),
    ".avi":  ("video",    ["video", "avi"]),
    ".mp3":  ("audio",    ["audio", "mp3"]),
    ".wav":  ("audio",    ["audio", "wav"]),
    ".png":  ("image",    ["image", "png"]),
    ".jpg":  ("image",    ["image", "jpg"]),
    ".jpeg": ("image",    ["image", "jpeg"]),
    ".gif":  ("image",    ["image", "gif"]),
    ".svg":  ("image",    ["image", "svg"]),
    ".py":   ("code",     ["code", "python"]),
    ".js":   ("code",     ["code", "javascript"]),
    ".ts":   ("code",     ["code", "typescript"]),
    ".go":   ("code",     ["code", "golang"]),
    ".rs":   ("code",     ["code", "rust"]),
    ".java": ("code",     ["code", "java"]),
    ".cpp":  ("code",     ["code", "cpp"]),
    ".c":    ("code",     ["code", "c"]),
    ".cs":   ("code",     ["code", "csharp"]),
    ".rb":   ("code",     ["code", "ruby"]),
    ".php":  ("code",     ["code", "php"]),
    ".zip":  ("archive",  ["archive", "zip"]),
    ".tar":  ("archive",  ["archive", "tar"]),
    ".gz":   ("archive",  ["archive", "gz"]),
    ".ipynb":("code",     ["code", "jupyter", "notebook"]),
    ".md":   ("document", ["markdown", "document"]),
    ".sh":   ("code",     ["code", "bash", "shell"]),
    ".sql":  ("code",     ["code", "sql"]),
}

# ── Content-type keywords (checked in title/description) ─────────────────────
CONTENT_TYPE_KEYWORDS = {
    "tutorial":           "tutorial",
    "guide":              "guide",
    "cheatsheet":         "cheatsheet",
    "cheat sheet":        "cheatsheet",
    "roadmap":            "roadmap",
    "interview":          "interview",
    "course":             "course",
    "beginner":           "beginner",
    "beginners":          "beginner",
    "advanced":           "advanced",
    "introduction":       "intro",
    "intro":              "intro",
    "crash course":       "crash-course",
    "full course":        "full-course",
    "explained":          "explained",
    "overview":           "overview",
    "recap":              "recap",
    "tips":               "tips",
    "tricks":             "tips",
    "news":               "news",
    "announcement":       "announcement",
    "introducing":        "announcement",
    "launches":           "announcement",
    "release":            "release",
    "released":           "release",
    "open source":        "open-source",
    "free":               "free",
    "project":            "project",
    "portfolio":          "portfolio",
    "career":             "career",
    "job":                "job",
    "hiring":             "hiring",
    "podcast":            "podcast",
    "newsletter":         "newsletter",
    "paper":              "paper",
    "research":           "research",
    "review":             "review",
    "comparison":         "comparison",
    "vs":                 "comparison",
    "benchmark":          "benchmark",
    "awesome":            "awesome-list",
    "cheatsheet":         "cheatsheet",
    "documentation":      "docs",
    "docs":               "docs",
    "api":                "api",
    "library":            "library",
    "framework":          "framework",
    "tool":               "tool",
    "tools":              "tool",
    "plugin":             "plugin",
    "extension":          "extension",
    "template":           "template",
    "boilerplate":        "boilerplate",
}

# ── Tech terms to detect in text ─────────────────────────────────────────────
# Order matters: longer/more specific phrases first
TECH_TERMS = [
    # AI / LLM  (check before short words like "ai")
    ("machine learning",       "machine-learning"),
    ("deep learning",          "deep-learning"),
    ("natural language processing", "nlp"),
    ("large language model",   "llm"),
    ("reinforcement learning", "reinforcement-learning"),
    ("computer vision",        "computer-vision"),
    ("neural network",         "neural-network"),
    ("generative ai",          "generative-ai"),
    ("stable diffusion",       "stable-diffusion"),
    ("prompt engineering",     "prompt-engineering"),
    ("retrieval augmented",    "rag"),
    ("fine.?tuning",           "fine-tuning"),
    ("vector database",        "vector-db"),
    ("function calling",       "function-calling"),

    # Companies / Models
    ("anthropic",   "anthropic"),
    ("openai",      "openai"),
    ("claude",      "claude"),
    ("chatgpt",     "chatgpt"),
    ("gpt-4o",      "gpt-4o"),
    ("gpt-4",       "gpt-4"),
    ("gpt-3",       "gpt-3"),
    ("gemini",      "gemini"),
    ("mistral",     "mistral"),
    ("llama",       "llama"),
    ("langchain",   "langchain"),
    ("hugging face","huggingface"),
    ("huggingface", "huggingface"),
    ("tensorflow",  "tensorflow"),
    ("pytorch",     "pytorch"),
    ("scikit.learn","sklearn"),
    ("keras",       "keras"),

    # Languages (be careful: "r " needs word boundary)
    ("typescript",  "typescript"),
    ("javascript",  "javascript"),
    ("python",      "python"),
    ("golang",      "golang"),
    ("kotlin",      "kotlin"),
    ("flutter",     "flutter"),
    ("swift",       "swift"),
    ("scala",       "scala"),
    ("haskell",     "haskell"),
    ("rust",        "rust"),
    ("java",        "java"),
    ("ruby",        "ruby"),
    ("php",         "php"),
    ("bash",        "bash"),
    ("shell",       "shell"),
    ("sql",         "sql"),
    ("html",        "html"),
    ("css",         "css"),
    ("c\\+\\+",     "cpp"),
    ("c#",          "csharp"),

    # Web / Frontend
    ("next\\.?js",  "nextjs"),
    ("nuxt\\.?js",  "nuxtjs"),
    ("react",       "react"),
    ("angular",     "angular"),
    ("vue\\.?js",   "vuejs"),
    ("svelte",      "svelte"),
    ("tailwind",    "tailwind"),
    ("webpack",     "webpack"),
    ("vite",        "vite"),
    ("graphql",     "graphql"),
    ("rest api",    "rest-api"),
    ("websocket",   "websocket"),
    ("web3",        "web3"),

    # Backend / Infra
    ("spring boot", "spring-boot"),
    ("spring",      "spring"),
    ("fastapi",     "fastapi"),
    ("django",      "django"),
    ("flask",       "flask"),
    ("express\\.?js","expressjs"),
    ("node\\.?js",  "nodejs"),
    ("nest\\.?js",  "nestjs"),
    ("laravel",     "laravel"),
    ("rails",       "rails"),
    ("microservice","microservices"),
    ("serverless",  "serverless"),
    ("kubernetes",  "kubernetes"),
    ("docker",      "docker"),
    ("terraform",   "terraform"),
    ("ansible",     "ansible"),
    ("devops",      "devops"),
    ("ci/cd",       "ci-cd"),
    ("linux",       "linux"),
    ("nginx",       "nginx"),

    # Cloud
    ("aws",         "aws"),
    ("azure",       "azure"),
    ("google cloud","gcp"),
    ("gcp",         "gcp"),
    ("firebase",    "firebase"),
    ("supabase",    "supabase"),
    ("vercel",      "vercel"),
    ("netlify",     "netlify"),

    # Databases
    ("postgresql",  "postgresql"),
    ("postgres",    "postgresql"),
    ("mongodb",     "mongodb"),
    ("redis",       "redis"),
    ("mysql",       "mysql"),
    ("sqlite",      "sqlite"),
    ("elasticsearch","elasticsearch"),
    ("dynamodb",    "dynamodb"),
    ("prisma",      "prisma"),

    # Mobile
    ("android",     "android"),
    ("ios",         "ios"),
    ("react native","react-native"),
    ("xamarin",     "xamarin"),

    # Security
    ("cybersecurity","cybersecurity"),
    ("penetration testing","pentesting"),
    ("hacking",     "hacking"),
    ("vulnerability","security"),
    ("encryption",  "encryption"),
    ("zero.day",    "zero-day"),

    # Data
    ("data science","data-science"),
    ("data engineering","data-engineering"),
    ("pandas",      "pandas"),
    ("numpy",       "numpy"),
    ("spark",       "spark"),
    ("airflow",     "airflow"),
    ("dbt",         "dbt"),

    # Blockchain
    ("blockchain",  "blockchain"),
    ("solidity",    "solidity"),
    ("ethereum",    "ethereum"),
    ("bitcoin",     "bitcoin"),
    ("defi",        "defi"),
    ("nft",         "nft"),

    # Other notable companies
    ("nvidia",      "nvidia"),
    ("microsoft",   "microsoft"),
    ("google",      "google"),
    ("meta",        "meta"),
    ("apple",       "apple"),
    ("amazon",      "amazon"),
    ("tesla",       "tesla"),
    ("spacex",      "spacex"),
    ("openai",      "openai"),
    ("github",      "github"),
]

# ── Stop words (filter from freeform extraction) ─────────────────────────────
STOP_WORDS = {
    "the","a","an","and","or","but","in","on","at","to","for","of","with",
    "by","from","up","about","into","is","are","was","were","be","been",
    "have","has","had","do","does","did","will","would","could","should",
    "this","that","these","those","i","you","he","she","it","we","they",
    "what","which","who","when","where","why","how","all","each","every",
    "both","few","more","most","other","some","such","no","not","only",
    "own","same","so","than","too","very","just","can","also","new","get",
    "use","make","know","take","see","come","your","our","their","my",
    "as","if","then","because","while","its","any","now","even","well",
    "way","time","year","day","man","world","life","work","part","place",
    "today","show","using","used","learn","best","top","first","need",
    "want","give","think","look","help","start","find","much","let","go",
    "said","play","run","move","live","say","set","must","add","try",
    "ask","seem","turn","feel","read","keep","hold","bring","build","fall",
    "pay","meet","include","continue","cover","watch","follow","stop",
    "create","open","lead","understand","develop","write","page","post",
    "site","web","app","user","official","click","subscribe","like","here",
    "there","back","long","great","good","big","high","small","next",
    "full","free","online","into","through","over","after","before",
    "between","under","again","further","then","once","per","without",
    "within","during","against","around","behind","beyond","along",
    "across","among","throughout","toward","onto","off","out","own",
    "those","being","above","below","still","already","never","always",
    "sometimes","often","usually","recently","soon","later","early",
    "just","yet","already","however","therefore","moreover","thus",
    "hence","meanwhile","instead","otherwise","anyway","nevertheless",
}


def _extract_tech_tags(text: str) -> list[str]:
    """Scan text for known tech terms and return matched tags."""
    found = []
    text_lower = text.lower()
    for pattern, tag in TECH_TERMS:
        if re.search(r'\b' + pattern + r'\b', text_lower, re.IGNORECASE):
            found.append(tag)
    return found


def _extract_content_type_tags(text: str) -> list[str]:
    """Detect content-type keywords (tutorial, guide, etc.)."""
    found = []
    text_lower = text.lower()
    for keyword, tag in CONTENT_TYPE_KEYWORDS.items():
        if keyword in text_lower and tag not in found:
            found.append(tag)
    return found


def _extract_meta_keywords(soup: BeautifulSoup) -> list[str]:
    """Pull from <meta name="keywords"> if present."""
    tag = soup.find("meta", attrs={"name": "keywords"})
    if not tag or not tag.get("content"):
        return []
    raw = [k.strip().lower() for k in tag["content"].split(",") if k.strip()]
    # keep only short, meaningful ones (not full sentences)
    return [k for k in raw if 2 < len(k) < 30 and " " not in k or len(k.split()) <= 2][:6]


def _extract_title_keywords(title: str) -> list[str]:
    """Pull non-stop meaningful words from the title."""
    words = re.findall(r"[a-zA-Z0-9][\w\-\.]*[a-zA-Z0-9]|[a-zA-Z]{3,}", title)
    result = []
    for w in words:
        w_low = w.lower()
        if (
            w_low not in STOP_WORDS
            and len(w_low) >= 3
            and not re.fullmatch(r'[\d\.\-]+', w_low)   # skip pure version nums
            and w_low not in result
        ):
            result.append(w_low)
    return result[:6]


async def fetch_url_metadata(url: str) -> dict:
    """Fetch title, description, favicon, thumbnail + smart auto-tags."""
    result = {
        "title":       url,
        "description": None,
        "favicon":     None,
        "thumbnail":   None,
        "tags":        [],
        "category":    None,
    }

    soup = None
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        }
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            html = response.text

        soup = BeautifulSoup(html, "html.parser")

        # Title
        og_title   = soup.find("meta", property="og:title")
        title_tag  = soup.find("title")
        if og_title and og_title.get("content"):
            result["title"] = og_title["content"].strip()
        elif title_tag:
            result["title"] = title_tag.get_text(strip=True)

        # Description
        og_desc    = soup.find("meta", property="og:description")
        meta_desc  = soup.find("meta", attrs={"name": "description"})
        if og_desc and og_desc.get("content"):
            result["description"] = og_desc["content"].strip()
        elif meta_desc and meta_desc.get("content"):
            result["description"] = meta_desc["content"].strip()

        # Thumbnail
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            result["thumbnail"] = og_image["content"]

        # Favicon
        parsed = urlparse(url)
        base   = f"{parsed.scheme}://{parsed.netloc}"
        icon_link = (
            soup.find("link", rel="icon")
            or soup.find("link", rel="shortcut icon")
            or soup.find("link", rel=lambda v: v and "icon" in v)
        )
        if icon_link and icon_link.get("href"):
            href = icon_link["href"]
            if href.startswith("http"):
                result["favicon"] = href
            elif href.startswith("//"):
                result["favicon"] = f"{parsed.scheme}:{href}"
            else:
                result["favicon"] = base + ("/" if not href.startswith("/") else "") + href
        else:
            result["favicon"] = f"{base}/favicon.ico"

    except Exception:
        pass

    # ── Auto-tagging ──────────────────────────────────────────────────────────
    all_tags: list[str] = []

    # 1. Domain-based category + base tags
    try:
        parsed  = urlparse(url)
        domain  = parsed.netloc.replace("www.", "")
        for key, (cat, base_tags) in DOMAIN_TAG_MAP.items():
            if key in domain:
                result["category"] = result["category"] or cat
                all_tags.extend(base_tags)
                break
    except Exception:
        pass

    # Build combined text for scanning
    combined_text = " ".join(filter(None, [
        result.get("title", ""),
        result.get("description", ""),
    ]))

    # 2. Tech terms from title + description
    all_tags.extend(_extract_tech_tags(combined_text))

    # 3. Content-type keywords (tutorial, guide, interview…)
    all_tags.extend(_extract_content_type_tags(combined_text))

    # 4. Meta keywords from the page
    if soup:
        all_tags.extend(_extract_meta_keywords(soup))

    # 5. Meaningful title words (as fallback for unrecognised proper nouns)
    title_kw = _extract_title_keywords(result.get("title", ""))
    # only add if not already covered
    existing = {t.lower() for t in all_tags}
    for kw in title_kw:
        if kw not in existing and kw not in STOP_WORDS:
            all_tags.append(kw)

    # Deduplicate, keep order, cap at 12
    seen = set()
    clean = []
    for t in all_tags:
        t = t.strip().lower()
        if t and t not in seen:
            seen.add(t)
            clean.append(t)

    result["tags"] = clean[:12]
    return result


def auto_tag_file(filename: str) -> tuple[str | None, list[str]]:
    """Return (category, tags) for an uploaded filename."""
    import os
    ext = os.path.splitext(filename)[1].lower()
    if ext in FILE_TYPE_TAGS:
        return FILE_TYPE_TAGS[ext]
    return None, []

# Future Improvements for Article Monster

## 🖼️ Cover Image Generation for Kindle Display

**Priority**: Medium
**Impact**: High (Better user experience on Kindle)

### Problem
Currently our EPUBs don't have cover images. When you close a Kindle while reading an article, it just shows generic text. FiveFilters articles show beautifully formatted article titles as cover images.

### Solution
Generate dynamic cover images for each article that include:
- Article title (properly wrapped and formatted)
- Publication name (The Atlantic, New Yorker, etc.)
- Author name
- Date
- Clean, readable typography
- Consistent branding

### Implementation Options
1. **Canvas/Node.js**: Use `canvas` npm package to generate PNG covers server-side
2. **SVG to PNG**: Generate SVG templates and convert to PNG
3. **Image Templates**: Pre-made templates with text overlays

### Technical Requirements
- Install image generation library (`canvas` or `sharp`)
- Create cover generation function in EPUB pipeline
- Handle text wrapping for long titles
- Ensure high DPI for Kindle displays (300+ DPI)
- Keep file sizes reasonable

### Example Implementation
```javascript
async function generateCover(article) {
  const canvas = createCanvas(600, 800); // Kindle-appropriate dimensions
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, 600, 800);
  
  // Title
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 48px Georgia';
  wrapText(ctx, article.title, 50, 200, 500, 60);
  
  // Author & source
  ctx.font = '24px Georgia';
  ctx.fillText(article.byline, 50, 600);
  ctx.fillText(article.siteName, 50, 650);
  
  return canvas.toBuffer('image/png');
}
```

### Benefits
- Professional appearance on Kindle devices
- Better visual identification of articles in library
- Matches FiveFilters quality
- Enhanced user experience

---

## 📚 Table of Contents Removal Investigation

**Priority**: Low (cosmetic issue)
**Status**: Needs Research

### Problem
EPUBs currently show an unwanted TOC page with entries like "1. --" and "2. Article Title". This is unnecessary for single-article EPUBs.

### Research Areas
1. **epub-gen Library Deep Dive**
   - Examine source code for TOC generation logic
   - Find proper configuration options beyond `tocTitle: null`
   - Test different content structure approaches

2. **Alternative EPUB Libraries**
   - `epub3-writer` - More modern, better maintained
   - `nodepub` - Simpler API, might have better TOC control
   - `epub-maker` - Lightweight alternative
   - Custom implementation using JSZip

3. **Post-Processing Approach**
   - Extract EPUB (it's a ZIP file)
   - Remove/modify `toc.ncx` and `content.opf` files
   - Re-zip the modified EPUB
   - Pros: Works with any library
   - Cons: More complex, potential corruption risk

### Implementation Ideas
```javascript
// Option 1: Post-process EPUB
async function removeTocFromEpub(epubBuffer) {
  const zip = new JSZip();
  await zip.loadAsync(epubBuffer);
  
  // Remove TOC files
  zip.remove('toc.ncx');
  zip.remove('nav.xhtml');
  
  // Modify content.opf to remove TOC references
  const contentOpf = await zip.file('content.opf').async('string');
  const modifiedOpf = contentOpf.replace(/<item.*toc.*\/>/g, '');
  zip.file('content.opf', modifiedOpf);
  
  return zip.generateAsync({type: 'nodebuffer'});
}

// Option 2: Try different epub-gen options
const options = {
  // ...existing options
  tocTitle: false,
  ignoreOriginalToc: true,
  generateContents: false,
  // Test these undocumented options
};
```

### Why This is Low Priority
- TOC doesn't affect reading experience significantly
- Content is still accessible and readable
- Other improvements (images, covers) have higher impact
- Risk of breaking working functionality

## 🎨 Typography Improvements

**Status**: In Progress (safe CSS-only changes)

### Completed Issues
- ✅ Cramped headline spacing fixed with CSS margins
- ✅ Better line heights for readability

### Typography Enhancement Options

**1. Font Improvements**
```css
/* Option A: System font stack with fallbacks */
font-family: "Palatino", "Book Antiqua", "Times New Roman", Georgia, serif;

/* Option B: Web font embedding */
@import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
font-family: "Crimson Text", Georgia, serif;

/* Option C: Modern system fonts */
font-family: "Charter", "Bitstream Charter", "Sitka Text", Cambria, serif;
```

**2. Advanced Typography Features**
```css
/* Enable ligatures and kerning */
font-feature-settings: "liga" 1, "kern" 1;
text-rendering: optimizeLegibility;

/* Better number styling */
font-variant-numeric: oldstyle-nums;

/* Drop caps for first paragraph */
.content p:first-of-type::first-letter {
  float: left;
  font-size: 3.5em;
  line-height: 0.8;
  margin: 0.1em 0.1em 0 0;
  color: #3498db;
}

/* Better quote styling */
blockquote {
  font-family: "Palatino", Georgia, serif;
  font-style: italic;
  font-size: 1.1em;
  border-left: 4px solid #3498db;
  padding-left: 2em;
  margin: 2em 0;
  position: relative;
}

blockquote::before {
  content: """;
  font-size: 4em;
  color: #3498db;
  position: absolute;
  left: 0.2em;
  top: -0.5em;
}
```

**3. Headline Typography**
```css
/* Sophisticated headline stack */
h1 {
  font-family: "Playfair Display", "Times New Roman", serif;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-wrap: balance; /* New CSS feature for better line breaks */
}

/* Subheading hierarchy */
h2 {
  font-family: "Source Sans Pro", "Helvetica Neue", sans-serif;
  font-weight: 600;
  color: #2c3e50;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.9em;
}
```

**4. Responsive & Accessible Typography**
```css
/* Fluid typography that scales with device */
body {
  font-size: clamp(16px, 2.5vw, 20px);
  line-height: calc(1.4 + 0.5vw);
}

/* Better contrast and spacing */
.content {
  max-width: 65ch; /* Optimal reading line length */
  color: #1a1a1a; /* Better contrast than #333 */
}
```

### Immediate Implementation Options
1. **Safe upgrade**: Better system font stack (Palatino → Georgia fallback)
2. **Medium upgrade**: Embed 1-2 Google Fonts for headlines and body
3. **Advanced upgrade**: Full typographic system with drop caps, better quotes, etc.

### Benefits
- **Professional appearance** matching high-end publications
- **Better readability** with fonts designed for long-form reading  
- **Visual hierarchy** making articles easier to scan
- **Brand consistency** with distinctive typography choices

---

## 📚 Additional Future Enhancements

### Image Embedding Improvements
- Base64 embedding for authenticated sites
- Image optimization/compression
- Fallback to article screenshots

### Enhanced Metadata
- Publisher logos
- Publication date formatting
- Reading progress indicators

### Multi-format Support
- MOBI generation for older Kindles
- PDF export option
- Plain text format

### Content Enhancement
- Table of contents for long articles
- Footnote support
- Citation formatting
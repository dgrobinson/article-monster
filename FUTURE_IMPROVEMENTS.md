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

### Remaining Improvements
- Better paragraph spacing
- Enhanced metadata section styling
- Improved subheading hierarchy

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
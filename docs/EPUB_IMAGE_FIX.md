# EPUB Image Fix Implementation Plan

## Problem Analysis
The core issue is an authentication mismatch between client-side extraction and server-side EPUB generation:
- **Client-side** (bookmarklet): Has full access to authenticated images via browser cookies
- **Server-side** (epub-gen): Cannot access auth-protected images when generating EPUB

## Phased Implementation Approach

### Phase 1: URL Fixing (Immediate - 5 min fix)
**Goal**: Fix relative URLs to ensure public images work correctly

**Implementation**:
```javascript
// Add to bookmarklet.js after article extraction
function fixImageUrls(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const baseUrl = window.location.origin;
  
  div.querySelectorAll('img').forEach(img => {
    // Fix relative URLs to absolute
    if (!img.src.startsWith('http')) {
      img.src = new URL(img.src, baseUrl).href;
    }
    // Also fix srcset for responsive images
    if (img.srcset) {
      img.srcset = img.srcset.split(',').map(src => {
        const [url, descriptor] = src.trim().split(' ');
        if (!url.startsWith('http')) {
          return new URL(url, baseUrl).href + (descriptor ? ' ' + descriptor : '');
        }
        return src;
      }).join(', ');
    }
  });
  
  return div.innerHTML;
}
```

**Benefits**:
- Fixes all public site images immediately
- No performance impact
- No payload size increase

### Phase 2: Critical Image Embedding (If Phase 1 insufficient)
**Goal**: Embed important images as base64 to preserve authenticated content

**Implementation**:
```javascript
// Add to bookmarklet.js
async function embedCriticalImages(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const images = div.querySelectorAll('img');
  
  // Only process first 3 images between 50KB-500KB
  let processedCount = 0;
  for (let img of images) {
    if (processedCount >= 3) break;
    
    try {
      const response = await fetch(img.src);
      const blob = await response.blob();
      
      // Skip tiny images (icons) and huge images (performance)
      if (blob.size < 50000 || blob.size > 500000) continue;
      
      const reader = new FileReader();
      const base64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      
      img.src = base64;
      processedCount++;
    } catch (e) {
      console.warn('Failed to embed image:', img.src);
    }
  }
  
  return div.innerHTML;
}
```

**Benefits**:
- Preserves key images from authenticated sites
- Limited to 3 images to maintain performance
- Smart filtering avoids tracking pixels and huge files
- Graceful fallback for remaining images

### Phase 3: Monitoring & Optimization (Optional future enhancement)
**Goal**: Track success rates and optimize thresholds

**Potential Enhancements**:
- Add telemetry for image success/failure rates
- Adjust size thresholds based on real usage
- Consider WebP conversion for smaller sizes
- Add user preference for image quality/quantity tradeoff

## Implementation Steps

1. **Test Current State** (5 min)
   - Test with WSJ/Atlantic article to confirm images missing
   - Check browser console for image URLs in extracted content

2. **Implement Phase 1** (10 min)
   - Add `fixImageUrls` function to bookmarklet
   - Call it on extracted content before sending to server
   - Deploy and test with public sites (BBC, NPR, etc.)

3. **Evaluate Phase 1 Results** (10 min)
   - Test with various sites
   - Document which sites now work
   - Identify if auth sites still need Phase 2

4. **Implement Phase 2 if Needed** (20 min)
   - Add `embedCriticalImages` function
   - Integrate with extraction flow
   - Test payload sizes and performance

5. **Production Deployment** (5 min)
   - Push to GitHub
   - Auto-deploy to DigitalOcean
   - Test in production environment

## Success Criteria
- ✅ Public site images appear in EPUBs
- ✅ At least hero/primary images from auth sites preserved
- ✅ No significant performance degradation
- ✅ Payload size remains under 10MB for typical articles

## Alternative Approaches Considered (Not Recommended)
1. **Cookie Forwarding**: Security risk, complex implementation
2. **Server-side Proxy**: Doesn't solve auth problem
3. **Full Base64 Conversion**: Too large payloads, memory issues
4. **Separate Image Upload**: Too complex for bookmarklet
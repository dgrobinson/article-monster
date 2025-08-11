# Metadata Extraction Roadmap

## Overview
This document outlines potential future improvements for bibliographic metadata extraction in Article Monster, particularly for enhancing Zotero citation quality and academic research workflows.

## Current State (August 2025)
✅ **Completed Enhancements:**
- Enhanced metadata selectors (Twitter Cards, Dublin Core, Schema.org)
- DOM-based fallbacks for author and date extraction
- Intelligent author name parsing (first/last name splitting)
- Multiple author support
- Relative-to-absolute URL conversion for images
- Improved filename formatting (Proper-Case-With-Hyphens)

## Future Enhancement Opportunities

### 1. Academic Metadata Extraction
**Priority: High** - Essential for research workflows

#### DOI Detection
- **Goal**: Extract Digital Object Identifiers when available
- **Implementation Ideas**:
  - Check meta tags: `meta[name="citation_doi"]`, `meta[name="dc.identifier"]`
  - Search for DOI patterns in page: `/10\.\d{4,}\/[-._;()\/:a-zA-Z0-9]+/`
  - Check URL patterns (many journals include DOI in URL)
  - Look for DOI badges/widgets commonly used by publishers
- **Benefits**: 
  - Automatic citation retrieval from CrossRef
  - Perfect metadata for academic papers
  - Deduplication in Zotero

#### Journal/Publication Detection
- **Goal**: Identify academic journal names and publication details
- **Implementation Ideas**:
  - Check `meta[name="citation_journal_title"]`
  - Parse publication info from `meta[name="citation_publication_date"]`
  - Extract volume/issue from `meta[name="citation_volume"]` and `citation_issue`
  - Detect common journal website patterns
- **Benefits**:
  - Proper journal article citations
  - Better organization in Zotero

#### Page Numbers & Article Numbers
- **Goal**: Extract page ranges or article numbers for citations
- **Implementation Ideas**:
  - Check `meta[name="citation_firstpage"]` and `citation_lastpage`
  - Look for article numbers in `meta[name="citation_article_number"]`
  - Parse from displayed citation strings on page
- **Benefits**:
  - Complete citations for academic work

### 2. Leverage Existing Metadata Extraction Tools
**Priority: High** - Avoid duplicating work, use proven solutions

#### Option A: Integrate Zotero's Embedded Metadata Translator
- **Goal**: Use Zotero's proven metadata extraction logic
- **Source**: [Zotero's Embedded Metadata.js](https://github.com/zotero/translators/blob/master/Embedded%20Metadata.js)
- **Advantages**:
  - Battle-tested across thousands of sites
  - Handles Dublin Core, OpenGraph, Schema.org, Citation metadata
  - Sophisticated author parsing and date handling
  - Built-in DOI cleaning and validation
- **Implementation Options**:
  - **Server-side**: Port Zotero translator to Node.js, run on extracted HTML
  - **Client-side**: Adapt translator logic for bookmarklet execution
  - **Hybrid**: Run basic extraction in bookmarklet, enhanced extraction server-side
- **Benefits**:
  - Immediate access to comprehensive metadata extraction
  - Community-maintained and constantly improved
  - Handles edge cases we haven't encountered

#### Option B: EPUB Metadata Analysis & Enhancement
- **Goal**: Extract and enhance metadata from generated EPUBs
- **Approach**: 
  - Generate EPUB with current extraction
  - Parse EPUB metadata using `epub-metadata-parser` npm package
  - Cross-reference with Zotero's embedded metadata extraction
  - Enhance missing fields through secondary extraction
- **Libraries**:
  - `epub-metadata-parser` - extracts Dublin Core metadata from EPUB
  - Could integrate with Zotero translator for comparison/enhancement
- **Benefits**:
  - Post-processing approach - less impact on bookmarklet performance
  - EPUB already contains structured metadata we can analyze
  - Can identify gaps and fill them systematically

#### Option C: Hybrid Approach (Recommended)
1. **Primary**: Integrate Zotero's Embedded Metadata translator logic into our extraction
2. **Secondary**: Use EPUB metadata analysis to identify and fill gaps
3. **Tertiary**: Maintain minimal site-specific rules only where absolutely necessary

### 3. Enhanced Author Processing
**Priority: Medium** - Improves citation quality

#### Author Role Detection
- **Goal**: Identify different contributor types
- **Implementation Ideas**:
  - Detect "Editor", "Translator", "Contributor" labels
  - Parse author roles from structured data
  - Support for institutional authors
- **Benefits**:
  - More accurate academic citations
  - Proper credit attribution

#### ORCID Integration
- **Goal**: Extract and store ORCID identifiers
- **Implementation Ideas**:
  - Check for ORCID meta tags
  - Look for ORCID badges/links
  - Store in Zotero's extra field
- **Benefits**:
  - Author disambiguation
  - Link to author's other works

### 4. Content-Type Intelligence
**Priority: Low** - Nice to have for better categorization

#### Automatic Item Type Detection
- **Goal**: Choose optimal Zotero item type beyond "webpage"
- **Detection Strategies**:
  - News article vs Blog post vs Academic article
  - Based on metadata, URL patterns, content analysis
  - Conference papers, preprints, reports
- **Benefits**:
  - Better organization in Zotero
  - Appropriate citation formats

#### Abstract vs Excerpt Intelligence
- **Goal**: Distinguish between actual abstracts and auto-generated excerpts
- **Implementation Ideas**:
  - Check for `meta[name="description"]` vs actual abstract tags
  - Detect "Abstract:" headings in content
  - Length and formatting analysis
- **Benefits**:
  - Higher quality abstracts in citations

### 5. Data Quality & Validation
**Priority: Low** - Improves reliability

#### Metadata Confidence Scoring
- **Goal**: Rate confidence in extracted metadata
- **Implementation Ideas**:
  - Score based on source (meta tag > DOM > inference)
  - Flag uncertain data for user review
  - Provide metadata source transparency
- **Benefits**:
  - User awareness of data quality
  - Opportunity for manual correction

#### Duplicate Detection
- **Goal**: Prevent duplicate entries in Zotero
- **Implementation Ideas**:
  - Check for existing items by URL, DOI, title
  - Warn user before creating duplicates
  - Option to update existing item
- **Benefits**:
  - Cleaner Zotero library
  - Avoided confusion

## Implementation Strategy

### Phase 1: Zotero Translator Integration (Next Session - Recommended)
1. **Extract Zotero's Embedded Metadata logic**:
   - Study the [Embedded Metadata.js translator](https://github.com/zotero/translators/blob/master/Embedded%20Metadata.js)
   - Port key functions to JavaScript (can run in both Node.js and browser)
   - Focus on: DOI extraction, author parsing, date handling, meta tag processing
   
2. **Integration approach**:
   - **Option A**: Add to bookmarklet (client-side) - gets full page access
   - **Option B**: Add to server (post-processing) - cleaner architecture
   - **Recommended**: Hybrid - critical metadata in bookmarklet, enhancement server-side

3. **Immediate benefits**:
   - DOI extraction from citation meta tags
   - Better author name parsing
   - Journal/publication metadata
   - Academic article detection

### Phase 2: EPUB Metadata Analysis (Future Session)
1. **Add EPUB metadata parsing**:
   - Install `epub-metadata-parser` npm package
   - Parse generated EPUB files to extract Dublin Core metadata
   - Compare extracted metadata with original article data
   
2. **Gap analysis and filling**:
   - Identify common metadata gaps
   - Re-extract missing fields from original HTML
   - Enhance EPUB metadata before sending to Zotero
   
3. **Quality validation**:
   - Cross-validate metadata between sources
   - Flag inconsistencies for manual review

### Phase 3: MCP Server Enhancements (Next Priority)
1. **Fix MCP Add Item Functionality**:
   - Currently fails with "Item creation failed"
   - May need Zotero API key write permissions check
   - Debug Zotero API response format requirements
   - Test with different item types (webpage, journalArticle, etc.)

### Phase 4: Refinement and Advanced Features (Long-term)
1. Metadata confidence scoring
2. ORCID support
3. Advanced author role detection
4. Custom overrides for problematic sites

## Testing Sites for Validation

### Academic Sites
- arXiv.org (preprints)
- pubmed.ncbi.nlm.nih.gov (medical)
- scholar.google.com (academic search)
- jstor.org (academic journals)
- sciencedirect.com (Elsevier journals)
- nature.com (Nature publications)
- science.org (Science publications)

### News Sites
- wsj.com (Wall Street Journal)
- nytimes.com (New York Times)
- theatlantic.com (The Atlantic)
- newyorker.com (The New Yorker)
- washingtonpost.com (Washington Post)
- economist.com (The Economist)

### Tech/Blog Sites
- medium.com (Mixed content)
- substack.com (Newsletter platform)
- dev.to (Developer articles)
- hackernews (ycombinator.com)
- arstechnica.com (Tech journalism)

## Success Metrics
- **Metadata Completeness**: % of extractions with all key fields
- **Author Accuracy**: Correct name parsing and attribution
- **DOI Hit Rate**: % of academic articles with DOI found
- **Duplicate Prevention**: Reduction in duplicate Zotero entries
- **User Satisfaction**: Fewer manual corrections needed

## Notes for Next Session
1. **Primary Focus**: Integrate Zotero's Embedded Metadata translator
   - This gives us battle-tested extraction logic without reinventing the wheel
   - Immediate gains in DOI extraction, author parsing, academic metadata
   - Community-maintained and constantly improving

2. **Implementation Decision**: Client-side vs Server-side
   - **Client-side advantage**: Access to full page DOM, user authentication context
   - **Server-side advantage**: Cleaner architecture, can process extracted HTML
   - **Recommendation**: Try client-side first for maximum metadata access

3. **Quick Wins to Implement**:
   - DOI extraction from citation meta tags (`meta[name="citation_doi"]`)
   - Journal metadata (`meta[name="citation_journal_title"]`, `citation_volume`, etc.)
   - Better author parsing with first/last name splitting
   - Academic vs news article detection

4. **EPUB Analysis as Secondary**:
   - After implementing Zotero translator integration
   - Use for quality validation and gap detection
   - Could help identify metadata that wasn't captured initially

5. **Avoid Duplicating FiveFilters Work**:
   - FiveFilters handles content extraction excellently
   - Focus on metadata that content extraction doesn't capture
   - Use their extracted content as input for metadata analysis

## Related Files
- `public/bookmarklet.js` - Main extraction logic
- `src/zoteroSender.js` - Zotero item creation
- `site-configs/` - FiveFilters extraction rules (content-focused)
- `CLAUDE.md` - Current issues and fixes
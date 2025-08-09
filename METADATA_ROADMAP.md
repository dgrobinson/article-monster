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

### 2. Site-Specific Extraction Rules
**Priority: Medium** - Improves reliability for popular sites

#### Integration with FiveFilters Configs
- **Goal**: Leverage existing site-specific extraction rules
- **Current Gap**: FiveFilters configs focus on content, not metadata
- **Implementation Ideas**:
  - Extend FiveFilters config format to include metadata selectors
  - Create supplementary metadata configs for popular sites
  - Build a metadata extraction registry
- **Target Sites** (most valuable):
  - **News**: WSJ, NYTimes, The Atlantic, New Yorker, WaPo
  - **Academic**: arXiv, PubMed, JSTOR, ScienceDirect
  - **Tech**: Medium, Substack, Dev.to, GitHub
  - **Magazines**: Wired, The Verge, Ars Technica

#### Custom Extraction Patterns
- **Goal**: Handle sites with non-standard metadata
- **Examples**:
  - Medium uses custom JSON-LD structures
  - Substack has unique author/date patterns
  - Academic preprint servers have specific formats
- **Implementation**: 
  - Site detection by domain
  - Custom extraction functions per site
  - Fallback to generic extraction

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

### Phase 1: Academic Essentials (Next Session)
1. DOI detection and extraction
2. Journal/publication metadata
3. Page numbers and article numbers
4. Test with academic sites (arXiv, PubMed, journal sites)

### Phase 2: Site-Specific Rules (Future)
1. Create metadata config format
2. Build configs for top 10 sites
3. Implement config loader in bookmarklet
4. Test and refine

### Phase 3: Advanced Features (Long-term)
1. Author role detection
2. ORCID support
3. Item type intelligence
4. Confidence scoring

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
1. Start with DOI extraction - highest value for academic users
2. Test current extraction quality on academic sites
3. Consider creating test suite with expected metadata
4. Evaluate whether to extend FiveFilters configs or create separate system
5. Assess effort vs benefit for each enhancement

## Related Files
- `public/bookmarklet.js` - Main extraction logic
- `src/zoteroSender.js` - Zotero item creation
- `site-configs/` - FiveFilters extraction rules (content-focused)
- `CLAUDE.md` - Current issues and fixes
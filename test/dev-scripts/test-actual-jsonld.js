// Test with the ACTUAL JSON-LD from New Yorker
const fs = require('fs');

// Read the actual New Yorker HTML
const html = fs.readFileSync('test-cases/solved/newyorker-baldwin.html', 'utf8');

// Extract the JSON-LD
const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
if (jsonLdMatch) {
  const jsonLd = JSON.parse(jsonLdMatch[1]);
  const articleBody = jsonLd.articleBody;
  
  console.log('JSON-LD articleBody analysis:');
  console.log('Total length:', articleBody.length);
  console.log('First 500 chars:', articleBody.substring(0, 500));
  console.log('\nNewline analysis:');
  
  // Check what kind of newlines exist
  const singleNewlines = (articleBody.match(/(?<!\n)\n(?!\n)/g) || []).length;
  const doubleNewlines = (articleBody.match(/\n\n/g) || []).length;
  const windowsNewlines = (articleBody.match(/\r\n/g) || []).length;
  
  console.log('Single newlines (\\n not followed/preceded by another):', singleNewlines);
  console.log('Double newlines (\\n\\n):', doubleNewlines);
  console.log('Windows newlines (\\r\\n):', windowsNewlines);
  
  // Show what's between paragraphs
  const firstParaEnd = articleBody.indexOf('congregation.');
  const secondParaStart = articleBody.indexOf('He could charm');
  
  if (firstParaEnd > -1 && secondParaStart > -1) {
    const between = articleBody.substring(firstParaEnd, secondParaStart);
    console.log('\nBetween first and second paragraph:');
    console.log('Raw:', JSON.stringify(between));
    console.log('Length:', between.length);
    
    // Show char codes
    console.log('Char codes:', Array.from(between).map(c => c.charCodeAt(0)));
  }
  
  // Test our fix
  function _textToHtml(text) {
    // Convert plain text to basic HTML with paragraph breaks
    // Many JSON-LD sources use single newlines between paragraphs
    // So we'll split on any newline and filter out empty results
    var paragraphs = text.split(/\n+/);  // Split on one or more newlines
    
    // Filter out empty paragraphs and convert to HTML
    return '<div>' + paragraphs
      .map(function(paragraph) {
        var trimmed = paragraph.trim();
        // Only create paragraph if it has substantial content (not just punctuation)
        return trimmed && trimmed.length > 1 ? '<p>' + trimmed + '</p>' : '';
      })
      .filter(Boolean)
      .join('\n') + '</div>';
  }
  
  const result = _textToHtml(articleBody);
  const pCount = (result.match(/<p>/g) || []).length;
  console.log('\nAfter _textToHtml:');
  console.log('Paragraph count:', pCount);
  console.log('First 1000 chars:', result.substring(0, 1000));
}
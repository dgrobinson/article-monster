// Test the paragraph fix
function _textToHtml(text) {
  // Convert plain text to basic HTML with paragraph breaks
  // First try splitting on double line breaks (standard markdown style)
  var paragraphs = text.split(/\n\s*\n/);
  
  // If we only get one paragraph, try splitting on single newlines
  // (some JSON-LD uses single newlines between paragraphs)
  if (paragraphs.length === 1) {
    paragraphs = text.split(/\n/);
  }
  
  // Filter out empty paragraphs and convert to HTML
  return '<div>' + paragraphs
    .map(function(paragraph) {
      var trimmed = paragraph.trim();
      return trimmed ? '<p>' + trimmed + '</p>' : '';
    })
    .filter(Boolean)
    .join('\n') + '</div>';
}

// Test with New Yorker style text (single newlines)
const newYorkerText = `Baldwin was high-strung and emotionally labile. He wasn't exactly charismatic—there was a strangeness about him which he did nothing to conceal—but he was magnetic.
He could charm, he could engage, and he could also rant. Some people who knew him thought that the ranting was an act.
Baldwin did not follow a healthy or a domestically stable life style. He chain-smoked, wrote all night, and drank his way through countless bottles of Johnnie Walker Scotch.`;

console.log('Testing with New Yorker style (single newlines):');
const result1 = _textToHtml(newYorkerText);
console.log('Result:', result1);
console.log('Number of <p> tags:', (result1.match(/<p>/g) || []).length);

// Test with standard markdown style (double newlines)
const markdownText = `First paragraph here with some text.

Second paragraph here with more text.

Third paragraph here with final text.`;

console.log('\n\nTesting with markdown style (double newlines):');
const result2 = _textToHtml(markdownText);
console.log('Result:', result2);
console.log('Number of <p> tags:', (result2.match(/<p>/g) || []).length);
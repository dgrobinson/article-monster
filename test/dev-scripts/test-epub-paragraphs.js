const Epub = require('epub-gen');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');

async function test() {
  const testContent = '<p>First paragraph here.</p>\n<p>Second paragraph here.</p>\n<p>Third paragraph here.</p>';
  
  console.log('Input content:');
  console.log(testContent);
  console.log('Has 3 <p> tags:', (testContent.match(/<p>/g) || []).length);
  
  const options = {
    title: 'Test Paragraphs',
    author: 'Test',
    output: '/tmp/test-paragraphs.epub',
    content: [
      {
        title: 'Test Chapter',
        data: `<div class="content">${testContent}</div>`
      }
    ],
    tempDir: '/tmp',
    verbose: false
  };
  
  const epub = new Epub(options);
  await epub.promise;
  
  // Now unzip and check the output
  const { execSync } = require('child_process');
  const unzipDir = await fs.mkdtemp(path.join(os.tmpdir(), 'epub-test-'));
  execSync(`unzip -o -q ${options.output} -d ${unzipDir}`);
  
  const content = await fs.readFile(path.join(unzipDir, 'OEBPS', '0_test-chapter.xhtml'), 'utf8');
  
  console.log('\nOutput content structure:');
  const pCount = (content.match(/<p>/g) || []).length;
  console.log('Has <p> tags:', pCount);
  
  // Show how the paragraphs appear
  const contentSection = content.match(/<div class="content">([\s\S]*?)<\/div>/);
  if (contentSection) {
    console.log('\nContent section:');
    console.log(contentSection[1].substring(0, 200));
  }
}

test().catch(console.error);

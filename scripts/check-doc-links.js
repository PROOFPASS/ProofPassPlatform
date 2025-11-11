#!/usr/bin/env node

/**
 * Check for broken links in markdown documentation files
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const PROJECT_ROOT = path.join(__dirname, '..');

async function checkDocumentationLinks() {
  console.log('\n📚 Checking documentation links...\n');

  // Find all markdown files (exclude node_modules)
  const mdFiles = await glob('**/*.md', {
    cwd: PROJECT_ROOT,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    absolute: true
  });

  let totalLinks = 0;
  let brokenLinks = 0;
  const issues = [];

  for (const file of mdFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(PROJECT_ROOT, file);

    // Match markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkText = match[1];
      const linkUrl = match[2];
      totalLinks++;

      // Skip external links (http, https, mailto, etc.)
      if (linkUrl.match(/^(https?|mailto|ftp|tel):/i)) {
        continue;
      }

      // Skip anchors within the same document
      if (linkUrl.startsWith('#')) {
        continue;
      }

      // Check internal file links
      const fileDir = path.dirname(file);
      let targetPath;

      // Remove anchor from URL if present
      const urlWithoutAnchor = linkUrl.split('#')[0];

      if (urlWithoutAnchor) {
        // Resolve relative path
        targetPath = path.resolve(fileDir, urlWithoutAnchor);

        // Check if file exists
        if (!fs.existsSync(targetPath)) {
          brokenLinks++;
          issues.push({
            file: relativePath,
            link: linkUrl,
            text: linkText,
            target: path.relative(PROJECT_ROOT, targetPath)
          });
        }
      }
    }
  }

  console.log(`📊 Summary:\n`);
  console.log(`  Total markdown files checked: ${mdFiles.length}`);
  console.log(`  Total links found: ${totalLinks}`);
  console.log(`  Broken links: ${brokenLinks}\n`);

  if (issues.length > 0) {
    console.log(`❌ Broken links found:\n`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.file}`);
      console.log(`   Link: "${issue.text}" -> ${issue.link}`);
      console.log(`   Target not found: ${issue.target}\n`);
    });
    return false;
  } else {
    console.log(`✅ No broken internal links found!\n`);
    return true;
  }
}

checkDocumentationLinks()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error checking links:', error);
    process.exit(1);
  });

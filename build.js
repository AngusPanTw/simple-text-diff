const fs = require('fs');
const path = require('path');

try {
    const indexHtml = fs.readFileSync('index.html', 'utf8');
    const styleCss = fs.readFileSync('style.css', 'utf8');
    const mainJs = fs.readFileSync('main.js', 'utf8');
    const diffJs = fs.readFileSync(path.join('node_modules', 'diff', 'dist', 'diff.js'), 'utf8');

    let offlineHtml = indexHtml;

    // Inject CSS
    // regex to match the link tag loosely
    const styleTag = `<style>\n${styleCss}\n</style>`;
    offlineHtml = offlineHtml.replace(/<link\s+rel="stylesheet"\s+href="style.css"\s*>/, styleTag);

    // Prepare Main JS
    // We need to replace the import line with const { diffLines, diffChars } = Diff;
    const modifiedMainJs = mainJs.replace("import { diffLines, diffChars } from 'diff';", "const { diffLines, diffChars } = Diff;");

    // Inject Scripts
    const scripts = `
    <script>
    ${diffJs}
    </script>
    <script>
    ${modifiedMainJs}
    </script>
    `;

    // regex to match the script tag loosely
    offlineHtml = offlineHtml.replace(/<script\s+type="module"\s+src="main.js"\s*><\/script>/, scripts);

    fs.writeFileSync('offline_diff.html', offlineHtml);
    console.log('offline_diff.html created successfully.');
} catch (error) {
    console.error('Error creating offline file:', error);
    process.exit(1);
}

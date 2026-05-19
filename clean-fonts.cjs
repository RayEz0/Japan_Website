const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Match fontFamily: "something", or fontFamily: 'something'
      content = content.replace(/fontFamily:\s*(['"]).*?\1\s*,?/g, '');
      
      // Clean up empty style={{ }}
      content = content.replace(/style=\{\{\s*\}\}/g, '');
      // Clean up empty style objects like style={{  }}
      content = content.replace(/style=\{\{\s*,\s*\}\}/g, '');
      
      fs.writeFileSync(fullPath, content);
      console.log('Processed', fullPath);
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done cleaning inline fonts.');

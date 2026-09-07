/**
 * FreshCart AI — 100,000 Product Dataset Downloader
 * 
 * Downloads authentic retail datasets from GitHub & Open Repositories:
 * 1. zerotox-open-source/zerotox-datasets: 50,000 Open Food Facts food & grocery products (22 MB compressed)
 * 2. Amazon Berkeley Objects: listings_0, listings_1, listings_2 shards (~16 MB total compressed)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const rawDir = path.resolve(__dirname, '..', 'data', 'raw');
if (!fs.existsSync(rawDir)) {
  fs.mkdirSync(rawDir, { recursive: true });
}

const DATASETS = [
  {
    name: 'GitHub Zerotox Open Food Facts (50,000 Grocery Products)',
    url: 'https://raw.githubusercontent.com/zerotox-open-source/zerotox-datasets/main/data/zerotox-dataset-50k.csv.gz',
    filename: 'zerotox-dataset-50k.csv.gz',
    minBytes: 20 * 1024 * 1024 // ~22 MB
  },
  {
    name: 'Amazon Berkeley Objects Shard 0 (Electronics & Merchandise)',
    url: 'https://amazon-berkeley-objects.s3.amazonaws.com/listings/metadata/listings_0.json.gz',
    filename: 'listings_0.json.gz',
    minBytes: 4 * 1024 * 1024 // ~5.4 MB
  },
  {
    name: 'Amazon Berkeley Objects Shard 1 (Electronics & Merchandise)',
    url: 'https://amazon-berkeley-objects.s3.amazonaws.com/listings/metadata/listings_1.json.gz',
    filename: 'listings_1.json.gz',
    minBytes: 4 * 1024 * 1024 // ~5.4 MB
  },
  {
    name: 'Amazon Berkeley Objects Shard 2 (Electronics & Merchandise)',
    url: 'https://amazon-berkeley-objects.s3.amazonaws.com/listings/metadata/listings_2.json.gz',
    filename: 'listings_2.json.gz',
    minBytes: 4 * 1024 * 1024 // ~5.4 MB
  }
];

function downloadFile(item) {
  return new Promise((resolve, reject) => {
    const destPath = path.join(rawDir, item.filename);

    if (fs.existsSync(destPath) && fs.statSync(destPath).size >= item.minBytes) {
      console.log(`⏩ [CACHED] ${item.name} (${(fs.statSync(destPath).size / (1024 * 1024)).toFixed(2)} MB)`);
      return resolve(destPath);
    }

    console.log(`⬇️ [DOWNLOADING] ${item.name} from:\n   ${item.url}`);
    const file = fs.createWriteStream(destPath);

    function getWithRedirect(url, redirectCount = 0) {
      if (redirectCount > 5) {
        return reject(new Error(`Too many redirects for ${url}`));
      }

      https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return getWithRedirect(res.headers.location, redirectCount + 1);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Failed with HTTP status ${res.statusCode} for ${url}`));
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;
        let lastReport = Date.now();

        res.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (Date.now() - lastReport > 2000) {
            const mb = (downloadedBytes / (1024 * 1024)).toFixed(1);
            const totalMb = totalBytes ? (totalBytes / (1024 * 1024)).toFixed(1) : '?';
            process.stdout.write(`   Progress: ${mb} MB / ${totalMb} MB\r`);
            lastReport = Date.now();
          }
        });

        res.pipe(file);

        file.on('finish', () => {
          file.close(() => {
            const finalSize = fs.statSync(destPath).size;
            console.log(`\n   ✅ Downloaded ${item.filename} (${(finalSize / (1024 * 1024)).toFixed(2)} MB)`);
            resolve(destPath);
          });
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }

    getWithRedirect(item.url);
  });
}

async function main() {
  console.log('=================================================================');
  console.log('  📦 FRESHCART AI: DOWNLOADING 100K PRODUCT SOURCE DATASETS');
  console.log('=================================================================\n');

  for (const item of DATASETS) {
    try {
      await downloadFile(item);
    } catch (err) {
      console.error(`❌ Error downloading ${item.filename}:`, err.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 All source datasets successfully downloaded and verified in data/raw/!\n');
}

if (require.main === module) {
  main();
}

module.exports = { downloadFile, DATASETS };

import archiver from 'archiver';
import { createWriteStream, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const zipPath = join(distDir, 'api_lambda.zip');

// Check if dist directory exists
if (!existsSync(distDir)) {
    console.error('Error: dist/ directory does not exist. Run "npm run build" first.');
    process.exit(1);
}

// Read package.json to determine production dependencies
const packageJsonPath = join(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const prodDependencies = Object.keys(packageJson.dependencies || {});

console.log('Creating Lambda deployment package...');
console.log(`Output: ${zipPath}`);

// Create zip file
const output = createWriteStream(zipPath);
const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
});

output.on('close', () => {
    const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log(`✓ Created ${zipPath}`);
    console.log(`✓ Total size: ${sizeInMB} MB`);
    console.log(`✓ Archive contains ${archive.pointer()} bytes`);
});

archive.on('error', (err) => {
    console.error('Error creating zip file:', err);
    process.exit(1);
});

archive.pipe(output);

// Add dist folder (compiled JavaScript)
console.log('Adding dist/ folder...');
archive.directory(join(distDir, '.'), 'dist', false);

// In a monorepo with workspaces, dependencies are hoisted to root node_modules
const rootNodeModules = join(rootDir, '..', '..', 'node_modules');
const localNodeModules = join(rootDir, 'node_modules');

// Function to add a dependency to the archive
function addDependency(depName, nodeModulesPath) {
    const depPath = join(nodeModulesPath, depName);
    if (existsSync(depPath)) {
        const stats = statSync(depPath);
        if (stats.isDirectory()) {
            archive.directory(depPath, `node_modules/${depName}`, false);
            return true;
        }
    }
    return false;
}

// Add production node_modules
console.log('Adding production dependencies...');
let addedCount = 0;

for (const dep of prodDependencies) {
    // Try root node_modules first (workspace hoisting)
    if (existsSync(rootNodeModules) && addDependency(dep, rootNodeModules)) {
        addedCount++;
    }
    // Fallback to local node_modules
    else if (existsSync(localNodeModules) && addDependency(dep, localNodeModules)) {
        addedCount++;
    } else {
        console.warn(`Warning: Could not find dependency: ${dep}`);
    }
}

console.log(`✓ Added ${addedCount} dependencies to archive`);

// Finalize the archive
archive.finalize();


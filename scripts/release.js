#!/usr/bin/env node
/**
 * @fileoverview Release script for JsonSuperSet
 *
 * This script:
 * 1. Checks if package.json version matches the published npm version
 * 2. If same, calculates the next version from conventional commits (or uses provided version)
 * 3. Updates package.json and package-lock.json
 * 4. Amends the last commit with version bump
 * 5. Creates a git tag and pushes to origin
 *
 * Usage:
 *   npm run release                    # Auto-calculate version from commits
 *   npm run release -- 2.0.0           # Use specific version
 *   npm run release -- --dry-run       # Preview without making changes
 *   npm run release -- 2.0.0 --dry-run # Preview specific version
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packagePath = path.resolve(__dirname, '../package.json');
const dryRun = process.argv.includes('--dry-run');

// Get explicit version from args (e.g., "2.0.0")
const explicitVersion = process.argv.find((arg) =>
  /^\d+\.\d+\.\d+$/.test(arg)
);

/**
 * Validate semver format
 * @param {string} version - Version to validate
 * @returns {boolean} True if valid semver
 */
function isValidSemver(version) {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/**
 * Execute a shell command and return trimmed output
 * @param {string} cmd - Command to execute
 * @param {object} options - Options for execSync
 * @returns {string} Command output
 */
function exec(cmd, options = {}) {
  return execSync(cmd, { encoding: 'utf8', ...options }).trim();
}

/**
 * Execute a command, logging it first. In dry-run mode, only log.
 * @param {string} cmd - Command to execute
 * @param {string} description - What this command does
 * @returns {string|null} Command output or null in dry-run mode
 */
function run(cmd, description) {
  console.log(`  ${description}`);
  console.log(`    $ ${cmd}`);
  if (dryRun) {
    console.log('    (dry-run: skipped)');
    return null;
  }
  return exec(cmd);
}

/**
 * Get the currently published version on npm
 * @param {string} packageName - Package name
 * @returns {string|null} Version string or null if not published
 */
function getNpmVersion(packageName) {
  try {
    return exec(`npm view ${packageName} version 2>/dev/null`);
  } catch {
    return null;
  }
}

/**
 * Get commits since a specific tag
 * @param {string} tag - Git tag to start from
 * @returns {string[]} Array of commit messages
 */
function getCommitsSince(tag) {
  try {
    const range = tag ? `${tag}..HEAD` : 'HEAD';
    const log = exec(`git log ${range} --pretty=format:"%s" 2>/dev/null`);
    return log ? log.split('\n').filter(Boolean) : [];
  } catch {
    // If tag doesn't exist, get all commits
    const log = exec('git log --pretty=format:"%s" 2>/dev/null');
    return log ? log.split('\n').filter(Boolean) : [];
  }
}

/**
 * Determine the bump type from commit messages
 * @param {string[]} commits - Array of commit messages
 * @returns {'major'|'minor'|'patch'} Bump type
 */
function determineBumpType(commits) {
  let hasBreaking = false;
  let hasFeature = false;

  for (const commit of commits) {
    const lowerCommit = commit.toLowerCase();

    // Check for breaking changes
    if (
      lowerCommit.includes('breaking change') ||
      /^[a-z]+!:/.test(commit)
    ) {
      hasBreaking = true;
      break;
    }

    // Check for features
    if (/^feat(\(.+\))?:/.test(commit)) {
      hasFeature = true;
    }
  }

  if (hasBreaking) {
    return 'major';
  }
  if (hasFeature) {
    return 'minor';
  }
  return 'patch';
}

/**
 * Bump a semver version
 * @param {string} version - Current version (e.g., "1.2.3")
 * @param {'major'|'minor'|'patch'} type - Bump type
 * @returns {string} New version
 */
function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

/**
 * Main release function
 */
async function release() {
  console.log('\n📦 JsonSuperSet Release Script\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  if (explicitVersion) {
    console.log(`📌 Using explicit version: ${explicitVersion}\n`);
  }

  // Read package.json
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const { name, version: localVersion } = pkg;

  console.log(`Package: ${name}`);
  console.log(`Local version: ${localVersion}`);

  // Get npm version
  const npmVersion = getNpmVersion(name);
  console.log(`npm version: ${npmVersion || '(not published)'}\n`);

  let newVersion;
  let commits;

  // If explicit version provided, use it directly
  if (explicitVersion) {
    newVersion = explicitVersion;
    const tag = npmVersion ? `v${npmVersion}` : null;
    commits = getCommitsSince(tag);

    console.log(`Setting version to: ${newVersion}\n`);

    // Update package.json
    if (!dryRun) {
      pkg.version = newVersion;
      fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('  Updated package.json');
    } else {
      console.log('  Would update package.json');
    }

    // Update package-lock.json
    run('npm install --package-lock-only', 'Updating package-lock.json');

    // Stage changes
    run('git add package.json package-lock.json', 'Staging version files');

    // Amend last commit
    run('git commit --amend --no-edit', 'Amending last commit with version bump');
  } else if (npmVersion === localVersion) {
    // Need to bump version
    console.log('Versions match - calculating next version...\n');

    // Get commits since last tag
    const tag = `v${localVersion}`;
    commits = getCommitsSince(tag);

    if (0 === commits.length) {
      console.log('❌ No commits found since last release. Nothing to release.');
      process.exit(0);
    }

    console.log(`Found ${commits.length} commit(s) since ${tag}:`);
    commits.forEach((c) => console.log(`  - ${c}`));
    console.log('');

    // Determine bump type
    const bumpType = determineBumpType(commits);
    newVersion = bumpVersion(localVersion, bumpType);

    console.log(`Bump type: ${bumpType}`);
    console.log(`New version: ${newVersion}\n`);

    // Update package.json
    if (!dryRun) {
      pkg.version = newVersion;
      fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('  Updated package.json');
    } else {
      console.log('  Would update package.json');
    }

    // Update package-lock.json
    run('npm install --package-lock-only', 'Updating package-lock.json');

    // Stage changes
    run('git add package.json package-lock.json', 'Staging version files');

    // Amend last commit
    run('git commit --amend --no-edit', 'Amending last commit with version bump');
  } else if (!npmVersion) {
    // First publish - use current version
    console.log('First publish - using current version\n');
    newVersion = localVersion;
    commits = getCommitsSince(null);
  } else {
    // package.json version is ahead of npm - use it
    console.log(`Local version (${localVersion}) is ahead of npm (${npmVersion})`);
    console.log('Using local version for release\n');
    newVersion = localVersion;
    const tag = `v${npmVersion}`;
    commits = getCommitsSince(tag);
  }

  // Create tag
  const tag = `v${newVersion}`;
  run(`git tag ${tag}`, `Creating tag ${tag}`);

  // Push with tags
  run('git push origin main --tags --force-with-lease', 'Pushing to origin with tags');

  console.log('\n✅ Release initiated!');
  console.log(`   Version: ${newVersion}`);
  console.log(`   Tag: ${tag}`);
  console.log('\n📋 GitHub Actions will now:');
  console.log('   1. Run tests');
  console.log('   2. Build bundles');
  console.log('   3. Publish to npm');
  console.log('   4. Create GitHub Release with notes\n');

  if (commits && 0 < commits.length) {
    console.log('📝 Release notes preview:');
    console.log('─'.repeat(40));
    commits.forEach((c) => console.log(`- ${c}`));
    console.log('─'.repeat(40));
  }

  console.log('');
}

release().catch((err) => {
  console.error('\n❌ Release failed:', err.message);
  process.exit(1);
});

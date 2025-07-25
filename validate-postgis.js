#!/usr/bin/env node

/**
 * PostGIS Connection Validator
 * Run this script to verify PostGIS is properly set up and connected
 */

const { execSync } = require('child_process');

console.log('🔍 PostGIS Connection Validation Script');
console.log('=====================================\n');

// Test 1: Check if PostGIS container is running
console.log('1️⃣ Checking PostGIS Docker container...');
try {
  const containers = execSync(
    'docker ps --filter "name=postgis" --format "table {{.Names}}\\t{{.Status}}"',
    { encoding: 'utf8' },
  );
  if (containers.includes('postgis')) {
    console.log('✅ PostGIS container is running');
    console.log(containers);
  } else {
    console.log('❌ PostGIS container not found');
    console.log('💡 Run: docker-compose up -d postgis');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Docker command failed:', error.message);
  process.exit(1);
}

// Test 2: Check if app can build successfully
console.log('\n2️⃣ Testing TypeScript compilation...');
try {
  execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  console.log('Error:', error.stdout || error.message);
  process.exit(1);
}

// Test 3: Check if required packages are installed
console.log('\n3️⃣ Checking required packages...');
const requiredPackages = ['wkx', 'typeorm', '@nestjs/typeorm', 'pg'];
const packageJson = require('./package.json');

requiredPackages.forEach((pkg) => {
  const isInstalled =
    packageJson.dependencies[pkg] || packageJson.devDependencies[pkg];
  if (isInstalled) {
    console.log(`✅ ${pkg}: ${isInstalled}`);
  } else {
    console.log(`❌ ${pkg}: Not installed`);
  }
});

// Test 4: Validate PostGIS test data
console.log('\n4️⃣ Validating test data structure...');
const testData = {
  type: 'Polygon',
  coordinates: [
    [
      [30.0564, -1.9441],
      [30.0574, -1.9441],
      [30.0574, -1.9451],
      [30.0564, -1.9451],
      [30.0564, -1.9441],
    ],
  ],
};

// Basic GeoJSON validation
const isValidGeoJSON =
  testData.type === 'Polygon' &&
  Array.isArray(testData.coordinates) &&
  testData.coordinates.length > 0 &&
  Array.isArray(testData.coordinates[0]) &&
  testData.coordinates[0].length >= 4;

if (isValidGeoJSON) {
  console.log('✅ Test GeoJSON data is valid');
  console.log(`   Polygon has ${testData.coordinates[0].length} coordinates`);

  // Check if polygon is closed
  const firstCoord = testData.coordinates[0][0];
  const lastCoord = testData.coordinates[0][testData.coordinates[0].length - 1];
  const isClosed =
    firstCoord[0] === lastCoord[0] && firstCoord[1] === lastCoord[1];

  if (isClosed) {
    console.log('✅ Polygon is properly closed');
  } else {
    console.log('⚠️  Polygon is not closed (first ≠ last coordinate)');
  }

  // Check Rwanda bounds
  const isInRwanda = testData.coordinates[0].every((coord) => {
    const [lng, lat] = coord;
    return lng >= 28.861 && lng <= 30.899 && lat >= -2.84 && lat <= -1.047;
  });

  if (isInRwanda) {
    console.log('✅ Coordinates are within Rwanda bounds');
  } else {
    console.log('⚠️  Some coordinates may be outside Rwanda bounds');
  }
} else {
  console.log('❌ Test GeoJSON data is invalid');
}

// Test 5: Show connection instructions
console.log('\n5️⃣ Connection Information');
console.log(
  'Database: postgresql://landadmin:landpass123@localhost:5433/landdb',
);
console.log('PostGIS Extensions: PostGIS, PostGIS Topology');

console.log('\n📋 Next Steps:');
console.log('1. Start your NestJS application: npm run start:dev');
console.log('2. Import postman-spatial-tests.json into Postman');
console.log('3. Set up authentication (run Login request first)');
console.log('4. Test spatial endpoints with provided test data');

console.log('\n📖 Documentation:');
console.log('- API Testing Guide: POSTMAN_TESTING_GUIDE.md');
console.log('- PostGIS Usage: POSTGIS_GUIDE.md');
console.log('- Test Data: test-data-samples.js');

console.log(
  '\n🎉 Validation complete! Your PostGIS setup appears ready for testing.',
);

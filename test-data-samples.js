// Additional Test Data for PostGIS Spatial API Testing
// Copy and paste these JSON objects into Postman requests

// Test Case 1: Large Commercial Complex in Kigali
export const commercialComplexKigali = {
  parcelNumber: 'KGL-COMM-2024-001',
  upiNumber: 'UPI-KGL-COMM-2024-001',
  area: 2500.0,
  district: 'Kigali',
  sector: 'Nyarugenge',
  cell: 'Nyarugenge',
  village: 'Biryogo',
  description: 'Large commercial complex downtown Kigali',
  landUseType: 'COMMERCIAL',
  marketValue: 150000000,
  governmentValue: 140000000,
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [30.058, -1.945],
        [30.06, -1.945],
        [30.06, -1.947],
        [30.058, -1.947],
        [30.058, -1.945],
      ],
    ],
  },
};

// Test Case 2: Residential Plot in Gasabo (Should be nearby to first test)
export const residentialGasabo = {
  parcelNumber: 'GSB-RES-2024-002',
  upiNumber: 'UPI-GSB-RES-2024-002',
  area: 600.0,
  district: 'Gasabo',
  sector: 'Remera',
  cell: 'Rukiri I',
  village: 'Rukiri',
  description: 'Residential plot near commercial area',
  landUseType: 'RESIDENTIAL',
  marketValue: 35000000,
  governmentValue: 32000000,
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [30.0585, -1.9455], // Close to commercial complex
        [30.0595, -1.9455],
        [30.0595, -1.9465],
        [30.0585, -1.9465],
        [30.0585, -1.9455],
      ],
    ],
  },
};

// Test Case 3: Agricultural Land in Huye
export const agriculturalHuye = {
  parcelNumber: 'HUY-AGR-2024-001',
  upiNumber: 'UPI-HUY-AGR-2024-001',
  area: 8000.0,
  district: 'Huye',
  sector: 'Tumba',
  cell: 'Cyarwa',
  village: 'Cyarwa',
  description: 'Large agricultural plot in Huye district',
  landUseType: 'AGRICULTURAL',
  marketValue: 40000000,
  governmentValue: 35000000,
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [29.73, -2.59],
        [29.74, -2.59],
        [29.74, -2.6],
        [29.73, -2.6],
        [29.73, -2.59],
      ],
    ],
  },
};

// Test Case 4: Overlapping Plot (for overlap testing)
export const overlappingPlot = {
  parcelNumber: 'KGL-OVERLAP-2024-001',
  upiNumber: 'UPI-KGL-OVERLAP-2024-001',
  area: 800.0,
  district: 'Kigali',
  sector: 'Nyarugenge',
  cell: 'Nyarugenge',
  village: 'Biryogo',
  description: 'Plot that partially overlaps with commercial complex',
  landUseType: 'MIXED',
  marketValue: 45000000,
  governmentValue: 42000000,
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [30.059, -1.946], // Overlaps with commercial complex
        [30.061, -1.946],
        [30.061, -1.948],
        [30.059, -1.948],
        [30.059, -1.946],
      ],
    ],
  },
};

// Test Case 5: Industrial Plot in Musanze
export const industrialMusanze = {
  parcelNumber: 'MSZ-IND-2024-001',
  upiNumber: 'UPI-MSZ-IND-2024-001',
  area: 5000.0,
  district: 'Musanze',
  sector: 'Muhoza',
  cell: 'Cyuve',
  village: 'Cyuve I',
  description: 'Industrial plot near Musanze town',
  landUseType: 'INDUSTRIAL',
  marketValue: 60000000,
  governmentValue: 55000000,
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [29.63, -1.5],
        [29.64, -1.5],
        [29.64, -1.51],
        [29.63, -1.51],
        [29.63, -1.5],
      ],
    ],
  },
};

// Test Case 6: Complex Polygon Shape (L-shaped plot)
export const complexShapePlot = {
  parcelNumber: 'KGL-COMPLEX-2024-001',
  upiNumber: 'UPI-KGL-COMPLEX-2024-001',
  area: 1200.0,
  district: 'Kigali',
  sector: 'Gasabo',
  cell: 'Remera',
  village: 'Remera I',
  description: 'L-shaped commercial plot with complex geometry',
  landUseType: 'COMMERCIAL',
  marketValue: 80000000,
  governmentValue: 75000000,
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [30.11, -1.92], // L-shaped polygon
        [30.115, -1.92],
        [30.115, -1.925],
        [30.1125, -1.925],
        [30.1125, -1.9275],
        [30.11, -1.9275],
        [30.11, -1.92],
      ],
    ],
  },
};

// Spatial Query Test Parameters
export const spatialTestParams = {
  // Test coordinates for nearby searches
  kigaliCenter: { lat: -1.9441, lng: 30.0619 },
  gasaboCenter: { lat: -1.94, lng: 30.1 },
  huyeCenter: { lat: -2.5969, lng: 29.7392 },
  musanzeCenter: { lat: -1.4987, lng: 29.6334 },

  // Search radius options (in meters)
  searchRadii: [500, 1000, 2000, 5000, 10000],

  // Test for Rwanda bounds validation
  validCoordinates: [
    { lat: -1.9441, lng: 30.0619 }, // Kigali - valid
    { lat: -2.5969, lng: 29.7392 }, // Huye - valid
  ],

  invalidCoordinates: [
    { lat: 0.0, lng: 0.0 }, // Invalid - outside Rwanda
    { lat: -5.0, lng: 25.0 }, // Invalid - outside Rwanda
  ],
};

// PostGIS SQL Test Queries (for direct database testing)
export const postgisSQLQueries = {
  // Check PostGIS version
  checkPostGIS: 'SELECT PostGIS_version();',

  // Check spatial indexes
  checkSpatialIndexes: `
    SELECT schemaname, tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE indexdef LIKE '%gist%' 
    AND tablename = 'land_records';
  `,

  // Calculate total area of all land records
  totalArea: `
    SELECT 
      COUNT(*) as total_records,
      SUM(ST_Area(ST_Transform(geometry, 3857))) as total_area_sqm
    FROM land_records 
    WHERE geometry IS NOT NULL;
  `,

  // Find all overlapping geometries
  findOverlaps: `
    SELECT 
      lr1.parcel_number as parcel1,
      lr2.parcel_number as parcel2,
      ST_Area(ST_Transform(ST_Intersection(lr1.geometry, lr2.geometry), 3857)) as overlap_area
    FROM land_records lr1, land_records lr2
    WHERE lr1.id < lr2.id 
    AND ST_Overlaps(lr1.geometry, lr2.geometry);
  `,

  // Validate all geometries
  validateGeometries: `
    SELECT 
      parcel_number,
      ST_IsValid(geometry) as is_valid,
      ST_IsSimple(geometry) as is_simple,
      ST_Area(ST_Transform(geometry, 3857)) as area_sqm
    FROM land_records 
    WHERE geometry IS NOT NULL;
  `,
};

// Performance Test Configuration
export const performanceTests = {
  // Create multiple records for load testing
  generateBulkData: (count) => {
    const records = [];
    for (let i = 0; i < count; i++) {
      const baseCoord = [30.05 + i * 0.001, -1.94 + i * 0.001];
      records.push({
        parcelNumber: `PERF-${String(i).padStart(4, '0')}-2024-001`,
        upiNumber: `UPI-PERF-${String(i).padStart(4, '0')}-2024-001`,
        area: Math.random() * 2000 + 500,
        district: 'Kigali',
        sector: 'Test',
        cell: 'Performance',
        village: `Test-${i}`,
        description: `Performance test record ${i}`,
        landUseType: 'RESIDENTIAL',
        marketValue: Math.random() * 50000000 + 10000000,
        governmentValue: Math.random() * 45000000 + 8000000,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [baseCoord[0], baseCoord[1]],
              [baseCoord[0] + 0.001, baseCoord[1]],
              [baseCoord[0] + 0.001, baseCoord[1] + 0.001],
              [baseCoord[0], baseCoord[1] + 0.001],
              [baseCoord[0], baseCoord[1]],
            ],
          ],
        },
      });
    }
    return records;
  },

  // Test configuration
  config: {
    bulkRecordCounts: [10, 50, 100, 500],
    concurrentRequests: [1, 5, 10, 20],
    searchRadii: [100, 500, 1000, 5000, 10000],
  },
};

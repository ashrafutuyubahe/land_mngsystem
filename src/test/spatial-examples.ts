// PostGIS Integration Test Examples
// Use these examples to test the spatial functionality

import * as wkx from 'wkx';
import { Polygon, Point } from 'geojson';

// Example 1: Converting GeoJSON to WKB
export function testGeoJSONToWKB() {
  const geoJsonPolygon: Polygon = {
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

  // Convert to WKB for database storage
  const geometry = wkx.Geometry.parseGeoJSON(geoJsonPolygon);
  const wkbBuffer = geometry.toWkb();

  console.log('Original GeoJSON:', JSON.stringify(geoJsonPolygon, null, 2));
  console.log('WKB Buffer length:', wkbBuffer.length);

  // Convert back to GeoJSON
  const parsedGeometry = wkx.Geometry.parse(wkbBuffer);
  const backToGeoJSON = parsedGeometry.toGeoJSON();

  console.log(
    'Converted back to GeoJSON:',
    JSON.stringify(backToGeoJSON, null, 2),
  );

  return { original: geoJsonPolygon, wkb: wkbBuffer, converted: backToGeoJSON };
}

// Example 2: Calculate center point
export function calculateCenterPoint(polygon: Polygon): Point {
  const coordinates = polygon.coordinates[0]; // Exterior ring
  let sumLat = 0;
  let sumLng = 0;
  let count = coordinates.length - 1; // Exclude the last point (same as first)

  for (let i = 0; i < count; i++) {
    sumLng += coordinates[i][0];
    sumLat += coordinates[i][1];
  }

  return {
    type: 'Point',
    coordinates: [sumLng / count, sumLat / count],
  };
}

// Example 3: API Test Data
export const testLandRecordData = {
  parcelNumber: 'TEST-001-2024-001',
  upiNumber: 'UPI-TEST-001-2024-001',
  area: 1000.5,
  district: 'Kigali',
  sector: 'Nyarugenge',
  cell: 'Kiyovu',
  village: 'Kiyovu I',
  description: 'Test residential plot with PostGIS geometry',
  landUseType: 'RESIDENTIAL',
  marketValue: 50000000,
  governmentValue: 45000000,
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [30.0564, -1.9441], // Bottom-left
        [30.0574, -1.9441], // Bottom-right
        [30.0574, -1.9451], // Top-right
        [30.0564, -1.9451], // Top-left
        [30.0564, -1.9441], // Close polygon
      ],
    ],
  } as Polygon,
};

// Example 4: Test Rwanda bounds validation
export function isWithinRwandaBounds(point: [number, number]): boolean {
  const [lng, lat] = point;

  // Rwanda approximate bounds
  const rwandaBounds = {
    minLng: 28.861,
    maxLng: 30.899,
    minLat: -2.84,
    maxLat: -1.047,
  };

  return (
    lng >= rwandaBounds.minLng &&
    lng <= rwandaBounds.maxLng &&
    lat >= rwandaBounds.minLat &&
    lat <= rwandaBounds.maxLat
  );
}

// Example 5: PostGIS Query Examples
export const spatialQueries = {
  // Find all land records within 1km of a point
  findNearby: `
    SELECT 
      lr.*,
      ST_Distance(
        ST_Transform(lr.center_point, 3857),
        ST_Transform(ST_GeomFromText('POINT($1 $2)', 4326), 3857)
      ) as distance_meters
    FROM land_records lr
    WHERE lr.center_point IS NOT NULL
      AND ST_DWithin(
        ST_Transform(lr.center_point, 3857),
        ST_Transform(ST_GeomFromText('POINT($1 $2)', 4326), 3857),
        $3
      )
    ORDER BY distance_meters ASC;
  `,

  // Calculate actual area of a land parcel
  calculateArea: `
    SELECT 
      id,
      parcel_number,
      ST_Area(ST_Transform(geometry, 3857)) as area_square_meters,
      ST_Area(ST_Transform(geometry, 3857)) / 10000.0 as area_hectares
    FROM land_records 
    WHERE id = $1 AND geometry IS NOT NULL;
  `,

  // Check if two parcels overlap
  checkOverlap: `
    SELECT 
      lr1.parcel_number as parcel1,
      lr2.parcel_number as parcel2,
      ST_Overlaps(lr1.geometry, lr2.geometry) as overlaps,
      ST_Area(ST_Transform(ST_Intersection(lr1.geometry, lr2.geometry), 3857)) as overlap_area_sqm
    FROM land_records lr1, land_records lr2
    WHERE lr1.id = $1 AND lr2.id = $2
      AND lr1.geometry IS NOT NULL 
      AND lr2.geometry IS NOT NULL;
  `,

  // Find all parcels within an administrative boundary
  findByBoundary: `
    SELECT lr.*
    FROM land_records lr
    WHERE lr.geometry IS NOT NULL
      AND lr.district = $1
      AND ($2 IS NULL OR lr.sector = $2)
      AND ($3 IS NULL OR lr.cell = $3);
  `,
};

// Example 6: Performance testing
export function generateTestPolygon(
  centerLat: number,
  centerLng: number,
  sizeMeters: number,
): Polygon {
  const metersToDegreesLat = 1 / 111111; // Approximate
  const metersToDegreesLng =
    1 / (111111 * Math.cos((centerLat * Math.PI) / 180));

  const halfSizeLat = (sizeMeters / 2) * metersToDegreesLat;
  const halfSizeLng = (sizeMeters / 2) * metersToDegreesLng;

  return {
    type: 'Polygon',
    coordinates: [
      [
        [centerLng - halfSizeLng, centerLat - halfSizeLat], // SW
        [centerLng + halfSizeLng, centerLat - halfSizeLat], // SE
        [centerLng + halfSizeLng, centerLat + halfSizeLat], // NE
        [centerLng - halfSizeLng, centerLat + halfSizeLat], // NW
        [centerLng - halfSizeLng, centerLat - halfSizeLat], // Close
      ],
    ],
  };
}

// Usage examples:
console.log('Testing WKX conversion...');
testGeoJSONToWKB();

console.log('Testing center point calculation...');
const centerPoint = calculateCenterPoint(testLandRecordData.geometry);
console.log('Center point:', centerPoint);

console.log('Testing Rwanda bounds validation...');
console.log(
  'Is within Rwanda:',
  isWithinRwandaBounds(centerPoint.coordinates as [number, number]),
);

console.log('Generated test polygon:');
const testPolygon = generateTestPolygon(-1.9441, 30.0564, 100); // 100m x 100m
console.log(JSON.stringify(testPolygon, null, 2));

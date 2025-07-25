# PostGIS Spatial Data Integration Guide

## Overview

This guide explains how to use the PostGIS spatial features integrated into the Land Administration API using the `wkx` package for handling spatial data.

## Features Implemented

### 1. Spatial Data Storage

- **Geometry Column**: Stores land parcel boundaries as PostGIS Polygon geometry
- **Center Point**: Automatically calculated center point of each land parcel
- **Area Calculation**: Precise area calculation using PostGIS functions
- **WKB Format**: Uses Well-Known Binary format for efficient storage

### 2. API Endpoints

#### Create Land Record with Geometry

```http
POST /land-registration
Content-Type: application/json
Authorization: Bearer {token}

{
  "parcelNumber": "KG-001-2024-001",
  "upiNumber": "UPI-001-2024-001",
  "area": 500.75,
  "district": "Kigali",
  "sector": "Nyarugenge",
  "cell": "Kiyovu",
  "village": "Kiyovu I",
  "landUseType": "RESIDENTIAL",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [30.0564, -1.9441],
        [30.0574, -1.9441],
        [30.0574, -1.9451],
        [30.0564, -1.9451],
        [30.0564, -1.9441]
      ]
    ]
  }
}
```

#### Get Land Record with GeoJSON Geometry

```http
GET /land-registration/{id}/geometry
Authorization: Bearer {token}
```

#### Find Nearby Land Records

```http
GET /land-registration/spatial/nearby?lat=-1.9441&lng=30.0564&radius=1000
Authorization: Bearer {token}
```

#### Calculate Accurate Area

```http
GET /land-registration/{id}/area
Authorization: Bearer {token}
```

#### Check Geometry Overlap

```http
GET /land-registration/{id1}/overlap/{id2}
Authorization: Bearer {token}
```

## How It Works

### 1. Data Processing Flow

1. **Input**: GeoJSON Polygon from client
2. **Validation**: Geometry validation using PostGIS functions
3. **Conversion**: GeoJSON → WKB using `wkx` library
4. **Storage**: WKB stored in PostGIS geometry column
5. **Retrieval**: WKB → GeoJSON for client responses

### 2. Spatial Calculations

- **Area**: Uses PostGIS `ST_Area()` with coordinate transformation
- **Distance**: Uses PostGIS `ST_Distance()` for spatial queries
- **Overlap**: Uses PostGIS `ST_Overlaps()` and `ST_Intersection()`
- **Center Point**: Uses PostGIS `ST_Centroid()` function

### 3. Code Examples

#### Creating Geometry in Service

```typescript
// Convert GeoJSON to WKB for storage
const wkbGeometry = wkx.Geometry.parseGeoJSON(geoJsonPolygon).toWkb();

// Calculate center point
const centerPoint = this.calculateCenterPoint(geoJsonPolygon);
const wkbCenterPoint = wkx.Geometry.parseGeoJSON(centerPoint).toWkb();

// Save to database
const landRecord = await this.landRecordRepository.save({
  ...otherData,
  geometry: wkbGeometry,
  centerPoint: wkbCenterPoint,
});
```

#### Converting Back to GeoJSON

```typescript
// Convert WKB to GeoJSON for client
const geoJsonGeometry = wkx.Geometry.parse(landRecord.geometry).toGeoJSON();
```

#### Spatial Queries

```typescript
// Find records within radius using PostGIS
const query = `
  SELECT lr.*, ST_Distance(
    ST_Transform(lr.center_point, 3857),
    ST_Transform(ST_GeomFromText('POINT($2 $3)', 4326), 3857)
  ) as distance
  FROM land_records lr
  WHERE ST_DWithin(
    ST_Transform(lr.center_point, 3857),
    ST_Transform(ST_GeomFromText('POINT($2 $3)', 4326), 3857),
    $4
  )
`;
```

## Database Schema

### Land Records Table

```sql
-- Geometry columns added to existing table
ALTER TABLE land_records
ADD COLUMN geometry geometry(Polygon, 4326),
ADD COLUMN center_point geometry(Point, 4326),
ADD COLUMN calculated_area decimal(12,6);

-- Create spatial indexes for performance
CREATE INDEX idx_land_records_geometry ON land_records USING GIST (geometry);
CREATE INDEX idx_land_records_center_point ON land_records USING GIST (center_point);
```

## Testing the Implementation

### 1. Start PostGIS Container

```bash
docker-compose up -d postgis
```

### 2. Test Geometry Creation

Use the API to create a land record with geometry and verify it's stored correctly.

### 3. Test Spatial Queries

- Test nearby search functionality
- Verify area calculations
- Check overlap detection

### 4. Performance Testing

- Test with large datasets
- Verify spatial indexes are being used
- Monitor query performance

## Best Practices

### 1. Coordinate Systems

- Input: WGS84 (EPSG:4326) for compatibility
- Calculations: Web Mercator (EPSG:3857) for accuracy
- Storage: WGS84 (EPSG:4326) for standards compliance

### 2. Validation

- Always validate geometry before storage
- Check if geometries are within expected bounds (Rwanda)
- Ensure polygons are properly closed

### 3. Performance

- Use spatial indexes for all geometry columns
- Transform coordinates only when necessary
- Batch operations for bulk data processing

### 4. Error Handling

- Handle invalid geometries gracefully
- Provide meaningful error messages
- Log spatial operation failures

## Rwanda-Specific Considerations

### 1. Coordinate Bounds

- Longitude: 28.861° to 30.899° E
- Latitude: -2.840° to -1.047° N

### 2. Administrative Boundaries

- Validate geometries are within Rwanda borders
- Consider administrative hierarchy (District → Sector → Cell → Village)

### 3. Land Use Types

- Residential, Commercial, Agricultural, etc.
- Validate against Rwanda land use classifications

## Troubleshooting

### Common Issues

1. **Invalid Geometry**: Use PostGIS `ST_IsValid()` to check
2. **Performance**: Ensure spatial indexes exist
3. **Coordinate System**: Verify SRID is correct (4326)
4. **WKB Conversion**: Handle binary data properly

### Debug Queries

```sql
-- Check if geometry is valid
SELECT ST_IsValid(geometry), ST_IsValidReason(geometry) FROM land_records;

-- View geometry as text
SELECT ST_AsText(geometry) FROM land_records;

-- Check spatial indexes
SELECT * FROM pg_indexes WHERE tablename = 'land_records' AND indexdef LIKE '%GIST%';
```

## Next Steps

1. **Add More Spatial Functions**
   - Buffer operations
   - Intersection calculations
   - Spatial joins

2. **Performance Optimization**
   - Implement geometry caching
   - Add materialized views for complex queries

3. **Advanced Features**
   - 3D geometry support
   - Temporal spatial data
   - Spatial analytics dashboard

4. **Integration**
   - GIS software integration
   - Mobile app support
   - Real-time spatial updates

# PostGIS Spatial API Testing Guide

## Overview

This guide provides comprehensive instructions for testing the Land Administration API's PostGIS spatial functionality using Postman.

## Prerequisites

1. **PostGIS Database Running**

   ```bash
   docker-compose up -d postgis
   ```

2. **Application Running**

   ```bash
   npm run start:dev
   ```

3. **Postman Collection Imported**
   - Import `postman-spatial-tests.json` into Postman
   - Set collection variables

## Collection Variables Setup

In Postman, go to your collection settings and set these variables:

| Variable         | Value                       | Description               |
| ---------------- | --------------------------- | ------------------------- |
| `base_url`       | `http://localhost:3000`     | API base URL              |
| `jwt_token`      | (will be set automatically) | JWT authentication token  |
| `land_record_id` | (will be set automatically) | ID of created land record |

## Testing Steps

### Step 1: Authentication

1. **Run "Login" request**
   - This will automatically set the `jwt_token` variable
   - All subsequent requests will use this token

### Step 2: Create Land Records with Spatial Data

#### Test Case 1: Kigali Downtown Commercial Plot

```json
{
  "parcelNumber": "KGL-001-2024-001",
  "upiNumber": "UPI-KGL-001-2024-001",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [30.0564, -1.9441], // Bottom-left (Kigali coordinates)
        [30.0574, -1.9441], // Bottom-right
        [30.0574, -1.9451], // Top-right
        [30.0564, -1.9451], // Top-left
        [30.0564, -1.9441] // Close polygon
      ]
    ]
  }
}
```

#### Test Case 2: Gasabo Residential Plot

```json
{
  "parcelNumber": "GSB-002-2024-001",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [30.1234, -1.9123], // Gasabo district coordinates
        [30.1244, -1.9123],
        [30.1244, -1.9133],
        [30.1234, -1.9133],
        [30.1234, -1.9123]
      ]
    ]
  }
}
```

#### Test Case 3: Agricultural Land

```json
{
  "parcelNumber": "AGR-003-2024-001",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [29.6234, -1.4987], // Musanze area coordinates
        [29.6334, -1.4987],
        [29.6334, -1.5087],
        [29.6234, -1.5087],
        [29.6234, -1.4987]
      ]
    ]
  }
}
```

### Step 3: Test Spatial Queries

#### 3.1 Get Geometry Data

- **Endpoint**: `GET /land-registration/{id}/geometry`
- **Purpose**: Retrieve land record with GeoJSON geometry
- **Expected**: Original polygon converted back from WKB

#### 3.2 Calculate Accurate Area

- **Endpoint**: `GET /land-registration/{id}/area`
- **Purpose**: Get PostGIS ST_Area calculation in square meters
- **Expected**: Precise area calculation using spatial projection

#### 3.3 Find Nearby Land Records

- **Endpoint**: `GET /land-registration/spatial/nearby`
- **Parameters**:
  - `lat`: -1.9441 (Kigali center)
  - `lng`: 30.0569
  - `radius`: 1000 (meters)
- **Purpose**: Find land records within specified radius
- **Expected**: Array of nearby land records with distance

#### 3.4 Check Geometry Overlap

- **Endpoint**: `GET /land-registration/{id1}/overlap/{id2}`
- **Purpose**: Detect if two land parcels overlap
- **Expected**: Boolean overlap status and overlap area

## Expected Results

### 1. Land Record Creation

```json
{
  "id": "uuid-here",
  "parcelNumber": "KGL-001-2024-001",
  "calculatedArea": 1234.56, // PostGIS calculated area in sqm
  "geometry": "<Buffer...>", // WKB format
  "centerPoint": "<Buffer...>", // WKB format
  "status": "PENDING"
}
```

### 2. Geometry Retrieval

```json
{
  "id": "uuid-here",
  "parcelNumber": "KGL-001-2024-001",
  "geoJsonGeometry": {
    "type": "Polygon",
    "coordinates": [...]  // Original coordinates
  }
}
```

### 3. Area Calculation

```json
{
  "landRecordId": "uuid-here",
  "area": 1234.56,
  "unit": "square_meters",
  "calculatedUsing": "PostGIS ST_Area"
}
```

### 4. Nearby Search

```json
[
  {
    "id": "uuid-here",
    "parcelNumber": "KGL-001-2024-001",
    "distance": 150.75, // Distance in meters
    "district": "Kigali"
  }
]
```

### 5. Overlap Detection

```json
{
  "overlaps": false,
  "overlapArea": 0,
  "landRecord1": "uuid-1",
  "landRecord2": "uuid-2"
}
```

## Validation Checklist

### ✅ WKX Integration

- [ ] GeoJSON successfully converted to WKB
- [ ] WKB successfully converted back to GeoJSON
- [ ] No data loss in conversion process

### ✅ PostGIS Functionality

- [ ] ST_Area returns accurate area calculations
- [ ] ST_Distance calculates correct distances
- [ ] ST_DWithin finds records within radius
- [ ] ST_Overlaps detects geometry intersections

### ✅ API Responses

- [ ] All endpoints return proper HTTP status codes
- [ ] Response schemas match expected format
- [ ] Error handling works for invalid geometry
- [ ] Authentication required for all endpoints

### ✅ Spatial Accuracy

- [ ] Coordinates are in correct SRID (4326 - WGS84)
- [ ] Area calculations match expected values
- [ ] Distance calculations are accurate
- [ ] Rwanda coordinate bounds validation works

## Troubleshooting

### Common Issues

1. **"Invalid geometry data" Error**
   - Ensure polygon is properly closed (first = last coordinate)
   - Check coordinate format: [longitude, latitude]
   - Validate GeoJSON structure

2. **"PostGIS function not found" Error**
   - Verify PostGIS extension is installed in database
   - Check database connection configuration
   - Ensure ST\_\* functions are available

3. **Area calculation returns 0**
   - Check if geometry was saved properly
   - Verify SRID transformation (4326 → 3857)
   - Confirm polygon has valid area

4. **Nearby search returns empty**
   - Verify coordinate system (WGS84)
   - Check if center point is within reasonable bounds
   - Increase search radius

## Rwanda-Specific Coordinates

### Major Cities Reference Points

- **Kigali**: -1.9441, 30.0619
- **Huye**: -2.5969, 29.7392
- **Musanze**: -1.4987, 29.6334
- **Rubavu**: -1.6792, 29.2686

### Administrative Boundaries

- **Longitude**: 28.861° E to 30.899° E
- **Latitude**: 2.84° S to 1.047° S
- **Total Area**: ~26,338 km²

Use these coordinates to create realistic test data for Rwandan land administration.

## Performance Testing

### Load Testing Parameters

- Create 100+ land records with spatial data
- Test nearby queries with various radius sizes
- Measure response times for complex polygon queries
- Validate database performance under load

### Optimization Verification

- Confirm spatial indexes are being used
- Check query execution plans
- Monitor memory usage during spatial operations
- Validate PostGIS extension performance

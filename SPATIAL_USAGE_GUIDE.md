# Land Administration API - PostGIS Spatial Data Usage

This guide explains how to use the PostGIS spatial features in the Land Administration API.

## Setup PostGIS Database

Make sure your PostgreSQL database has PostGIS extensions enabled:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

## API Endpoints for Spatial Data

### 1. Register Land with GeoJSON Geometry

**POST** `/land-registration`

```json
{
  "parcelNumber": "KG-001-2024-001",
  "upiNumber": "UPI-001-2024-001",
  "area": 500.75,
  "district": "Kigali",
  "sector": "Nyarugenge",
  "cell": "Kiyovu",
  "village": "Kiyovu I",
  "description": "Residential plot with garden",
  "landUseType": "RESIDENTIAL",
  "marketValue": 50000000,
  "governmentValue": 45000000,
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [30.0566, -1.9441],
        [30.0576, -1.9441],
        [30.0576, -1.9451],
        [30.0566, -1.9451],
        [30.0566, -1.9441]
      ]
    ]
  },
  "documents": "[\"land_survey.pdf\", \"ownership_certificate.pdf\"]"
}
```

### 2. Get Land Record with GeoJSON

**GET** `/land-registration/{id}/geometry`

Returns the land record with the geometry converted back to GeoJSON format.

### 3. Find Nearby Land Records

**GET** `/land-registration/spatial/nearby?lat=-1.9441&lng=30.0566&radius=1000`

Finds all land records within 1000 meters of the specified point.

### 4. Calculate Accurate Land Area

**GET** `/land-registration/{id}/area`

Uses PostGIS ST_Area function to calculate the accurate area of the land parcel.

### 5. Check Land Parcel Overlap

**GET** `/land-registration/{id1}/overlap/{id2}`

Checks if two land parcels overlap and returns overlap area if they do.

## Spatial Data Processing

### WKX Package Usage

The API uses the `wkx` package to convert between GeoJSON and WKB (Well-Known Binary) format:

```typescript
// Convert GeoJSON to WKB for PostGIS storage
const polygon = wkx.Geometry.parseGeoJSON(geoJsonPolygon);
const wkbBuffer = polygon.toWkb();

// Convert WKB back to GeoJSON for API responses
const geometry = wkx.Geometry.parse(wkbBuffer);
const geoJSON = geometry.toGeoJSON();
```

### PostGIS Spatial Queries

The service includes several PostGIS spatial operations:

1. **Distance Queries**: Find land records within a radius
2. **Area Calculations**: Calculate accurate area using ST_Area
3. **Overlap Detection**: Check if geometries overlap using ST_Overlaps
4. **Intersection**: Calculate overlap area using ST_Intersection

## Database Schema

### Land Records Table

```sql
CREATE TABLE land_records (
  id UUID PRIMARY KEY,
  parcel_number VARCHAR UNIQUE,
  upi_number VARCHAR UNIQUE,
  area DECIMAL(10,2),
  -- ... other fields ...

  -- PostGIS geometry fields
  geometry GEOMETRY(Polygon, 4326), -- Land parcel boundary
  center_point GEOMETRY(Point, 4326), -- Center point of parcel
  calculated_area DECIMAL(12,6), -- Area calculated from geometry

  -- Legacy coordinates for backward compatibility
  coordinates JSONB
);

-- Spatial indexes for performance
CREATE INDEX idx_land_records_geometry ON land_records USING GIST (geometry);
CREATE INDEX idx_land_records_center_point ON land_records USING GIST (center_point);
```

## Benefits of Using PostGIS

1. **Accurate Area Calculations**: PostGIS provides precise area calculations using geodetic calculations
2. **Spatial Indexing**: GIST indexes enable fast spatial queries
3. **Overlap Detection**: Built-in functions to detect and measure overlaps between parcels
4. **Distance Queries**: Efficient queries to find nearby parcels
5. **Coordinate System Support**: Proper handling of different coordinate reference systems

## Example Client Usage

```javascript
// Register a new land parcel with polygon geometry
const newLandRecord = await fetch('/land-registration', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  },
  body: JSON.stringify({
    parcelNumber: 'KG-001-2024-001',
    upiNumber: 'UPI-001-2024-001',
    area: 500.75,
    district: 'Kigali',
    sector: 'Nyarugenge',
    cell: 'Kiyovu',
    village: 'Kiyovu I',
    landUseType: 'RESIDENTIAL',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [30.0566, -1.9441],
          [30.0576, -1.9441],
          [30.0576, -1.9451],
          [30.0566, -1.9451],
          [30.0566, -1.9441],
        ],
      ],
    },
  }),
});

// Find nearby land records
const nearbyLands = await fetch(
  '/land-registration/spatial/nearby?lat=-1.9441&lng=30.0566&radius=1000',
  {
    headers: { Authorization: 'Bearer ' + token },
  },
);

// Get accurate area calculation
const areaInfo = await fetch('/land-registration/' + landId + '/area', {
  headers: { Authorization: 'Bearer ' + token },
});
```

## Data Validation

The API validates GeoJSON input to ensure:

- Geometry type is 'Polygon'
- Coordinates array is properly structured
- Polygon is closed (first and last coordinates are the same)
- Coordinates are within reasonable bounds for Rwanda

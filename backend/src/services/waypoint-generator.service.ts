// AI-assisted: Generated initial algorithm with Claude Code
// Manual improvements: Fixed coordinate conversion, added zigzag ordering
import * as turf from '@turf/turf';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Waypoint {
  latitude: number;
  longitude: number;
  altitude: number;
  order: number;
}

export interface CrosshatchConfig {
  polygon: LatLng[];
  altitude: number;
  overlap: number;
  angle?: number;
}

export interface PerimeterConfig {
  polygon: LatLng[];
  altitude: number;
  distanceFromEdge: number;
}

export interface GridConfig {
  polygon: LatLng[];
  altitude: number;
  gridSize: number;
}

function orderWaypointsZigzag(waypoints: Waypoint[]): Waypoint[] {
  // Simple zigzag ordering - group by approximate latitude, then alternate direction
  const sorted = [...waypoints].sort((a, b) => {
    if (Math.abs(a.latitude - b.latitude) < 0.0001) {
      return a.longitude - b.longitude;
    }
    return a.latitude - b.latitude;
  });

  // For now, return sorted - can be improved with more sophisticated zigzag
  return sorted.map((wp, index) => ({ ...wp, order: index }));
}

function ensureClosedPolygon(polygon: LatLng[]): LatLng[] {
  // Ensure polygon is closed (first and last point must be the same)
  if (polygon.length === 0) return polygon;
  const first = polygon[0];
  const last = polygon[polygon.length - 1];
  if (first.lat !== last.lat || first.lng !== last.lng) {
    return [...polygon, first];
  }
  return polygon;
}

export function calculatePolygonArea(polygon: LatLng[]): number {
  if (!polygon || polygon.length < 3) return 0;

  const closedPolygon = ensureClosedPolygon(polygon);
  const turfPolygon = turf.polygon([closedPolygon.map(p => [p.lng, p.lat])]);

  return turf.area(turfPolygon); // Returns area in square meters
}

export function generateCrosshatchWaypoints(config: CrosshatchConfig): Waypoint[] {
  const { polygon, altitude, overlap, angle = 0 } = config;

  // 1. Convert polygon to Turf.js format (ensure it's closed)
  const closedPolygon = ensureClosedPolygon(polygon);
  const turfPolygon = turf.polygon([closedPolygon.map(p => [p.lng, p.lat])]);

  // 2. Get bounding box
  const bbox = turf.bbox(turfPolygon);
  const [minLng, minLat, maxLng, maxLat] = bbox;

  // 3. Calculate line spacing (assuming sensor width of 50m)
  const sensorWidth = 50; // meters
  const spacing = sensorWidth * (1 - overlap / 100); // meters

  // ⭐ CRITICAL: Convert meters to degrees (coordinate system fix)
  const centerLat = (minLat + maxLat) / 2;
  const metersPerDegreeLng = 111320 * Math.cos(centerLat * Math.PI / 180);
  const spacingInDegreesLng = spacing / metersPerDegreeLng;

  // 4. Calculate number of lines needed
  const widthInMeters = turf.distance(
    [minLng, minLat],
    [maxLng, minLat],
    { units: 'meters' }
  );
  const numLines = Math.ceil(widthInMeters / spacing);

  // 5. Generate parallel lines
  const lines: turf.Feature<turf.LineString>[] = [];
  for (let i = 0; i <= numLines; i++) {
    const x = minLng + (i * spacingInDegreesLng); // ⭐ Now using degrees
    const line = turf.lineString([
      [x, minLat - 1], // Extend beyond bounds
      [x, maxLat + 1]
    ]);

    // Rotate line by angle (using center of bbox as pivot instead of centroid to avoid ES module issues)
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    const pivot = turf.point([centerLng, centerLat]);
    const rotated = turf.transformRotate(line, angle, { pivot });
    lines.push(rotated);
  }

  // 6. Clip lines to polygon by sampling points and filtering
  const waypoints: Waypoint[] = [];
  for (const line of lines) {
    const coords = line.geometry.coordinates;
    const lineLength = turf.length(line, { units: 'meters' });
    const numSamples = Math.ceil(lineLength / 20); // Sample every 20 meters

    // Sample points along the line
    for (let i = 0; i <= numSamples; i++) {
      const ratio = i / numSamples;
      const point = turf.along(line, lineLength * ratio, { units: 'meters' });

      // Only add waypoints that are inside the polygon
      if (turf.booleanPointInPolygon(point, turfPolygon)) {
        waypoints.push({
          latitude: point.geometry.coordinates[1],
          longitude: point.geometry.coordinates[0],
          altitude,
          order: waypoints.length
        });
      }
    }
  }

  // 8. Order waypoints (zigzag pattern)
  return orderWaypointsZigzag(waypoints);
}

export function generatePerimeterWaypoints(config: PerimeterConfig): Waypoint[] {
  const { polygon, altitude, distanceFromEdge } = config;

  // 1. Convert to Turf.js format (ensure it's closed)
  const closedPolygon = ensureClosedPolygon(polygon);
  const turfPolygon = turf.polygon([closedPolygon.map(p => [p.lng, p.lat])]);

  // 2. Offset polygon inward
  const offsetPolygon = turf.buffer(turfPolygon, -distanceFromEdge, { units: 'meters' });

  if (!offsetPolygon || offsetPolygon.geometry.type !== 'Polygon') {
    return [];
  }

  // 3. Sample points along perimeter
  const coords = offsetPolygon.geometry.coordinates[0];
  const waypoints: Waypoint[] = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const start = coords[i];
    const end = coords[i + 1];
    const segment = turf.lineString([start, end]);
    const length = turf.length(segment, { units: 'meters' });
    const numPoints = Math.ceil(length / 20); // Every 20 meters

    for (let j = 0; j < numPoints; j++) {
      const ratio = j / numPoints;
      const point = turf.along(segment, length * ratio, { units: 'meters' });
      waypoints.push({
        latitude: point.geometry.coordinates[1],
        longitude: point.geometry.coordinates[0],
        altitude,
        order: waypoints.length
      });
    }
  }

  return waypoints;
}

export function generateGridWaypoints(config: GridConfig): Waypoint[] {
  const { polygon, altitude, gridSize } = config;

  // 1. Convert to Turf.js format (ensure it's closed)
  const closedPolygon = ensureClosedPolygon(polygon);
  const turfPolygon = turf.polygon([closedPolygon.map(p => [p.lng, p.lat])]);

  // 2. Get bounding box
  const bbox = turf.bbox(turfPolygon);
  const [minLng, minLat, maxLng, maxLat] = bbox;

  // 3. Create grid
  const waypoints: Waypoint[] = [];
  const centerLat = (minLat + maxLat) / 2;
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(centerLat * Math.PI / 180);

  const gridSizeInDegreesLat = gridSize / metersPerDegreeLat;
  const gridSizeInDegreesLng = gridSize / metersPerDegreeLng;

  for (let lat = minLat; lat <= maxLat; lat += gridSizeInDegreesLat) {
    for (let lng = minLng; lng <= maxLng; lng += gridSizeInDegreesLng) {
      const point = turf.point([lng, lat]);
      if (turf.booleanPointInPolygon(point, turfPolygon)) {
        waypoints.push({
          latitude: lat,
          longitude: lng,
          altitude,
          order: waypoints.length
        });
      }
    }
  }

  // Order for efficient flight path
  return waypoints.sort((a, b) => {
    if (Math.abs(a.latitude - b.latitude) < 0.0001) {
      return a.longitude - b.longitude;
    }
    return a.latitude - b.latitude;
  }).map((wp, index) => ({ ...wp, order: index }));
}

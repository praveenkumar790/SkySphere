import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  generateCrosshatchWaypoints,
  generatePerimeterWaypoints,
  generateGridWaypoints
} from '../src/services/waypoint-generator.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up
  await prisma.telemetry.deleteMany();
  await prisma.surveyReport.deleteMany();
  await prisma.missionExecution.deleteMany();
  await prisma.waypoint.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.drone.deleteMany();
  await prisma.user.deleteMany();
  await prisma.site.deleteMany();
  await prisma.organization.deleteMany();

  console.log('🧹 Cleaned up existing data');

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'SkySphere Demo Org',
      slug: 'skysphere-demo',
    }
  });
  console.log('✅ Created Organization:', org.name);

  // 2. Create Site
  const site = await prisma.site.create({
    data: {
      name: 'Main HQ',
      location: 'San Francisco, CA',
      organizationId: org.id
    }
  });

  // 3. Create demo user (Admin)
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'demo@skysphere.com',
      passwordHash: hashedPassword,
      name: 'Demo Admin',
      role: UserRole.ORG_ADMIN,
      organizationId: org.id
    }
  });

  console.log('✅ Created user:', user.email);

  // 4. Create Drones
  const droneData = [
    { name: 'DJI-001', model: 'DJI Phantom 4 Pro', status: 'available', battery: 85, location: [37.7749, -122.4194] },
    { name: 'DJI-002', model: 'DJI Mavic 3', status: 'available', battery: 92, location: [40.7128, -74.0060] },
    { name: 'DJI-003', model: 'DJI Inspire 2', status: 'in-mission', battery: 67, location: [34.0522, -118.2437] },
  ];

  const drones = [];
  for (const data of droneData) {
    const drone = await prisma.drone.create({
      data: {
        name: data.name,
        model: data.model,
        status: data.status as any,
        batteryLevel: data.battery,
        currentLat: data.location[0],
        currentLng: data.location[1],
        lastSeen: new Date(),
        organizationId: org.id, // Linked to Org
        createdById: user.id
      }
    });
    drones.push(drone);
  }

  console.log(`✅ Created ${drones.length} drones`);

  // 5. Create Missions
  const missionData = [
    {
      name: 'Building A - Roof Inspection',
      description: 'Comprehensive roof inspection',
      pattern: 'crosshatch',
      polygon: [
        { lat: 37.7749, lng: -122.4194 },
        { lat: 37.7755, lng: -122.4194 },
        { lat: 37.7755, lng: -122.4188 },
        { lat: 37.7749, lng: -122.4188 },
        { lat: 37.7749, lng: -122.4194 }
      ],
      altitude: 50,
      overlap: 30,
      speed: 5
    }
  ];

  const missions = [];
  for (const data of missionData) {
    let waypoints: any[] = [];
    try {
      waypoints = generateCrosshatchWaypoints({
        polygon: data.polygon,
        altitude: data.altitude,
        overlap: data.overlap
      });
    } catch (e) {
      console.warn('Fallback waypoint generation');
      waypoints = [{ latitude: 37.7749, longitude: -122.4194, altitude: 50, order: 0 }];
    }

    const mission = await prisma.mission.create({
      data: {
        name: data.name,
        description: data.description,
        patternType: data.pattern,
        altitude: data.altitude,
        overlapPercentage: data.overlap,
        speed: data.speed,
        polygonCoordinates: data.polygon as any,
        organizationId: org.id, // Linked to Org
        createdById: user.id,
        waypoints: {
          create: waypoints.map((wp, index) => ({
            latitude: wp.latitude,
            longitude: wp.longitude,
            altitude: wp.altitude,
            orderIndex: wp.order !== undefined ? wp.order : index
          }))
        }
      }
    });
    missions.push(mission);
  }

  console.log(`✅ Created ${missions.length} missions`);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

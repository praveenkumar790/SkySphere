-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "battery_level" INTEGER NOT NULL,
    "current_lat" DOUBLE PRECISION,
    "current_lng" DOUBLE PRECISION,
    "last_seen" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "drones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pattern_type" TEXT NOT NULL,
    "altitude" DOUBLE PRECISION NOT NULL,
    "overlap_percentage" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,
    "polygon_coordinates" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waypoints" (
    "id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "waypoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_executions" (
    "id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "drone_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "progress_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current_waypoint_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "mission_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION NOT NULL,
    "battery_level" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,
    "heading" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_reports" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "total_distance" DOUBLE PRECISION NOT NULL,
    "total_duration" INTEGER NOT NULL,
    "coverage_area" DOUBLE PRECISION NOT NULL,
    "waypoints_completed" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "drones_status_idx" ON "drones"("status");

-- CreateIndex
CREATE INDEX "drones_battery_level_idx" ON "drones"("battery_level");

-- CreateIndex
CREATE INDEX "drones_user_id_idx" ON "drones"("user_id");

-- CreateIndex
CREATE INDEX "missions_pattern_type_idx" ON "missions"("pattern_type");

-- CreateIndex
CREATE INDEX "missions_user_id_idx" ON "missions"("user_id");

-- CreateIndex
CREATE INDEX "waypoints_mission_id_idx" ON "waypoints"("mission_id");

-- CreateIndex
CREATE INDEX "mission_executions_mission_id_idx" ON "mission_executions"("mission_id");

-- CreateIndex
CREATE INDEX "mission_executions_drone_id_idx" ON "mission_executions"("drone_id");

-- CreateIndex
CREATE INDEX "mission_executions_status_idx" ON "mission_executions"("status");

-- CreateIndex
CREATE INDEX "mission_executions_started_at_idx" ON "mission_executions"("started_at");

-- CreateIndex
CREATE INDEX "telemetry_execution_id_idx" ON "telemetry"("execution_id");

-- CreateIndex
CREATE INDEX "telemetry_timestamp_idx" ON "telemetry"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "survey_reports_execution_id_key" ON "survey_reports"("execution_id");

-- CreateIndex
CREATE INDEX "survey_reports_created_at_idx" ON "survey_reports"("created_at");

-- AddForeignKey
ALTER TABLE "drones" ADD CONSTRAINT "drones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waypoints" ADD CONSTRAINT "waypoints_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_executions" ADD CONSTRAINT "mission_executions_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_executions" ADD CONSTRAINT "mission_executions_drone_id_fkey" FOREIGN KEY ("drone_id") REFERENCES "drones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry" ADD CONSTRAINT "telemetry_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "mission_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_reports" ADD CONSTRAINT "survey_reports_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "mission_executions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

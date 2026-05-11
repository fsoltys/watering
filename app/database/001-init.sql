CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE devices (
    device_id VARCHAR(50) PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    water_duration_sec INT DEFAULT 10,
    moisture_threshold_percent INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE telemetry (
    time TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(50) REFERENCES devices(device_id) ON DELETE CASCADE,
    water_lvl INT NOT NULL,
    battery_lvl INT NOT NULL,
    moisture_lvl INT NOT NULL,
    uptime INT NOT NULL
);

-- 3. Inicjalizacja TimescaleDB
SELECT create_hypertable('telemetry', 'time');
SELECT add_retention_policy('telemetry', INTERVAL '90 days');
CREATE INDEX ix_telemetry_device_id_time ON telemetry (device_id, time DESC);

-- 4. Tworzenie Zmaterializowanych Widoków
CREATE MATERIALIZED VIEW telemetry_15m WITH (timescaledb.continuous) AS
SELECT time_bucket('15 minutes', time) AS bucket, device_id, 
       AVG(moisture_lvl) as avg_moisture, MIN(moisture_lvl) as min_moisture, MAX(moisture_lvl) as max_moisture
FROM telemetry GROUP BY bucket, device_id;

CREATE MATERIALIZED VIEW telemetry_1h WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS bucket, device_id, 
       AVG(moisture_lvl) as avg_moisture, MIN(moisture_lvl) as min_moisture, MAX(moisture_lvl) as max_moisture
FROM telemetry GROUP BY bucket, device_id;

CREATE MATERIALIZED VIEW telemetry_1d WITH (timescaledb.continuous) AS
SELECT time_bucket('1 day', time) AS bucket, device_id, 
       AVG(moisture_lvl) as avg_moisture, MIN(moisture_lvl) as min_moisture, MAX(moisture_lvl) as max_moisture
FROM telemetry GROUP BY bucket, device_id;

-- Widok 15-minutowy odświeża się co 15 minut
SELECT add_continuous_aggregate_policy('telemetry_15m',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '15 minutes',
    schedule_interval => INTERVAL '15 minutes');

-- Widok godzinny odświeża się co godzinę
SELECT add_continuous_aggregate_policy('telemetry_1h',
    start_offset => INTERVAL '4 weeks',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Widok dzienny odświeża się co 24 godziny
SELECT add_continuous_aggregate_policy('telemetry_1d',
    start_offset => INTERVAL '6 months',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');
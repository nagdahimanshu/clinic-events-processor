# Client Events Processor

A Node.js service that streams and processes clinic event data from CSV files, computes weekly analytics and reports live progress to Slack

## Requirements

- Upload CSV files via web interface
- Stream and process CSV files without loading entire file into memory
- Send Slack notification when processing starts
- Send progress updates every 10 seconds with live metrics (rows processed, revenue, errors)
- Send completion message
- Calculate week-by-week metrics: revenue totals, revenue per treatment, appointments, bookings

## Assumptions

- CSV files contain patient event data with timestamps, revenue amounts and treatment types
- Required CSV fields are: `event_id`, `clinic_id`, `patient_id`, `event_type`, `event_timestamp`
- Only `TREATMENT_COMPLETED` events have revenue values
- Revenue is tracked by `treatment_type` column not `event_type`
- No database persistence required

## Tech Stack

- Node.js + TypeScript
- Express.js
- AWS S3 (optional, configurable)
- Winston (structured logging)
- Docker + Docker Compose

## Architecture

The application follows a clean layered architecture:

```
Routes → Controllers → Services → Domain
```

- **Domain Layer**: Pure business logic (CSV processing, incremental analytics)
- **Services Layer**: Infrastructure (Slack, S3 storage, upload, process)
- **Controllers**: HTTP request handling
- **Routes**:  HTTP route definitions

Please check [ARCHITECTURE_DECISIONS.md](docs/ARCHITECTURE_DECISIONS.md) for detailed architecture decisions and trade-offs.

## Getting Started

### Option 1: Running Locally

You will need Node.js 20+ installed.

#### 1. Clone and Install

```bash
git clone https://github.com/nagdahimanshu/clinic-events-processor.git
cd clinic-events-processor
npm install
```

#### 2. Set Up Environment File

**Note:** This step is required for both local and Docker setups.

Copy `.env.example` to `.env` and update the configuration:

```bash
cp env.example .env
```

**Required Configuration:**
- `SLACK_WEBHOOK_URL` - Your Slack incoming webhook URL for notifications

**Optional Configuration:**
- `PORT` - Server port (defaults to 3000)
- `SKIP_S3` - Set to `true` to skip S3 and process directly from stream (defaults to true)
- `S3_BUCKET` - S3 bucket name (only needed if using S3)
- `AWS_ACCESS_KEY_ID` - AWS credentials (only needed if using S3)
- `AWS_SECRET_ACCESS_KEY` - AWS credentials (only needed if using S3)
- `LOG_LEVEL` - Logging level: debug, info, warn, error

#### 3. Start the Application

```bash
npm run dev
```

This will:
- Start the Express server on port 3000
- Serve the frontend at http://localhost:3000

Check if the server is running at: `http://localhost:3000/health` and it should return `{"status":"ok"}`

### Option 2: Running with Docker

**Note:** Make sure you've completed the "Set Up Environment File" step above before running Docker.

Run the application with Docker Compose:

```bash
cd docker
docker-compose up -d --build
```

This builds the Docker image and starts the application. The `--build` flag ensures the image is rebuilt every time.

Access the application at: `http://localhost:3000`


## API Endpoints

- `POST /api/upload` - Upload and process CSV file
- `GET /health` - Health check endpoint
- `GET /metrics` - Prometheus metrics endpoint

## CSV File Format

Your CSV file should include these columns:

**Required Fields:**
The following fields are mandatory and must be present in every row:
- `event_id` - Unique event identifier (string, non-empty)
- `clinic_id` - Clinic identifier (string, non-empty)
- `patient_id` - Patient identifier (string, non-empty)
- `event_type` - Type of event (string, non-empty, e.g., TREATMENT_COMPLETED, APPOINTMENT_CREATED)
- `event_timestamp` - ISO 8601 timestamp (e.g., 2024-12-11T09:01:00.000Z)

**Optional Fields:**
- `appointment_id` - Appointment identifier
- `treatment_id` - Treatment identifier
- `channel` - Channel through which the event occurred
- `treatment_type` - Type of treatment (e.g., implants, veneers, aligners) - used for revenue breakdown
- `appointment_status_snapshot` - Status of the appointment
- `revenue_amount` - Revenue amount (numeric, must be non-negative if provided, only for TREATMENT_COMPLETED events)
- `doctor_id` - Doctor identifier
- `notes` - Additional notes

**Validation:**
- `event_timestamp` must be a valid ISO 8601 date format
- `revenue_amount` must be a valid number and non-negative (if provided)

## Development

### Scripts

- `npm run dev` - Start dev server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:coverage` - Generate coverage report

## Future Improvements

If I had more time to work on this, here are the key things I would focus on to make it production ready and scalable:
- I would probably migrate processing to an async queue (SQS) so uploads don't block and we can handle more concurrent requests.
- Right now Slack notifications can fail silently. I would add retry logic with exponential backoff so notifications are more reliable.
- Add CSV rows validation in order to avoid processing invalid rows
- Also need to add rate limiting per user or IP to prevent abuse.
- Right now there are only a few unit tests. I would add integration tests for the API endpoints and some basic E2E tests.
- Handle CSV parsing edge cases like unclosed quotes, wrong delimiters and corrupted files.
- Create idempotent keys based on file content (e.g., file hash) so the same file uploaded concurrently by different users doesn't cause race conditions or duplicate processing.

# Parent Notes API Documentation

This document details the API endpoints for parents to view notes and announcements from the organizations their children are associated with.

## Base URL
`/api/users/parent/notes`

---

## 1. Get All Notes
Retrieve a history of notes. Filters can be applied.

**Endpoint:** `GET /`

**Query Parameters:**

| Parameter        | Type     | Required | Description                                                        |
| :--------------- | :------- | :------- | :----------------------------------------------------------------- |
| `year`           | `number` | No       | Filter by year (e.g., `2024`).                                     |
| `month`          | `number` | No       | Filter by month (1-12).                                            |
| `type`           | `string` | No       | Filter by type: `holiday`, `event`, `other`.                       |
| `status`         | `string` | No       | Filter by status: `active`, `cancelled`, `all`. Default: `active`. |
| `organizationId` | `string` | No       | Filter notes from a specific organization.                         |

**Success Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "notes": [
      {
        "id": "uuid",
        "title": "School Holiday",
        "description": "National holiday.",
        "date": "2024-12-25",
        "type": "holiday",
        "cancelRides": true,
        "status": "active",
        "organizationId": "uuid",
        "organization": {
            "name": "Sunshine School",
            "logo": "url_to_logo"
        },
        "dayName": "Wednesday",
        "createdAt": "2024-12-01T10:00:00.000Z"
      }
    ],
    "byType": {
      "holidays": 1,
      "events": 0,
      "other": 0
    },
    "total": 1
  }
}
```

---

## 2. Get Upcoming Notes
Retrieve notes occurring in the near future (e.g., next 30 days).

**Endpoint:** `GET /upcoming`

**Query Parameters:**

| Parameter | Type     | Required | Description                   | Default |
| :-------- | :------- | :------- | :---------------------------- | :------ |
| `days`    | `number` | No       | Number of days to look ahead. | `30`    |

**Success Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "notes": [
      {
        "id": "uuid",
        "title": "Exam Week",
        "description": "Midterm exams start.",
        "date": "2024-05-15",
        "type": "event",
        "cancelRides": false,
        "organization": {
            "name": "Sunshine School",
            "logo": "url_to_logo"
        },
        "dayName": "Wednesday",
        "daysUntil": 5
      }
    ],
    "total": 1
  }
}
```

---

## 3. Get Note By ID
Retrieve details of a specific note, including affected rides.

**Endpoint:** `GET /:id`

**Path Parameters:**

| Parameter | Type     | Required | Description         |
| :-------- | :------- | :------- | :------------------ |
| `id`      | `string` | Yes      | The ID of the note. |

**Success Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "note": {
      "id": "uuid",
      "title": "School Holiday",
      "description": "National holiday.",
      "date": "2024-12-25",
      "type": "holiday",
      "cancelRides": true,
      "status": "active",
      "organizationId": "uuid",
      "organization": {
          "name": "Sunshine School",
          "logo": "url_to_logo"
      },
      "dayName": "Wednesday",
      "createdAt": "2024-12-01T10:00:00.000Z"
    },
    "affectedRides": {
      "total": 2,
      "cancelled": 2,
      "list": [
        {
          "id": "uuid",
          "status": "cancelled",
          "rideName": "Morning Route A",
          "rideType": "pickup"
        }
      ]
    }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing parent ID or invalid parameters.
- `404 Not Found`: Note not found or parent does not have access to the organization.

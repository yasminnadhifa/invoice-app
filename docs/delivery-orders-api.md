# POST /api/delivery-orders

Create a new delivery order, optionally with attached files in a single request.

## Request

```
POST /api/delivery-orders
api-key: your-api-key-here
Content-Type: multipart/form-data
```

## Form Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `data` | string | Yes | Delivery order payload as a JSON string — see schema below |
| `files` | file | No | One or more files to attach (repeat field for multiple files) |

## `data` JSON Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `docId` | string | Yes | Unique document ID (e.g. `DO-2026-0512`) |
| `currency` | string | Yes | ISO 4217 currency code (e.g. `USD`, `IDR`) |
| `deliveryDate` | string | Yes | ISO 8601 date (e.g. `2026-05-22`) |
| `sender` | object | Yes | Sender info — see below |
| `recipient` | object | Yes | Recipient info — see below |
| `items` | array | Yes | Line items — see below |
| `subtotal` | number | Yes | Sum of all item `totalPrice` |
| `total` | number | Yes | Final total after shipping and tax |
| `poReference` | string | No | Purchase order reference number |
| `shippingFee` | number | No | Shipping cost (default `0`) |
| `taxRate` | number | No | Tax rate as decimal, e.g. `0.08875` for 8.875% (default `0`) |
| `taxAmount` | number | No | Computed tax amount (default `0`) |
| `status` | string | No | `draft` \| `sent` \| `delivered` \| `cancelled` (default `draft`) |

### `sender` / `recipient`

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Company or person name |
| `address` | string | Yes | Full address — use `\n` for line breaks |
| `phone` | string | Yes | Phone number |

### `items[]`

| Field | Type | Required | Description |
|---|---|---|---|
| `lineNumber` | number | Yes | Line number (1-based) |
| `sku` | string | Yes | SKU / product code |
| `description` | string | Yes | Product description |
| `quantity` | number | Yes | Quantity |
| `unit` | string | Yes | Unit of measure (e.g. `Unit`, `Set`, `Kit`) |
| `unitPrice` | number | Yes | Price per unit |
| `totalPrice` | number | Yes | `quantity × unitPrice` |

## Example

### cURL

```bash
curl -X POST https://your-domain.com/api/delivery-orders \
  -H "api-key: your-api-key-here" \
  -F 'data={
    "docId": "DO-2026-0512",
    "poReference": "PO-2026-001",
    "currency": "USD",
    "deliveryDate": "2026-05-22",
    "sender": {
      "name": "Nexus Technology Solutions, Inc.",
      "address": "1600 Amphitheatre Pkwy\nMountain View, CA 94043\nUnited States",
      "phone": "+1 (650) 555-0199"
    },
    "recipient": {
      "name": "Swift Logistics Corp.",
      "address": "350 Fifth Avenue, Suite 6000\nNew York, NY 10118\nUnited States",
      "phone": "+1 (212) 555-0100"
    },
    "items": [
      {
        "lineNumber": 1,
        "sku": "SKU-A001",
        "description": "Dell Latitude 5540 Laptop i7-1356U 16GB 512GB SSD",
        "quantity": 10,
        "unit": "Unit",
        "unitPrice": 1250.00,
        "totalPrice": 12500.00
      }
    ],
    "subtotal": 12500.00,
    "shippingFee": 250.00,
    "taxRate": 0.08875,
    "taxAmount": 1109.38,
    "total": 13859.38
  }' \
  -F "files=@/path/to/packing-list.pdf" \
  -F "files=@/path/to/photo.jpg"
```

### JavaScript (fetch)

```js
const formData = new FormData();

formData.append("data", JSON.stringify({
  docId: "DO-2026-0512",
  poReference: "PO-2026-001",
  currency: "USD",
  deliveryDate: "2026-05-22",
  sender: {
    name: "Nexus Technology Solutions, Inc.",
    address: "1600 Amphitheatre Pkwy\nMountain View, CA 94043\nUnited States",
    phone: "+1 (650) 555-0199"
  },
  recipient: {
    name: "Swift Logistics Corp.",
    address: "350 Fifth Avenue, Suite 6000\nNew York, NY 10118\nUnited States",
    phone: "+1 (212) 555-0100"
  },
  items: [
    {
      lineNumber: 1,
      sku: "SKU-A001",
      description: "Dell Latitude 5540 Laptop i7-1356U 16GB 512GB SSD",
      quantity: 10,
      unit: "Unit",
      unitPrice: 1250.00,
      totalPrice: 12500.00
    }
  ],
  subtotal: 12500.00,
  shippingFee: 250.00,
  taxRate: 0.08875,
  taxAmount: 1109.38,
  total: 13859.38
}));

formData.append("files", packingListFile);  // File object
formData.append("files", photoFile);        // File object (repeat for multiple)

const res = await fetch("/api/delivery-orders", {
  method: "POST",
  headers: { "api-key": "your-api-key-here" },
  body: formData,
});
```

## Responses

### `201 Created`

```json
{
  "_id": "6847f2a1c3e2b10012a4d891",
  "documentType": "do",
  "docId": "DO-2026-0512",
  "poReference": "PO-2026-001",
  "currency": "USD",
  "deliveryDate": "2026-05-22T00:00:00.000Z",
  "status": "draft",
  "sender": { "name": "Nexus Technology Solutions, Inc.", "address": "...", "phone": "..." },
  "recipient": { "name": "Swift Logistics Corp.", "address": "...", "phone": "..." },
  "items": [...],
  "subtotal": 12500,
  "shippingFee": 250,
  "taxRate": 0.08875,
  "taxAmount": 1109.38,
  "total": 13859.38,
  "createdBy": "69faa99110af68af4b3baf9c",
  "createdAt": "2026-06-03T08:00:00.000Z",
  "updatedAt": "2026-06-03T08:00:00.000Z",
  "attachments": [
    {
      "_id": "6847f3b2d4f1c20023b5e902",
      "filename": "1748937600000-packing-list.pdf",
      "originalName": "packing-list.pdf",
      "fileUrl": "https://your-blob-store.vercel-storage.com/attachments/1748937600000-packing-list.pdf",
      "entityType": "delivery-order",
      "entityId": "6847f2a1c3e2b10012a4d891",
      "fileType": "original",
      "createdAt": "2026-06-03T08:00:00.000Z"
    }
  ]
}
```

> `attachments` is an empty array `[]` if no files were sent.

### `400 Bad Request` — Missing `data` field

```json
{
  "message": "Missing field: data (JSON string)"
}
```

### `400 Bad Request` — Invalid JSON in `data`

```json
{
  "message": "Invalid JSON in field: data"
}
```

### `400 Bad Request` — Missing required fields inside `data`

```json
{
  "message": "Missing required fields",
  "errors": {
    "docId": "Required",
    "deliveryDate": "Required"
  }
}
```

### `401 Unauthorized`

```json
{
  "message": "Invalid API key"
}
```

### `409 Conflict` — `docId` already exists

```json
{
  "message": "Delivery order ID already exists"
}
```

### `500 Internal Server Error`

```json
{
  "message": "Internal server error",
  "errors": "..."
}
```

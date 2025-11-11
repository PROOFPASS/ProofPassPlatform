# @proofpass/templates

Predefined attestation templates with built-in validation for ProofPass.

## Installation

```bash
npm install @proofpass/templates
```

## Quick Start

```typescript
import { templates, validateClaims } from '@proofpass/templates';

// Validate claims against a template
const claims = {
  firstName: 'Alice',
  lastName: 'Smith',
  dateOfBirth: '1990-01-01',
  nationality: 'US',
  email: 'alice@example.com'
};

const result = validateClaims('identity', claims);

if (result.success) {
  console.log('✓ Valid claims:', result.data);
} else {
  console.error('✗ Validation errors:', result.errors);
}
```

## Available Templates

### Identity Verification (`identity`)

Personal identity attestation for KYC/AML compliance.

**Fields:**
- `firstName`: string (required)
- `lastName`: string (required)
- `dateOfBirth`: string (YYYY-MM-DD, required)
- `nationality`: string (ISO 3166-1 alpha-2, required)
- `idNumber`: string (optional)
- `email`: string (optional)
- `phone`: string (optional)

**Default expiration:** 1 year

```typescript
import { identityTemplate, validateClaims } from '@proofpass/templates';

const claims = {
  firstName: 'Alice',
  lastName: 'Smith',
  dateOfBirth: '1990-01-01',
  nationality: 'US'
};

const result = validateClaims('identity', claims);
```

### Educational Credential (`education`)

Academic degrees and certificates.

**Fields:**
- `institution`: string (required)
- `degree`: 'associate' | 'bachelor' | 'master' | 'doctorate' | 'certificate' | 'diploma' (required)
- `fieldOfStudy`: string (required)
- `graduationDate`: string (YYYY-MM-DD, required)
- `gpa`: number (0-4, optional)
- `honors`: string (optional)
- `studentId`: string (optional)

**Default expiration:** None

```typescript
const claims = {
  institution: 'MIT',
  degree: 'bachelor',
  fieldOfStudy: 'Computer Science',
  graduationDate: '2024-05-15',
  gpa: 3.8
};

validateClaims('education', claims);
```

### Employment Verification (`employment`)

Work history and employment status.

**Fields:**
- `employer`: string (required)
- `position`: string (required)
- `startDate`: string (YYYY-MM-DD, required)
- `endDate`: string (YYYY-MM-DD, optional)
- `responsibilities`: string[] (optional)
- `department`: string (optional)
- `employmentType`: 'full-time' | 'part-time' | 'contract' | 'intern' (optional)

**Default expiration:** 2 years

```typescript
const claims = {
  employer: 'Acme Corp',
  position: 'Senior Developer',
  startDate: '2020-01-01',
  employmentType: 'full-time'
};

validateClaims('employment', claims);
```

### Professional License (`license`)

Professional licenses and certifications.

**Fields:**
- `type`: string (required)
- `licenseNumber`: string (required)
- `issuingAuthority`: string (required)
- `issueDate`: string (YYYY-MM-DD, required)
- `expirationDate`: string (YYYY-MM-DD, optional)
- `status`: 'active' | 'expired' | 'suspended' | 'revoked' (required)
- `restrictions`: string[] (optional)

**Default expiration:** Based on expirationDate

```typescript
const claims = {
  type: 'Medical License',
  licenseNumber: 'MD-12345',
  issuingAuthority: 'State Medical Board',
  issueDate: '2015-06-01',
  expirationDate: '2025-06-01',
  status: 'active'
};

validateClaims('license', claims);
```

### Age Verification (`age-verification`)

Age verification for age-gated content.

**Fields:**
- `over18`: boolean (required)
- `over21`: boolean (optional)
- `verificationDate`: string (YYYY-MM-DD, required)
- `verificationMethod`: 'id-document' | 'biometric' | 'third-party' (required)

**Default expiration:** 30 days

```typescript
const claims = {
  over18: true,
  over21: true,
  verificationDate: '2024-01-01',
  verificationMethod: 'id-document'
};

validateClaims('age-verification', claims);
```

## API Reference

### `validateClaims(templateId, claims)`

Validate claims against a template schema.

**Returns:** `ValidationResult<T>`
- `success`: boolean
- `data`: T (if valid)
- `errors`: ZodError (if invalid)

### `getTemplate(templateId)`

Get a template by ID.

**Returns:** `AttestationTemplate | undefined`

### `listTemplates()`

Get all available templates.

**Returns:** `AttestationTemplate[]`

### `getTemplatesByCategory(category)`

Get templates filtered by category.

**Returns:** `AttestationTemplate[]`

### `createCustomTemplate(id, template)`

Create a custom template.

```typescript
import { createCustomTemplate } from '@proofpass/templates';
import { z } from 'zod';

const customTemplate = createCustomTemplate('driver-license', {
  name: 'Driver License',
  description: 'Driver license verification',
  category: 'License',
  schema: z.object({
    licenseNumber: z.string(),
    state: z.string(),
    class: z.string(),
    restrictions: z.array(z.string()).optional()
  }),
  example: {
    licenseNumber: 'D1234567',
    state: 'CA',
    class: 'C'
  },
  defaultExpiration: 5 * 365 * 24 * 60 * 60
});
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  AttestationTemplate,
  ValidationResult,
  IdentityClaims,
  EducationClaims,
  EmploymentClaims,
  LicenseClaims,
  AgeVerificationClaims
} from '@proofpass/templates';

const identityClaims: IdentityClaims = {
  firstName: 'Alice',
  lastName: 'Smith',
  dateOfBirth: '1990-01-01',
  nationality: 'US'
};
```

## Integration with ProofPass SDK

Use templates with the ProofPass SDK:

```typescript
import ProofPass from '@proofpass/client';
import { validateClaims } from '@proofpass/templates';

const proofpass = new ProofPass('your-api-key');

// Validate before creating
const claims = {
  firstName: 'Alice',
  lastName: 'Smith',
  dateOfBirth: '1990-01-01',
  nationality: 'US'
};

const validation = validateClaims('identity', claims);

if (validation.success) {
  const attestation = await proofpass.attestations.create({
    type: 'identity',
    subject: 'did:key:z6Mkf...',
    claims: validation.data
  });
}
```

## Best Practices

### 1. Always Validate Before Creating Attestations

```typescript
// ✅ Good - Validate first
const validation = validateClaims('identity', claims);
if (validation.success) {
  await proofpass.attestations.create({
    type: 'identity',
    subject: 'did:key:...',
    claims: validation.data
  });
}

// ❌ Bad - No validation
await proofpass.attestations.create({
  type: 'identity',
  subject: 'did:key:...',
  claims: untrustedUserInput  // Dangerous!
});
```

### 2. Handle Validation Errors Gracefully

```typescript
import { validateClaims } from '@proofpass/templates';

const validation = validateClaims('identity', claims);

if (!validation.success) {
  // Extract specific field errors
  const errors = validation.errors.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message
  }));

  console.error('Validation failed:', errors);

  // Example output:
  // [
  //   { field: 'firstName', message: 'Required' },
  //   { field: 'dateOfBirth', message: 'Invalid date format' }
  // ]
}
```

### 3. Use TypeScript for Type Safety

```typescript
import type { IdentityClaims } from '@proofpass/templates';
import { validateClaims } from '@proofpass/templates';

// TypeScript ensures you provide the right structure
const claims: IdentityClaims = {
  firstName: 'Alice',
  lastName: 'Smith',
  dateOfBirth: '1990-01-01',
  nationality: 'US'
};

const validation = validateClaims('identity', claims);
```

### 4. Reuse Template References

```typescript
import { getTemplate } from '@proofpass/templates';

// Get template once
const identityTemplate = getTemplate('identity');

if (identityTemplate) {
  console.log('Template name:', identityTemplate.name);
  console.log('Required fields:', Object.keys(identityTemplate.schema.shape));
  console.log('Example:', identityTemplate.example);
}
```

## Advanced Usage

### Custom Template Creation

Create organization-specific templates:

```typescript
import { createCustomTemplate } from '@proofpass/templates';
import { z } from 'zod';

// Create a custom template for your organization
const healthcareTemplate = createCustomTemplate('patient-record', {
  name: 'Patient Medical Record',
  description: 'Electronic health record attestation',
  category: 'Healthcare',
  schema: z.object({
    patientId: z.string().min(1),
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    allergies: z.array(z.string()).optional(),
    medications: z.array(z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string()
    })).optional(),
    chronicConditions: z.array(z.string()).optional()
  }),
  example: {
    patientId: 'P12345',
    bloodType: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    medications: [
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Daily'
      }
    ],
    chronicConditions: ['Type 2 Diabetes']
  },
  defaultExpiration: 90 * 24 * 60 * 60  // 90 days
});

// Use the custom template
const claims = {
  patientId: 'P12345',
  bloodType: 'O+',
  allergies: ['Penicillin']
};

const validation = validateClaims('patient-record', claims);
```

### Batch Validation

Validate multiple claims at once:

```typescript
import { validateClaims } from '@proofpass/templates';

interface ValidationTask {
  templateId: string;
  claims: Record<string, any>;
}

async function batchValidate(tasks: ValidationTask[]) {
  return tasks.map(task => ({
    templateId: task.templateId,
    claims: task.claims,
    result: validateClaims(task.templateId, task.claims)
  }));
}

// Usage
const tasks = [
  { templateId: 'identity', claims: { firstName: 'Alice', lastName: 'Smith', /* ... */ } },
  { templateId: 'education', claims: { institution: 'MIT', degree: 'bachelor', /* ... */ } },
  { templateId: 'employment', claims: { employer: 'Acme Corp', position: 'Developer', /* ... */ } }
];

const results = await batchValidate(tasks);

const allValid = results.every(r => r.result.success);
if (allValid) {
  console.log('All claims valid');
}
```

### Template Categories

Filter templates by category:

```typescript
import { getTemplatesByCategory, listTemplates } from '@proofpass/templates';

// Get all identity-related templates
const identityTemplates = getTemplatesByCategory('Identity');
console.log(`Found ${identityTemplates.length} identity templates`);

// List all templates
const allTemplates = listTemplates();
console.log('Available templates:', allTemplates.map(t => t.id));
```

## Framework Integration

### React Form Validation

```typescript
import React, { useState } from 'react';
import { validateClaims } from '@proofpass/templates';
import type { IdentityClaims } from '@proofpass/templates';

function IdentityForm() {
  const [claims, setClaims] = useState<Partial<IdentityClaims>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateClaims('identity', claims);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.errors.issues.forEach(issue => {
        const field = issue.path.join('.');
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Submit valid claims
    console.log('Valid claims:', validation.data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="First Name"
        value={claims.firstName || ''}
        onChange={(e) => setClaims({ ...claims, firstName: e.target.value })}
      />
      {errors.firstName && <span className="error">{errors.firstName}</span>}

      <input
        type="text"
        placeholder="Last Name"
        value={claims.lastName || ''}
        onChange={(e) => setClaims({ ...claims, lastName: e.target.value })}
      />
      {errors.lastName && <span className="error">{errors.lastName}</span>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Express.js Middleware

```typescript
import express from 'express';
import { validateClaims } from '@proofpass/templates';

const app = express();
app.use(express.json());

// Validation middleware
const validateTemplate = (templateId: string) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const validation = validateClaims(templateId, req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        issues: validation.errors.issues
      });
    }

    req.body = validation.data;  // Use validated data
    next();
  };
};

// Use middleware
app.post('/api/identity', validateTemplate('identity'), (req, res) => {
  // req.body is now validated
  res.json({ success: true, claims: req.body });
});
```

## Building

```bash
npm run build
```

This compiles TypeScript to JavaScript and generates type declaration files in `./dist`.

## Testing

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Related Packages

- `@proofpass/client` - API client for ProofPass Platform
- `@proofpass/vc-toolkit` - Create and verify verifiable credentials
- `@proofpass/types` - TypeScript type definitions
- `@proofpass/qr-toolkit` - QR code generation for credentials

## Dependencies

This package uses [Zod](https://zod.dev/) for schema validation, providing:
- Runtime type checking
- Detailed error messages
- TypeScript type inference
- Composable schemas

## License

LGPL-3.0

## Support

- **Documentation:** [https://docs.proofpass.com](https://docs.proofpass.com)
- **GitHub Issues:** [https://github.com/PROOFPASS/ProofPassPlatform/issues](https://github.com/PROOFPASS/ProofPassPlatform/issues)
- **Email:** fboiero@frvm.utn.edu.ar

/**
 * Tests para ProofPass Templates
 * Coverage objetivo: 100%
 */

import {
  templates,
  validateClaims,
  getTemplate,
  listTemplates,
  getTemplatesByCategory,
  createCustomTemplate,
  identityTemplate,
  educationTemplate,
  employmentTemplate,
  licenseTemplate,
  ageVerificationTemplate,
  identitySchema,
  educationSchema,
  employmentSchema,
  licenseSchema,
  ageVerificationSchema,
  type IdentityClaims,
  type EducationClaims,
  type EmploymentClaims,
  type LicenseClaims,
  type AgeVerificationClaims,
} from '../src/index';
import { z } from 'zod';

describe('ProofPass Templates', () => {
  describe('Identity Template', () => {
    it('debe tener la estructura correcta', () => {
      expect(identityTemplate.id).toBe('identity');
      expect(identityTemplate.name).toBe('Identity Verification');
      expect(identityTemplate.category).toBe('Identity');
      expect(identityTemplate.defaultExpiration).toBe(365 * 24 * 60 * 60);
      expect(identityTemplate.example).toBeDefined();
    });

    it('debe validar claims válidos', () => {
      const validClaims: IdentityClaims = {
        firstName: 'Alice',
        lastName: 'Smith',
        dateOfBirth: '1990-01-01',
        nationality: 'US',
        email: 'alice@example.com',
      };

      const result = validateClaims('identity', validClaims);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validClaims);
      expect(result.errors).toBeUndefined();
    });

    it('debe validar claims mínimos requeridos', () => {
      const minimalClaims: IdentityClaims = {
        firstName: 'Bob',
        lastName: 'Johnson',
        dateOfBirth: '1985-05-15',
        nationality: 'CA',
      };

      const result = validateClaims('identity', minimalClaims);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(minimalClaims);
    });

    it('debe rechazar firstName vacío', () => {
      const claims = {
        firstName: '',
        lastName: 'Smith',
        dateOfBirth: '1990-01-01',
        nationality: 'US',
      };

      const result = validateClaims('identity', claims);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('debe rechazar lastName vacío', () => {
      const claims = {
        firstName: 'Alice',
        lastName: '',
        dateOfBirth: '1990-01-01',
        nationality: 'US',
      };

      const result = validateClaims('identity', claims);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('debe rechazar formato de fecha inválido', () => {
      const claims = {
        firstName: 'Alice',
        lastName: 'Smith',
        dateOfBirth: '01-01-1990', // Formato incorrecto
        nationality: 'US',
      };

      const result = validateClaims('identity', claims);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('debe rechazar código de país inválido', () => {
      const claims = {
        firstName: 'Alice',
        lastName: 'Smith',
        dateOfBirth: '1990-01-01',
        nationality: 'USA', // Debe ser 2 letras
      };

      const result = validateClaims('identity', claims);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('debe rechazar email inválido', () => {
      const claims = {
        firstName: 'Alice',
        lastName: 'Smith',
        dateOfBirth: '1990-01-01',
        nationality: 'US',
        email: 'not-an-email',
      };

      const result = validateClaims('identity', claims);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('debe aceptar campos opcionales', () => {
      const claims: IdentityClaims = {
        firstName: 'Alice',
        lastName: 'Smith',
        dateOfBirth: '1990-01-01',
        nationality: 'US',
        idNumber: 'ID123456',
        phone: '+1234567890',
      };

      const result = validateClaims('identity', claims);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(claims);
    });
  });

  describe('Education Template', () => {
    it('debe tener la estructura correcta', () => {
      expect(educationTemplate.id).toBe('education');
      expect(educationTemplate.name).toBe('Educational Credential');
      expect(educationTemplate.category).toBe('Education');
      expect(educationTemplate.defaultExpiration).toBeUndefined();
    });

    it('debe validar claims válidos', () => {
      const validClaims: EducationClaims = {
        institution: 'MIT',
        degree: 'bachelor',
        fieldOfStudy: 'Computer Science',
        graduationDate: '2024-05-15',
        gpa: 3.8,
      };

      const result = validateClaims('education', validClaims);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validClaims);
    });

    it('debe validar todos los tipos de degrees', () => {
      const degrees = ['associate', 'bachelor', 'master', 'doctorate', 'certificate', 'diploma'] as const;

      degrees.forEach(degree => {
        const claims = {
          institution: 'University',
          degree,
          fieldOfStudy: 'Test Field',
          graduationDate: '2024-01-01',
        };

        const result = validateClaims('education', claims);
        expect(result.success).toBe(true);
      });
    });

    it('debe rechazar tipo de degree inválido', () => {
      const claims = {
        institution: 'MIT',
        degree: 'invalid-degree',
        fieldOfStudy: 'Computer Science',
        graduationDate: '2024-05-15',
      };

      const result = validateClaims('education', claims);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('debe rechazar GPA fuera de rango', () => {
      const claims1 = {
        institution: 'MIT',
        degree: 'bachelor',
        fieldOfStudy: 'CS',
        graduationDate: '2024-01-01',
        gpa: -0.1,
      };

      const result1 = validateClaims('education', claims1);
      expect(result1.success).toBe(false);

      const claims2 = {
        ...claims1,
        gpa: 4.1,
      };

      const result2 = validateClaims('education', claims2);
      expect(result2.success).toBe(false);
    });

    it('debe aceptar campos opcionales', () => {
      const claims: EducationClaims = {
        institution: 'MIT',
        degree: 'master',
        fieldOfStudy: 'AI',
        graduationDate: '2024-01-01',
        honors: 'Summa Cum Laude',
        studentId: 'STU-123',
      };

      const result = validateClaims('education', claims);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(claims);
    });
  });

  describe('Employment Template', () => {
    it('debe tener la estructura correcta', () => {
      expect(employmentTemplate.id).toBe('employment');
      expect(employmentTemplate.name).toBe('Employment Verification');
      expect(employmentTemplate.category).toBe('Employment');
      expect(employmentTemplate.defaultExpiration).toBe(2 * 365 * 24 * 60 * 60);
    });

    it('debe validar claims válidos', () => {
      const validClaims: EmploymentClaims = {
        employer: 'Acme Corp',
        position: 'Senior Developer',
        startDate: '2020-01-01',
        endDate: '2024-01-01',
        employmentType: 'full-time',
      };

      const result = validateClaims('employment', validClaims);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validClaims);
    });

    it('debe validar employment sin endDate (empleo actual)', () => {
      const claims = {
        employer: 'Acme Corp',
        position: 'Developer',
        startDate: '2020-01-01',
      };

      const result = validateClaims('employment', claims);

      expect(result.success).toBe(true);
    });

    it('debe validar todos los tipos de employment', () => {
      const types = ['full-time', 'part-time', 'contract', 'intern'] as const;

      types.forEach(employmentType => {
        const claims = {
          employer: 'Company',
          position: 'Position',
          startDate: '2020-01-01',
          employmentType,
        };

        const result = validateClaims('employment', claims);
        expect(result.success).toBe(true);
      });
    });

    it('debe aceptar campos opcionales', () => {
      const claims: EmploymentClaims = {
        employer: 'Tech Inc',
        position: 'Lead Engineer',
        startDate: '2020-01-01',
        endDate: '2024-01-01',
        responsibilities: ['Code review', 'Team management'],
        department: 'Engineering',
        employmentType: 'full-time',
      };

      const result = validateClaims('employment', claims);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(claims);
    });

    it('debe rechazar employer vacío', () => {
      const claims = {
        employer: '',
        position: 'Developer',
        startDate: '2020-01-01',
      };

      const result = validateClaims('employment', claims);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('License Template', () => {
    it('debe tener la estructura correcta', () => {
      expect(licenseTemplate.id).toBe('license');
      expect(licenseTemplate.name).toBe('Professional License');
      expect(licenseTemplate.category).toBe('License');
      expect(licenseTemplate.defaultExpiration).toBeUndefined();
    });

    it('debe validar claims válidos', () => {
      const validClaims: LicenseClaims = {
        type: 'Medical License',
        licenseNumber: 'MD-12345',
        issuingAuthority: 'State Medical Board',
        issueDate: '2015-06-01',
        expirationDate: '2025-06-01',
        status: 'active',
      };

      const result = validateClaims('license', validClaims);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validClaims);
    });

    it('debe validar todos los status types', () => {
      const statuses = ['active', 'expired', 'suspended', 'revoked'] as const;

      statuses.forEach(status => {
        const claims = {
          type: 'License',
          licenseNumber: 'L-123',
          issuingAuthority: 'Authority',
          issueDate: '2020-01-01',
          status,
        };

        const result = validateClaims('license', claims);
        expect(result.success).toBe(true);
      });
    });

    it('debe validar license sin expirationDate', () => {
      const claims = {
        type: 'Permanent License',
        licenseNumber: 'P-999',
        issuingAuthority: 'Federal Authority',
        issueDate: '2020-01-01',
        status: 'active',
      };

      const result = validateClaims('license', claims);

      expect(result.success).toBe(true);
    });

    it('debe aceptar restrictions', () => {
      const claims: LicenseClaims = {
        type: 'Driving License',
        licenseNumber: 'DL-456',
        issuingAuthority: 'DMV',
        issueDate: '2020-01-01',
        expirationDate: '2030-01-01',
        status: 'active',
        restrictions: ['Corrective lenses required', 'Daylight driving only'],
      };

      const result = validateClaims('license', claims);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(claims);
    });

    it('debe rechazar licenseNumber vacío', () => {
      const claims = {
        type: 'License',
        licenseNumber: '',
        issuingAuthority: 'Authority',
        issueDate: '2020-01-01',
        status: 'active',
      };

      const result = validateClaims('license', claims);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Age Verification Template', () => {
    it('debe tener la estructura correcta', () => {
      expect(ageVerificationTemplate.id).toBe('age-verification');
      expect(ageVerificationTemplate.name).toBe('Age Verification');
      expect(ageVerificationTemplate.category).toBe('Identity');
      expect(ageVerificationTemplate.defaultExpiration).toBe(30 * 24 * 60 * 60);
    });

    it('debe validar claims válidos', () => {
      const validClaims: AgeVerificationClaims = {
        over18: true,
        over21: true,
        verificationDate: '2024-01-01',
        verificationMethod: 'id-document',
      };

      const result = validateClaims('age-verification', validClaims);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validClaims);
    });

    it('debe validar todos los verification methods', () => {
      const methods = ['id-document', 'biometric', 'third-party'] as const;

      methods.forEach(verificationMethod => {
        const claims = {
          over18: true,
          verificationDate: '2024-01-01',
          verificationMethod,
        };

        const result = validateClaims('age-verification', claims);
        expect(result.success).toBe(true);
      });
    });

    it('debe validar sin over21', () => {
      const claims = {
        over18: true,
        verificationDate: '2024-01-01',
        verificationMethod: 'biometric',
      };

      const result = validateClaims('age-verification', claims);

      expect(result.success).toBe(true);
    });

    it('debe rechazar verificationMethod inválido', () => {
      const claims = {
        over18: true,
        verificationDate: '2024-01-01',
        verificationMethod: 'invalid-method',
      };

      const result = validateClaims('age-verification', claims);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateClaims', () => {
    it('debe lanzar error para template no existente', () => {
      expect(() => {
        validateClaims('nonexistent-template', {});
      }).toThrow('Template not found: nonexistent-template');
    });

    it('debe retornar errors en ValidationResult', () => {
      const invalidClaims = {
        firstName: '',
        lastName: 'Test',
      };

      const result = validateClaims('identity', invalidClaims);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.data).toBeUndefined();
    });
  });

  describe('getTemplate', () => {
    it('debe retornar template existente', () => {
      const template = getTemplate('identity');

      expect(template).toBeDefined();
      expect(template?.id).toBe('identity');
      expect(template?.name).toBe('Identity Verification');
    });

    it('debe retornar undefined para template no existente', () => {
      const template = getTemplate('nonexistent');

      expect(template).toBeUndefined();
    });

    it('debe retornar todos los templates disponibles', () => {
      const ids = ['identity', 'education', 'employment', 'license', 'age-verification'];

      ids.forEach(id => {
        const template = getTemplate(id);
        expect(template).toBeDefined();
        expect(template?.id).toBe(id);
      });
    });
  });

  describe('listTemplates', () => {
    it('debe retornar todos los templates', () => {
      const allTemplates = listTemplates();

      // 13 templates: 5 base + 4 supply chain + 1 product + 1 health + 1 certification + 1 training
      expect(allTemplates.length).toBeGreaterThanOrEqual(5);
      expect(allTemplates).toContainEqual(identityTemplate);
      expect(allTemplates).toContainEqual(educationTemplate);
      expect(allTemplates).toContainEqual(employmentTemplate);
      expect(allTemplates).toContainEqual(licenseTemplate);
      expect(allTemplates).toContainEqual(ageVerificationTemplate);
    });

    it('debe retornar array con todos los IDs correctos', () => {
      const allTemplates = listTemplates();
      const ids = allTemplates.map(t => t.id);

      expect(ids).toContain('identity');
      expect(ids).toContain('education');
      expect(ids).toContain('employment');
      expect(ids).toContain('license');
      expect(ids).toContain('age-verification');
    });
  });

  describe('getTemplatesByCategory', () => {
    it('debe retornar templates de categoría Identity', () => {
      const identityTemplates = getTemplatesByCategory('Identity');

      expect(identityTemplates.length).toBe(2);
      expect(identityTemplates).toContainEqual(identityTemplate);
      expect(identityTemplates).toContainEqual(ageVerificationTemplate);
    });

    it('debe retornar templates de categoría Education', () => {
      const educationTemplates = getTemplatesByCategory('Education');

      // 2 templates: education + training
      expect(educationTemplates.length).toBeGreaterThanOrEqual(1);
      expect(educationTemplates).toContainEqual(educationTemplate);
    });

    it('debe retornar templates de categoría Employment', () => {
      const employmentTemplates = getTemplatesByCategory('Employment');

      expect(employmentTemplates.length).toBe(1);
      expect(employmentTemplates).toContainEqual(employmentTemplate);
    });

    it('debe retornar templates de categoría License', () => {
      const licenseTemplates = getTemplatesByCategory('License');

      expect(licenseTemplates.length).toBe(1);
      expect(licenseTemplates).toContainEqual(licenseTemplate);
    });

    it('debe retornar array vacío para categoría no existente', () => {
      const nonexistent = getTemplatesByCategory('Nonexistent');

      expect(nonexistent).toEqual([]);
    });
  });

  describe('createCustomTemplate', () => {
    it('debe crear un template custom', () => {
      const customSchema = z.object({
        customField: z.string(),
      });

      const customTemplate = createCustomTemplate('custom-test', {
        name: 'Custom Test Template',
        description: 'A custom template for testing',
        category: 'Test',
        schema: customSchema,
        example: { customField: 'test' },
      });

      expect(customTemplate.id).toBe('custom-test');
      expect(customTemplate.name).toBe('Custom Test Template');
      expect(customTemplate.category).toBe('Test');
    });

    it('debe agregar template custom al registry', () => {
      const customSchema = z.object({
        field1: z.string(),
        field2: z.number(),
      });

      createCustomTemplate('custom-registry', {
        name: 'Registry Test',
        description: 'Test',
        category: 'Test',
        schema: customSchema,
        example: { field1: 'test', field2: 123 },
      });

      const retrieved = getTemplate('custom-registry');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('custom-registry');
    });

    it('debe permitir validar con template custom', () => {
      const customSchema = z.object({
        username: z.string().min(3),
        age: z.number().min(0).max(120),
      });

      createCustomTemplate('user-profile', {
        name: 'User Profile',
        description: 'User profile template',
        category: 'Social',
        schema: customSchema,
        example: { username: 'alice', age: 30 },
      });

      const validClaims = {
        username: 'bob',
        age: 25,
      };

      const result = validateClaims('user-profile', validClaims);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validClaims);
    });

    it('debe soportar defaultExpiration en template custom', () => {
      const customSchema = z.object({
        value: z.string(),
      });

      const customTemplate = createCustomTemplate('with-expiration', {
        name: 'With Expiration',
        description: 'Test',
        category: 'Test',
        schema: customSchema,
        example: { value: 'test' },
        defaultExpiration: 7 * 24 * 60 * 60, // 7 days
      });

      expect(customTemplate.defaultExpiration).toBe(7 * 24 * 60 * 60);
    });
  });

  describe('Templates Registry', () => {
    it('debe contener todos los templates predefinidos', () => {
      expect(templates['identity']).toBe(identityTemplate);
      expect(templates['education']).toBe(educationTemplate);
      expect(templates['employment']).toBe(employmentTemplate);
      expect(templates['license']).toBe(licenseTemplate);
      expect(templates['age-verification']).toBe(ageVerificationTemplate);
    });

    it('debe tener 5 templates por defecto', () => {
      const initialCount = Object.keys(templates).length;
      expect(initialCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Flujo end-to-end completo', () => {
    it('debe completar flujo: list -> get -> validate', () => {
      // 1. List all templates
      const allTemplates = listTemplates();
      expect(allTemplates.length).toBeGreaterThanOrEqual(5);

      // 2. Get specific template
      const eduTemplate = getTemplate('education');
      expect(eduTemplate).toBeDefined();

      // 3. Validate with template
      const claims: EducationClaims = {
        institution: 'Stanford',
        degree: 'master',
        fieldOfStudy: 'Machine Learning',
        graduationDate: '2024-06-01',
        gpa: 3.9,
      };

      const result = validateClaims('education', claims);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(claims);
    });

    it('debe completar flujo: create custom -> validate -> get by category', () => {
      // 1. Create custom template
      const customSchema = z.object({
        skill: z.string(),
        level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
        yearsExperience: z.number().min(0),
      });

      const skillTemplate = createCustomTemplate('skill-attestation', {
        name: 'Skill Attestation',
        description: 'Professional skill verification',
        category: 'Professional',
        schema: customSchema,
        example: {
          skill: 'TypeScript',
          level: 'expert',
          yearsExperience: 5,
        },
        defaultExpiration: 180 * 24 * 60 * 60, // 180 days
      });

      expect(skillTemplate.id).toBe('skill-attestation');

      // 2. Validate with custom template
      const claims = {
        skill: 'React',
        level: 'advanced',
        yearsExperience: 3,
      };

      const result = validateClaims('skill-attestation', claims);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(claims);

      // 3. Get by category
      const professionalTemplates = getTemplatesByCategory('Professional');
      expect(professionalTemplates.length).toBeGreaterThanOrEqual(1);
      expect(professionalTemplates).toContainEqual(skillTemplate);
    });

    it('debe manejar validación fallida con detalles de error', () => {
      const invalidClaims = {
        firstName: 'A',
        lastName: 'B',
        dateOfBirth: 'invalid-date',
        nationality: 'INVALID',
        email: 'not-email',
      };

      const result = validateClaims('identity', invalidClaims);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.issues.length).toBeGreaterThan(0);
    });
  });
});

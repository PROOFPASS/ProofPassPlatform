-- Seed attestation templates

INSERT INTO attestation_templates (name, description, type, schema, example_claims) VALUES
(
  'Battery Passport',
  'Comprehensive battery lifecycle attestation for EU Battery Regulation compliance',
  'BatteryPassport',
  '{
    "type": "object",
    "properties": {
      "manufacturer": {"type": "string"},
      "model": {"type": "string"},
      "chemistry": {"type": "string"},
      "capacity_wh": {"type": "number"},
      "weight_kg": {"type": "number"},
      "carbon_footprint_kg": {"type": "number"},
      "manufacturing_date": {"type": "string", "format": "date"},
      "expected_lifetime_years": {"type": "number"}
    },
    "required": ["manufacturer", "model", "chemistry", "capacity_wh"]
  }',
  '{
    "manufacturer": "Tesla Energy",
    "model": "Powerwall 2",
    "chemistry": "NMC811",
    "capacity_wh": 13500,
    "weight_kg": 114,
    "carbon_footprint_kg": 2340,
    "manufacturing_date": "2024-01-15",
    "expected_lifetime_years": 10
  }'
),
(
  'Quality Test',
  'General quality control test results',
  'QualityTest',
  '{
    "type": "object",
    "properties": {
      "test_name": {"type": "string"},
      "test_date": {"type": "string", "format": "date-time"},
      "result": {"type": "string", "enum": ["pass", "fail"]},
      "score": {"type": "number", "minimum": 0, "maximum": 100},
      "inspector": {"type": "string"},
      "notes": {"type": "string"}
    },
    "required": ["test_name", "test_date", "result"]
  }',
  '{
    "test_name": "Pressure Test",
    "test_date": "2024-01-20T10:30:00Z",
    "result": "pass",
    "score": 95,
    "inspector": "Jane Smith",
    "notes": "All parameters within acceptable range"
  }'
),
(
  'Origin Verification',
  'Proof of origin and provenance',
  'OriginVerification',
  '{
    "type": "object",
    "properties": {
      "country_of_origin": {"type": "string"},
      "region": {"type": "string"},
      "facility": {"type": "string"},
      "coordinates": {
        "type": "object",
        "properties": {
          "latitude": {"type": "number"},
          "longitude": {"type": "number"}
        }
      },
      "certification_body": {"type": "string"},
      "certification_date": {"type": "string", "format": "date"}
    },
    "required": ["country_of_origin", "facility"]
  }',
  '{
    "country_of_origin": "Germany",
    "region": "Bavaria",
    "facility": "Munich Production Plant #3",
    "coordinates": {
      "latitude": 48.1351,
      "longitude": 11.5820
    },
    "certification_body": "TÜV SÜD",
    "certification_date": "2024-01-10"
  }'
),
(
  'Carbon Footprint',
  'Carbon emissions calculation and verification',
  'CarbonFootprint',
  '{
    "type": "object",
    "properties": {
      "total_emissions_kg": {"type": "number"},
      "scope_1_kg": {"type": "number"},
      "scope_2_kg": {"type": "number"},
      "scope_3_kg": {"type": "number"},
      "calculation_method": {"type": "string"},
      "verification_standard": {"type": "string"},
      "reporting_period_start": {"type": "string", "format": "date"},
      "reporting_period_end": {"type": "string", "format": "date"}
    },
    "required": ["total_emissions_kg", "calculation_method"]
  }',
  '{
    "total_emissions_kg": 450.5,
    "scope_1_kg": 120.0,
    "scope_2_kg": 180.5,
    "scope_3_kg": 150.0,
    "calculation_method": "GHG Protocol",
    "verification_standard": "ISO 14064-3",
    "reporting_period_start": "2024-01-01",
    "reporting_period_end": "2024-12-31"
  }'
),
(
  'Food Safety Certification',
  'Food safety compliance and testing',
  'FoodSafety',
  '{
    "type": "object",
    "properties": {
      "product_name": {"type": "string"},
      "batch_number": {"type": "string"},
      "test_date": {"type": "string", "format": "date"},
      "pathogen_test_result": {"type": "string", "enum": ["negative", "positive"]},
      "allergen_free": {"type": "array", "items": {"type": "string"}},
      "expiration_date": {"type": "string", "format": "date"},
      "storage_conditions": {"type": "string"},
      "haccp_compliant": {"type": "boolean"}
    },
    "required": ["product_name", "batch_number", "test_date"]
  }',
  '{
    "product_name": "Organic Almond Butter",
    "batch_number": "AB-2024-001234",
    "test_date": "2024-01-18",
    "pathogen_test_result": "negative",
    "allergen_free": ["gluten", "dairy", "soy"],
    "expiration_date": "2025-01-18",
    "storage_conditions": "Cool, dry place below 25°C",
    "haccp_compliant": true
  }'
),
(
  'Pharmaceutical Compliance',
  'Pharmaceutical product compliance and GMP verification',
  'PharmaCompliance',
  '{
    "type": "object",
    "properties": {
      "drug_name": {"type": "string"},
      "active_ingredient": {"type": "string"},
      "batch_number": {"type": "string"},
      "manufacturing_date": {"type": "string", "format": "date"},
      "expiry_date": {"type": "string", "format": "date"},
      "gmp_certified": {"type": "boolean"},
      "regulatory_approval": {"type": "string"},
      "quality_assurance_officer": {"type": "string"}
    },
    "required": ["drug_name", "batch_number", "gmp_certified"]
  }',
  '{
    "drug_name": "Paracetamol 500mg",
    "active_ingredient": "Paracetamol",
    "batch_number": "PC-500-20240115",
    "manufacturing_date": "2024-01-15",
    "expiry_date": "2027-01-15",
    "gmp_certified": true,
    "regulatory_approval": "FDA Approved",
    "quality_assurance_officer": "Dr. Sarah Johnson"
  }'
);

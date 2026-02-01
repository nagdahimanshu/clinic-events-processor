/**
 * Validates CSV headers
 */
export function validateCSVHeaders(headers: string[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const requiredFields = [
    "event_id",
    "clinic_id",
    "patient_id",
    "event_type",
    "event_timestamp",
  ];

  for (const field of requiredFields) {
    if (!headers.includes(field)) {
      errors.push(`Missing required column: ${field}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

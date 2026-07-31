import { ValidationResult } from '../../services/dataLoader';

/**
 * Validates raw Ranger list data from JSON according to schema requirements.
 * Enforces schema defined in docs/json-schema.md
 */
export function validateRangerRaw(
  data: unknown,
  context: string = 'Ranger JSON'
): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    return {
      isValid: false,
      errors: [`[${context}] Content must be an array`],
    };
  }

  const unitCodes = new Set<string>();

  data.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(
        `[${context}] Item at index ${index} is not a valid JSON object`
      );
      return;
    }

    const { Name, Image, UnitCode } = item as Record<string, unknown>;

    if (typeof Name !== 'string' || Name.trim() === '') {
      errors.push(
        `[${context}] Item at index ${index} is missing or has an empty "Name" field`
      );
    }
    if (typeof Image !== 'string' || Image.trim() === '') {
      errors.push(
        `[${context}] Item at index ${index} is missing or has an empty "Image" field`
      );
    }
    if (typeof UnitCode !== 'string' || UnitCode.trim() === '') {
      errors.push(
        `[${context}] Item at index ${index} is missing or has an empty "UnitCode" field`
      );
    } else {
      if (unitCodes.has(UnitCode)) {
        errors.push(
          `[${context}] Duplicate UnitCode "${UnitCode}" found at index ${index}`
        );
      } else {
        unitCodes.add(UnitCode);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

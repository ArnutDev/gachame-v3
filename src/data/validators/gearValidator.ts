import { ValidationResult } from '../../services/dataLoader';

/**
 * Validates raw Gear list data from JSON according to schema requirements.
 * Enforces schema defined in docs/json-schema.md
 */
export function validateGearRaw(
  data: unknown,
  context: string = 'Gear JSON'
): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    return {
      isValid: false,
      errors: [`[${context}] Content must be an array`],
    };
  }

  const itemCodes = new Set<string>();

  data.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(
        `[${context}] Item at index ${index} is not a valid JSON object`
      );
      return;
    }

    const { Name, Image, ItemCode } = item as Record<string, unknown>;

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
    if (typeof ItemCode !== 'string' || ItemCode.trim() === '') {
      errors.push(
        `[${context}] Item at index ${index} is missing or has an empty "ItemCode" field`
      );
    } else {
      if (itemCodes.has(ItemCode)) {
        errors.push(
          `[${context}] Duplicate ItemCode "${ItemCode}" found at index ${index}`
        );
      } else {
        itemCodes.add(ItemCode);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

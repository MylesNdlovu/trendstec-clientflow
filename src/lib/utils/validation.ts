interface ValidationResult {
	isValid: boolean;
	errors: string[];
	sanitized?: any;
}

export class ValidationError extends Error {
	constructor(public errors: string[]) {
		super(`Validation failed: ${errors.join(', ')}`);
		this.name = 'ValidationError';
	}
}

export const validators = {
	email: (value: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(value);
	},

	phone: (value: string): boolean => {
		const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
		return phoneRegex.test(value);
	},

	mt5Login: (value: string): boolean => {
		return /^\d{6,12}$/.test(value);
	},

	broker: (value: string): boolean => {
		const allowedBrokers = ['exness', 'xm', 'fxpro', 'pepperstone', 'ic-markets', 'admiral-markets'];
		return allowedBrokers.includes(value.toLowerCase());
	},

	status: (value: string): boolean => {
		const allowedStatuses = ['captured', 'deposited', 'trading', 'profitable', 'inactive'];
		return allowedStatuses.includes(value);
	},

	url: (value: string): boolean => {
		try {
			new URL(value);
			return true;
		} catch {
			return false;
		}
	},

	required: (value: any): boolean => {
		return value !== null && value !== undefined && value !== '';
	},

	minLength: (min: number) => (value: string): boolean => {
		return typeof value === 'string' && value.length >= min;
	},

	maxLength: (max: number) => (value: string): boolean => {
		return typeof value === 'string' && value.length <= max;
	},

	numeric: (value: any): boolean => {
		return !isNaN(parseFloat(value)) && isFinite(value);
	},

	positiveNumber: (value: any): boolean => {
		return validators.numeric(value) && parseFloat(value) > 0;
	}
};

export const schemas = {
	systemeContact: {
		email: [validators.required, validators.email],
		first_name: [validators.required, validators.minLength(1), validators.maxLength(50)],
		last_name: [validators.maxLength(50)],
		phone: [validators.phone],
		custom_fields: {
			broker: [validators.required, validators.broker],
			mt5_login: [validators.mt5Login],
			mt5_server: [validators.minLength(1), validators.maxLength(100)],
			lead_source: [validators.minLength(1), validators.maxLength(50)],
			conversion_status: [validators.status],
			commission_earned: [validators.numeric]
		},
		tags: {
			_array: true,
			_itemValidation: [validators.minLength(1), validators.maxLength(30)]
		}
	},

	webhookPayload: {
		event: [validators.required, validators.minLength(1)],
		contact: {
			email: [validators.required, validators.email],
			id: [validators.required],
			tags: {
				_array: true,
				_optional: true
			},
			custom_fields: {
				_optional: true
			}
		},
		timestamp: [validators.required]
	},

	mt5Credentials: {
		email: [validators.required, validators.email],
		mt5Login: [validators.required, validators.mt5Login],
		investorPassword: [validators.required, validators.minLength(6), validators.maxLength(20)],
		broker: [validators.required, validators.broker],
		server: [validators.required, validators.minLength(1), validators.maxLength(100)]
	},

	leadUpdate: {
		email: [validators.required, validators.email],
		status: [validators.required, validators.status],
		commission: [validators.numeric],
		mt5Data: {
			_optional: true,
			balance: [validators.numeric],
			equity: [validators.numeric],
			positions: {
				_array: true,
				_optional: true
			}
		}
	},

	webhookConfig: {
		url: [validators.required, validators.url],
		events: {
			_array: true,
			_itemValidation: [validators.minLength(1)]
		},
		secret: [validators.minLength(16)],
		active: [validators.required]
	}
};

export function validateData(data: any, schema: any): ValidationResult {
	const errors: string[] = [];
	let sanitized: any = {};

	function validateValue(value: any, validators: any[], fieldPath: string): any {
		for (const validator of validators) {
			if (typeof validator === 'function') {
				if (!validator(value)) {
					errors.push(`Invalid ${fieldPath}: ${value}`);
					return value;
				}
			}
		}
		return value;
	}

	function validateObject(obj: any, schemaObj: any, path: string = ''): any {
		const result: any = {};

		for (const [key, validation] of Object.entries(schemaObj)) {
			const fieldPath = path ? `${path}.${key}` : key;
			const fieldValue = obj?.[key];

			if (Array.isArray(validation)) {
				if (fieldValue === undefined || fieldValue === null) {
					errors.push(`Missing required field: ${fieldPath}`);
					continue;
				}
				result[key] = validateValue(fieldValue, validation, fieldPath);
			} else if (typeof validation === 'object') {
				if (validation._array) {
					if (!Array.isArray(fieldValue)) {
						if (validation._optional && (fieldValue === undefined || fieldValue === null)) {
							continue;
						}
						errors.push(`${fieldPath} must be an array`);
						continue;
					}

					if (validation._itemValidation) {
						result[key] = fieldValue.map((item: any, index: number) =>
							validateValue(item, validation._itemValidation, `${fieldPath}[${index}]`)
						);
					} else {
						result[key] = fieldValue;
					}
				} else if (validation._optional && (fieldValue === undefined || fieldValue === null)) {
					continue;
				} else {
					if (!fieldValue && !validation._optional) {
						errors.push(`Missing required field: ${fieldPath}`);
						continue;
					}
					result[key] = validateObject(fieldValue, validation, fieldPath);
				}
			}
		}

		return result;
	}

	try {
		sanitized = validateObject(data, schema);
	} catch (error) {
		errors.push(`Validation error: ${error.message}`);
	}

	return {
		isValid: errors.length === 0,
		errors,
		sanitized: errors.length === 0 ? sanitized : undefined
	};
}

export function sanitizeInput(input: any): any {
	if (typeof input === 'string') {
		return input
			.trim()
			.replace(/[<>]/g, '')
			.substring(0, 1000);
	}

	if (typeof input === 'object' && input !== null) {
		if (Array.isArray(input)) {
			return input.map(sanitizeInput);
		}

		const sanitized: any = {};
		for (const [key, value] of Object.entries(input)) {
			const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '');
			sanitized[sanitizedKey] = sanitizeInput(value);
		}
		return sanitized;
	}

	return input;
}

export function validateAndSanitize(data: any, schemaName: keyof typeof schemas): any {
	const schema = schemas[schemaName];
	if (!schema) {
		throw new ValidationError([`Unknown schema: ${schemaName}`]);
	}

	const sanitizedData = sanitizeInput(data);
	const validation = validateData(sanitizedData, schema);

	if (!validation.isValid) {
		throw new ValidationError(validation.errors);
	}

	return validation.sanitized;
}
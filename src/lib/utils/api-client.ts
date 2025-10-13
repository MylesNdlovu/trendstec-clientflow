interface RetryConfig {
	maxRetries: number;
	baseDelay: number;
	maxDelay: number;
	exponentialBackoff: boolean;
}

interface RateLimitConfig {
	maxRequests: number;
	windowMs: number;
}

interface ApiClientConfig {
	baseUrl?: string;
	timeout?: number;
	retry?: RetryConfig;
	rateLimit?: RateLimitConfig;
	headers?: Record<string, string>;
}

interface ApiRequest {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE';
	endpoint: string;
	body?: any;
	headers?: Record<string, string>;
	retries?: number;
	skipRetry?: boolean;
}

interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	status?: number;
	retries?: number;
	duration?: number;
}

class RateLimiter {
	private requests: number[] = [];
	private maxRequests: number;
	private windowMs: number;

	constructor(config: RateLimitConfig) {
		this.maxRequests = config.maxRequests;
		this.windowMs = config.windowMs;
	}

	canMakeRequest(): boolean {
		const now = Date.now();
		this.requests = this.requests.filter(time => now - time < this.windowMs);
		return this.requests.length < this.maxRequests;
	}

	recordRequest(): void {
		this.requests.push(Date.now());
	}

	waitTime(): number {
		if (this.canMakeRequest()) return 0;
		const oldestRequest = Math.min(...this.requests);
		return this.windowMs - (Date.now() - oldestRequest);
	}
}

export class ApiClient {
	private config: Required<ApiClientConfig>;
	private rateLimiter: RateLimiter;
	private failedRequests: Map<string, any[]> = new Map();

	constructor(config: ApiClientConfig = {}) {
		this.config = {
			baseUrl: config.baseUrl || '',
			timeout: config.timeout || 30000,
			retry: {
				maxRetries: 3,
				baseDelay: 1000,
				maxDelay: 10000,
				exponentialBackoff: true,
				...config.retry
			},
			rateLimit: {
				maxRequests: 100,
				windowMs: 60000,
				...config.rateLimit
			},
			headers: {
				'Content-Type': 'application/json',
				...config.headers
			}
		};

		this.rateLimiter = new RateLimiter(this.config.rateLimit);
	}

	async request<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
		const startTime = Date.now();

		if (!this.rateLimiter.canMakeRequest()) {
			const waitTime = this.rateLimiter.waitTime();
			console.warn(`Rate limit exceeded. Waiting ${waitTime}ms before retry.`);
			await this.delay(waitTime);
		}

		this.rateLimiter.recordRequest();

		const requestId = `${request.method}:${request.endpoint}:${Date.now()}`;
		let lastError: Error | null = null;
		let attempt = 0;
		const maxAttempts = request.skipRetry ? 1 : this.config.retry.maxRetries + 1;

		while (attempt < maxAttempts) {
			try {
				const response = await this.makeRequest(request);
				const duration = Date.now() - startTime;

				if (response.ok) {
					const data = await this.parseResponse<T>(response);
					return {
						success: true,
						data,
						status: response.status,
						retries: attempt,
						duration
					};
				} else {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}
			} catch (error) {
				lastError = error as Error;
				attempt++;

				if (attempt < maxAttempts && !request.skipRetry) {
					const delay = this.calculateDelay(attempt);
					console.warn(`Request failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`, {
						error: lastError.message,
						requestId
					});
					await this.delay(delay);
				} else {
					this.addToFailedQueue(requestId, request, lastError);
				}
			}
		}

		const duration = Date.now() - startTime;
		return {
			success: false,
			error: lastError?.message || 'Unknown error',
			status: 0,
			retries: attempt - 1,
			duration
		};
	}

	private async makeRequest(request: ApiRequest): Promise<Response> {
		const url = this.config.baseUrl + request.endpoint;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

		try {
			const response = await fetch(url, {
				method: request.method,
				headers: {
					...this.config.headers,
					...request.headers
				},
				body: request.body ? JSON.stringify(request.body) : undefined,
				signal: controller.signal
			});

			clearTimeout(timeoutId);
			return response;
		} catch (error) {
			clearTimeout(timeoutId);
			throw error;
		}
	}

	private async parseResponse<T>(response: Response): Promise<T> {
		const contentType = response.headers.get('content-type');
		if (contentType?.includes('application/json')) {
			return await response.json();
		}
		return await response.text() as T;
	}

	private calculateDelay(attempt: number): number {
		if (!this.config.retry.exponentialBackoff) {
			return this.config.retry.baseDelay;
		}

		const exponentialDelay = this.config.retry.baseDelay * Math.pow(2, attempt - 1);
		const jitter = Math.random() * 0.1 * exponentialDelay;
		return Math.min(exponentialDelay + jitter, this.config.retry.maxDelay);
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	private addToFailedQueue(requestId: string, request: ApiRequest, error: Error): void {
		const queueKey = `${request.method}:${request.endpoint}`;
		if (!this.failedRequests.has(queueKey)) {
			this.failedRequests.set(queueKey, []);
		}

		this.failedRequests.get(queueKey)!.push({
			requestId,
			request,
			error: error.message,
			timestamp: new Date().toISOString(),
			retries: this.config.retry.maxRetries
		});

		console.error(`Request failed permanently: ${requestId}`, {
			endpoint: request.endpoint,
			error: error.message,
			queueSize: this.failedRequests.get(queueKey)!.length
		});
	}

	getFailedRequests(): Record<string, any[]> {
		const result: Record<string, any[]> = {};
		this.failedRequests.forEach((value, key) => {
			result[key] = value;
		});
		return result;
	}

	async retryFailedRequests(queueKey?: string): Promise<{ success: number; failed: number }> {
		let totalSuccess = 0;
		let totalFailed = 0;

		const keysToRetry = queueKey ? [queueKey] : Array.from(this.failedRequests.keys());

		for (const key of keysToRetry) {
			const failedQueue = this.failedRequests.get(key) || [];
			const retryQueue = [...failedQueue];
			this.failedRequests.set(key, []);

			for (const item of retryQueue) {
				try {
					const response = await this.request({
						...item.request,
						skipRetry: false
					});

					if (response.success) {
						totalSuccess++;
						console.log(`Successfully retried failed request: ${item.requestId}`);
					} else {
						totalFailed++;
						this.failedRequests.get(key)!.push(item);
					}
				} catch (error) {
					totalFailed++;
					this.failedRequests.get(key)!.push(item);
				}
			}
		}

		return { success: totalSuccess, failed: totalFailed };
	}

	clearFailedQueue(queueKey?: string): void {
		if (queueKey) {
			this.failedRequests.delete(queueKey);
		} else {
			this.failedRequests.clear();
		}
	}

	getStats(): {
		rateLimitInfo: { maxRequests: number; windowMs: number; currentRequests: number };
		failedQueues: Record<string, number>;
	} {
		const now = Date.now();
		const recentRequests = this.rateLimiter['requests'].filter(
			time => now - time < this.config.rateLimit.windowMs
		);

		const failedQueues: Record<string, number> = {};
		this.failedRequests.forEach((value, key) => {
			failedQueues[key] = value.length;
		});

		return {
			rateLimitInfo: {
				maxRequests: this.config.rateLimit.maxRequests,
				windowMs: this.config.rateLimit.windowMs,
				currentRequests: recentRequests.length
			},
			failedQueues
		};
	}
}

export const systemeApiClient = new ApiClient({
	baseUrl: 'https://api.systeme.io/api',
	timeout: 30000,
	retry: {
		maxRetries: 3,
		baseDelay: 2000,
		maxDelay: 30000,
		exponentialBackoff: true
	},
	rateLimit: {
		maxRequests: 90,
		windowMs: 60000
	},
	headers: {
		'Content-Type': 'application/json',
		'User-Agent': 'Affiliate-Dashboard/1.0'
	}
});
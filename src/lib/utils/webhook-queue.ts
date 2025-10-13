interface WebhookEvent {
	id: string;
	type: string;
	payload: any;
	timestamp: string;
	retries: number;
	maxRetries: number;
	nextRetry?: string;
	lastError?: string;
	status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter';
}

interface ProcessingResult {
	success: boolean;
	error?: string;
	shouldRetry?: boolean;
}

class WebhookQueue {
	private events: Map<string, WebhookEvent> = new Map();
	private isProcessing = false;
	private processingInterval: NodeJS.Timeout | null = null;

	constructor(private config = {
		maxRetries: 5,
		retryDelays: [1000, 5000, 15000, 60000, 300000], // 1s, 5s, 15s, 1m, 5m
		processingIntervalMs: 30000, // Check every 30 seconds
		deadLetterThreshold: 7 // Days to keep in dead letter queue
	}) {
		this.startProcessing();
	}

	addEvent(type: string, payload: any, maxRetries?: number): string {
		const eventId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		const event: WebhookEvent = {
			id: eventId,
			type,
			payload,
			timestamp: new Date().toISOString(),
			retries: 0,
			maxRetries: maxRetries || this.config.maxRetries,
			status: 'pending'
		};

		this.events.set(eventId, event);
		console.log(`Added webhook event to queue: ${eventId} (${type})`);

		// Trigger immediate processing for new events
		if (!this.isProcessing) {
			this.processQueue();
		}

		return eventId;
	}

	async processEvent(eventId: string, processor: (payload: any) => Promise<ProcessingResult>): Promise<boolean> {
		const event = this.events.get(eventId);
		if (!event || event.status === 'completed' || event.status === 'dead_letter') {
			return false;
		}

		event.status = 'processing';
		console.log(`Processing webhook event: ${eventId} (attempt ${event.retries + 1}/${event.maxRetries + 1})`);

		try {
			const result = await processor(event.payload);

			if (result.success) {
				event.status = 'completed';
				console.log(`Successfully processed webhook event: ${eventId}`);
				return true;
			} else {
				return this.handleFailure(event, result.error || 'Unknown processing error', result.shouldRetry);
			}
		} catch (error) {
			return this.handleFailure(event, error.message, true);
		}
	}

	private handleFailure(event: WebhookEvent, error: string, shouldRetry: boolean = true): boolean {
		event.lastError = error;
		event.retries++;

		console.error(`Webhook event failed: ${event.id}`, {
			error,
			attempt: event.retries,
			maxRetries: event.maxRetries
		});

		if (shouldRetry && event.retries <= event.maxRetries) {
			// Schedule retry
			const delay = this.config.retryDelays[Math.min(event.retries - 1, this.config.retryDelays.length - 1)];
			event.nextRetry = new Date(Date.now() + delay).toISOString();
			event.status = 'pending';

			console.log(`Scheduling retry for webhook event: ${event.id} in ${delay}ms`);
			return false;
		} else {
			// Move to dead letter queue
			event.status = 'dead_letter';
			console.error(`Webhook event moved to dead letter queue: ${event.id}`);

			// Alert administrators about dead letter event
			this.alertDeadLetter(event);
			return false;
		}
	}

	private async processQueue(): Promise<void> {
		if (this.isProcessing) {
			return;
		}

		this.isProcessing = true;
		const now = new Date();

		try {
			for (const event of this.events.values()) {
				if (event.status === 'pending' && (!event.nextRetry || new Date(event.nextRetry) <= now)) {
					// Process the event (this would be handled by the specific webhook processor)
					console.log(`Ready to process: ${event.id}`);
				}
			}
		} catch (error) {
			console.error('Queue processing error:', error);
		} finally {
			this.isProcessing = false;
		}
	}

	private startProcessing(): void {
		if (this.processingInterval) {
			clearInterval(this.processingInterval);
		}

		this.processingInterval = setInterval(() => {
			this.processQueue();
		}, this.config.processingIntervalMs);

		console.log('Webhook queue processing started');
	}

	stopProcessing(): void {
		if (this.processingInterval) {
			clearInterval(this.processingInterval);
			this.processingInterval = null;
		}
		console.log('Webhook queue processing stopped');
	}

	private alertDeadLetter(event: WebhookEvent): void {
		// In production, this would send alerts via email, Slack, etc.
		console.error('🚨 DEAD LETTER ALERT 🚨', {
			eventId: event.id,
			type: event.type,
			retries: event.retries,
			lastError: event.lastError,
			timestamp: event.timestamp,
			payload: event.payload
		});

		// TODO: Implement actual alerting mechanism
		// - Send email to administrators
		// - Post to Slack channel
		// - Create monitoring system alert
	}

	getQueueStats(): {
		total: number;
		pending: number;
		processing: number;
		completed: number;
		failed: number;
		deadLetter: number;
		oldestPending?: string;
	} {
		const stats = {
			total: this.events.size,
			pending: 0,
			processing: 0,
			completed: 0,
			failed: 0,
			deadLetter: 0,
			oldestPending: undefined as string | undefined
		};

		let oldestPendingTime = Infinity;

		for (const event of this.events.values()) {
			switch (event.status) {
				case 'pending':
					stats.pending++;
					const eventTime = new Date(event.timestamp).getTime();
					if (eventTime < oldestPendingTime) {
						oldestPendingTime = eventTime;
						stats.oldestPending = event.timestamp;
					}
					break;
				case 'processing':
					stats.processing++;
					break;
				case 'completed':
					stats.completed++;
					break;
				case 'failed':
					stats.failed++;
					break;
				case 'dead_letter':
					stats.deadLetter++;
					break;
			}
		}

		return stats;
	}

	getEvent(eventId: string): WebhookEvent | undefined {
		return this.events.get(eventId);
	}

	getEvents(status?: WebhookEvent['status'], limit?: number): WebhookEvent[] {
		let events = Array.from(this.events.values());

		if (status) {
			events = events.filter(event => event.status === status);
		}

		// Sort by timestamp (newest first)
		events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

		if (limit) {
			events = events.slice(0, limit);
		}

		return events;
	}

	retryEvent(eventId: string): boolean {
		const event = this.events.get(eventId);
		if (!event) {
			return false;
		}

		if (event.status === 'dead_letter' || event.status === 'failed') {
			event.status = 'pending';
			event.retries = 0;
			event.nextRetry = undefined;
			event.lastError = undefined;

			console.log(`Manually retrying webhook event: ${eventId}`);
			this.processQueue();
			return true;
		}

		return false;
	}

	purgeOldEvents(olderThanDays: number = 30): number {
		const cutoffTime = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
		let purgedCount = 0;

		for (const [eventId, event] of this.events.entries()) {
			if (new Date(event.timestamp) < cutoffTime && (event.status === 'completed' || event.status === 'dead_letter')) {
				this.events.delete(eventId);
				purgedCount++;
			}
		}

		if (purgedCount > 0) {
			console.log(`Purged ${purgedCount} old webhook events`);
		}

		return purgedCount;
	}

	clearDeadLetterQueue(): number {
		let clearedCount = 0;

		for (const [eventId, event] of this.events.entries()) {
			if (event.status === 'dead_letter') {
				this.events.delete(eventId);
				clearedCount++;
			}
		}

		if (clearedCount > 0) {
			console.log(`Cleared ${clearedCount} events from dead letter queue`);
		}

		return clearedCount;
	}
}

// Global webhook queue instance
export const webhookQueue = new WebhookQueue();
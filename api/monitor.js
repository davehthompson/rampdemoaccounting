const winston = require('winston');
const AsyncRetry = require('async-retry');
const axios = require('axios');

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

class DatabaseMonitor {
  constructor({ redis, apiEndpoint, pollingInterval = 30000 }) {
    this.redis = redis;
    this.apiEndpoint = apiEndpoint;
    this.pollingInterval = pollingInterval;
    this.isRunning = false;
    
    // Redis keys
    this.keys = {
      lastCheck: 'monitor:lastCheckTime',
      metrics: 'monitor:metrics',
      webhooks: 'monitor:webhooks',
      changes: 'monitor:changes',
      processing: 'monitor:processing'
    };

    this.retryConfig = {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 5000,
      factor: 2
    };
  }

  async initialize() {
    try {
      // Initialize metrics if they don't exist
      const exists = await this.redis.exists(this.keys.metrics);
      if (!exists) {
        const defaultMetrics = {
          totalChangesDetected: 0,
          totalChangesSent: 0,
          failedApiCalls: 0,
          successfulApiCalls: 0,
          lastProcessingTime: 0,
          averageProcessingTime: 0,
          totalProcessingTime: 0,
          processedBatches: 0,
          retryAttempts: 0,
          lastError: '',
          status: 'initialized'
        };

        await this.redis.hmset(this.keys.metrics, defaultMetrics);
      }

      logger.info('Database monitor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize monitor:', error);
      throw error;
    }
  }

  async addWebhook(url) {
    try {
      const id = await this.redis.sadd(this.keys.webhooks, url);
      await this.redis.publish('webhook:added', url);
      logger.info(`Added webhook: ${url}`);
      return id;
    } catch (error) {
      logger.error('Failed to add webhook:', error);
      throw error;
    }
  }

  async removeWebhook(url) {
    try {
      await this.redis.srem(this.keys.webhooks, url);
      await this.redis.publish('webhook:removed', url);
      logger.info(`Removed webhook: ${url}`);
    } catch (error) {
      logger.error('Failed to remove webhook:', error);
      throw error;
    }
  }

  async getWebhooks() {
    try {
      return await this.redis.smembers(this.keys.webhooks);
    } catch (error) {
      logger.error('Failed to get webhooks:', error);
      return [];
    }
  }

  async notifyWebhooks(changes) {
    const webhooks = await this.getWebhooks();
    
    const notifications = webhooks.map(async (url) => {
      try {
        await AsyncRetry(
          async () => {
            await axios.post(url, { changes }, {
              timeout: 5000,
              headers: { 'Content-Type': 'application/json' }
            });
          },
          this.retryConfig
        );
        logger.info(`Successfully notified webhook: ${url}`);
      } catch (error) {
        logger.error(`Failed to notify webhook ${url}:`, error);
        await this.updateMetrics({ failedApiCalls: 1 });
      }
    });

    await Promise.allSettled(notifications);
  }

  async addChange(change) {
    try {
      const id = await this.redis.xadd(
        this.keys.changes,
        '*',
        'data',
        JSON.stringify(change)
      );
      await this.redis.publish('change:added', JSON.stringify(change));
      return id;
    } catch (error) {
      logger.error('Failed to add change:', error);
      throw error;
    }
  }

  async getChanges(lastCheckTime) {
    try {
      const result = await this.redis.xrange(
        this.keys.changes,
        lastCheckTime || '-',
        '+'
      );

      return result.map(([id, [, data]]) => ({
        id,
        ...JSON.parse(data)
      }));
    } catch (error) {
      logger.error('Failed to get changes:', error);
      return [];
    }
  }

  async updateMetrics(updates) {
    const pipeline = this.redis.pipeline();
    
    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === 'number') {
        pipeline.hincrby(this.keys.metrics, key, value);
      } else {
        pipeline.hset(this.keys.metrics, key, value);
      }
    });

    await pipeline.exec();
  }

  async getMetrics() {
    try {
      const metrics = await this.redis.hgetall(this.keys.metrics);
      return {
        ...metrics,
        isRunning: this.isRunning
      };
    } catch (error) {
      logger.error('Failed to get metrics:', error);
      return {};
    }
  }

  async sendToApi(changes) {
    if (!changes.length) return true;

    try {
      await AsyncRetry(
        async (bail) => {
          try {
            const response = await axios.post(this.apiEndpoint, { changes }, {
              timeout: 30000,
              headers: { 'Content-Type': 'application/json' }
            });

            if (response.status === 400) {
              bail(new Error('Bad request'));
              return;
            }

            await this.updateMetrics({
              successfulApiCalls: 1,
              totalChangesSent: changes.length
            });

            await this.notifyWebhooks(changes);
            
            logger.info(`Successfully sent ${changes.length} changes to API`);
            return true;
          } catch (error) {
            await this.updateMetrics({
              failedApiCalls: 1,
              retryAttempts: 1,
              lastError: error.message
            });
            throw error;
          }
        },
        this.retryConfig
      );

      return true;
    } catch (error) {
      logger.error('Failed to send changes to API after retries:', error);
      return false;
    }
  }

  async checkForChanges() {
    const startTime = Date.now();
    const processingId = `processing:${startTime}`;

    try {
      // Use Redis lock for distributed environments
      const lock = await this.redis.set(
        this.keys.processing,
        processingId,
        'NX',
        'PX',
        30000
      );

      if (!lock) {
        logger.info('Another process is currently checking for changes');
        return;
      }

      const lastCheckTime = await this.redis.get(this.keys.lastCheck);
      const changes = await this.getChanges(lastCheckTime);
      
      if (changes.length > 0) {
        await this.updateMetrics({
          totalChangesDetected: changes.length,
          status: 'processing'
        });

        logger.info(`Found ${changes.length} changes`);
        
        if (await this.sendToApi(changes)) {
          await this.redis.set(this.keys.lastCheck, changes[changes.length - 1].id);
          await this.updateMetrics({ status: 'idle' });
        }
      }

      const processingTime = Date.now() - startTime;
      await this.updateMetrics({
        lastProcessingTime: processingTime,
        totalProcessingTime: processingTime,
        processedBatches: 1
      });

    } catch (error) {
      logger.error('Error in check for changes:', error);
      await this.updateMetrics({
        lastError: error.message,
        status: 'error'
      });
    } finally {
      // Release lock only if we own it
      const currentId = await this.redis.get(this.keys.processing);
      if (currentId === processingId) {
        await this.redis.del(this.keys.processing);
      }
    }
  }

  start() {
    if (this.isRunning) {
      logger.warn('Monitor is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting database monitor...');
    
    const runMonitor = async () => {
      if (!this.isRunning) return;
      
      await this.checkForChanges();
      setTimeout(runMonitor, this.pollingInterval);
    };

    runMonitor();
  }

  stop() {
    logger.info('Stopping database monitor...');
    this.isRunning = false;
  }
}

module.exports = DatabaseMonitor;

/**
 * Queue Management Routes
 * API endpoints for monitoring and managing job queues
 */

import type { FastifyInstance } from 'fastify';
import { queueManager } from '../../queue/queue-manager';
import { QueueName } from '../../queue/config';

export async function queueRoutes(fastify: FastifyInstance) {
  // GET /queue/stats - Get all queue statistics
  fastify.get('/stats', async () => {
    const stats = await queueManager.getAllStats();
    return {
      success: true,
      data: stats,
    };
  });

  // GET /queue/:name/stats - Get specific queue statistics
  fastify.get<{
    Params: { name: string };
  }>('/:name/stats', async (request, reply) => {
    const { name } = request.params;

    if (!Object.values(QueueName).includes(name as QueueName)) {
      return reply.code(404).send({
        success: false,
        error: `Queue ${name} not found`,
      });
    }

    const stats = await queueManager.getQueueStats(name as QueueName);
    return {
      success: true,
      data: stats,
    };
  });

  // GET /queue/:name/jobs - Get jobs from a queue
  fastify.get<{
    Params: { name: string };
    Querystring: { status?: string; start?: number; end?: number };
  }>('/:name/jobs', async (request, reply) => {
    const { name } = request.params;
    const { status = 'waiting', start = 0, end = 10 } = request.query;

    if (!Object.values(QueueName).includes(name as QueueName)) {
      return reply.code(404).send({
        success: false,
        error: `Queue ${name} not found`,
      });
    }

    const queue = queueManager.getQueue(name as QueueName);
    if (!queue) {
      return reply.code(404).send({
        success: false,
        error: `Queue ${name} not initialized`,
      });
    }

    let jobs;
    switch (status) {
      case 'waiting':
        jobs = await queue.getWaiting(start, end);
        break;
      case 'active':
        jobs = await queue.getActive(start, end);
        break;
      case 'completed':
        jobs = await queue.getCompleted(start, end);
        break;
      case 'failed':
        jobs = await queue.getFailed(start, end);
        break;
      case 'delayed':
        jobs = await queue.getDelayed(start, end);
        break;
      default:
        return reply.code(400).send({
          success: false,
          error: `Invalid status: ${status}`,
        });
    }

    return {
      success: true,
      data: jobs.map((job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
      })),
    };
  });

  // GET /queue/:name/job/:jobId - Get specific job details
  fastify.get<{
    Params: { name: string; jobId: string };
  }>('/:name/job/:jobId', async (request, reply) => {
    const { name, jobId } = request.params;

    if (!Object.values(QueueName).includes(name as QueueName)) {
      return reply.code(404).send({
        success: false,
        error: `Queue ${name} not found`,
      });
    }

    const queue = queueManager.getQueue(name as QueueName);
    if (!queue) {
      return reply.code(404).send({
        success: false,
        error: `Queue ${name} not initialized`,
      });
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return reply.code(404).send({
        success: false,
        error: `Job ${jobId} not found`,
      });
    }

    return {
      success: true,
      data: {
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
      },
    };
  });

  // POST /queue/:name/pause - Pause a queue
  fastify.post<{
    Params: { name: string };
  }>('/:name/pause', async (request, reply) => {
    const { name } = request.params;

    if (!Object.values(QueueName).includes(name as QueueName)) {
      return reply.code(404).send({
        success: false,
        error: `Queue ${name} not found`,
      });
    }

    await queueManager.pauseQueue(name as QueueName);
    return {
      success: true,
      message: `Queue ${name} paused`,
    };
  });

  // POST /queue/:name/resume - Resume a queue
  fastify.post<{
    Params: { name: string };
  }>('/:name/resume', async (request, reply) => {
    const { name } = request.params;

    if (!Object.values(QueueName).includes(name as QueueName)) {
      return reply.code(404).send({
        success: false,
        error: `Queue ${name} not found`,
      });
    }

    await queueManager.resumeQueue(name as QueueName);
    return {
      success: true,
      message: `Queue ${name} resumed`,
    };
  });

  // POST /queue/:name/clean - Clean completed jobs
  fastify.post<{
    Params: { name: string };
    Body: { grace?: number };
  }>('/:name/clean', async (request, reply) => {
    const { name } = request.params;
    const { grace } = request.body || {};

    if (!Object.values(QueueName).includes(name as QueueName)) {
      return reply.code(404).send({
        success: false,
        error: `Queue ${name} not found`,
      });
    }

    await queueManager.cleanQueue(name as QueueName, grace);
    return {
      success: true,
      message: `Queue ${name} cleaned`,
    };
  });

  // DELETE /queue/:name/job/:jobId - Remove a job
  fastify.delete<{
    Params: { name: string; jobId: string };
  }>('/:name/job/:jobId', async (request, reply) => {
    const { name, jobId } = request.params;

    if (!Object.values(QueueName).includes(name as QueueName)) {
      return reply.code(404).send({
        success: false,
        error: `Queue ${name} not found`,
      });
    }

    const queue = queueManager.getQueue(name as QueueName);
    if (!queue) {
      return reply.code(404).send({
        success: false,
        error: `Queue ${name} not initialized`,
      });
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return reply.code(404).send({
        success: false,
        error: `Job ${jobId} not found`,
      });
    }

    await job.remove();
    return {
      success: true,
      message: `Job ${jobId} removed`,
    };
  });

  // POST /queue/:name/job/:jobId/retry - Retry a failed job
  fastify.post<{
    Params: { name: string; jobId: string };
  }>('/:name/job/:jobId/retry', async (request, reply) => {
    const { name, jobId } = request.params;

    if (!Object.values(QueueName).includes(name as QueueName)) {
      return reply.code(404).send({
        success: false,
        error: `Queue ${name} not found`,
      });
    }

    const queue = queueManager.getQueue(name as QueueName);
    if (!queue) {
      return reply.code(404).send({
        success: false,
        error: `Queue ${name} not initialized`,
      });
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return reply.code(404).send({
        success: false,
        error: `Job ${jobId} not found`,
      });
    }

    await job.retry();
    return {
      success: true,
      message: `Job ${jobId} retried`,
    };
  });
}

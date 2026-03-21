/**
 * Groq API key retrieval scenario
 * Runs the scenario via Go groq-runner (tls-client + rod) spawned as child process.
 * Issue: #15 Automate Groq API key registration
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { GroqScenarioConfig, DEFAULT_GROQ_CONFIG } from './config';
import type { MailInbox } from '../../../models/mail/MailInbox';

export interface GroqScenarioResult {
  apiKey?: string;
  inbox: MailInbox;
  success: boolean;
  error?: string;
}

/** Default path to groq-runner binary. Set GROQ_RUNNER_PATH when running from repo root. */
function defaultGroqRunnerPath(): string {
  if (process.env.GROQ_RUNNER_PATH) return process.env.GROQ_RUNNER_PATH;
  const fromToolkit = path.join(process.cwd(), 'libs', 'groq-runner', 'groq-runner');
  const fromRepo = path.join(process.cwd(), 'ss-toolkit', 'libs', 'groq-runner', 'groq-runner');
  const fromModules = path.join(process.cwd(), 'modules', 'ss-toolkit', 'libs', 'groq-runner', 'groq-runner');
  if (fs.existsSync(fromToolkit)) return fromToolkit;
  if (fs.existsSync(fromRepo)) return fromRepo;
  if (fs.existsSync(fromModules)) return fromModules;
  return fromToolkit;
}

export class GroqApiKeyScenario {
  private readonly config: GroqScenarioConfig & { proxy?: string; groqRunnerPath?: string };

  constructor(config: GroqScenarioConfig & { groqRunnerPath?: string } = {}) {
    this.config = { ...DEFAULT_GROQ_CONFIG, ...config };
  }

  async run(): Promise<GroqScenarioResult> {
    const runnerPath = this.config.groqRunnerPath ?? defaultGroqRunnerPath();
    const args = [
      ...(this.config.proxy ? ['--proxy', this.config.proxy] : []),
      '--mail-provider', this.config.mailProvider ?? 'tempmailol',
      '--timeout-ms', String(this.config.emailTimeoutMs ?? 120000),
      '--api-key-name', this.config.apiKeyName ?? `groq-${Date.now()}`,
      '--step-delay-ms', String(this.config.stepDelayMs ?? 1000),
      '--email-poll-ms', String(this.config.emailPollMs ?? 5000),
      '--email-timeout-ms', String(this.config.emailTimeoutMs ?? 120000),
    ];

    return new Promise((resolve) => {
      const child = spawn(runnerPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });

      let stdout = '';
      let stderr = '';
      child.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      child.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

      child.on('error', (err) => {
        resolve({
          inbox: { address: '', provider: this.config.mailProvider ?? 'tempmailol' },
          success: false,
          error: `Failed to start groq-runner: ${err.message}. Path: ${runnerPath}. ${stderr ? `stderr: ${stderr}` : ''}`,
        });
      });

      child.on('close', (code) => {
        try {
          const line = stdout.trim().split('\n').pop() ?? '{}';
          const data = JSON.parse(line) as { success?: boolean; apiKey?: string; inbox?: { address?: string; provider?: string }; error?: string; step?: string };
          const errMsg = data.error || (code !== 0 ? `exit ${code}` : undefined);
          const errWithStep = data.step && errMsg ? `${errMsg} [step: ${data.step}]` : errMsg;
          resolve({
            apiKey: data.apiKey,
            inbox: {
              address: data.inbox?.address ?? '',
              provider: data.inbox?.provider ?? this.config.mailProvider ?? 'tempmailol',
            },
            success: data.success === true,
            error: errWithStep,
          });
        } catch {
          resolve({
            inbox: { address: '', provider: this.config.mailProvider ?? 'tempmailol' },
            success: false,
            error: code !== 0 ? `groq-runner exit ${code}. stderr: ${stderr}` : `Invalid JSON from groq-runner: ${stdout.slice(0, 200)}`,
          });
        }
      });
    });
  }
}

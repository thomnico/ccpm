import { Octokit } from '@octokit/rest';
import { ApiCache, BOARD_TTL, COMMENT_TTL } from './cache';
import type {
  GitHubIssue,
  GitHubComment,
  GitHubContent,
  GitHubRepo,
  RateLimitInfo,
} from './types';

export class GitHubClient {
  private octokit: Octokit;
  private cache: ApiCache;
  private owner: string;
  private repo: string;
  public rateLimit: RateLimitInfo = { limit: 5000, remaining: 5000, reset: 0 };

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({ auth: token });
    this.cache = new ApiCache();
    this.owner = owner;
    this.repo = repo;
  }

  private updateRateLimit(headers: Record<string, string>): void {
    const limit = headers['x-ratelimit-limit'];
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];
    if (limit) this.rateLimit.limit = parseInt(limit, 10);
    if (remaining) this.rateLimit.remaining = parseInt(remaining, 10);
    if (reset) this.rateLimit.reset = parseInt(reset, 10);
  }

  private async cachedRequest<T>(
    cacheKey: string,
    ttl: number,
    requestFn: () => Promise<any>
  ): Promise<T> {
    const cached = this.cache.get<T>(cacheKey);
    const headers: Record<string, string> = {};
    if (cached?.etag) {
      headers['If-None-Match'] = cached.etag;
    }

    try {
      const response = await requestFn();
      this.updateRateLimit(response.headers as Record<string, string>);

      if (response.status === 304 && cached) {
        return cached.data;
      }

      const etag = (response.headers as Record<string, string>)['etag'] ?? null;
      this.cache.set<T>(cacheKey, response.data as T, etag, ttl);
      return response.data as T;
    } catch (error: any) {
      if (error.status === 304 && cached) {
        return cached.data;
      }
      throw error;
    }
  }

  async listIssues(
    labels: string,
    state: 'open' | 'closed' | 'all' = 'all'
  ): Promise<GitHubIssue[]> {
    const cacheKey = `issues:${labels}:${state}`;
    const cached = this.cache.get<GitHubIssue[]>(cacheKey);
    const reqHeaders: Record<string, string> = {};
    if (cached?.etag) reqHeaders['If-None-Match'] = cached.etag;

    try {
      const response = await this.octokit.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        labels,
        state,
        per_page: 100,
        headers: reqHeaders,
      });
      this.updateRateLimit(response.headers as Record<string, string>);

      if (response.status === 304 && cached) return cached.data;

      const etag = (response.headers as Record<string, string>)['etag'] ?? null;
      const data = response.data as unknown as GitHubIssue[];
      this.cache.set(cacheKey, data, etag, BOARD_TTL);
      return data;
    } catch (error: any) {
      if (error.status === 304 && cached) return cached.data;
      throw error;
    }
  }

  async getIssue(number: number): Promise<GitHubIssue> {
    return this.cachedRequest<GitHubIssue>(
      `issue:${number}`,
      BOARD_TTL,
      () =>
        this.octokit.issues.get({
          owner: this.owner,
          repo: this.repo,
          issue_number: number,
        })
    );
  }

  async getComments(issueNumber: number): Promise<GitHubComment[]> {
    return this.cachedRequest<GitHubComment[]>(
      `comments:${issueNumber}`,
      COMMENT_TTL,
      () =>
        this.octokit.issues.listComments({
          owner: this.owner,
          repo: this.repo,
          issue_number: issueNumber,
          per_page: 100,
        })
    );
  }

  async addLabel(issueNumber: number, label: string): Promise<void> {
    await this.octokit.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      labels: [label],
    });
  }

  async removeLabel(issueNumber: number, label: string): Promise<void> {
    try {
      await this.octokit.issues.removeLabel({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        name: label,
      });
    } catch (error: any) {
      if (error.status !== 404) throw error;
    }
  }

  async createIssue(
    title: string,
    body: string,
    labels: string[]
  ): Promise<GitHubIssue> {
    const response = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title,
      body,
      labels,
    });
    return response.data as unknown as GitHubIssue;
  }

  async updateIssue(
    number: number,
    data: { title?: string; body?: string; state?: 'open' | 'closed' }
  ): Promise<GitHubIssue> {
    const response = await this.octokit.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: number,
      ...data,
    });
    return response.data as unknown as GitHubIssue;
  }

  async getContents(path: string): Promise<GitHubContent[]> {
    return this.cachedRequest<GitHubContent[]>(
      `contents:${path}`,
      BOARD_TTL,
      () =>
        this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path,
        })
    );
  }

  async updateContents(
    path: string,
    content: string,
    sha: string,
    message: string,
    branch?: string
  ): Promise<void> {
    await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path,
      message,
      content: btoa(content),
      sha,
      ...(branch ? { branch } : {}),
    });
  }

  async createComment(issueNumber: number, body: string): Promise<void> {
    await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body,
    });
  }

  async validateToken(): Promise<boolean> {
    try {
      await this.octokit.users.getAuthenticated();
      return true;
    } catch {
      return false;
    }
  }

  // --- Repo Picker ---

  async listUserRepos(): Promise<GitHubRepo[]> {
    const repos = await this.octokit.paginate(
      this.octokit.repos.listForAuthenticatedUser,
      {
        per_page: 100,
        sort: 'updated',
        affiliation: 'owner,collaborator,organization_member',
      }
    );
    return repos as unknown as GitHubRepo[];
  }

  async listLabels(owner: string, repo: string): Promise<string[]> {
    try {
      const response = await this.octokit.issues.listLabelsForRepo({
        owner,
        repo,
        per_page: 100,
      });
      this.updateRateLimit(response.headers as Record<string, string>);
      return (response.data as { name: string }[]).map((l) => l.name);
    } catch {
      return [];
    }
  }

  async hasDirectory(owner: string, repo: string, path: string): Promise<boolean> {
    try {
      await this.octokit.repos.getContent({ owner, repo, path });
      return true;
    } catch {
      return false;
    }
  }

  // --- PR on Save ---

  async getDefaultBranch(): Promise<string> {
    const response = await this.octokit.repos.get({
      owner: this.owner,
      repo: this.repo,
    });
    this.updateRateLimit(response.headers as Record<string, string>);
    return response.data.default_branch;
  }

  async getRef(branch: string): Promise<string> {
    const response = await this.octokit.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${branch}`,
    });
    this.updateRateLimit(response.headers as Record<string, string>);
    return response.data.object.sha;
  }

  async createBranch(name: string, sha: string): Promise<void> {
    await this.octokit.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${name}`,
      sha,
    });
  }

  async createPullRequest(
    title: string,
    head: string,
    base: string,
    body: string
  ): Promise<{ html_url: string; number: number }> {
    const response = await this.octokit.pulls.create({
      owner: this.owner,
      repo: this.repo,
      title,
      head,
      base,
      body,
    });
    return { html_url: response.data.html_url, number: response.data.number };
  }
}

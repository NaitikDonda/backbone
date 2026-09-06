/**
 * Journey Story Versioning Service - Phase 14: Longitudinal Health Journey Reconstruction
 * 
 * Manages versioning of journey stories to track changes over time.
 * Allows regeneration when underlying data changes without losing previous versions.
 */

import type {
  JourneyStory,
  JourneyStoryVersion
} from '../types';

export class JourneyStoryVersioningService {
  private static instance: JourneyStoryVersioningService;
  private storyVersions: Map<string, JourneyStoryVersion[]>;

  private constructor() {
    this.storyVersions = new Map();
  }

  static getInstance(): JourneyStoryVersioningService {
    if (!JourneyStoryVersioningService.instance) {
      JourneyStoryVersioningService.instance = new JourneyStoryVersioningService();
    }
    return JourneyStoryVersioningService.instance;
  }

  /**
   * Create a new story version
   */
  createStoryVersion(
    journeyId: string,
    patientId: string,
    story: JourneyStory,
    dataVersion: string,
    semanticVersion: string,
    knowledgeVersion: string,
    episodeVersion: string,
    reason: 'initial' | 'data_change' | 'regeneration' | 'other' = 'initial'
  ): JourneyStoryVersion {
    const existingVersions = this.storyVersions.get(journeyId) || [];
    const nextVersion = existingVersions.length + 1;

    const now = new Date().toISOString();

    const version: JourneyStoryVersion = {
      id: `story-version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      journeyId,
      patientId,
      version: nextVersion,
      story: {
        ...story,
        id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        journeyId,
        patientId,
        createdAt: now,
        updatedAt: now,
        dataVersion,
        semanticVersion,
        knowledgeVersion,
        episodeVersion,
      },
      dataVersion,
      semanticVersion,
      knowledgeVersion,
      episodeVersion,
      createdAt: now,
      reason,
    };

    existingVersions.push(version);
    this.storyVersions.set(journeyId, existingVersions);

    return version;
  }

  /**
   * Get latest story version for a journey
   */
  getLatestStoryVersion(journeyId: string): JourneyStoryVersion | null {
    const versions = this.storyVersions.get(journeyId);
    if (!versions || versions.length === 0) {
      return null;
    }
    return versions[versions.length - 1];
  }

  /**
   * Get all story versions for a journey
   */
  getAllStoryVersions(journeyId: string): JourneyStoryVersion[] {
    return this.storyVersions.get(journeyId) || [];
  }

  /**
   * Get specific story version by version number
   */
  getStoryVersion(journeyId: string, versionNumber: number): JourneyStoryVersion | null {
    const versions = this.storyVersions.get(journeyId);
    if (!versions) {
      return null;
    }
    return versions.find(v => v.version === versionNumber) || null;
  }

  /**
   * Check if story needs regeneration based on version changes
   */
  needsRegeneration(
    journeyId: string,
    currentDataVersion: string,
    currentSemanticVersion: string,
    currentKnowledgeVersion: string,
    currentEpisodeVersion: string
  ): boolean {
    const latestVersion = this.getLatestStoryVersion(journeyId);
    
    if (!latestVersion) {
      return true;
    }

    return (
      latestVersion.dataVersion !== currentDataVersion ||
      latestVersion.semanticVersion !== currentSemanticVersion ||
      latestVersion.knowledgeVersion !== currentKnowledgeVersion ||
      latestVersion.episodeVersion !== currentEpisodeVersion
    );
  }

  /**
   * Delete old versions (keep only latest N versions)
   */
  cleanupOldVersions(journeyId: string, keepCount: number = 5): void {
    const versions = this.storyVersions.get(journeyId);
    if (!versions || versions.length <= keepCount) {
      return;
    }

    const versionsToKeep = versions.slice(-keepCount);
    this.storyVersions.set(journeyId, versionsToKeep);
  }

  /**
   * Delete all versions for a journey
   */
  deleteAllVersions(journeyId: string): void {
    this.storyVersions.delete(journeyId);
  }

  /**
   * Get version history summary
   */
  getVersionHistorySummary(journeyId: string): Array<{
    version: number;
    createdAt: string;
    reason: string;
    dataVersion: string;
  }> {
    const versions = this.storyVersions.get(journeyId) || [];
    
    return versions.map(v => ({
      version: v.version,
      createdAt: v.createdAt,
      reason: v.reason,
      dataVersion: v.dataVersion,
    }));
  }
}

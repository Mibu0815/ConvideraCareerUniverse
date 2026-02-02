/**
 * OIDS Validator - Vector Verification Logic
 *
 * Handles spatial entropy validation against asset public keys
 * with offline fallback support and encrypted logging.
 */

import crypto from 'crypto';

// Types
interface CapturedData {
  spatialEntropy: number[];
  timestamp: number;
  deviceId: string;
  metadata?: Record<string, unknown>;
}

interface KeyBundle {
  assetPublicKey: string;
  referenceVectors: number[];
  validUntil: number;
  bundleId: string;
}

interface ValidationResult {
  confidenceScore: number; // 0-100
  verificationId: string;
  isOfflineValidation: boolean;
  timestamp: number;
}

interface EncryptedLogEntry {
  iv: string;
  encryptedData: string;
  hash: string;
  timestamp: number;
}

// Local storage for offline KeyBundle and logs
const localKeyBundleStore: Map<string, KeyBundle> = new Map();
const pendingSyncLogs: EncryptedLogEntry[] = [];

// Encryption key (in production, this should be securely stored)
const LOG_ENCRYPTION_KEY = crypto.randomBytes(32);

export class OidsValidator {
  private isOnline: boolean = true;

  constructor() {
    this.checkConnectivity();
  }

  /**
   * Check internet connectivity
   */
  private async checkConnectivity(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && 'onLine' in navigator) {
        this.isOnline = navigator.onLine;
      } else {
        // Server-side: assume online, or implement actual check
        this.isOnline = true;
      }
      return this.isOnline;
    } catch {
      this.isOnline = false;
      return false;
    }
  }

  /**
   * Store KeyBundle locally for offline access
   */
  public storeKeyBundle(assetId: string, bundle: KeyBundle): void {
    localKeyBundleStore.set(assetId, bundle);
  }

  /**
   * Retrieve local KeyBundle for offline validation
   */
  private getLocalKeyBundle(assetId: string): KeyBundle | null {
    const bundle = localKeyBundleStore.get(assetId);
    if (bundle && bundle.validUntil > Date.now()) {
      return bundle;
    }
    return null;
  }

  /**
   * Main validation function - compares spatial entropy with asset public key
   */
  public async validateVektors(
    capturedData: CapturedData,
    assetPublicKey: string,
    assetId?: string
  ): Promise<ValidationResult> {
    await this.checkConnectivity();

    let keyBundle: KeyBundle | null = null;
    let isOfflineValidation = false;

    // Online mode: use provided public key directly
    if (this.isOnline) {
      keyBundle = {
        assetPublicKey,
        referenceVectors: this.deriveReferenceVectors(assetPublicKey),
        validUntil: Date.now() + 3600000, // 1 hour
        bundleId: crypto.randomUUID(),
      };

      // Store for offline use
      if (assetId) {
        this.storeKeyBundle(assetId, keyBundle);
      }
    } else {
      // Offline mode: fall back to local KeyBundle
      if (assetId) {
        keyBundle = this.getLocalKeyBundle(assetId);
      }

      if (!keyBundle) {
        throw new Error('Offline validation failed: No local KeyBundle available');
      }

      isOfflineValidation = true;
    }

    // Perform vector comparison
    const confidenceScore = this.computeVectorSimilarity(
      capturedData.spatialEntropy,
      keyBundle.referenceVectors
    );

    // Generate verification ID
    const verificationId = this.generateVerificationId(
      capturedData,
      keyBundle,
      confidenceScore
    );

    const result: ValidationResult = {
      confidenceScore,
      verificationId,
      isOfflineValidation,
      timestamp: Date.now(),
    };

    // Create encrypted log entry
    await this.createEncryptedLogEntry(result, capturedData, assetPublicKey);

    return result;
  }

  /**
   * Derive reference vectors from asset public key
   * Simulates extracting comparison vectors from the key
   */
  private deriveReferenceVectors(assetPublicKey: string): number[] {
    const hash = crypto.createHash('sha256').update(assetPublicKey).digest();
    const vectors: number[] = [];

    // Generate normalized vectors from hash
    for (let i = 0; i < hash.length; i += 4) {
      const value = hash.readUInt32BE(i % (hash.length - 3));
      vectors.push((value % 1000) / 1000); // Normalize to 0-1
    }

    return vectors;
  }

  /**
   * Compute similarity between captured entropy and reference vectors
   * Uses cosine similarity algorithm
   */
  private computeVectorSimilarity(
    spatialEntropy: number[],
    referenceVectors: number[]
  ): number {
    // Normalize arrays to same length
    const minLength = Math.min(spatialEntropy.length, referenceVectors.length);
    const entropy = spatialEntropy.slice(0, minLength);
    const reference = referenceVectors.slice(0, minLength);

    if (minLength === 0) {
      return 0;
    }

    // Compute cosine similarity
    let dotProduct = 0;
    let entropyMagnitude = 0;
    let referenceMagnitude = 0;

    for (let i = 0; i < minLength; i++) {
      dotProduct += entropy[i] * reference[i];
      entropyMagnitude += entropy[i] * entropy[i];
      referenceMagnitude += reference[i] * reference[i];
    }

    entropyMagnitude = Math.sqrt(entropyMagnitude);
    referenceMagnitude = Math.sqrt(referenceMagnitude);

    if (entropyMagnitude === 0 || referenceMagnitude === 0) {
      return 0;
    }

    const similarity = dotProduct / (entropyMagnitude * referenceMagnitude);

    // Convert to 0-100 score
    return Math.round(Math.max(0, Math.min(100, similarity * 100)));
  }

  /**
   * Generate unique verification ID
   */
  private generateVerificationId(
    capturedData: CapturedData,
    keyBundle: KeyBundle,
    confidenceScore: number
  ): string {
    const payload = JSON.stringify({
      timestamp: capturedData.timestamp,
      deviceId: capturedData.deviceId,
      bundleId: keyBundle.bundleId,
      score: confidenceScore,
      nonce: crypto.randomBytes(8).toString('hex'),
    });

    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    return `OIDS-${hash.substring(0, 16).toUpperCase()}`;
  }

  /**
   * Create encrypted log entry for later sync
   */
  private async createEncryptedLogEntry(
    result: ValidationResult,
    capturedData: CapturedData,
    assetPublicKey: string
  ): Promise<void> {
    const logData = {
      verificationId: result.verificationId,
      confidenceScore: result.confidenceScore,
      isOffline: result.isOfflineValidation,
      timestamp: result.timestamp,
      deviceId: capturedData.deviceId,
      assetKeyHash: crypto
        .createHash('sha256')
        .update(assetPublicKey)
        .digest('hex')
        .substring(0, 16),
    };

    // Encrypt the log entry
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', LOG_ENCRYPTION_KEY, iv);

    const jsonData = JSON.stringify(logData);
    let encrypted = cipher.update(jsonData, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    const encryptedEntry: EncryptedLogEntry = {
      iv: iv.toString('hex'),
      encryptedData: encrypted + authTag.toString('hex'),
      hash: crypto.createHash('sha256').update(jsonData).digest('hex'),
      timestamp: Date.now(),
    };

    // Store for later sync
    pendingSyncLogs.push(encryptedEntry);
  }

  /**
   * Get pending logs for sync (when back online)
   */
  public getPendingSyncLogs(): EncryptedLogEntry[] {
    return [...pendingSyncLogs];
  }

  /**
   * Clear synced logs
   */
  public clearSyncedLogs(count: number): void {
    pendingSyncLogs.splice(0, count);
  }

  /**
   * Get sync status
   */
  public getSyncStatus(): { pendingCount: number; isOnline: boolean } {
    return {
      pendingCount: pendingSyncLogs.length,
      isOnline: this.isOnline,
    };
  }
}

// Export singleton instance
export const oidsValidator = new OidsValidator();

export default OidsValidator;

import { Readable } from "stream";

import { config } from "../shared/config";
import { logger } from "../shared/logger";

interface S3ClientType {
  send: (command: unknown) => Promise<{ Body: Readable }>;
}

interface PutObjectCommandType {
  new (params: {
    Bucket: string;
    Key: string;
    Body: Buffer | Readable;
    ContentType: string;
  }): unknown;
}

interface GetObjectCommandType {
  new (params: { Bucket: string; Key: string }): unknown;
}

interface DeleteObjectCommandType {
  new (params: { Bucket: string; Key: string }): unknown;
}

/**
 * Interface for S3 storage service
 */
export interface IStorage {
  save(file: Buffer | Readable, key: string): Promise<string>;
  getStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
}

export class S3Storage implements IStorage {
  private bucket: string;
  private s3: S3ClientType | null = null;
  private PutObjectCommand: PutObjectCommandType | null = null;
  private GetObjectCommand: GetObjectCommandType | null = null;
  private DeleteObjectCommand: DeleteObjectCommandType | null = null;

  constructor(bucket: string) {
    this.bucket = bucket;
    try {
      const {
        S3Client,
        PutObjectCommand,
        GetObjectCommand,
        DeleteObjectCommand,
      } = require("@aws-sdk/client-s3");
      this.s3 = new S3Client({}) as S3ClientType;
      this.PutObjectCommand = PutObjectCommand as PutObjectCommandType;
      this.GetObjectCommand = GetObjectCommand as GetObjectCommandType;
      this.DeleteObjectCommand = DeleteObjectCommand as DeleteObjectCommandType;
      logger.debug("S3 storage has been initialized successfully", { bucket });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.warn("Unable to initialze S3 storage", {
        error: errorMessage,
      });
    }
  }

  async save(file: Buffer | Readable, key: string): Promise<string> {
    if (!this.s3 || !this.PutObjectCommand) {
      throw new Error("S3 client is not available");
    }

    const size = Buffer.isBuffer(file) ? file.length : undefined;
    await this.s3.send(
      new this.PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: "text/csv",
      }),
    );
    logger.debug("File successully saved to S3", {
      key,
      bucket: this.bucket,
      size: size || "streaming",
    });
    return key;
  }

  async getStream(key: string): Promise<Readable> {
    if (!this.s3 || !this.GetObjectCommand) {
      throw new Error("S3 client is not available");
    }
    const response = await this.s3.send(
      new this.GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    return response.Body as Readable;
  }

  async delete(key: string): Promise<void> {
    if (!this.s3 || !this.DeleteObjectCommand) {
      return;
    }

    try {
      await this.s3.send(
        new this.DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      logger.debug("S3 object has been deleted", { key, bucket: this.bucket });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.warn("Error while deleting S3 object", {
        key,
        bucket: this.bucket,
        error: errorMessage,
      });
    }
  }
}

export function getS3Storage(): IStorage {
  if (!config.s3Bucket) {
    throw new Error(
      "S3_BUCKET is not configured. Please set either S3_BUCKET environment variable or use SKIP_S3=true for direct processing.",
    );
  }
  return new S3Storage(config.s3Bucket);
}

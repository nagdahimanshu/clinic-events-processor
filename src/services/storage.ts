import { Readable } from "stream";

import { logger } from "../shared/logger";
import { config } from "../shared/config";

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
  private s3: any;
  private PutObjectCommand: any;
  private GetObjectCommand: any;
  private DeleteObjectCommand: any;

  constructor(bucket: string) {
    this.bucket = bucket;
    try {
      const {
        S3Client,
        PutObjectCommand,
        GetObjectCommand,
        DeleteObjectCommand,
      } = require("@aws-sdk/client-s3");
      this.s3 = new S3Client({});
      this.PutObjectCommand = PutObjectCommand;
      this.GetObjectCommand = GetObjectCommand;
      this.DeleteObjectCommand = DeleteObjectCommand;
      logger.debug("S3 storage has been initialized successfully", { bucket });
    } catch (error: any) {
      logger.warn("Unable to initialze S3 storage", {
        error: error.message,
      });
    }
  }

  async save(file: Buffer | Readable, key: string): Promise<string> {
    if (!this.s3) {
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
    if (!this.s3) {
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
    if (!this.s3) {
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
    } catch (error: any) {
      logger.warn("Error while deleting S3 object", {
        key,
        bucket: this.bucket,
        error: error.message,
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

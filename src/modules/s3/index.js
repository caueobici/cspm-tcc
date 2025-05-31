import {
  S3Client,
  ListBucketsCommand,
  GetBucketTaggingCommand,
  GetBucketLocationCommand,
  GetBucketAclCommand,
  GetBucketPolicyCommand,
  GetBucketPolicyStatusCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLoggingCommand,
  GetBucketCorsCommand,
  GetBucketWebsiteCommand,
  GetBucketReplicationCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketNotificationConfigurationCommand
} from '@aws-sdk/client-s3';
import { AWSModule } from '../../core/aws-module.js';

class S3Module extends AWSModule {
  constructor() {
    super();
    this.s3Client = new S3Client();
  }

  async getBucketRegion(bucketName) {
    try {
      const command = new GetBucketLocationCommand({
        Bucket: bucketName
      });
      const { LocationConstraint } = await this.s3Client.send(command);
      // If LocationConstraint is null or empty, the bucket is in us-east-1
      return LocationConstraint || 'us-east-1';
    } catch (error) {
      console.warn(`Failed to get region for bucket ${bucketName}:`, error.message);
      return null;
    }
  }

  async getBucketTags(bucketName, region) {
    try {
      // Create a new S3 client for the specific region
      const regionalClient = new S3Client({ region });
      const command = new GetBucketTaggingCommand({
        Bucket: bucketName
      });
      const { TagSet } = await regionalClient.send(command);
      return TagSet.reduce((acc, tag) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {});
    } catch (error) {
      if (error.name !== 'NoSuchTagSet') {
        console.warn(`Failed to get tags for bucket ${bucketName}:`, error.message);
      }
      return {};
    }
  }

  async getBucketAcl(bucketName, region) {
    try {
      const regionalClient = new S3Client({ region });
      const command = new GetBucketAclCommand({
        Bucket: bucketName
      });
      const { Owner, Grants } = await regionalClient.send(command);
      return {
        owner: {
          id: Owner.ID,
          displayName: Owner.DisplayName
        },
        grants: Grants.map(grant => ({
          grantee: {
            type: grant.Grantee.Type,
            id: grant.Grantee.ID,
            uri: grant.Grantee.URI,
            displayName: grant.Grantee.DisplayName
          },
          permission: grant.Permission
        }))
      };
    } catch (error) {
      if (error.name !== 'NoSuchBucket') {
        console.warn(`Failed to get ACL for bucket ${bucketName}:`, error.message);
      }
      return null;
    }
  }

  async getBucketPolicy(bucketName, region) {
    try {
      const regionalClient = new S3Client({ region });
      const command = new GetBucketPolicyCommand({
        Bucket: bucketName
      });
      const { Policy } = await regionalClient.send(command);
      return JSON.parse(Policy);
    } catch (error) {
      if (error.name !== 'NoSuchBucketPolicy') {
        console.warn(`Failed to get policy for bucket ${bucketName}:`, error.message);
      }
      return null;
    }
  }

  async getBucketPolicyStatus(bucketName, region) {
    try {
      const regionalClient = new S3Client({ region });
      const command = new GetBucketPolicyStatusCommand({
        Bucket: bucketName
      });
      const { PolicyStatus } = await regionalClient.send(command);
      return PolicyStatus;
    } catch (error) {
      if (error.name !== 'NoSuchBucketPolicy') {
        console.warn(`Failed to get policy status for bucket ${bucketName}:`, error.message);
      }
      return null;
    }
  }

  async getBucketVersioning(bucketName, region) {
    try {
      const regionalClient = new S3Client({ region });
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName
      });
      const { Status, MFADelete } = await regionalClient.send(command);
      return { status: Status, mfaDelete: MFADelete };
    } catch (error) {
      if (error.name !== 'NoSuchBucket') {
        console.warn(`Failed to get versioning for bucket ${bucketName}:`, error.message);
      }
      return null;
    }
  }

  async getBucketEncryption(bucketName, region) {
    try {
      const regionalClient = new S3Client({ region });
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName
      });
      const { ServerSideEncryptionConfiguration } = await regionalClient.send(command);
      return ServerSideEncryptionConfiguration;
    } catch (error) {
      if (error.name !== 'ServerSideEncryptionConfigurationNotFoundError') {
        console.warn(`Failed to get encryption for bucket ${bucketName}:`, error.message);
      }
      return null;
    }
  }

  async getBucketLogging(bucketName, region) {
    try {
      const regionalClient = new S3Client({ region });
      const command = new GetBucketLoggingCommand({
        Bucket: bucketName
      });
      const { LoggingEnabled } = await regionalClient.send(command);
      return LoggingEnabled;
    } catch (error) {
      if (error.name !== 'NoSuchBucket') {
        console.warn(`Failed to get logging for bucket ${bucketName}:`, error.message);
      }
      return null;
    }
  }

  async getBucketCors(bucketName, region) {
    try {
      const regionalClient = new S3Client({ region });
      const command = new GetBucketCorsCommand({
        Bucket: bucketName
      });
      const { CORSRules } = await regionalClient.send(command);
      return CORSRules;
    } catch (error) {
      if (error.name !== 'NoSuchCORSConfiguration') {
        console.warn(`Failed to get CORS for bucket ${bucketName}:`, error.message);
      }
      return null;
    }
  }

  async getBucketWebsite(bucketName, region) {
    try {
      const regionalClient = new S3Client({ region });
      const command = new GetBucketWebsiteCommand({
        Bucket: bucketName
      });
      const websiteConfig = await regionalClient.send(command);
      return websiteConfig;
    } catch (error) {
      if (error.name !== 'NoSuchWebsiteConfiguration') {
        console.warn(`Failed to get website configuration for bucket ${bucketName}:`, error.message);
      }
      return null;
    }
  }

  async getBucketReplication(bucketName, region) {
    try {
      const regionalClient = new S3Client({ region });
      const command = new GetBucketReplicationCommand({
        Bucket: bucketName
      });
      const { ReplicationConfiguration } = await regionalClient.send(command);
      return ReplicationConfiguration;
    } catch (error) {
      if (error.name !== 'ReplicationConfigurationNotFoundError') {
        console.warn(`Failed to get replication for bucket ${bucketName}:`, error.message);
      }
      return null;
    }
  }

  async getBucketLifecycle(bucketName, region) {
    try {
      const regionalClient = new S3Client({ region });
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName
      });
      const { Rules } = await regionalClient.send(command);
      return Rules;
    } catch (error) {
      if (error.name !== 'NoSuchLifecycleConfiguration') {
        console.warn(`Failed to get lifecycle configuration for bucket ${bucketName}:`, error.message);
      }
      return null;
    }
  }

  async getBucketNotification(bucketName, region) {
    try {
      const regionalClient = new S3Client({ region });
      const command = new GetBucketNotificationConfigurationCommand({
        Bucket: bucketName
      });
      const notificationConfig = await regionalClient.send(command);
      return notificationConfig;
    } catch (error) {
      if (error.name !== 'NoSuchBucket') {
        console.warn(`Failed to get notification configuration for bucket ${bucketName}:`, error.message);
      }
      return null;
    }
  }

  async checkIfBucketIsPublic(acls, policy) {
    const isPublicByAcl = acls?.grants?.some(grant => 
      grant.grantee.uri === 'http://acs.amazonaws.com/groups/global/AllUsers' ||
      grant.grantee.uri === 'http://acs.amazonaws.com/groups/global/AuthenticatedUsers'
    ) || false;

    const isPublicByPolicy = policy?.Statement?.some(statement => 
      statement.Effect === 'Allow' &&
      statement.Principal?.includes('*') &&
      (statement.Action?.includes('s3:GetObject') || statement.Action?.includes('s3:ListBucket'))
    ) || false;


    return isPublicByAcl || isPublicByPolicy;
  }

  async getData() {
    await this.validateCredentials();

    try {
      // List all buckets
      const listCommand = new ListBucketsCommand({});
      const { Buckets } = await this.s3Client.send(listCommand);

      // Get detailed information for each bucket and return as array
      return await Promise.all(
        Buckets.map(async (bucket) => {
          // Get bucket region first as it's needed for other operations
          const region = await this.getBucketRegion(bucket.Name);
          if (!region) return null;

          // Create regional client for this bucket
          const regionalClient = new S3Client({ region });

          // Get all bucket information in parallel
          const [
            tags,
            acl,
            policy,
            policyStatus,
            versioning,
            encryption,
            logging,
            cors,
            website,
            replication,
            lifecycle,
            notification
          ] = await Promise.all([
            this.getBucketTags(bucket.Name, region),
            this.getBucketAcl(bucket.Name, region),
            this.getBucketPolicy(bucket.Name, region),
            this.getBucketPolicyStatus(bucket.Name, region),
            this.getBucketVersioning(bucket.Name, region),
            this.getBucketEncryption(bucket.Name, region),
            this.getBucketLogging(bucket.Name, region),
            this.getBucketCors(bucket.Name, region),
            this.getBucketWebsite(bucket.Name, region),
            this.getBucketReplication(bucket.Name, region),
            this.getBucketLifecycle(bucket.Name, region),
            this.getBucketNotification(bucket.Name, region)
          ]);

          // Construct the ARN
          const arn = `arn:aws:s3:::${bucket.Name}`;

          // Return comprehensive bucket information
          return {
            name: bucket.Name,
            arn,
            region,
            creationDate: bucket.CreationDate,
            tags,
            acl,
            policy,
            policyStatus,
            versioning,
            encryption,
            logging,
            cors,
            website,
            replication,
            lifecycle,
            notification,
            security: {
              isPublic: await this.checkIfBucketIsPublic(acl, policy),
              hasPolicy: !!policy,
              isEncrypted: !!encryption,
              isVersioned: versioning?.status === 'Enabled',
              hasLogging: !!logging
            }
          };
        })
      ).then(buckets => buckets.filter(bucket => bucket !== null)); // Remove any null entries
    } catch (error) {
      throw new Error(`Failed to get S3 data: ${error.message}`);
    }
  }
}

export default new S3Module(); 
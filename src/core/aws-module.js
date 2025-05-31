import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

export class AWSModule {
  constructor() {
    this.stsClient = new STSClient();
  }

  async validateCredentials() {
    try {
      const command = new GetCallerIdentityCommand({});
      await this.stsClient.send(command);
      return true;
    } catch (error) {
      throw new Error(`AWS credentials validation failed: ${error.message}`);
    }
  }

  async getData() {
    throw new Error('getData() must be implemented by the service module');
  }
} 
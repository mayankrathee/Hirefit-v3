// Type declarations for modules without types

declare module 'passport-azure-ad' {
  import { Strategy } from 'passport';

  export interface IBearerStrategyOption {
    identityMetadata: string;
    clientID: string;
    validateIssuer?: boolean;
    issuer?: string;
    passReqToCallback?: boolean;
    loggingLevel?: string;
    loggingNoPII?: boolean;
  }

  export class BearerStrategy extends Strategy {
    constructor(options: IBearerStrategyOption, verify?: Function);
  }
}

// Extend Express Request types
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

export {};


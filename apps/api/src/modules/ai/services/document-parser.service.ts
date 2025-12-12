import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  AI_PROVIDER,
  IAIProvider,
  DocumentParseInput,
  DocumentParseResult,
} from '../interfaces/ai-provider.interface';

/**
 * Document Parser Service
 * 
 * Orchestrates document parsing using the configured AI provider.
 * Handles PDF, DOC, and DOCX files.
 */
@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);

  // Supported MIME types
  private readonly supportedTypes = new Map<string, string>([
    ['application/pdf', 'pdf'],
    ['application/msword', 'doc'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
    ['text/plain', 'txt'],
  ]);

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
  ) {}

  /**
   * Parse a document and extract text content
   */
  async parseDocument(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<DocumentParseResult> {
    // Validate file type
    if (!this.isSupported(mimeType)) {
      throw new Error(
        `Unsupported file type: ${mimeType}. Supported types: ${Array.from(this.supportedTypes.keys()).join(', ')}`,
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new Error(`File too large: ${buffer.length} bytes. Maximum size: ${maxSize} bytes`);
    }

    this.logger.debug(`Parsing document: ${fileName} (${mimeType}, ${buffer.length} bytes)`);

    const input: DocumentParseInput = {
      buffer,
      fileName,
      mimeType,
    };

    try {
      const result = await this.aiProvider.parseDocument(input);
      
      this.logger.log(
        `Document parsed successfully: ${fileName}, ` +
        `${result.pages} pages, ${result.text.length} chars, ` +
        `confidence: ${(result.confidence * 100).toFixed(1)}%`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to parse document ${fileName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if a MIME type is supported
   */
  isSupported(mimeType: string): boolean {
    return this.supportedTypes.has(mimeType);
  }

  /**
   * Get file extension from MIME type
   */
  getExtension(mimeType: string): string | undefined {
    return this.supportedTypes.get(mimeType);
  }

  /**
   * Get supported MIME types
   */
  getSupportedTypes(): string[] {
    return Array.from(this.supportedTypes.keys());
  }
}



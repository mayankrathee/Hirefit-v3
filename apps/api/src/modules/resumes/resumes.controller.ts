import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { ResumesService } from './resumes.service';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('resumes')
@Controller('candidates/:candidateId/resumes')
@ApiBearerAuth('JWT-auth')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post()
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a resume for a candidate' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Resume uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async upload(
    @TenantId() tenantId: string,
    @Param('candidateId') candidateId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.resumesService.upload(tenantId, {
      candidateId,
      originalFileName: file.originalname,
      fileType: file.mimetype,
      fileSizeBytes: file.size,
      buffer: file.buffer,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all resumes for a candidate' })
  @ApiResponse({ status: 200, description: 'List of resumes' })
  findAll(@Param('candidateId') candidateId: string) {
    return this.resumesService.findByCandidate(candidateId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resume by ID' })
  @ApiResponse({ status: 200, description: 'Resume details' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  findOne(
    @Param('candidateId') candidateId: string,
    @Param('id') id: string,
  ) {
    return this.resumesService.findById(candidateId, id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get download URL for resume' })
  @ApiResponse({ status: 200, description: 'Download URL' })
  async getDownloadUrl(
    @Param('candidateId') candidateId: string,
    @Param('id') id: string,
  ) {
    const url = await this.resumesService.getDownloadUrl(candidateId, id);
    return { url };
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Download resume file' })
  @ApiProduces('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  @ApiResponse({ status: 200, description: 'Resume file' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async downloadFile(
    @Param('candidateId') candidateId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { filePath, fileName, mimeType } = await this.resumesService.getFilePath(candidateId, id);
    
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    });

    const file = createReadStream(filePath);
    return new StreamableFile(file);
  }

  @Post(':id/set-primary')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set resume as primary' })
  @ApiResponse({ status: 200, description: 'Resume set as primary' })
  setPrimary(
    @Param('candidateId') candidateId: string,
    @Param('id') id: string,
  ) {
    return this.resumesService.setPrimary(candidateId, id);
  }

  @Delete(':id')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete resume' })
  @ApiResponse({ status: 204, description: 'Resume deleted' })
  remove(
    @Param('candidateId') candidateId: string,
    @Param('id') id: string,
  ) {
    return this.resumesService.delete(candidateId, id);
  }
}


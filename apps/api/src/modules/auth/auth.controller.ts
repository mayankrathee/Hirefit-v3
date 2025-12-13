import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/user.decorator';
import { SkipTenantCheck } from '../../common/guards/tenant.guard';
import { RefreshTokenDto, AzureAdCallbackDto, LoginDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
@SkipTenantCheck()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('azure-ad/callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Azure AD OAuth callback' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async azureAdCallback(@Body() body: AzureAdCallbackDto) {
    // In a real implementation, you would validate the Azure AD token
    // and extract the profile. This is simplified for the example.
    return this.authService.handleAzureAdCallback(
      body.profile,
      body.tenantSlug,
    );
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email/password login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or email not verified' })
  async login(@Body() body: LoginDto) {
    return this.authService.loginWithPassword(body.email, body.password, body.tenantSlug);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  async logout(@CurrentUser() user: JwtPayload) {
    await this.authService.logout(user.sub);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async me(@CurrentUser() user: JwtPayload) {
    return {
      id: user.sub,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.roles,
    };
  }

  @Get('google/login')
  @Public()
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiQuery({ name: 'tenant', required: false, description: 'Tenant slug for SSO' })
  @ApiQuery({ name: 'redirect_uri', required: false, description: 'Frontend redirect URI after auth' })
  @ApiResponse({ status: 302, description: 'Redirect to Google' })
  googleLogin(
    @Query('tenant') tenantSlug: string,
    @Query('redirect_uri') frontendRedirect: string,
    @Res() res: Response,
  ) {
    const clientId = this.configService.get<string>('google.clientId') || process.env.GOOGLE_CLIENT_ID;
    const redirectUri = this.configService.get<string>('google.redirectUri') || process.env.GOOGLE_REDIRECT_URI;
    
    if (!clientId) {
      this.logger.warn('Google OAuth not configured');
      const webUrl = this.configService.get<string>('WEB_URL') || this.configService.get<string>('webUrl') || 'http://localhost:3002';
      res.redirect(`${webUrl}/login?error=${encodeURIComponent('Google OAuth not configured')}`);
      return;
    }

    // Store state for CSRF protection and to pass tenant info
    const state = Buffer.from(JSON.stringify({
      tenantSlug,
      frontendRedirect: frontendRedirect || `${this.configService.get<string>('webUrl') || 'http://localhost:3002'}/auth/callback`,
      timestamp: Date.now(),
    })).toString('base64');

    const scope = encodeURIComponent('openid profile email');
    const encodedRedirectUri = encodeURIComponent(redirectUri || '');
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodedRedirectUri}&` +
      `scope=${scope}&` +
      `state=${encodeURIComponent(state)}`;

    this.logger.log(`Redirecting to Google for authentication`);
    res.redirect(authUrl);
  }

  @Get('google/callback')
  @Public()
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with tokens' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const webUrl = this.configService.get<string>('webUrl') || 'http://localhost:3002';
    
    // Handle errors from Google
    if (error) {
      this.logger.error(`Google OAuth error: ${error} - ${errorDescription}`);
      res.redirect(`${webUrl}/login?error=${encodeURIComponent(errorDescription || error)}`);
      return;
    }

    if (!code) {
      this.logger.error('No authorization code received');
      res.redirect(`${webUrl}/login?error=no_code`);
      return;
    }

    try {
      // Decode state
      let parsedState = { tenantSlug: '', frontendRedirect: `${webUrl}/auth/callback` };
      if (state) {
        try {
          parsedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
        } catch {
          this.logger.warn('Failed to parse state parameter');
        }
      }

      // Exchange code for tokens
      const tokens = await this.exchangeGoogleCodeForTokens(code);
      
      // Decode ID token to get user info
      const idTokenPayload = this.decodeJwt(tokens.id_token);
      
      // Handle Google callback in auth service
      const result = await this.authService.handleGoogleCallback({
        sub: idTokenPayload.sub,
        email: idTokenPayload.email,
        name: idTokenPayload.name,
        given_name: idTokenPayload.given_name,
        family_name: idTokenPayload.family_name,
        picture: idTokenPayload.picture,
      }, parsedState.tenantSlug);

      // Redirect to frontend with tokens
      const redirectUrl = new URL(parsedState.frontendRedirect);
      redirectUrl.searchParams.set('accessToken', result.accessToken);
      redirectUrl.searchParams.set('refreshToken', result.refreshToken);
      redirectUrl.searchParams.set('user', Buffer.from(JSON.stringify(result.user)).toString('base64'));

      res.redirect(redirectUrl.toString());
    } catch (err: any) {
      this.logger.error(`Google callback error: ${err.message}`);
      res.redirect(`${webUrl}/login?error=${encodeURIComponent(err.message)}`);
    }
  }

  @Get('azure-ad/login')
  @Public()
  @ApiOperation({ summary: 'Initiate Azure AD login' })
  @ApiQuery({ name: 'tenant', required: false, description: 'Tenant slug for SSO' })
  @ApiQuery({ name: 'redirect_uri', required: false, description: 'Frontend redirect URI after auth' })
  @ApiResponse({ status: 302, description: 'Redirect to Azure AD' })
  azureAdLogin(
    @Query('tenant') tenantSlug: string,
    @Query('redirect_uri') frontendRedirect: string,
    @Res() res: Response,
  ) {
    const clientId = this.configService.get<string>('azure.ad.clientId') || process.env.AZURE_AD_CLIENT_ID;
    const azureTenantId = this.configService.get<string>('azure.ad.tenantId') || process.env.AZURE_AD_TENANT_ID || 'common';
    const redirectUri = this.configService.get<string>('azure.ad.redirectUri') || process.env.AZURE_AD_REDIRECT_URI;
    
    if (!clientId) {
      this.logger.warn('Azure AD not configured');
      const webUrl = this.configService.get<string>('WEB_URL') || this.configService.get<string>('webUrl') || 'http://localhost:3002';
      res.redirect(`${webUrl}/login?error=${encodeURIComponent('Azure AD not configured')}`);
      return;
    }

    // Store state for CSRF protection and to pass tenant info
    const state = Buffer.from(JSON.stringify({
      tenantSlug,
      frontendRedirect: frontendRedirect || `${this.configService.get<string>('webUrl') || 'http://localhost:3002'}/auth/callback`,
      timestamp: Date.now(),
    })).toString('base64');

    const scope = encodeURIComponent('openid profile email');
    const encodedRedirectUri = encodeURIComponent(redirectUri || '');
    
    const authUrl = `https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodedRedirectUri}&` +
      `scope=${scope}&` +
      `response_mode=query&` +
      `state=${encodeURIComponent(state)}`;

    this.logger.log(`Redirecting to Azure AD for authentication`);
    res.redirect(authUrl);
  }

  @Get('azure-ad/callback')
  @Public()
  @ApiOperation({ summary: 'Handle Azure AD OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with tokens' })
  async azureAdCallbackGet(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const webUrl = this.configService.get<string>('webUrl') || 'http://localhost:3002';
    
    // Handle errors from Azure AD
    if (error) {
      this.logger.error(`Azure AD auth error: ${error} - ${errorDescription}`);
      res.redirect(`${webUrl}/login?error=${encodeURIComponent(errorDescription || error)}`);
      return;
    }

    if (!code) {
      this.logger.error('No authorization code received');
      res.redirect(`${webUrl}/login?error=no_code`);
      return;
    }

    try {
      // Decode state
      let parsedState = { tenantSlug: '', frontendRedirect: `${webUrl}/auth/callback` };
      if (state) {
        try {
          parsedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
        } catch {
          this.logger.warn('Failed to parse state parameter');
        }
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code);
      
      // Decode ID token to get user info
      const idTokenPayload = this.decodeJwt(tokens.id_token);
      
      // Handle Azure AD callback in auth service
      const result = await this.authService.handleAzureAdCallback({
        oid: idTokenPayload.oid,
        email: idTokenPayload.preferred_username || idTokenPayload.email,
        name: idTokenPayload.name,
        given_name: idTokenPayload.given_name,
        family_name: idTokenPayload.family_name,
        preferred_username: idTokenPayload.preferred_username,
        tid: idTokenPayload.tid,
      }, parsedState.tenantSlug);

      // Redirect to frontend with tokens
      const redirectUrl = new URL(parsedState.frontendRedirect);
      redirectUrl.searchParams.set('accessToken', result.accessToken);
      redirectUrl.searchParams.set('refreshToken', result.refreshToken);
      redirectUrl.searchParams.set('user', Buffer.from(JSON.stringify(result.user)).toString('base64'));

      res.redirect(redirectUrl.toString());
    } catch (err: any) {
      this.logger.error(`Azure AD callback error: ${err.message}`);
      res.redirect(`${webUrl}/login?error=${encodeURIComponent(err.message)}`);
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<any> {
    const clientId = this.configService.get<string>('azure.ad.clientId') || process.env.AZURE_AD_CLIENT_ID;
    const clientSecret = this.configService.get<string>('azure.ad.clientSecret') || process.env.AZURE_AD_CLIENT_SECRET;
    const azureTenantId = this.configService.get<string>('azure.ad.tenantId') || process.env.AZURE_AD_TENANT_ID || 'common';
    const redirectUri = this.configService.get<string>('azure.ad.redirectUri') || process.env.AZURE_AD_REDIRECT_URI;

    const tokenUrl = `https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/token`;
    
    const body = new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      code,
      redirect_uri: redirectUri!,
      grant_type: 'authorization_code',
      scope: 'openid profile email',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error_description || 'Token exchange failed');
    }

    return response.json();
  }

  /**
   * Exchange Google authorization code for tokens
   */
  private async exchangeGoogleCodeForTokens(code: string): Promise<any> {
    const clientId = this.configService.get<string>('google.clientId') || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = this.configService.get<string>('google.clientSecret') || process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = this.configService.get<string>('google.redirectUri') || process.env.GOOGLE_REDIRECT_URI;

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    
    const body = new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      code,
      redirect_uri: redirectUri!,
      grant_type: 'authorization_code',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error_description || 'Token exchange failed');
    }

    return response.json();
  }

  /**
   * Decode JWT without verification (for ID token inspection)
   */
  private decodeJwt(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payload);
  }

}


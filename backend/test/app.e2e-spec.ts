import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Yashil Quest API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const testUser = {
      email: `test_${Date.now()}@yashilquest.uz`,
      username: `TestUser_${Date.now()}`,
      password: 'TestPass123!',
      region: 'Toshkent',
    };

    it('POST /api/auth/register - should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);

      accessToken = res.body.accessToken;
      userId = res.body.user.id;
    });

    it('POST /api/auth/login - should login with correct credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      accessToken = res.body.accessToken;
    });

    it('POST /api/auth/login - should reject wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('GET /api/auth/me - should return current user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.email).toBe(testUser.email);
    });
  });

  describe('Trees', () => {
    it('GET /api/trees/map - should return tree locations', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/trees/map')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/trees/nearby - should return nearby trees', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/trees/nearby?lat=41.2995&lng=69.2401&radius=10')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Leaderboard', () => {
    it('GET /api/leaderboard/global - should return leaderboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/leaderboard/global')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/leaderboard/stats - should return platform stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/leaderboard/stats')
        .expect(200);

      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('totalTrees');
      expect(res.body).toHaveProperty('totalVerifications');
    });
  });

  describe('Tokens', () => {
    it('GET /api/tokens/balance - should return user balance', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tokens/balance')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalTokens');
      expect(res.body).toHaveProperty('walletAddress');
    });

    it('GET /api/tokens/stats - should return token supply stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/tokens/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalSupply');
      expect(res.body).toHaveProperty('byType');
    });
  });

  describe('Users', () => {
    it('GET /api/users/profile - should return user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('username');
      expect(res.body).toHaveProperty('level');
      expect(res.body).toHaveProperty('totalTokens');
    });

    it('PATCH /api/users/profile - should update user profile', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ region: 'Samarqand' })
        .expect(200);

      expect(res.body.region).toBe('Samarqand');
    });
  });

  describe('Security', () => {
    it('should reject requests without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/tokens/balance')
        .expect(401);
    });

    it('should reject invalid auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });

    it('should validate request body on registration', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', username: 'ab', password: '123' })
        .expect(400);
    });
  });
});

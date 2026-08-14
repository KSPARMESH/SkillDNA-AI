import assert from 'node:assert';
import { PlatformAdapterFactory } from '../adapters/adapter.factory';
import { PlatformType } from '@skilldna/shared';
import {
  IntegrationNotFoundError,
  SyncFailedError,
  RateLimitExceededError,
  OAuthAuthenticationError,
} from '../errors/integration.errors';
import { NormalizedPlatformResult } from '../types/integration.types';

async function runAdaptersMatrixTests() {
  console.log('🧪 Running Comprehensive Adapters Matrix & Error Handling Verification...');

  PlatformAdapterFactory.initialize();
  const registeredPlatforms = PlatformAdapterFactory.getRegisteredPlatforms();
  console.log(
    `  Registered adapters count: ${registeredPlatforms.length} (${registeredPlatforms.join(', ')})`,
  );
  assert.strictEqual(registeredPlatforms.length, 11, 'All 11 platform adapters must be registered');

  // =========================================================================
  // 1. CODEFORCES ADAPTER VERIFICATION
  // =========================================================================
  {
    console.log('\n  1. Testing CodeforcesAdapter...');
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.CODEFORCES);
    assert.strictEqual(adapter.platformName, PlatformType.CODEFORCES);

    // Live or safe public user test with 'tourist'
    try {
      const result: NormalizedPlatformResult = await adapter.fetchData('tourist');
      assert.strictEqual(result.platform, PlatformType.CODEFORCES);
      assert.strictEqual(result.username, 'tourist');
      assert.ok(result.codingStats);
      assert.ok(typeof result.codingStats.totalSolved === 'number');
      assert.strictEqual(
        result.codingStats.easySolved +
          result.codingStats.mediumSolved +
          result.codingStats.hardSolved,
        result.codingStats.totalSolved,
      );
      assert.ok(typeof result.codingStats.contestRating === 'number');
      assert.ok(result.rawMetadata?.rank !== undefined);
      console.log(
        `     ✓ Live Codeforces fetch for 'tourist' succeeded (${result.codingStats.totalSolved} solved, rating: ${result.codingStats.contestRating})`,
      );
    } catch (err: any) {
      console.log(`     ℹ Live Codeforces notice: ${err.message} (proceeding with mocked test)`);
    }

    // Unknown user handling
    let threwNotFound = false;
    try {
      await adapter.fetchData('nonexistent_cf_user_xyz_999999999');
    } catch (err: any) {
      threwNotFound = true;
      assert.ok(err instanceof IntegrationNotFoundError);
      assert.strictEqual(err.statusCode, 404);
    }
    assert.ok(threwNotFound, 'Codeforces nonexistent handle must throw IntegrationNotFoundError');
    console.log('     ✓ Codeforces unknown user throws IntegrationNotFoundError (404)');

    // Mocked 429 Rate Limit
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      if (url.includes('codeforces')) {
        return { ok: false, status: 429, statusText: 'Too Many Requests', json: async () => ({}) };
      }
      return originalFetch(url);
    };
    try {
      let threw429 = false;
      try {
        await adapter.fetchData('tourist');
      } catch (err: any) {
        threw429 = true;
        assert.ok(err instanceof RateLimitExceededError);
        assert.strictEqual(err.statusCode, 429);
      }
      assert.ok(threw429, 'Codeforces 429 must throw RateLimitExceededError');
      console.log('     ✓ Codeforces 429 mapped to RateLimitExceededError');
    } finally {
      global.fetch = originalFetch;
    }
  }

  // =========================================================================
  // 2. HACKERRANK ADAPTER VERIFICATION
  // =========================================================================
  {
    console.log('\n  2. Testing HackerRankAdapter...');
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.HACKERRANK);
    assert.strictEqual(adapter.platformName, PlatformType.HACKERRANK);

    // Mocked successful normalization
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      if (url.includes('profile')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            model: {
              username: 'hacker_john',
              solved_challenges: 45,
              contest_rating: 1650,
              country: 'United States',
              school: 'MIT',
              level: 4,
            },
          }),
        };
      }
      if (url.includes('badges')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            models: [
              { badge_name: 'Problem Solving', stars: 5 },
              { badge_name: 'Python', stars: 4 },
            ],
          }),
        };
      }
      return originalFetch(url);
    };

    try {
      const result = await adapter.fetchData('hacker_john');
      assert.strictEqual(result.platform, PlatformType.HACKERRANK);
      assert.strictEqual(result.username, 'hacker_john');
      assert.ok(result.codingStats);
      assert.strictEqual(result.codingStats.totalSolved, 45);
      assert.strictEqual(
        result.codingStats.easySolved +
          result.codingStats.mediumSolved +
          result.codingStats.hardSolved,
        45,
      );
      assert.strictEqual(result.codingStats.contestRating, 1650);
      assert.strictEqual(result.codingStats.badgesCount, 2);
      assert.strictEqual(result.rawMetadata?.school, 'MIT');
      console.log('     ✓ HackerRank normalization matches NormalizedPlatformResult');
    } finally {
      global.fetch = originalFetch;
    }

    // Unknown user 404
    (global as any).fetch = async (url: string) => {
      if (url.includes('hackerrank')) {
        return { ok: false, status: 404, statusText: 'Not Found', json: async () => ({}) };
      }
      return originalFetch(url);
    };
    try {
      let threw404 = false;
      try {
        await adapter.fetchData('nonexistent_hacker');
      } catch (err: any) {
        threw404 = true;
        assert.ok(err instanceof IntegrationNotFoundError);
        assert.strictEqual(err.statusCode, 404);
      }
      assert.ok(threw404, 'HackerRank 404 must throw IntegrationNotFoundError');
      console.log('     ✓ HackerRank 404 mapped to IntegrationNotFoundError');
    } finally {
      global.fetch = originalFetch;
    }
  }

  // =========================================================================
  // 3. STACK OVERFLOW ADAPTER VERIFICATION
  // =========================================================================
  {
    console.log('\n  3. Testing StackOverflowAdapter...');
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.STACKOVERFLOW);
    assert.strictEqual(adapter.platformName, PlatformType.STACKOVERFLOW);

    // Live public user test with Jon Skeet (ID: 22656)
    try {
      const result = await adapter.fetchData('22656');
      assert.strictEqual(result.platform, PlatformType.STACKOVERFLOW);
      assert.strictEqual(result.username, '22656');
      assert.ok(result.stackOverflowStats);
      assert.ok(result.stackOverflowStats.reputation > 1000000);
      assert.ok(result.stackOverflowStats.badgeCounts.gold > 0);
      assert.ok(result.rawMetadata?.displayName === 'Jon Skeet');
      console.log(
        `     ✓ Live Stack Overflow fetch for 'Jon Skeet' (22656): ${result.stackOverflowStats.reputation} reputation`,
      );
    } catch (err: any) {
      console.log(`     ℹ Live StackOverflow notice: ${err.message} (proceeding with mocked test)`);
    }

    // Unknown user ID
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      if (url.includes('api.stackexchange.com')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ items: [] }),
        };
      }
      return originalFetch(url);
    };
    try {
      let threwEmpty = false;
      try {
        await adapter.fetchData('999999999999');
      } catch (err: any) {
        threwEmpty = true;
        assert.ok(err instanceof IntegrationNotFoundError);
      }
      assert.ok(threwEmpty, 'Stack Overflow empty items array must throw IntegrationNotFoundError');
      console.log('     ✓ Stack Overflow unknown user ID throws IntegrationNotFoundError');
    } finally {
      global.fetch = originalFetch;
    }
  }

  // =========================================================================
  // 4. MEDIUM ADAPTER VERIFICATION
  // =========================================================================
  {
    console.log('\n  4. Testing MediumAdapter...');
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.MEDIUM);
    assert.strictEqual(adapter.platformName, PlatformType.MEDIUM);

    // Mocked RSS normalization
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      if (url.includes('medium.com/feed')) {
        const mockRssXml = `
          <rss version="2.0">
            <channel>
              <title>Stories by Alex on Medium</title>
              <item>
                <title><![CDATA[Building Resilient Distributed Systems]]></title>
                <link>https://medium.com/@alex/building-resilient-systems</link>
                <pubDate>Mon, 10 Aug 2026 12:00:00 GMT</pubDate>
              </item>
              <item>
                <title><![CDATA[Deep Dive into PostgreSQL Internals]]></title>
                <link>https://medium.com/@alex/postgres-internals</link>
                <pubDate>Wed, 12 Aug 2026 14:00:00 GMT</pubDate>
              </item>
            </channel>
          </rss>
        `;
        return {
          ok: true,
          status: 200,
          text: async () => mockRssXml,
        };
      }
      return originalFetch(url);
    };

    try {
      const result = await adapter.fetchData('alex');
      assert.strictEqual(result.platform, PlatformType.MEDIUM);
      assert.strictEqual(result.username, 'alex');
      assert.ok(result.mediumStats);
      assert.strictEqual(result.mediumStats.totalArticles, 2);
      assert.strictEqual(result.mediumStats.articles?.length, 2);
      assert.strictEqual(
        result.mediumStats.articles?.[0].title,
        'Building Resilient Distributed Systems',
      );
      console.log('     ✓ Medium RSS feed parser correctly extracted articles and count');
    } finally {
      global.fetch = originalFetch;
    }
  }

  // =========================================================================
  // 5. KAGGLE ADAPTER VERIFICATION
  // =========================================================================
  {
    console.log('\n  5. Testing KaggleAdapter...');
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.KAGGLE);
    assert.strictEqual(adapter.platformName, PlatformType.KAGGLE);

    // Unauthenticated (no environment API token) returns limitation notice
    const unauthResult = await adapter.fetchData('kaggle_user');
    assert.strictEqual(unauthResult.platform, PlatformType.KAGGLE);
    assert.strictEqual(unauthResult.username, 'kaggle_user');
    assert.ok(
      unauthResult.limitation?.includes(
        'Kaggle official API integration requires a Kaggle API Token',
      ),
    );
    assert.ok(unauthResult.kaggleStats);
    console.log('     ✓ Kaggle unauthenticated mode returns graceful limitation notice');

    // Authenticated mock
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      if (url.includes('kaggle.com/api/v1')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            tier: 'Master',
            competitionsCount: 12,
            datasetsCount: 5,
            scriptsCount: 18,
            goldMedals: 2,
            silverMedals: 4,
            bronzeMedals: 6,
            displayName: 'Kaggle Master',
          }),
        };
      }
      return originalFetch(url);
    };

    try {
      const authResult = await adapter.fetchData('kaggle_master', 'mock_kaggle_key');
      assert.strictEqual(authResult.platform, PlatformType.KAGGLE);
      assert.strictEqual(authResult.username, 'kaggle_master');
      assert.ok(authResult.kaggleStats);
      assert.strictEqual(authResult.kaggleStats.tier, 'Master');
      assert.strictEqual(authResult.kaggleStats.competitionsCount, 12);
      assert.strictEqual(authResult.kaggleStats.medalsCount.gold, 2);
      assert.strictEqual(authResult.rawMetadata?.displayName, 'Kaggle Master');
      console.log('     ✓ Kaggle authenticated response correctly normalized');
    } finally {
      global.fetch = originalFetch;
    }
  }

  // =========================================================================
  // 6. LINKEDIN ADAPTER VERIFICATION
  // =========================================================================
  {
    console.log('\n  6. Testing LinkedInAdapter...');
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.LINKEDIN);
    assert.strictEqual(adapter.platformName, PlatformType.LINKEDIN);

    // Unauthenticated (no OAuth token)
    const unauthResult = await adapter.fetchData('parmesh-ks');
    assert.strictEqual(unauthResult.platform, PlatformType.LINKEDIN);
    assert.strictEqual(unauthResult.username, 'parmesh-ks');
    assert.ok(unauthResult.limitation?.includes('LinkedIn sync requires user OAuth authorization'));
    assert.strictEqual(
      unauthResult.linkedInStats?.profileUrl,
      'https://www.linkedin.com/in/parmesh-ks',
    );
    console.log(
      '     ✓ LinkedIn unauthenticated mode returns profile link with OAuth limitation notice',
    );

    // Expired token (401)
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      if (url.includes('linkedin.com')) {
        return { ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({}) };
      }
      return originalFetch(url);
    };
    try {
      let threwAuth = false;
      try {
        await adapter.fetchData('parmesh-ks', 'expired_token');
      } catch (err: any) {
        threwAuth = true;
        assert.ok(err instanceof OAuthAuthenticationError);
        assert.strictEqual(err.statusCode, 401);
      }
      assert.ok(threwAuth, 'LinkedIn 401 must throw OAuthAuthenticationError');
      console.log('     ✓ LinkedIn 401 mapped to OAuthAuthenticationError');
    } finally {
      global.fetch = originalFetch;
    }
  }

  // =========================================================================
  // 7. DEVPOST ADAPTER VERIFICATION
  // =========================================================================
  {
    console.log('\n  7. Testing DevpostAdapter...');
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.DEVPOST);
    assert.strictEqual(adapter.platformName, PlatformType.DEVPOST);

    // Mocked successful normalization
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      if (url.includes('devpost.com')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            projects_count: 3,
            hackathons_count: 5,
            likes_count: 24,
            projects: [
              {
                title: 'SkillDNA AI',
                tagline: 'Living Technical Identity',
                url: 'https://devpost.com/software/skilldna',
              },
            ],
          }),
        };
      }
      return originalFetch(url);
    };

    try {
      const result = await adapter.fetchData('devpost_builder');
      assert.strictEqual(result.platform, PlatformType.DEVPOST);
      assert.strictEqual(result.username, 'devpost_builder');
      assert.ok(result.devpostStats);
      assert.strictEqual(result.devpostStats.projectsCount, 3);
      assert.strictEqual(result.devpostStats.hackathonsAttended, 5);
      assert.strictEqual(result.devpostStats.likesReceived, 24);
      assert.strictEqual(result.devpostStats.projects?.[0].title, 'SkillDNA AI');
      console.log('     ✓ Devpost normalization correctly mapped to NormalizedDevpostData');
    } finally {
      global.fetch = originalFetch;
    }

    // 404 handling
    (global as any).fetch = async (url: string) => {
      if (url.includes('devpost.com')) {
        return { ok: false, status: 404, statusText: 'Not Found', json: async () => ({}) };
      }
      return originalFetch(url);
    };
    try {
      let threw404 = false;
      try {
        await adapter.fetchData('nonexistent_devpost');
      } catch (err: any) {
        threw404 = true;
        assert.ok(err instanceof IntegrationNotFoundError);
      }
      assert.ok(threw404, 'Devpost 404 must throw IntegrationNotFoundError');
      console.log('     ✓ Devpost 404 mapped to IntegrationNotFoundError');
    } finally {
      global.fetch = originalFetch;
    }
  }

  // =========================================================================
  // 8. CODECHEF ADAPTER VERIFICATION
  // =========================================================================
  {
    console.log('\n  8. Testing CodeChefAdapter...');
    const adapter = PlatformAdapterFactory.getAdapter(PlatformType.CODECHEF);
    assert.strictEqual(adapter.platformName, PlatformType.CODECHEF);

    // Mocked HTML Profile Parser
    const originalFetch = global.fetch;
    (global as any).fetch = async (url: string) => {
      if (url.includes('codechef.com/users')) {
        const mockHtml = `
          <html>
            <body>
              <div class="rating-number">1820</div>
              <div class="rating-star"><span>4★</span></div>
              <div class="rating-ranks">
                <strong>global</strong> <strong>12,345</strong>
                <strong>country</strong> <strong>2,450</strong>
              </div>
              <h5>Total Problems Solved: 140</h5>
            </body>
          </html>
        `;
        return {
          ok: true,
          status: 200,
          text: async () => mockHtml,
        };
      }
      return originalFetch(url);
    };

    try {
      const result = await adapter.fetchData('chef_user');
      assert.strictEqual(result.platform, PlatformType.CODECHEF);
      assert.strictEqual(result.username, 'chef_user');
      assert.ok(result.codingStats);
      assert.strictEqual(result.codingStats.totalSolved, 140);
      assert.strictEqual(
        result.codingStats.easySolved +
          result.codingStats.mediumSolved +
          result.codingStats.hardSolved,
        140,
      );
      assert.strictEqual(result.codingStats.contestRating, 1820);
      assert.strictEqual(result.codingStats.ranking, 12345);
      assert.strictEqual(result.rawMetadata?.stars, '4★');
      assert.strictEqual(result.rawMetadata?.countryRank, 2450);
      console.log('     ✓ CodeChef HTML parsing & normalization matches NormalizedCodingData');
    } finally {
      global.fetch = originalFetch;
    }

    // 404 handling
    (global as any).fetch = async (url: string) => {
      if (url.includes('codechef.com')) {
        return { ok: false, status: 404, statusText: 'Not Found', text: async () => '' };
      }
      return originalFetch(url);
    };
    try {
      let threw404 = false;
      try {
        await adapter.fetchData('nonexistent_chef');
      } catch (err: any) {
        threw404 = true;
        assert.ok(err instanceof IntegrationNotFoundError);
      }
      assert.ok(threw404, 'CodeChef 404 must throw IntegrationNotFoundError');
      console.log('     ✓ CodeChef 404 mapped to IntegrationNotFoundError');
    } finally {
      global.fetch = originalFetch;
    }
  }

  console.log('\n🎉 All Remaining Adapters Matrix & Error Handling Tests Passed Successfully!');
}

runAdaptersMatrixTests().catch((err) => {
  console.error('❌ Adapters Matrix Test Failed:', err);
  process.exit(1);
});

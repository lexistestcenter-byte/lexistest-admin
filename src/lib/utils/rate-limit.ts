/**
 * In-memory Rate Limiting 유틸리티
 * 프로덕션 다중 서버 환경에서는 Redis 기반으로 전환 권장
 */

interface RateLimitConfig {
  interval: number; // ms
  uniqueTokenPerInterval: number; // max users tracked
  limit: number; // requests per interval per token
}

interface TokenData {
  count: number;
  resetTime: number;
}

export function rateLimit(config: RateLimitConfig) {
  const tokenCache = new Map<string, TokenData>();

  // 주기적으로 만료된 토큰 정리
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [token, data] of tokenCache.entries()) {
      if (now > data.resetTime) {
        tokenCache.delete(token);
      }
    }
  }, config.interval);

  // Node.js에서 프로세스 종료를 막지 않도록
  if (cleanup.unref) cleanup.unref();

  return {
    check: async (
      token: string
    ): Promise<{ success: boolean; remaining: number }> => {
      const now = Date.now();

      // 캐시 크기 제한 (LRU)
      if (tokenCache.size >= config.uniqueTokenPerInterval) {
        const firstKey = tokenCache.keys().next().value;
        if (firstKey) tokenCache.delete(firstKey);
      }

      const tokenData = tokenCache.get(token);

      if (!tokenData || now > tokenData.resetTime) {
        tokenCache.set(token, {
          count: 1,
          resetTime: now + config.interval,
        });
        return { success: true, remaining: config.limit - 1 };
      }

      if (tokenData.count < config.limit) {
        tokenData.count++;
        return { success: true, remaining: config.limit - tokenData.count };
      }

      return { success: false, remaining: 0 };
    },
  };
}

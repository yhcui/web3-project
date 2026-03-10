package com.gitbitex.marketdata.manager;

import com.gitbitex.marketdata.entity.User;
import com.gitbitex.marketdata.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Component;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 用户管理器
 * 负责用户注册、登录、令牌管理等
 */
@Component
@RequiredArgsConstructor
public class UserManager {
    private final UserRepository userRepository;
    private final RedissonClient redissonClient;
    private final AccountManager accountManager;

    /**
     * 创建新用户
     * @param email 邮箱
     * @param password 密码
     * @return 用户对象
     */
    public User createUser(String email, String password) {
        // check if the email address is already registered
        User user = userRepository.findByEmail(email);
        if (user != null) {
            throw new RuntimeException("duplicate email address");
        }

        // create new user
        user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setEmail(email);
        user.setPasswordSalt(UUID.randomUUID().toString());
        user.setPasswordHash(encryptPassword(password, user.getPasswordSalt()));
        userRepository.save(user);
        return user;
    }

    /**
     * 生成访问令牌
     * @param user 用户
     * @param sessionId 会话 ID
     * @return 访问令牌
     */
    public String generateAccessToken(User user, String sessionId) {
        String accessToken = user.getId() + ":" + sessionId + ":" + generateAccessTokenSecret(user);
        redissonClient.getBucket(redisKeyForAccessToken(accessToken))
                .set(new Date().toString(), 14, TimeUnit.DAYS);
        return accessToken;
    }

    /**
     * 删除访问令牌
     * @param accessToken 访问令牌
     */
    public void deleteAccessToken(String accessToken) {
        redissonClient.getBucket(redisKeyForAccessToken(accessToken)).delete();
    }

    /**
     * 根据访问令牌获取用户
     * @param accessToken 访问令牌
     * @return 用户对象
     */
    public User getUserByAccessToken(String accessToken) {
        if (accessToken == null) {
            return null;
        }

        Object val = redissonClient.getBucket(redisKeyForAccessToken(accessToken)).get();
        if (val == null) {
            return null;
        }

        String[] parts = accessToken.split(":");
        if (parts.length != 3) {
            return null;
        }

        String userId = parts[0];
        User user = userRepository.findByUserId(userId);
        if (user == null) {
            return null;
        }

        // check secret
        if (!parts[2].equals(generateAccessTokenSecret(user))) {
            return null;
        }
        return user;
    }

    /**
     * 根据邮箱和密码获取用户
     * @param email 邮箱
     * @param password 密码
     * @return 用户对象
     */
    public User getUser(String email, String password) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return null;
        }

        if (user.getPasswordHash().equals(encryptPassword(password, user.getPasswordSalt()))) {
            return user;
        }
        return null;
    }

    /**
     * 加密密码
     * @param password 原始密码
     * @param saltKey 盐值
     * @return 加密后的密码
     */
    private String encryptPassword(String password, String saltKey) {
        return DigestUtils.md5DigestAsHex((password + saltKey).getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 生成访问令牌密钥
     * @param user 用户
     * @return 密钥
     */
    private String generateAccessTokenSecret(User user) {
        String key = user.getId() + user.getEmail() + user.getPasswordHash();
        return DigestUtils.md5DigestAsHex(key.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 生成访问令牌的 Redis 键
     * @param accessToken 访问令牌
     * @return Redis 键
     */
    private String redisKeyForAccessToken(String accessToken) {
        return "token." + accessToken;
    }
}

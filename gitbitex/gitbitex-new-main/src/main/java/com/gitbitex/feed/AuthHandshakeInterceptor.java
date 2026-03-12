package com.gitbitex.feed;

import com.gitbitex.marketdata.entity.User;
import com.gitbitex.marketdata.manager.UserManager;
import lombok.RequiredArgsConstructor;
import org.jetbrains.annotations.NotNull;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * WebSocket 握手认证拦截器
 * 在 WebSocket 连接建立前验证用户身份
 */
@Component
@RequiredArgsConstructor
public class AuthHandshakeInterceptor extends HttpSessionHandshakeInterceptor {
    private final UserManager userManager;

    /**
     * 握手前处理
     * @param request 服务器请求
     * @param response 服务器响应
     * @param wsHandler WebSocket 处理器
     * @param attributes 属性集合
     * @return 是否继续握手
     */
    @Override
    public boolean beforeHandshake(@NotNull ServerHttpRequest request, @NotNull ServerHttpResponse response,
                                   @NotNull WebSocketHandler wsHandler,
                                   @NotNull Map<String, Object> attributes) throws Exception {
        HttpServletRequest httpServletRequest = ((ServletServerHttpRequest) request).getServletRequest();
        String accessToken = getAccessToken(httpServletRequest);
        if (accessToken != null) {
            User user = userManager.getUserByAccessToken(accessToken);
            if (user != null) {
                attributes.put("CURRENT_USER_ID", user.getId());
            }
        }
        return true;
    }

    /**
     * 从请求中获取访问令牌
     * @param request HTTP 请求
     * @return 访问令牌
     */
    private String getAccessToken(HttpServletRequest request) {
        String tokenKey = "accessToken";
        String token = request.getParameter(tokenKey);
        if (token == null && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookie.getName().equals(tokenKey)) {
                    token = cookie.getValue();
                }
            }
        }
        return token;
    }
}

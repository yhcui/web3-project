package com.gitbitex.openapi;

import com.gitbitex.marketdata.entity.User;
import com.gitbitex.marketdata.manager.UserManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 认证拦截器
 * 从请求参数或 Cookie 中获取访问令牌，验证用户身份
 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {
    private final UserManager userManager;

    /**
     * 请求预处理
     * @param request HTTP 请求
     * @param response HTTP 响应
     * @param handler 处理器
     * @return 是否继续处理
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String accessToken = getAccessToken(request);
        if (accessToken != null) {
            User user = userManager.getUserByAccessToken(accessToken);
            request.setAttribute("currentUser", user);
            request.setAttribute("accessToken", accessToken);
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

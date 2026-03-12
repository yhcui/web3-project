package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * TOTP URI DTO
 * 用于传输两步验证的 URI 和密钥
 */
@Getter
@Setter
public class TotpUriDto {
    /** TOTP URI */
    private String uri;
    /** 密钥 */
    private String secretKey;
}

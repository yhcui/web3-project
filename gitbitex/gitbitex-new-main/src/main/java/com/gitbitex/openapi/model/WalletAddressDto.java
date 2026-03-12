package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 钱包地址 DTO
 * 用于传输充值地址信息
 */
@Getter
@Setter
public class WalletAddressDto {
    /** 钱包地址 */
    private String address;
}

package com.gitbitex.matchingengine;

import com.gitbitex.matchingengine.command.PutProductCommand;
import lombok.Getter;
import lombok.Setter;

/**
 * 交易对类
 * 记录交易对的基本信息
 */
@Getter
@Setter
public class Product implements Cloneable {
    /** 交易对 ID */
    private String id;
    /** 基础币种 */
    private String baseCurrency;
    /** 计价币种 */
    private String quoteCurrency;

    /** 默认构造 */
    public Product() {
    }

    /**
     * 从命令构造交易对
     * @param command 添加交易对命令
     */
    public Product(PutProductCommand command) {
        this.id = command.getProductId();
        this.baseCurrency = command.getBaseCurrency();
        this.quoteCurrency = command.getQuoteCurrency();
    }

    @Override
    public Product clone() {
        try {
            return (Product) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
}

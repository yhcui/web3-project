package com.gitbitex.matchingengine.message;

import com.gitbitex.matchingengine.Account;
import lombok.Getter;
import lombok.Setter;

/**
 * 账户消息
 * 推送账户资金变动信息
 */
@Getter
@Setter
public class AccountMessage extends Message {
    /** 账户信息 */
    private Account account;

    public AccountMessage() {
        this.setMessageType(MessageType.ACCOUNT);
    }
}

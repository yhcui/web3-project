package com.gitbitex.matchingengine.command;

import lombok.Getter;
import lombok.Setter;

/**
 * 命令基类
 * 所有撮合引擎命令的父类
 */
@Getter
@Setter
public class Command {
    /** 命令类型 */
    private CommandType type;
}

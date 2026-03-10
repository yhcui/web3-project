package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 分页列表
 * 用于传输分页数据
 * @param <T> 列表元素类型
 */
@Getter
@Setter
public class PagedList<T> {
    /** 列表数据 */
    private List<T> items;
    /** 总数 */
    private long count;

    /**
     * 构造分页列表
     * @param items 列表数据
     * @param count 总数
     */
    public PagedList(List<T> items, long count) {
        this.items = items;
        this.count = count;
    }
}

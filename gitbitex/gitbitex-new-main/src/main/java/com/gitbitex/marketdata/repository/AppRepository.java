package com.gitbitex.marketdata.repository;

import com.gitbitex.marketdata.entity.AppEntity;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 应用数据仓库
 * 负责应用数据的持久化操作
 */
@Component
public class AppRepository {

    /**
     * 根据用户 ID 查询应用列表
     * @param userId 用户 ID
     * @return 应用列表
     */
    public List<AppEntity> findByUserId(String userId) {
        return null;
    }

    /**
     * 根据应用 ID 查询应用
     * @param appId 应用 ID
     * @return 应用实体
     */
    public AppEntity findByAppId(String appId) {
        return null;
    }

    /**
     * 保存应用
     * @param appEntity 应用实体
     */
    public void save(AppEntity appEntity) {

    }

    /**
     * 根据 ID 删除应用
     * @param id 应用 ID
     */
    public void deleteById(String id) {

    }
}
